import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDays, addWeeks, formatWeekRange, fromISODate, getWeekStart, toISODate } from './date.js';

describe('date utils', () => {
  it('converts to and from ISO date values', () => {
    const source = new Date(2026, 1, 13);

    const iso = toISODate(source);
    const restored = fromISODate(iso);

    assert.equal(iso, '2026-02-13');
    assert.equal(restored.getFullYear(), 2026);
    assert.equal(restored.getMonth(), 1);
    assert.equal(restored.getDate(), 13);
  });

  it('gets the monday week start', () => {
    const weekStart = getWeekStart(new Date(2026, 1, 12)); // Thursday
    assert.equal(toISODate(weekStart), '2026-02-09');
  });

  it('adds days and weeks', () => {
    const date = new Date(2026, 1, 13);
    assert.equal(toISODate(addDays(date, 3)), '2026-02-16');
    assert.equal(toISODate(addWeeks(date, 2)), '2026-02-27');
  });

  it('formats a week range label', () => {
    const label = formatWeekRange(new Date(2026, 1, 9));
    assert.match(label, / - /);
  });
});
