import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Pagine generate a richiesta: i contenuti arrivano dal database, il cliente
// li cambia dall'area riservata e non serve rifare la build.
// Le sessioni di Astro non servono (l'area riservata ha le sue, su D1): così il deploy
// non crea un archivio KV inutile.
export default defineConfig({
  output: 'server',
  session: false,
  adapter: cloudflare({ imageService: 'passthrough' }),
});
