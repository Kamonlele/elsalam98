/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Utente dell'area riservata, se ha una sessione valida. */
    user?: import('./lib/auth').AdminUser;
  }
}

/*
 * Tipi dei collegamenti Cloudflare usati dal kit. Scritti a mano e ridotti al minimo:
 * i tipi completi generati da wrangler ridefiniscono Element e si scontrano con quelli
 * del browser usati dall'area riservata. Se usi un metodo nuovo, aggiungilo qui.
 */
declare module 'cloudflare:workers' {
  interface D1Result<T> { results: T[] }
  interface D1Statement {
    bind(...values: unknown[]): D1Statement;
    first<T = Record<string, unknown>>(): Promise<T | null>;
    all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    run(): Promise<unknown>;
  }
  interface D1Database {
    prepare(sql: string): D1Statement;
    batch(statements: D1Statement[]): Promise<unknown[]>;
  }
  interface R2Object {
    body: ReadableStream;
    httpEtag: string;
    size: number;
    writeHttpMetadata(headers: Headers): void;
  }
  interface R2Bucket {
    get(key: string, options?: { range?: { offset: number; length: number } }): Promise<R2Object | null>;
    head(key: string): Promise<Omit<R2Object, 'body'> | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | string | Blob, options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    }): Promise<unknown>;
    delete(key: string): Promise<void>;
  }
  export const env: { DB: D1Database; MEDIA: R2Bucket };
}
