import { describe, expect, it } from 'vitest';
import { openingHours, paragraphs } from '../src/lib/text';

describe('openingHours', () => {
  it('raggruppa i giorni con gli stessi orari, a partire dal lunedì', () => {
    const slots = { 1: ['10:00', '15:00'], 2: ['10:00', '15:00'], 3: ['10:00', '15:00'], 6: ['10:00', '11:30'], 0: [] };
    expect(openingHours(slots, 60, 'it')).toEqual([
      { days: 'lun - mer', hours: '10:00 - 16:00' },
      { days: 'sab', hours: '10:00 - 12:30' },
    ]);
  });
  it('mette in ordine le fasce e regge la mezzanotte', () => {
    expect(openingHours({ 5: ['22:30', '09:00'] }, 120, 'en')).toEqual([{ days: 'Fri', hours: '09:00 - 24:00' }]);
  });
  it('mostra la pausa pranzo come due fasce', () => {
    const day = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00'];
    expect(openingHours({ 1: day, 2: day, 3: day, 4: day, 5: day, 6: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'] }, 60, 'it')).toEqual([
      { days: 'lun - ven', hours: '09:00 - 13:00, 15:00 - 19:00' },
      { days: 'sab', hours: '09:00 - 15:00' },
    ]);
  });
  it('con passo irregolare spezza solo dove il salto supera il passo abituale', () => {
    expect(openingHours({ 1: ['10:00', '11:30', '15:00', '16:30'] }, 60, 'it')).toEqual([{ days: 'lun', hours: '10:00 - 12:30, 15:00 - 17:30' }]);
  });
  it('senza fasce non mostra niente', () => {
    expect(openingHours({}, 60, 'it')).toEqual([]);
  });
});

describe('paragraphs', () => {
  it('una riga vuota apre un nuovo paragrafo', () => {
    expect(paragraphs('Uno\nsegue\n\n  \nDue\n\n')).toEqual(['Uno\nsegue', 'Due']);
    expect(paragraphs('')).toEqual([]);
  });
});
