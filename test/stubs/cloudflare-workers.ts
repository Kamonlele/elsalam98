// Stub di `cloudflare:workers` per i test: il modulo esiste solo dentro il runtime Workers.
// Un `env` vuoto basta alla logica pura, che non tocca D1 né i bindings.
export const env = {};
