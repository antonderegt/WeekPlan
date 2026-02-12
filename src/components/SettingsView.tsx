import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Pattern, Settings } from '../types';
import { getWeekStart, toISODate } from '../utils/date';
import { resolvePatternIdForWeek } from '../utils/meal';
import { createId } from '../utils/uuid';
import { useData } from '../store/DataContext';
import { exportData, importData } from '../api/client';

function nextPatternName(existing: Pattern[]): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const used = new Set(existing.map((pattern) => pattern.name.trim()));
  for (const letter of alphabet) {
    const candidate = `Week ${letter}`;
    if (!used.has(candidate)) return candidate;
  }
  return `Week ${existing.length + 1}`;
}

export default function SettingsView() {
  const { patterns, settings, loading, upsertSettings, upsertPattern, removePattern, refreshAll } = useData();
  const [startDate, setStartDate] = useState('');
  const [dataStatus, setDataStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStartDate(settings?.patternStartDate ?? '');
  }, [settings?.patternStartDate]);

  const orderedPatterns = useMemo(() => {
    if (!patterns || !settings) return [];
    const patternMap = new Map(patterns.map((pattern) => [pattern.id, pattern]));
    return settings.patternOrder.map((id) => patternMap.get(id)).filter(Boolean) as Pattern[];
  }, [patterns, settings]);

  if (loading || !settings) {
    return <div className="page">Loading settings...</div>;
  }

  const todayPatternId = resolvePatternIdForWeek(new Date(), settings);
  const todayPattern = patterns.find((pattern) => pattern.id === todayPatternId);

  const handleStartDateSave = async () => {
    if (!startDate) return;
    await upsertSettings({ ...settings, patternStartDate: startDate });
  };

  const handleMove = async (id: string, direction: -1 | 1) => {
    const order = [...settings.patternOrder];
    const index = order.indexOf(id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return;
    [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
    await upsertSettings({ ...settings, patternOrder: order });
  };

  const handleAddPattern = async () => {
    const name = nextPatternName(patterns);
    const id = createId();
    await upsertPattern({ id, name, mealBlocks: [] });
    await upsertSettings({ ...settings, patternOrder: [...settings.patternOrder, id] });
  };

  const handleRename = async (pattern: Pattern, name: string) => {
    await upsertPattern({ ...pattern, name });
  };

  const handleDelete = async (pattern: Pattern) => {
    if (patterns.length <= 1) {
      window.alert('You must keep at least one pattern.');
      return;
    }
    const confirmed = window.confirm(`Delete ${pattern.name}? This will remove its meal plan.`);
    if (!confirmed) return;
    await removePattern(pattern.id);
    await upsertSettings({
      ...settings,
      patternOrder: settings.patternOrder.filter((id) => id !== pattern.id)
    });
  };

  const handleExport = async () => {
    setDataStatus(null);
    try {
      await exportData();
      setDataStatus({ type: 'success', message: 'Data exported successfully.' });
    } catch {
      setDataStatus({ type: 'error', message: 'Failed to export data.' });
    }
  };

  const handleImportClick = () => {
    setDataStatus(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file can be selected again
    event.target.value = '';

    const confirmed = window.confirm(
      'Importing will replace ALL existing data (ingredients, recipes, patterns, and settings). This cannot be undone.\n\nContinue?'
    );
    if (!confirmed) return;

    setImporting(true);
    setDataStatus(null);
    try {
      await importData(file);
      await refreshAll();
      setDataStatus({ type: 'success', message: 'Data imported successfully.' });
    } catch (err) {
      setDataStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to import data.' });
    } finally {
      setImporting(false);
    }
  };

  const defaultStart = toISODate(getWeekStart(new Date()));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure the weekly pattern cycle and start date.</p>
        </div>
      </div>
      <div className="card form-grid">
        <label>
          Pattern start date (Week A start)
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <div className="settings-actions">
          <button type="button" className="ghost" onClick={() => setStartDate(defaultStart)}>
            Use current week
          </button>
          <button type="button" onClick={handleStartDateSave} disabled={!startDate}>
            Save start date
          </button>
        </div>
        <p className="helper">Current pattern for today: {todayPattern?.name ?? 'Unknown'}</p>
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Pattern cycle</h3>
          <button type="button" className="ghost" onClick={handleAddPattern}>
            Add pattern
          </button>
        </div>
        {orderedPatterns.length === 0 ? (
          <p className="empty-state">No patterns yet.</p>
        ) : (
          <div className="pattern-list">
            {orderedPatterns.map((pattern, index) => (
              <div key={pattern.id} className="pattern-row">
                <input
                  value={pattern.name}
                  onChange={(event) => handleRename(pattern, event.target.value)}
                />
                <div className="pattern-actions">
                  <button
                    type="button"
                    className="ghost"
                    disabled={index === 0}
                    onClick={() => handleMove(pattern.id, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    disabled={index === orderedPatterns.length - 1}
                    onClick={() => handleMove(pattern.id, 1)}
                  >
                    Down
                  </button>
                  <button type="button" className="ghost danger" onClick={() => handleDelete(pattern)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Data</h3>
        </div>
        <p className="helper" style={{ marginTop: 0 }}>Export all data as a JSON file or import from a previous export.</p>
        <div className="data-actions">
          <button type="button" onClick={handleExport}>
            Export data
          </button>
          <button type="button" className="ghost" onClick={handleImportClick} disabled={importing}>
            {importing ? 'Importing…' : 'Import data'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        {dataStatus && (
          <p className={`data-status ${dataStatus.type}`}>{dataStatus.message}</p>
        )}
      </div>
    </div>
  );
}
