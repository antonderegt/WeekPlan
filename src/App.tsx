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


      <nav className="bottom-nav">
        <NavLink to="/" end>
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          Week
        </NavLink>
        <NavLink to="/recipes">
          <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
          Recipes
        </NavLink>
        <NavLink to="/ingredients">
          <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Ingredients
        </NavLink>
        <NavLink to="/settings">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </NavLink>
      </nav>

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
