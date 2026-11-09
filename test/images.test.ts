import { describe, expect, it } from 'vitest';
import { variantsOf, WIDTHS } from '../src/lib/images';

const id = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';

describe('variantsOf', () => {
  it('dà srcset e miniatura per una foto in più misure (webp)', () => {
    expect(variantsOf(`/media/img/${id}/full.webp`)).toEqual({
      srcset: `/media/img/${id}/640.webp 640w, /media/img/${id}/1280.webp 1280w, /media/img/${id}/full.webp 2400w`,
      blur: `/media/img/${id}/blur.webp`,
    });
  });
  it('vale anche per il ripiego jpg', () => {
    expect(variantsOf(`/media/img/${id}/full.jpg`)).toEqual({
      srcset: `/media/img/${id}/640.jpg 640w, /media/img/${id}/1280.jpg 1280w, /media/img/${id}/full.jpg 2400w`,
      blur: `/media/img/${id}/blur.jpg`,
    });
  });
  it('non tocca le foto vecchie né quelle di altri siti', () => {
    expect(variantsOf(`/media/foto/${id}.webp`)).toBeNull();
    expect(variantsOf('https://altro.it/x.webp')).toBeNull();
    expect(variantsOf(`/media/img/${id}/1280.webp`)).toBeNull();
    expect(variantsOf('')).toBeNull();
  });
  it('le misure sono 640 e 1280', () => {
    expect([...WIDTHS]).toEqual([640, 1280]);
  });
});
