import { describe, expect, it } from 'vitest';
import { slugify } from '../src/lib/validate';
describe('slugify', () => {
  it('toglie accenti e spazi', () => expect(slugify('Piscine Fuori Terra è')).toBe('piscine-fuori-terra-e'));
});
