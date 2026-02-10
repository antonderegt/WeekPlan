import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Ingredient, Pattern, Recipe, Settings } from '../types';
import {
  deleteIngredient,
  deletePattern,
  deleteRecipe,
  getIngredients,
  getPatterns,
  getRecipes,
  getSettings,
  saveIngredient,
  savePattern,
  saveRecipe,
  saveSettings
} from '../api/client';

interface DataContextValue {
  ingredients: Ingredient[];
  recipes: Recipe[];
  patterns: Pattern[];
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  upsertIngredient: (ingredient: Ingredient) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;
  upsertRecipe: (recipe: Recipe) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;
  upsertPattern: (pattern: Pattern) => Promise<void>;
  upsertPatterns: (patterns: Pattern[]) => Promise<void>;
  removePattern: (id: string) => Promise<void>;
  upsertSettings: (settings: Settings) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextIngredients, nextRecipes, nextPatterns, nextSettings] = await Promise.all([
        getIngredients(),
        getRecipes(),
        getPatterns(),
        getSettings()
      ]);
      setIngredients(nextIngredients);
      setRecipes(nextRecipes);
      setPatterns(nextPatterns);
      setSettings(nextSettings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const upsertIngredient = useCallback(async (ingredient: Ingredient) => {
    await saveIngredient(ingredient);
    setIngredients((prev) => {
      const existing = prev.find((item) => item.id === ingredient.id);
      if (existing) {
        return prev.map((item) => (item.id === ingredient.id ? ingredient : item));
      }
      return [...prev, ingredient];
    });
  }, []);

  const removeIngredient = useCallback(async (id: string) => {
    await deleteIngredient(id);
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const upsertRecipe = useCallback(async (recipe: Recipe) => {
    await saveRecipe(recipe);
    setRecipes((prev) => {
      const existing = prev.find((item) => item.id === recipe.id);
      if (existing) {
        return prev.map((item) => (item.id === recipe.id ? recipe : item));
      }
      return [...prev, recipe];
    });
  }, []);

  const removeRecipe = useCallback(async (id: string) => {
    await deleteRecipe(id);
    setRecipes((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const upsertPattern = useCallback(async (pattern: Pattern) => {
    await savePattern(pattern);
    setPatterns((prev) => {
      const existing = prev.find((item) => item.id === pattern.id);
      if (existing) {
        return prev.map((item) => (item.id === pattern.id ? pattern : item));
      }
      return [...prev, pattern];
    });
  }, []);

  const upsertPatterns = useCallback(async (nextPatterns: Pattern[]) => {
    await Promise.all(nextPatterns.map((pattern) => savePattern(pattern)));
    setPatterns((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      nextPatterns.forEach((pattern) => {
        map.set(pattern.id, pattern);
      });
      return Array.from(map.values());
    });
  }, []);

  const removePattern = useCallback(async (id: string) => {
    await deletePattern(id);
    setPatterns((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const upsertSettings = useCallback(async (nextSettings: Settings) => {
    await saveSettings(nextSettings);
    setSettings(nextSettings);
  }, []);

  const value = useMemo(
    () => ({
      ingredients,
      recipes,
      patterns,
      settings,
      loading,
      error,
      refreshAll,
      upsertIngredient,
      removeIngredient,
      upsertRecipe,
      removeRecipe,
      upsertPattern,
      upsertPatterns,
      removePattern,
      upsertSettings
    }),
    [
      ingredients,
      recipes,
      patterns,
      settings,
      loading,
      error,
      refreshAll,
      upsertIngredient,
      removeIngredient,
      upsertRecipe,
      removeRecipe,
      upsertPattern,
      upsertPatterns,
      removePattern,
      upsertSettings
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
