-- Le stesse tabelle le crea il sito da solo al primo avvio (src/lib/db.ts).
-- Questo file serve per crearle a mano: npm run db:apply

-- Contenuti: ogni riga è un elemento di una collezione (prodotti, sedi, ...)
-- con i dati in JSON. Aggiungere un campo non richiede migrazioni.
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY, collection TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'published',
  sort INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, updated_at INTEGER NOT NULL, updated_by TEXT
);
CREATE INDEX IF NOT EXISTS items_collection_idx ON items (collection, sort);

-- Area riservata
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL, last_login_at INTEGER, failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER,
  role TEXT NOT NULL DEFAULT 'admin'
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_unique ON admin_users (email);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions (user_id);

-- Prenotazioni delle visite
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, ref TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  status TEXT NOT NULL, location_id TEXT NOT NULL, location_label TEXT NOT NULL,
  product_id TEXT, product_name TEXT, date TEXT NOT NULL, time TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, city TEXT, answers TEXT NOT NULL DEFAULT '{}',
  locale TEXT NOT NULL, source TEXT NOT NULL DEFAULT '{}', ip_hash TEXT, reminder_sent_at INTEGER, note TEXT
);
CREATE INDEX IF NOT EXISTS bookings_slot_idx ON bookings (location_id, date, time);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (date);

-- Richieste dai moduli del sito (lead)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, ref TEXT NOT NULL, created_at INTEGER NOT NULL, form TEXT NOT NULL,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, city TEXT,
  answers TEXT NOT NULL DEFAULT '[]', page TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT '{}',
  ip_hash TEXT, status TEXT NOT NULL DEFAULT 'nuova'
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at);
CREATE INDEX IF NOT EXISTS leads_ip_idx ON leads (ip_hash, created_at);

-- Impostazioni riservate (chiavi email, webhook). Mai nei contenuti pubblici.
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);

-- Invii ai webhook, con ripetizioni
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY, endpoint_id TEXT NOT NULL, endpoint_name TEXT NOT NULL, event TEXT NOT NULL, payload TEXT NOT NULL,
  status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER, last_code INTEGER, last_error TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS webhook_deliveries_due_idx ON webhook_deliveries (status, next_at);

-- Redirect 301 dai vecchi indirizzi (a mano o automatici al cambio di indirizzo)
CREATE TABLE IF NOT EXISTS redirects (
  from_path TEXT PRIMARY KEY, to_path TEXT NOT NULL, auto INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
