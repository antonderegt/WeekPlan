import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Recipe } from '../types';
import Modal from './Modal';

interface MealAssignModalProps {
  isOpen: boolean;
  dayLabel: string;
  maxDuration: number;
  recipes: Recipe[];
  onClose: () => void;
  onSave: (recipeId: string, duration: number) => void;
}

export default function MealAssignModal({
  isOpen,
  dayLabel,
  maxDuration,
  recipes,
  onClose,
  onSave
}: MealAssignModalProps) {
  interface ComboState {
    isOpen: boolean;
    query: string;
    highlightedIndex: number;
  }

  const [recipeId, setRecipeId] = useState('');
  const [duration, setDuration] = useState(1);
  const [comboState, setComboState] = useState<ComboState>({
    isOpen: false,
    query: '',
    highlightedIndex: 0
  });

  const recipeInputRef = useRef<HTMLInputElement | null>(null);
  const recipeMap = useMemo(() => new Map(recipes.map((item) => [item.id, item])), [recipes]);
  const selectedRecipeName = recipeMap.get(recipeId)?.name ?? '';

  useEffect(() => {
    if (!isOpen) return;
    setRecipeId('');
    setDuration(1);
    setComboState({
      isOpen: false,
      query: recipes[0]?.name ?? '',
      highlightedIndex: 0
    });
    setTimeout(() => recipeInputRef.current?.focus(), 0);
  }, [isOpen, recipes]);

  const canSave = recipeId && duration >= 1;
  const queryValue = comboState.isOpen ? comboState.query : selectedRecipeName;
  const normalizedQuery = comboState.query.trim().toLowerCase();
  const filteredRecipes = normalizedQuery
    ? recipes.filter((recipe) => recipe.name.toLowerCase().includes(normalizedQuery))
    : recipes;
  const highlightedIndex =
    filteredRecipes.length === 0 ? -1 : Math.min(comboState.highlightedIndex, filteredRecipes.length - 1);
  const listboxId = 'meal-recipe-listbox';
  const activeDescendantId = highlightedIndex >= 0 ? `meal-recipe-option-${highlightedIndex}` : undefined;

  const selectRecipe = (recipe: Recipe) => {
    setRecipeId(recipe.id);
    setComboState({
      isOpen: false,
      query: recipe.name,
      highlightedIndex: 0
    });
  };

  return (
    <Modal
      title={`Add meal for ${dayLabel}`}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={() => canSave && onSave(recipeId, duration)} disabled={!canSave}>
            Add meal
          </button>
        </div>
      }
    >
      {recipes.length === 0 ? (
        <p>Create a recipe first, then add it to the plan.</p>
      ) : (
        <div className="form-grid">
          <label>
            Recipe
            <div className="meal-recipe-combobox">
              <input
                ref={recipeInputRef}
                className="meal-recipe-combobox-input"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={comboState.isOpen}
                aria-controls={listboxId}
                aria-activedescendant={activeDescendantId}
                value={queryValue}
                onFocus={() =>
                  setComboState({
                    isOpen: true,
                    query: selectedRecipeName,
                    highlightedIndex: Math.max(
                      0,
                      recipes.findIndex((recipe) => recipe.id === recipeId)
                    )
                  })
                }
                onBlur={() =>
                  setComboState({
                    isOpen: false,
                    query: selectedRecipeName,
                    highlightedIndex: 0
                  })
                }
                onChange={(event) =>
                  setComboState((prev) => ({
                    ...prev,
                    isOpen: true,
                    query: event.target.value,
                    highlightedIndex: 0
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    if (!comboState.isOpen) {
                      setComboState((prev) => ({ ...prev, isOpen: true }));
                      return;
                    }
                    if (filteredRecipes.length === 0) return;
                    setComboState((prev) => ({
                      ...prev,
                      highlightedIndex: Math.min(Math.max(0, prev.highlightedIndex) + 1, filteredRecipes.length - 1)
                    }));
                  }
                  if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (!comboState.isOpen) {
                      setComboState((prev) => ({ ...prev, isOpen: true }));
                      return;
                    }
                    if (filteredRecipes.length === 0) return;
                    setComboState((prev) => ({
                      ...prev,
                      highlightedIndex: Math.max(0, prev.highlightedIndex - 1)
                    }));
                  }
                  if (event.key === 'Enter') {
                    if (!comboState.isOpen) return;
                    event.preventDefault();
                    const selected = filteredRecipes[highlightedIndex];
                    if (!selected) return;
                    selectRecipe(selected);
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setComboState({
                      isOpen: false,
                      query: selectedRecipeName,
                      highlightedIndex: 0
                    });
                  }
                }}
              />
              {comboState.isOpen ? (
                <ul id={listboxId} role="listbox" className="meal-recipe-combobox-list">
                  {filteredRecipes.length === 0 ? (
                    <li className="meal-recipe-combobox-empty" aria-disabled="true">
                      No matches
                    </li>
                  ) : (
                    filteredRecipes.map((recipe, index) => (
                      <li
                        key={recipe.id}
                        id={`meal-recipe-option-${index}`}
                        role="option"
                        aria-selected={index === highlightedIndex}
                        className={index === highlightedIndex ? 'is-active' : undefined}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectRecipe(recipe);
                        }}
                      >
                        {recipe.name}
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
          </label>
          <label>
            Duration (days)
            <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              {Array.from({ length: maxDuration }, (_, idx) => idx + 1).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </Modal>
  );
}
