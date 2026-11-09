import { env } from 'cloudflare:workers';
import { ensureTables } from './db';
import { isRole, type Role } from './roles';

/** Ripreso dal Kamon Site Kit: stesse regole, stesse protezioni. */
export type AdminUser = { id: string; email: string; name: string; role: Role; createdAt: number; lastLoginAt: number | null };

// Un valore strano nel database vale il ruolo con meno permessi, mai di più.
const roleOf = (v: unknown): Role => (isRole(v) ? v : 'autore');

export const COOKIE_NAME = 'showcase_session';
export const SESSION_DAYS = 30;
// Massimo supportato dalla WebCrypto dei Workers: oltre, il login fallisce con NotSupportedError.
// Il numero sta dentro l'hash, quindi si può alzare in futuro senza rompere le password.
const PBKDF2_ITERATIONS = 100_000;
const MAX_ATTEMPTS = 8;
const LOCK_MINUTES = 15;
const MIN_PASSWORD = 10;

const encoder = new TextEncoder();
const toBase64 = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function deriveBits(password: string, salt: ArrayBuffer, iterations: number) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt.buffer as ArrayBuffer, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt.buffer as ArrayBuffer)}$${toBase64(bits)}`;
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iterations || !salt || !hash) return false;
  const bits = await deriveBits(password, fromBase64(salt).buffer as ArrayBuffer, Number(iterations));
  return constantTimeEqual(toBase64(bits), hash);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function passwordProblem(password: string) {
  if (password.length < MIN_PASSWORD) return `La password deve avere almeno ${MIN_PASSWORD} caratteri.`;
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'La password deve contenere almeno una lettera e un numero.';
  return null;
}
export const normaliseEmail = (email: string) => email.trim().toLowerCase();
export const looksLikeEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

/* ---------- utenti ---------- */

export async function countAdmins(): Promise<number> {
  await ensureTables();
  const row = await env.DB.prepare('SELECT COUNT(*) AS total FROM admin_users').first<{ total: number }>();
  return row?.total ?? 0;
}

export async function listAdmins(): Promise<AdminUser[]> {
  await ensureTables();
  const r = await env.DB.prepare('SELECT id, email, name, role, created_at AS createdAt, last_login_at AS lastLoginAt FROM admin_users ORDER BY created_at').all<AdminUser>();
  return (r.results ?? []).map((u) => ({ ...u, role: roleOf(u.role) }));
}

export async function createAdmin(email: string, name: string, password: string, role: Role) {
  await ensureTables();
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO admin_users (id, email, name, password_hash, created_at, failed_attempts, role) VALUES (?, ?, ?, ?, ?, 0, ?)')
    .bind(id, normaliseEmail(email), name.trim() || normaliseEmail(email), await hashPassword(password), Date.now(), role).run();
  return id;
}

// La condizione sta nella stessa istruzione: due amministratori che si tolgono a vicenda
// nello stesso momento non lasciano il sito senza nessuno.
const NOT_LAST_ADMIN = "(role != 'admin' OR (SELECT COUNT(*) FROM admin_users WHERE role = 'admin') > 1)";

/** Cambia il ruolo. Falso se è l'ultimo amministratore (o la persona non esiste). */
export async function setRole(id: string, role: Role) {
  await ensureTables();
  const sql = role === 'admin' ? 'UPDATE admin_users SET role = ? WHERE id = ?' : `UPDATE admin_users SET role = ? WHERE id = ? AND ${NOT_LAST_ADMIN}`;
  const r = await env.DB.prepare(sql).bind(role, id).run() as { meta?: { changes?: number } };
  return (r.meta?.changes ?? 0) > 0;
}

export async function emailTaken(email: string) {
  await ensureTables();
  return !!(await env.DB.prepare('SELECT 1 FROM admin_users WHERE email = ?').bind(normaliseEmail(email)).first());
}

/** Falso se è l'ultimo amministratore (o la persona non esiste). */
export async function deleteAdmin(id: string) {
  const [del] = await env.DB.batch([
    env.DB.prepare(`DELETE FROM admin_users WHERE id = ? AND ${NOT_LAST_ADMIN}`).bind(id),
    env.DB.prepare('DELETE FROM admin_sessions WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM admin_users WHERE id = ?)').bind(id, id),
  ]) as { meta?: { changes?: number } }[];
  return (del?.meta?.changes ?? 0) > 0;
}

/** Cambia la password e chiude tutte le sessioni dell'utente. */
export async function changePassword(id: string, password: string) {
  await env.DB.batch([
    env.DB.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').bind(await hashPassword(password), id),
    env.DB.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(id),
  ]);
}

export async function checkPassword(id: string, password: string) {
  const row = await env.DB.prepare('SELECT password_hash AS h FROM admin_users WHERE id = ?').bind(id).first<{ h: string }>();
  return !!row && verifyPassword(password, row.h);
}

/* ---------- accesso ---------- */

type LoginResult = { ok: true; token: string } | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  await ensureTables();
  const now = Date.now();
  const row = await env.DB.prepare('SELECT id, password_hash AS passwordHash, failed_attempts AS failedAttempts, locked_until AS lockedUntil FROM admin_users WHERE email = ?')
    .bind(normaliseEmail(email)).first<{ id: string; passwordHash: string; failedAttempts: number; lockedUntil: number | null }>();
  if (!row) {
    // Stesso costo di una verifica vera, per non rivelare se l'indirizzo esiste.
    await deriveBits(password, crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer, PBKDF2_ITERATIONS);
    return { ok: false, error: 'Email o password non corretti.' };
  }
  if (row.lockedUntil && row.lockedUntil > now) {
    return { ok: false, error: `Troppi tentativi. Riprova fra ${Math.ceil((row.lockedUntil - now) / 60_000)} minuti.` };
  }
  if (!(await verifyPassword(password, row.passwordHash))) {
    const attempts = (row.failedAttempts ?? 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCK_MINUTES * 60_000 : null;
    await env.DB.prepare('UPDATE admin_users SET failed_attempts = ?, locked_until = ? WHERE id = ?').bind(attempts, lockedUntil, row.id).run();
    return { ok: false, error: 'Email o password non corretti.' };
  }
  const token = randomToken();
  await env.DB.batch([
    env.DB.prepare('UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?').bind(now, row.id),
    env.DB.prepare('INSERT INTO admin_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(await sha256Hex(token), row.id, now, now + SESSION_DAYS * 86_400_000),
    env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').bind(now),
  ]);
  return { ok: true, token };
}

export async function endSession(token: string | undefined) {
  if (!token) return;
  await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
}

export async function userForToken(token: string | undefined): Promise<AdminUser | null> {
  if (!token) return null;
  try {
    await ensureTables();
    const row = await env.DB.prepare(`SELECT u.id, u.email, u.name, u.role, u.created_at AS createdAt, u.last_login_at AS lastLoginAt, s.expires_at AS expiresAt
      FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ?`)
      .bind(await sha256Hex(token)).first<AdminUser & { expiresAt: number }>();
    if (!row) return null;
    if (row.expiresAt < Date.now()) { await endSession(token); return null; }
    return { id: row.id, email: row.email, name: row.name, role: roleOf(row.role), createdAt: row.createdAt, lastLoginAt: row.lastLoginAt };
  } catch {
    return null;
  }
}

/** Le scritture arrivano solo dalle pagine del sito stesso. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return request.method === 'GET' || request.method === 'HEAD';
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export const cookieOptions = (request: Request) => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: new URL(request.url).protocol === 'https:',
  maxAge: SESSION_DAYS * 86_400,
});
