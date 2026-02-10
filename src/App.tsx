import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import type { Pattern, Settings } from './types';
import { getWeekStart, toISODate } from './utils/date';
import { resolvePatternIdForWeek } from './utils/meal';
import { createId } from './utils/uuid';
import WeekView from './components/WeekView';
import RecipeList from './components/RecipeList';
import IngredientList from './components/IngredientList';
import SettingsView from './components/SettingsView';
import Modal from './components/Modal';
import { useData } from './store/DataContext';

const SETTINGS_ID = 'settings';

function defaultPatterns(): Pattern[] {
  return [
    { id: createId(), name: 'Week A', mealBlocks: [] },
    { id: createId(), name: 'Week B', mealBlocks: [] }
  ];
}

export default function App() {
  const { patterns, settings, upsertPatterns, upsertSettings, loading } = useData();
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');

  const defaultStartDate = useMemo(() => toISODate(getWeekStart(new Date())), []);

  useEffect(() => {
    if (loading) return;
    if (patterns.length === 0) {
      const defaults = defaultPatterns();
      void upsertPatterns(defaults);
    }
  }, [patterns, upsertPatterns, loading]);

  useEffect(() => {
    if (loading) return;
    if (!settings) {
      const order = patterns.map((pattern) => pattern.id);
      const initialSettings: Settings = {
        id: SETTINGS_ID,
        patternStartDate: '',
        patternOrder: order
      };
      void upsertSettings(initialSettings);
      return;
    }

    const existingIds = new Set(patterns.map((pattern) => pattern.id));
    const filteredOrder = settings.patternOrder.filter((id) => existingIds.has(id));
    const missing = patterns.filter((pattern) => !filteredOrder.includes(pattern.id)).map((pattern) => pattern.id);
    if (missing.length > 0 || filteredOrder.length !== settings.patternOrder.length) {
      void upsertSettings({ ...settings, patternOrder: [...filteredOrder, ...missing] });
    }
  }, [patterns, settings, upsertSettings, loading]);

  useEffect(() => {
    if (!settings) return;
    setShowStartPrompt(!settings.patternStartDate);
    if (!settings.patternStartDate) {
      setStartDateInput(defaultStartDate);
    }
  }, [settings, defaultStartDate]);

  const handleStartDateSave = async (value: string) => {
    if (!settings) return;
    await upsertSettings({ ...settings, patternStartDate: value });
    setShowStartPrompt(false);
  };

  const currentPatternName = useMemo(() => {
    if (!settings || !settings.patternStartDate) return null;
    const id = resolvePatternIdForWeek(new Date(), settings);
    return patterns.find((pattern) => pattern.id === id)?.name ?? null;
  }, [settings, patterns]);

  return (
    <div className="app">
      <header className="top-bar">
        <div className="brand">WeekPlan</div>
        <nav>
          <NavLink to="/" end>
            Week
          </NavLink>
          <NavLink to="/recipes">Recipes</NavLink>
          <NavLink to="/ingredients">Ingredients</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="pattern-chip">{currentPatternName ? `Current: ${currentPatternName}` : 'Set start date'}</div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<WeekView />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/ingredients" element={<IngredientList />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </main>

      <Modal
        title="Set your pattern start date"
        isOpen={showStartPrompt}
        footer={
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => handleStartDateSave(defaultStartDate)}>
              Use current week
            </button>
            <button
              type="button"
              onClick={() => startDateInput && void handleStartDateSave(startDateInput)}
            >
              Save start date
            </button>
          </div>
        }
      >
        <p>
          Pick the calendar week that corresponds to Week A. This allows the app to alternate your weekly patterns.
        </p>
        <label className="modal-label">
          Week A start date
          <input
            id="start-date-input"
            type="date"
            value={startDateInput}
            onChange={(event) => setStartDateInput(event.target.value)}
          />
        </label>
      </Modal>
    </div>
  );
}
