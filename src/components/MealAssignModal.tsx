import React, { useEffect, useState } from 'react';
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
  const [recipeId, setRecipeId] = useState('');
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const firstId = recipes[0]?.id ?? '';
    setRecipeId(firstId);
    setDuration(1);
  }, [isOpen, recipes]);

  const canSave = recipeId && duration >= 1;

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
            <select value={recipeId} onChange={(event) => setRecipeId(event.target.value)}>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
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
