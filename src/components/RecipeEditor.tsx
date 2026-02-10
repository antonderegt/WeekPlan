import React, { useEffect, useMemo, useState } from 'react';
import type { Ingredient, Recipe, RecipeIngredient } from '../types';
import Modal from './Modal';
import { createId } from '../utils/uuid';

interface RecipeEditorProps {
  isOpen: boolean;
  ingredients: Ingredient[];
  initial?: Recipe | null;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

export default function RecipeEditor({
  isOpen,
  ingredients,
  initial,
  onClose,
  onSave
}: RecipeEditorProps) {
  const [name, setName] = useState('');
  const [items, setItems] = useState<RecipeIngredient[]>([]);
  const [stepsText, setStepsText] = useState('');

  const ingredientMap = useMemo(() => new Map(ingredients.map((item) => [item.id, item])), [ingredients]);

  useEffect(() => {
    if (!isOpen) return;
    setName(initial?.name ?? '');
    setItems(initial?.ingredients ?? []);
    setStepsText(initial?.steps?.join('\n') ?? '');
  }, [isOpen, initial]);

  const handleAddItem = () => {
    if (ingredients.length === 0) return;
    const first = ingredients[0];
    setItems((prev) => [
      ...prev,
      {
        ingredientId: first.id,
        quantity: 1,
        unit: first.unit
      }
    ]);
  };

  const updateItem = (index: number, updates: Partial<RecipeIngredient>) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, ...updates };
      })
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const canSave = name.trim().length > 0;

  return (
    <Modal
      title={initial ? 'Edit recipe' : 'Add recipe'}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canSave) return;
              const steps = stepsText
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);
              onSave({
                id: initial?.id ?? createId(),
                name: name.trim(),
                ingredients: items,
                steps
              });
            }}
            disabled={!canSave}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="form-grid">
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      </div>
      <div className="detail-section">
        <div className="section-header">
          <h4>Ingredients</h4>
          <button type="button" className="ghost" onClick={handleAddItem} disabled={ingredients.length === 0}>
            Add ingredient
          </button>
        </div>
        {ingredients.length === 0 ? (
          <p className="empty-state">Add ingredients to the catalog first.</p>
        ) : items.length === 0 ? (
          <p className="empty-state">No ingredients added.</p>
        ) : (
          <div className="ingredient-editor">
            {items.map((item, index) => {
              const ingredient = ingredientMap.get(item.ingredientId);
              return (
                <div key={`${item.ingredientId}-${index}`} className="ingredient-row">
                  <select
                    value={item.ingredientId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      const nextIngredient = ingredientMap.get(nextId);
                      updateItem(index, {
                        ingredientId: nextId,
                        unit: item.unit?.trim() ? item.unit : nextIngredient?.unit ?? ''
                      });
                    }}
                  >
                    {ingredients.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                  />
                  <input
                    value={item.unit}
                    onChange={(event) => updateItem(index, { unit: event.target.value })}
                    placeholder={ingredient?.unit ?? 'unit'}
                  />
                  <button type="button" className="ghost danger" onClick={() => removeItem(index)}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="detail-section">
        <h4>Steps</h4>
        <textarea
          rows={6}
          value={stepsText}
          onChange={(event) => setStepsText(event.target.value)}
          placeholder="One step per line"
        />
      </div>
    </Modal>
  );
}
