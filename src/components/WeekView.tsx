import React, { useMemo, useState } from 'react';
import type { MealBlock, Pattern, WeekOverride } from '../types';
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
  const { recipes, ingredients, patterns, settings, weekOverrides, loading, upsertPattern, upsertWeekOverride, removeWeekOverride } = useData();

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
  const [pendingSwap, setPendingSwap] = useState<{
    nextBlocks: MealBlock[];
    conflictingBlocks: MealBlock[];
  } | null>(null);
  const [dragDayIndex, setDragDayIndex] = useState<number | null>(null);
  const [swapBlockMessage, setSwapBlockMessage] = useState<string | null>(null);

  const baseDate = addWeeks(new Date(), weekOffset);
  const weekStart = getWeekStart(baseDate);
  const weekLabel = formatWeekRange(weekStart);
  const weekStartIso = weekStart.toISOString().slice(0, 10);

  const resolvedRecipes = recipes ?? [];
  const resolvedIngredients = ingredients ?? [];
  const resolvedPatterns = patterns ?? [];
  const patternId = settings ? resolvePatternIdForWeek(baseDate, settings) : null;
  const pattern = patternId ? getPatternById(resolvedPatterns, patternId) : null;

  const weekOverride = weekOverrides.find((o) => o.weekStartDate === weekStartIso) ?? null;
  const activeMealBlocks = weekOverride ? weekOverride.mealBlocks : (pattern?.mealBlocks ?? []);
  const dayMap = expandMealBlocks(activeMealBlocks);

  const detailBlock = detailBlockId
    ? activeMealBlocks.find((block) => block.id === detailBlockId) ?? null
    : null;

  const detailDurationDays = detailBlock?.durationDays ?? 1;
  const detailMaxDuration = detailBlock
    ? (() => {
        const otherBlocks = activeMealBlocks.filter((b) => b.id !== detailBlock.id);
        const nextBlockStart = otherBlocks
          .filter((b) => b.startDayIndex > detailBlock.startDayIndex)
          .reduce((min, b) => Math.min(min, b.startDayIndex), 7);
        return Math.min(7 - detailBlock.startDayIndex, nextBlockStart - detailBlock.startDayIndex);
      })()
    : 1;

  const handleAddMeal = (dayIndex: number) => {
    setAssignDayIndex(dayIndex);
  };

  const handleAssignMeal = (recipeId: string, duration: number) => {
    if (assignDayIndex === null) return;
    const conflicts = findConflicts(activeMealBlocks, assignDayIndex, duration);
    if (conflicts.length > 0) {
      setPendingMeal({ dayIndex: assignDayIndex, recipeId, duration });
      setConflictingBlocks(conflicts);
    } else {
      void saveMealBlock(assignDayIndex, recipeId, duration, []);
    }
    setAssignDayIndex(null);
  };

  const saveMealBlock = async (
    startDayIndex: number,
    recipeId: string,
    durationDays: number,
    removeBlocks: MealBlock[]
  ) => {
    const nextBlocks = activeMealBlocks.filter(
      (block) => !removeBlocks.some((remove) => remove.id === block.id)
    );
    nextBlocks.push({ id: createId(), recipeId, startDayIndex, durationDays });

    if (weekOverride) {
      await upsertWeekOverride({ ...weekOverride, mealBlocks: nextBlocks });
    } else if (pattern) {
      await upsertPattern({ ...pattern, mealBlocks: nextBlocks });
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!pendingMeal) return;
    await saveMealBlock(pendingMeal.dayIndex, pendingMeal.recipeId, pendingMeal.duration, conflictingBlocks);
    setPendingMeal(null);
    setConflictingBlocks([]);
  };

  const handleCancelOverwrite = () => {
    setPendingMeal(null);
    setConflictingBlocks([]);
  };

  const handleConfirmSwap = async () => {
    if (!pendingSwap || !weekOverride) return;
    const resolved = pendingSwap.nextBlocks.filter(
      (b) => !pendingSwap.conflictingBlocks.some((c) => c.id === b.id)
    );
    await upsertWeekOverride({ ...weekOverride, mealBlocks: resolved });
    setPendingSwap(null);
  };

  const handleCancelSwap = () => {
    setPendingSwap(null);
  };

  const handleRemoveBlock = async (blockId: string) => {
    const nextBlocks = activeMealBlocks.filter((block) => block.id !== blockId);
    if (weekOverride) {
      await upsertWeekOverride({ ...weekOverride, mealBlocks: nextBlocks });
    } else if (pattern) {
      await upsertPattern({ ...pattern, mealBlocks: nextBlocks });
    }
    setDetailBlockId(null);
  };

  const handleChangeDuration = async (newDuration: number) => {
    if (!detailBlock) return;
    const otherBlocks = activeMealBlocks.filter((b) => b.id !== detailBlock.id);
    const nextBlockStart = otherBlocks
      .filter((b) => b.startDayIndex > detailBlock.startDayIndex)
      .reduce((min, b) => Math.min(min, b.startDayIndex), 7);
    const maxPossible = Math.min(7 - detailBlock.startDayIndex, nextBlockStart - detailBlock.startDayIndex);
    const clamped = Math.max(1, Math.min(newDuration, maxPossible));
    const nextBlocks = activeMealBlocks.map((b) =>
      b.id === detailBlock.id ? { ...b, durationDays: clamped } : b
    );
    if (weekOverride) {
      await upsertWeekOverride({ ...weekOverride, mealBlocks: nextBlocks });
    } else if (pattern) {
      await upsertPattern({ ...pattern, mealBlocks: nextBlocks });
    }
  };

  const handleCustomizeWeek = async () => {
    await upsertWeekOverride({ weekStartDate: weekStartIso, mealBlocks: activeMealBlocks.map((b) => ({ ...b })) });
  };

  const handleResetToPattern = async () => {
    await removeWeekOverride(weekStartIso);
  };

  // Drag and drop — only active when weekOverride is set
  const handleDragStart = (dayIndex: number) => {
    setDragDayIndex(dayIndex);
  };

  const handleDragEnd = () => {
    setDragDayIndex(null);
  };

  const handleDrop = async (targetDayIndex: number) => {
    if (dragDayIndex === null || dragDayIndex === targetDayIndex || !weekOverride) return;

    const sourceDayEntry = dayMap[dragDayIndex];
    const targetDayEntry = dayMap[targetDayIndex];

    if (!sourceDayEntry || sourceDayEntry.isLeftoverDay) return;

    // Find the source block
    const sourceBlock = weekOverride.mealBlocks.find((b) => b.id === sourceDayEntry.blockId);
    if (!sourceBlock) return;

    let nextBlocks: MealBlock[];

    // Returns computed blocks after swap (with overlap adjustment), or null to cancel.
    // Mutates nextBlocks or calls setPendingSwap when there are third-party conflicts.
    const computeSwap = (targetBlock: MealBlock, sourceDestDay?: number): MealBlock[] | null => {
      let swapBlocks = weekOverride!.mealBlocks.map((b) => {
        if (b.id === sourceBlock.id) return { ...b, startDayIndex: sourceDestDay ?? targetBlock.startDayIndex };
        if (b.id === targetBlock.id) return { ...b, startDayIndex: sourceBlock.startDayIndex };
        return b;
      });

      let movedSourceBlock = swapBlocks.find((b) => b.id === sourceBlock.id)!;
      const movedTargetBlock = swapBlocks.find((b) => b.id === targetBlock.id)!;

      // Bug 1 fix: check if the two swapped blocks overlap each other
      const selfOverlap = findConflicts(
        [movedTargetBlock],
        movedSourceBlock.startDayIndex,
        movedSourceBlock.durationDays
      );
      if (selfOverlap.length > 0) {
        const adjustedStart = movedTargetBlock.startDayIndex + movedTargetBlock.durationDays;
        if (adjustedStart > 6) return null;
        swapBlocks = swapBlocks.map((b) =>
          b.id === sourceBlock.id ? { ...b, startDayIndex: adjustedStart } : b
        );
        movedSourceBlock = swapBlocks.find((b) => b.id === sourceBlock.id)!;
      }

      // Check whether the moved source block now overlaps any third-party block
      const otherBlocks = swapBlocks.filter(
        (b) => b.id !== sourceBlock.id && b.id !== targetBlock.id
      );
      const thirdPartyConflicts = findConflicts(
        otherBlocks,
        movedSourceBlock.startDayIndex,
        movedSourceBlock.durationDays
      );

      if (thirdPartyConflicts.length > 0) {
        setPendingSwap({ nextBlocks: swapBlocks, conflictingBlocks: thirdPartyConflicts });
        return null;
      }
      return swapBlocks;
    };

    // Whether the target day belongs to the block being dragged (e.g. dropping on own leftover)
    const isSameBlock = targetDayEntry?.blockId === sourceBlock.id;

    if (targetDayEntry && !isSameBlock && !targetDayEntry.isLeftoverDay) {
      // Swap: exchange startDayIndex of the two cook-day blocks
      const targetBlock = weekOverride.mealBlocks.find((b) => b.id === targetDayEntry.blockId);
      if (!targetBlock) return;

      if (sourceBlock.durationDays !== targetBlock.durationDays) {
        setDragDayIndex(null);
        setSwapBlockMessage("Can only swap meals of the same duration. Click a recipe to change its number of days.");
        return;
      }

      setDragDayIndex(null);
      const swapped = computeSwap(targetBlock);
      if (!swapped) return;
      nextBlocks = swapped;
    } else if (targetDayEntry && !isSameBlock && targetDayEntry.isLeftoverDay) {
      // Drop on another block's leftover day → swap with the owning cook-day block
      const cookBlock = weekOverride.mealBlocks.find((b) => b.id === targetDayEntry.blockId);
      if (!cookBlock) return;

      if (sourceBlock.durationDays !== cookBlock.durationDays) {
        setDragDayIndex(null);
        setSwapBlockMessage("Can only swap meals of the same duration. Click a recipe to change its number of days.");
        return;
      }

      setDragDayIndex(null);
      const swapped = computeSwap(cookBlock, targetDayIndex);
      if (!swapped) return;
      nextBlocks = swapped;
    } else {
      // Move to empty day (or own leftover day — treat as empty target)
      // For multi-day blocks, the new span may overlap other blocks: check first.
      const otherBlocks = weekOverride.mealBlocks.filter((b) => b.id !== sourceBlock.id);
      const conflicts = findConflicts(otherBlocks, targetDayIndex, sourceBlock.durationDays);
      if (conflicts.length > 0) {
        setPendingSwap({
          nextBlocks: weekOverride.mealBlocks.map((b) =>
            b.id === sourceBlock.id ? { ...b, startDayIndex: targetDayIndex } : b
          ),
          conflictingBlocks: conflicts
        });
        setDragDayIndex(null);
        return;
      }
      nextBlocks = weekOverride.mealBlocks.map((b) =>
        b.id === sourceBlock.id ? { ...b, startDayIndex: targetDayIndex } : b
      );
    }

    setDragDayIndex(null);
    await upsertWeekOverride({ ...weekOverride, mealBlocks: nextBlocks });
  };

  const shoppingItems = useMemo(() => {
    return aggregateShoppingList(activeMealBlocks, resolvedRecipes, resolvedIngredients);
  }, [activeMealBlocks, resolvedRecipes, resolvedIngredients]);

  if (loading) {
    return <div className="page">Loading week view...</div>;
  }

  if (!pattern && !weekOverride) {
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
            {weekLabel}
            {weekOverride ? (
              <> &ndash; <span className="week-override-badge">Custom week</span></>
            ) : (
              <> &ndash; Pattern: {pattern?.name ?? 'Unknown'}</>
            )}
          </p>
        </div>
        <div className="week-actions">
          <button type="button" className="ghost" aria-label="Previous week" onClick={() => setWeekOffset((prev) => prev - 1)}>
            Previous week
          </button>
          <button type="button" className="ghost" onClick={() => setWeekOffset(0)}>
            Today
          </button>
          <button type="button" className="ghost" aria-label="Next week" onClick={() => setWeekOffset((prev) => prev + 1)}>
            Next week
          </button>
          {weekOverride ? (
            <button type="button" className="ghost" onClick={() => void handleResetToPattern()}>
              Reset to pattern
            </button>
          ) : (
            <button type="button" className="ghost" onClick={() => void handleCustomizeWeek()}>
              Customize this week
            </button>
          )}
          <button type="button" onClick={() => setShoppingOpen(true)}>
            Generate shopping list
          </button>
        </div>
        <div className="mobile-week-nav">
          <button type="button" className="ghost" aria-label="Previous week" onClick={() => setWeekOffset((prev) => prev - 1)}>
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" className="ghost" aria-label="Shopping list" onClick={() => setShoppingOpen(true)}>
            <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </button>
          <button type="button" className="ghost" aria-label="Next week" onClick={() => setWeekOffset((prev) => prev + 1)}>
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <Modal
        title="Can't swap meals"
        isOpen={!!swapBlockMessage}
        onClose={() => setSwapBlockMessage(null)}
      >
        <p>{swapBlockMessage}</p>
      </Modal>

      <div className="week-grid">
        {dayNames.map((label, index) => {
          const dayDate = addDays(weekStart, index);
          const dayEntry = dayMap[index];
          const mealRecipe = dayEntry ? recipes.find((recipe) => recipe.id === dayEntry.recipeId) : null;
          const blockDuration = dayEntry
            ? activeMealBlocks.find((block) => block.id === dayEntry.blockId)?.durationDays ?? 1
            : 1;
          const subtitle = dayEntry && dayEntry.isLeftoverDay
            ? `Leftovers (day ${dayEntry.dayOffset + 1} of ${blockDuration})`
            : 'Cook day';
          const isDraggable = weekOverride !== null && dayEntry !== undefined && !dayEntry.isLeftoverDay;
          const isDragOver = dragDayIndex !== null && dragDayIndex !== index;
          return (
            <div
              key={label}
              className={`day-card${isDragOver ? ' drag-over' : ''}`}
              onDragOver={weekOverride ? (e) => { e.preventDefault(); } : undefined}
              onDrop={weekOverride ? () => void handleDrop(index) : undefined}
            >
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
                  draggable={isDraggable}
                  onDragStart={isDraggable ? () => handleDragStart(index) : undefined}
                  onDragEnd={isDraggable ? handleDragEnd : undefined}
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
        durationDays={detailDurationDays}
        maxDuration={detailMaxDuration}
        onClose={() => setDetailBlockId(null)}
        onRemove={detailBlockId ? () => handleRemoveBlock(detailBlockId) : undefined}
        onChangeDuration={(days: number) => void handleChangeDuration(days)}
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
            <button type="button" className="danger" onClick={() => void handleConfirmOverwrite()}>
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

      <Modal
        title="Conflicting meals"
        isOpen={pendingSwap !== null}
        onClose={handleCancelSwap}
        footer={
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={handleCancelSwap}>
              Cancel
            </button>
            <button type="button" className="danger" onClick={() => void handleConfirmSwap()}>
              Swap and remove conflicts
            </button>
          </div>
        }
      >
        <p>This swap would overlap with existing meals. Confirm to remove them.</p>
        <ul>
          {pendingSwap?.conflictingBlocks.map((block) => {
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
