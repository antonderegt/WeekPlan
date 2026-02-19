import React, { useMemo, useState } from 'react';
import type { MealBlock, Pattern } from '../types';
import { addDays, addWeeks, formatWeekRange, getWeekStart } from '../utils/date';
import {
  aggregateShoppingList,
  expandMealBlocks,
  findConflicts,
  getPatternById,
  resolvePatternIdForWeek
} from '../utils/meal';
import { createId } from '../utils/uuid';
import MealAssignModal from './MealAssignModal';
import MealDetailModal from './MealDetailModal';
import Modal from './Modal';
import ShoppingListModal from './ShoppingListModal';
import { useData } from '../store/DataContext';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeekView() {
  const { recipes, ingredients, patterns, settings, loading, upsertPattern } = useData();

  const [weekOffset, setWeekOffset] = useState(0);
  const [assignDayIndex, setAssignDayIndex] = useState<number | null>(null);
  const [detailBlockId, setDetailBlockId] = useState<string | null>(null);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<{
    dayIndex: number;
    recipeId: string;
    duration: number;
  } | null>(null);
  const [conflictingBlocks, setConflictingBlocks] = useState<MealBlock[]>([]);

  const baseDate = addWeeks(new Date(), weekOffset);
  const weekStart = getWeekStart(baseDate);
  const weekLabel = formatWeekRange(weekStart);

  const resolvedRecipes = recipes ?? [];
  const resolvedIngredients = ingredients ?? [];
  const resolvedPatterns = patterns ?? [];
  const patternId = settings ? resolvePatternIdForWeek(baseDate, settings) : null;
  const pattern = patternId ? getPatternById(resolvedPatterns, patternId) : null;
  const dayMap = expandMealBlocks(pattern?.mealBlocks ?? []);
  const detailBlock = detailBlockId
    ? pattern?.mealBlocks.find((block) => block.id === detailBlockId) ?? null
    : null;

  const handleAddMeal = (dayIndex: number) => {
    setAssignDayIndex(dayIndex);
  };

  const handleAssignMeal = (recipeId: string, duration: number) => {
    if (!pattern || assignDayIndex === null) return;
    const conflicts = findConflicts(pattern.mealBlocks, assignDayIndex, duration);
    if (conflicts.length > 0) {
      setPendingMeal({ dayIndex: assignDayIndex, recipeId, duration });
      setConflictingBlocks(conflicts);
    } else {
      void saveMealBlock(pattern, assignDayIndex, recipeId, duration, []);
    }
    setAssignDayIndex(null);
  };

  const saveMealBlock = async (
    targetPattern: Pattern,
    startDayIndex: number,
    recipeId: string,
    durationDays: number,
    removeBlocks: MealBlock[]
  ) => {
    const nextBlocks = targetPattern.mealBlocks.filter(
      (block) => !removeBlocks.some((remove) => remove.id === block.id)
    );
    nextBlocks.push({
      id: createId(),
      recipeId,
      startDayIndex,
      durationDays
    });
    await upsertPattern({ ...targetPattern, mealBlocks: nextBlocks });
  };

  const handleConfirmOverwrite = async () => {
    if (!pattern || !pendingMeal) return;
    await saveMealBlock(pattern, pendingMeal.dayIndex, pendingMeal.recipeId, pendingMeal.duration, conflictingBlocks);
    setPendingMeal(null);
    setConflictingBlocks([]);
  };

  const handleCancelOverwrite = () => {
    setPendingMeal(null);
    setConflictingBlocks([]);
  };

  const handleRemoveBlock = async (blockId: string) => {
    if (!pattern) return;
    const nextBlocks = pattern.mealBlocks.filter((block) => block.id !== blockId);
    await upsertPattern({ ...pattern, mealBlocks: nextBlocks });
    setDetailBlockId(null);
  };

  const shoppingItems = useMemo(() => {
    if (!pattern) return [];
    return aggregateShoppingList(pattern.mealBlocks, resolvedRecipes, resolvedIngredients);
  }, [pattern, resolvedRecipes, resolvedIngredients]);

  if (loading) {
    return <div className="page">Loading week view...</div>;
  }

  if (!pattern) {
    return (
      <div className="page">
        <div className="card">
          <h3>Set your pattern start date</h3>
          <p>Go to Settings to define the Week A start date so the app can pick the right pattern.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Week view</h2>
          <p>
            {weekLabel} - Pattern: {pattern?.name ?? 'Unknown'}
          </p>
        </div>
        <div className="week-actions">
          <button type="button" className="ghost" onClick={() => setWeekOffset((prev) => prev - 1)}>
            Previous week
          </button>
          <button type="button" className="ghost" onClick={() => setWeekOffset(0)}>
            Today
          </button>
          <button type="button" className="ghost" onClick={() => setWeekOffset((prev) => prev + 1)}>
            Next week
          </button>
          <button type="button" onClick={() => setShoppingOpen(true)}>
            Generate shopping list
          </button>
        </div>
        <div className="mobile-week-nav">
          <button type="button" className="ghost" onClick={() => setWeekOffset((prev) => prev - 1)}>
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" className="ghost" onClick={() => setShoppingOpen(true)}>
            <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </button>
          <button type="button" className="ghost" onClick={() => setWeekOffset((prev) => prev + 1)}>
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div className="week-grid">
        {dayNames.map((label, index) => {
          const dayDate = addDays(weekStart, index);
          const dayEntry = dayMap[index];
          const mealRecipe = dayEntry ? recipes.find((recipe) => recipe.id === dayEntry.recipeId) : null;
          const blockDuration = dayEntry
            ? pattern.mealBlocks.find((block) => block.id === dayEntry.blockId)?.durationDays ?? 1
            : 1;
          const subtitle = dayEntry && dayEntry.isLeftoverDay
            ? `Leftovers (day ${dayEntry.dayOffset + 1} of ${blockDuration})`
            : 'Cook day';
          return (
            <div key={label} className="day-card">
              <div className="day-header">
                <h3>{label}</h3>
                <span className="day-date">
                  {dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {mealRecipe ? (
                <button
                  type="button"
                  className="meal-card"
                  onClick={() => dayEntry && setDetailBlockId(dayEntry.blockId)}
                >
                  <div className="meal-title">{mealRecipe.name}</div>
                  <div className="meal-subtitle">{subtitle}</div>
                </button>
              ) : (
                <button type="button" className="ghost" onClick={() => handleAddMeal(index)}>
                  Add meal
                </button>
              )}
            </div>
          );
        })}
      </div>

      <MealAssignModal
        isOpen={assignDayIndex !== null}
        dayLabel={assignDayIndex !== null ? dayNames[assignDayIndex] : ''}
        maxDuration={assignDayIndex !== null ? 7 - assignDayIndex : 1}
        recipes={recipes}
        onClose={() => setAssignDayIndex(null)}
        onSave={handleAssignMeal}
      />

      <MealDetailModal
        isOpen={detailBlockId !== null}
        recipe={detailBlock ? recipes.find((recipe) => recipe.id === detailBlock.recipeId) ?? null : null}
        ingredients={ingredients}
        onClose={() => setDetailBlockId(null)}
        onRemove={detailBlockId ? () => handleRemoveBlock(detailBlockId) : undefined}
      />

      <ShoppingListModal isOpen={shoppingOpen} items={shoppingItems} onClose={() => setShoppingOpen(false)} />

      <Modal
        title="Conflicting meals"
        isOpen={pendingMeal !== null}
        onClose={handleCancelOverwrite}
        footer={
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={handleCancelOverwrite}>
              Cancel
            </button>
            <button type="button" className="danger" onClick={handleConfirmOverwrite}>
              Overwrite conflicting meals
            </button>
          </div>
        }
      >
        <p>This meal overlaps with existing meals. Choose overwrite to replace them.</p>
        <ul>
          {conflictingBlocks.map((block) => {
            const recipe = recipes.find((item) => item.id === block.recipeId);
            const days = Array.from({ length: block.durationDays }, (_, offset) => dayNames[block.startDayIndex + offset]);
            return (
              <li key={block.id}>
                {recipe?.name ?? 'Unknown recipe'} ({days.join(', ')})
              </li>
            );
          })}
        </ul>
      </Modal>
    </div>
  );
}
