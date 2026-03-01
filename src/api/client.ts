import type { Ingredient, Pattern, Recipe, Settings, WeekOverride } from '../types';

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function getIngredients(): Promise<Ingredient[]> {
  return fetchJson('/api/ingredients');
}

export function saveIngredient(ingredient: Ingredient): Promise<void> {
  return fetchJson(`/api/ingredients/${ingredient.id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ingredient)
    }
  );
}

export function deleteIngredient(id: string): Promise<void> {
  return fetchJson(`/api/ingredients/${id}`, { method: 'DELETE' });
}

export function getRecipes(): Promise<Recipe[]> {
  return fetchJson('/api/recipes');
}

export function saveRecipe(recipe: Recipe): Promise<void> {
  return fetchJson(`/api/recipes/${recipe.id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe)
    }
  );
}

export function deleteRecipe(id: string): Promise<void> {
  return fetchJson(`/api/recipes/${id}`, { method: 'DELETE' });
}

export function getPatterns(): Promise<Pattern[]> {
  return fetchJson('/api/patterns');
}

export function savePattern(pattern: Pattern): Promise<void> {
  return fetchJson(`/api/patterns/${pattern.id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pattern)
    }
  );
}

export function deletePattern(id: string): Promise<void> {
  return fetchJson(`/api/patterns/${id}`, { method: 'DELETE' });
}

export function getSettings(): Promise<Settings | null> {
  return fetchJson('/api/settings');
}

export function saveSettings(settings: Settings): Promise<void> {
  return fetchJson('/api/settings',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }
  );
}

export function getWeekOverrides(): Promise<WeekOverride[]> {
  return fetchJson('/api/week-overrides');
}

export function saveWeekOverride(override: WeekOverride): Promise<void> {
  return fetchJson(`/api/week-overrides/${override.weekStartDate}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mealBlocks: override.mealBlocks })
  });
}

export function deleteWeekOverride(weekStartDate: string): Promise<void> {
  return fetchJson(`/api/week-overrides/${weekStartDate}`, { method: 'DELETE' });
}

export async function exportData(): Promise<void> {
  const response = await fetch('/api/export');
  if (!response.ok) {
    throw new Error('Export failed');
  }
  const data = await response.json();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `weekplan-export-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || data.version !== 1) {
    throw new Error('Invalid or unsupported export file.');
  }
  return fetchJson('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: text
  });
}
