import { describe, expect, it } from 'vitest';
import { isMediaKey, parseRange } from '../src/lib/media-keys';

const id = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';

describe('isMediaKey', () => {
  it('accetta i nomi generati dal sito', () => {
    expect(isMediaKey(`foto/${id}.webp`)).toBe(true);
    expect(isMediaKey(`foto/${id}.jpg`)).toBe(true);
    expect(isMediaKey(`modelli/${id}.glb`)).toBe(true);
    expect(isMediaKey(`video/${id}.mp4`)).toBe(true);
    expect(isMediaKey(`video/${id}.webm`)).toBe(true);
    expect(isMediaKey(`img/${id}/1280.webp`)).toBe(true);
    expect(isMediaKey(`img/${id}/full.webp`)).toBe(true);
    expect(isMediaKey(`img/${id}/640.jpg`)).toBe(true);
    expect(isMediaKey(`img/${id}/blur.webp`)).toBe(true);
  });
  it('rifiuta tutto il resto', () => {
    expect(isMediaKey('../x')).toBe(false);
    expect(isMediaKey('video/abc.mp4')).toBe(false);
    expect(isMediaKey(`video/${id}.webp`)).toBe(false);
    expect(isMediaKey(`foto/${id}.mp4`)).toBe(false);
    expect(isMediaKey(`img/${id}/abc.webp`)).toBe(false);
    expect(isMediaKey(`altro/${id}.webp`)).toBe(false);
    expect(isMediaKey(`foto/${id}.webp/../x`)).toBe(false);
  });
});

describe('parseRange', () => {
  it('legge un intervallo chiuso', () => {
    expect(parseRange('bytes=0-99', 1000)).toEqual({ offset: 0, length: 100 });
  });
  it('legge un intervallo aperto', () => {
    expect(parseRange('bytes=900-', 1000)).toEqual({ offset: 900, length: 100 });
  });
  it('legge gli ultimi N byte', () => {
    expect(parseRange('bytes=-100', 1000)).toEqual({ offset: 900, length: 100 });
  });
  it('taglia la fine oltre la misura del file', () => {
    expect(parseRange('bytes=500-5000', 1000)).toEqual({ offset: 500, length: 500 });
  });
  it('rifiuta intervalli fuori dal file o malformati', () => {
    expect(parseRange('bytes=2000-', 1000)).toBeNull();
    expect(parseRange('bytes=50-10', 1000)).toBeNull();
    expect(parseRange('bytes=abc', 1000)).toBeNull();
    expect(parseRange('bytes=0-1,5-9', 1000)).toBeNull();
    expect(parseRange(null, 1000)).toBeNull();
    expect(parseRange('bytes=-0', 1000)).toBeNull();
  });
});
