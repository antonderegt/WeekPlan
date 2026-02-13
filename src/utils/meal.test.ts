import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aggregateShoppingList, expandMealBlocks, findConflicts, getWeekIndex, mod, resolvePatternIdForWeek } from './meal.js';

describe('meal utils', () => {
  it('normalizes modulo values', () => {
    assert.equal(mod(5, 3), 2);
    assert.equal(mod(-1, 3), 2);
    assert.equal(mod(10, 0), 0);
  });

  it('calculates week index relative to pattern start date', () => {
    const result = getWeekIndex(new Date(2026, 1, 16), '2026-02-09');
    assert.equal(result, 1);
  });

  it('resolves pattern id for a week using cyclic order', () => {
    const settings = {
      id: 'settings',
      patternOrder: ['p1', 'p2', 'p3'],
      patternStartDate: '2026-02-09'
    };

    assert.equal(resolvePatternIdForWeek(new Date(2026, 1, 9), settings), 'p1');
    assert.equal(resolvePatternIdForWeek(new Date(2026, 1, 16), settings), 'p2');
    assert.equal(resolvePatternIdForWeek(new Date(2026, 1, 23), settings), 'p3');
    assert.equal(resolvePatternIdForWeek(new Date(2026, 2, 2), settings), 'p1');
  });

  it('expands blocks into day assignments', () => {
    const dayMap = expandMealBlocks([
      { id: 'm1', recipeId: 'r1', startDayIndex: 1, durationDays: 3 }
    ]);

    assert.deepEqual(dayMap[1], { blockId: 'm1', recipeId: 'r1', isLeftoverDay: false, dayOffset: 0 });
    assert.deepEqual(dayMap[2], { blockId: 'm1', recipeId: 'r1', isLeftoverDay: true, dayOffset: 1 });
    assert.deepEqual(dayMap[3], { blockId: 'm1', recipeId: 'r1', isLeftoverDay: true, dayOffset: 2 });
  });

  it('finds overlapping meal blocks', () => {
    const mealBlocks = [
      { id: 'm1', recipeId: 'r1', startDayIndex: 0, durationDays: 2 },
      { id: 'm2', recipeId: 'r2', startDayIndex: 3, durationDays: 2 },
      { id: 'm3', recipeId: 'r3', startDayIndex: 5, durationDays: 1 }
    ];

    const conflicts = findConflicts(mealBlocks, 1, 3);
    assert.deepEqual(conflicts.map((c) => c.id), ['m1', 'm2']);
  });

  it('aggregates shopping quantities by ingredient name and unit', () => {
    const mealBlocks = [
      { id: 'm1', recipeId: 'r1', startDayIndex: 0, durationDays: 2 },
      { id: 'm2', recipeId: 'r2', startDayIndex: 2, durationDays: 1 }
    ];
    const recipes = [
      {
        id: 'r1',
        name: 'Soup',
        ingredients: [{ ingredientId: 'i1', quantity: 2, unit: 'cup' }],
        steps: []
      },
      {
        id: 'r2',
        name: 'Stew',
        ingredients: [{ ingredientId: 'i1', quantity: 1, unit: 'cup' }],
        steps: []
      }
    ];
    const ingredients = [{ id: 'i1', name: 'Carrot', unit: 'cup' }];

    assert.deepEqual(aggregateShoppingList(mealBlocks, recipes, ingredients), [
      { ingredientId: 'i1', name: 'Carrot', quantity: 3, unit: 'cup' }
    ]);
  });
});
