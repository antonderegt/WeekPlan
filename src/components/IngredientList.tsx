import React, { useState } from 'react';
import type { Ingredient } from '../types';
import IngredientEditor from './IngredientEditor';
import { useData } from '../store/DataContext';

export default function IngredientList() {
  const { ingredients, upsertIngredient, removeIngredient } = useData();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient);
    setEditorOpen(true);
  };

  const handleSave = async (ingredient: Ingredient) => {
    await upsertIngredient(ingredient);
    setEditorOpen(false);
  };

  const handleDelete = async (ingredient: Ingredient) => {
    const confirmed = window.confirm(`Delete ${ingredient.name}?`);
    if (!confirmed) return;
    await removeIngredient(ingredient.id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Ingredients</h2>
          <p>Manage your ingredient catalog and default units.</p>
        </div>
        <button type="button" onClick={openNew}>
          Add ingredient
        </button>
      </div>
      <div className="card">
        {ingredients && ingredients.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => (
                <tr key={ingredient.id}>
                  <td>{ingredient.name}</td>
                  <td>{ingredient.unit}</td>
                  <td className="actions">
                    <button type="button" className="ghost" onClick={() => openEdit(ingredient)}>
                      Edit
                    </button>
                    <button type="button" className="ghost danger" onClick={() => handleDelete(ingredient)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No ingredients yet. Add your first ingredient.</p>
        )}
      </div>
      <IngredientEditor
        isOpen={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
