import express from 'express';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'weekplan.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ingredients_json TEXT NOT NULL,
    steps_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS patterns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mealBlocks_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    patternStartDate TEXT NOT NULL,
    patternOrder_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS week_overrides (
    week_start_date TEXT PRIMARY KEY,
    meal_blocks_json TEXT NOT NULL
  );
`);

app.use(express.json({ limit: '1mb' }));

const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/ingredients', (_req, res) => {
  const rows = db.prepare('SELECT id, name, unit FROM ingredients ORDER BY name').all();
  res.json(rows);
});

app.put('/api/ingredients/:id', (req, res) => {
  const { id } = req.params;
  const { name, unit } = req.body ?? {};
  if (!id || !name || !unit) {
    res.status(400).send('Missing ingredient fields.');
    return;
  }
  db.prepare('INSERT OR REPLACE INTO ingredients (id, name, unit) VALUES (?, ?, ?)').run(id, name, unit);
  res.status(204).end();
});

app.delete('/api/ingredients/:id', (req, res) => {
  db.prepare('DELETE FROM ingredients WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.get('/api/recipes', (_req, res) => {
  const rows = db.prepare('SELECT id, name, ingredients_json, steps_json FROM recipes ORDER BY name').all();
  const recipes = rows.map((row) => ({
    id: row.id,
    name: row.name,
    ingredients: parseJson(row.ingredients_json, []),
    steps: parseJson(row.steps_json, [])
  }));
  res.json(recipes);
});

app.put('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const { name, ingredients, steps } = req.body ?? {};
  if (!id || !name || !Array.isArray(ingredients) || !Array.isArray(steps)) {
    res.status(400).send('Missing recipe fields.');
    return;
  }
  db.prepare(
    'INSERT OR REPLACE INTO recipes (id, name, ingredients_json, steps_json) VALUES (?, ?, ?, ?)'
  ).run(id, name, JSON.stringify(ingredients), JSON.stringify(steps));
  res.status(204).end();
});

app.delete('/api/recipes/:id', (req, res) => {
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.get('/api/patterns', (_req, res) => {
  const rows = db.prepare('SELECT id, name, mealBlocks_json FROM patterns ORDER BY name').all();
  const patterns = rows.map((row) => ({
    id: row.id,
    name: row.name,
    mealBlocks: parseJson(row.mealBlocks_json, [])
  }));
  res.json(patterns);
});

app.put('/api/patterns/:id', (req, res) => {
  const { id } = req.params;
  const { name, mealBlocks } = req.body ?? {};
  if (!id || !name || !Array.isArray(mealBlocks)) {
    res.status(400).send('Missing pattern fields.');
    return;
  }
  db.prepare('INSERT OR REPLACE INTO patterns (id, name, mealBlocks_json) VALUES (?, ?, ?)').run(
    id,
    name,
    JSON.stringify(mealBlocks)
  );
  res.status(204).end();
});

app.delete('/api/patterns/:id', (req, res) => {
  db.prepare('DELETE FROM patterns WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.get('/api/settings', (_req, res) => {
  const row = db.prepare('SELECT id, patternStartDate, patternOrder_json FROM settings WHERE id = ?').get('settings');
  if (!row) {
    res.json(null);
    return;
  }
  res.json({
    id: row.id,
    patternStartDate: row.patternStartDate,
    patternOrder: parseJson(row.patternOrder_json, [])
  });
});

app.put('/api/settings', (req, res) => {
  const { id, patternStartDate, patternOrder } = req.body ?? {};
  if (!id || !Array.isArray(patternOrder) || typeof patternStartDate !== 'string') {
    res.status(400).send('Missing settings fields.');
    return;
  }
  db.prepare(
    'INSERT OR REPLACE INTO settings (id, patternStartDate, patternOrder_json) VALUES (?, ?, ?)'
  ).run(id, patternStartDate, JSON.stringify(patternOrder));
  res.status(204).end();
});

// ── Week Overrides ───────────────────────────────────────────────────

app.get('/api/week-overrides', (_req, res) => {
  const rows = db.prepare('SELECT week_start_date, meal_blocks_json FROM week_overrides').all();
  const overrides = rows.map((row) => ({
    weekStartDate: row.week_start_date,
    mealBlocks: parseJson(row.meal_blocks_json, [])
  }));
  res.json(overrides);
});

app.put('/api/week-overrides/:weekStartDate', (req, res) => {
  const { weekStartDate } = req.params;
  const { mealBlocks } = req.body ?? {};
  if (!weekStartDate || !Array.isArray(mealBlocks)) {
    res.status(400).send('Missing week override fields.');
    return;
  }
  db.prepare('INSERT OR REPLACE INTO week_overrides (week_start_date, meal_blocks_json) VALUES (?, ?)').run(
    weekStartDate,
    JSON.stringify(mealBlocks)
  );
  res.status(204).end();
});

app.delete('/api/week-overrides/:weekStartDate', (req, res) => {
  db.prepare('DELETE FROM week_overrides WHERE week_start_date = ?').run(req.params.weekStartDate);
  res.status(204).end();
});

// ── Export / Import ──────────────────────────────────────────────────

app.get('/api/export', (_req, res) => {
  const ingredients = db.prepare('SELECT id, name, unit FROM ingredients ORDER BY name').all();

  const recipeRows = db.prepare('SELECT id, name, ingredients_json, steps_json FROM recipes ORDER BY name').all();
  const recipes = recipeRows.map((r) => ({
    id: r.id,
    name: r.name,
    ingredients: parseJson(r.ingredients_json, []),
    steps: parseJson(r.steps_json, [])
  }));

  const patternRows = db.prepare('SELECT id, name, mealBlocks_json FROM patterns ORDER BY name').all();
  const patterns = patternRows.map((r) => ({
    id: r.id,
    name: r.name,
    mealBlocks: parseJson(r.mealBlocks_json, [])
  }));

  const settingsRow = db.prepare('SELECT id, patternStartDate, patternOrder_json FROM settings WHERE id = ?').get('settings');
  const settings = settingsRow
    ? { id: settingsRow.id, patternStartDate: settingsRow.patternStartDate, patternOrder: parseJson(settingsRow.patternOrder_json, []) }
    : null;

  res.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    ingredients,
    recipes,
    patterns,
    settings
  });
});

app.post('/api/import', (req, res) => {
  const data = req.body;

  if (!data || data.version !== 1) {
    res.status(400).send('Invalid or unsupported export file.');
    return;
  }

  if (!Array.isArray(data.ingredients) || !Array.isArray(data.recipes) || !Array.isArray(data.patterns)) {
    res.status(400).send('Export file is missing required data arrays.');
    return;
  }

  const importTransaction = db.transaction(() => {
    // Clear all tables
    db.prepare('DELETE FROM ingredients').run();
    db.prepare('DELETE FROM recipes').run();
    db.prepare('DELETE FROM patterns').run();
    db.prepare('DELETE FROM settings').run();

    // Insert ingredients
    const insertIngredient = db.prepare('INSERT INTO ingredients (id, name, unit) VALUES (?, ?, ?)');
    for (const ing of data.ingredients) {
      if (ing.id && ing.name && ing.unit) {
        insertIngredient.run(ing.id, ing.name, ing.unit);
      }
    }

    // Insert recipes
    const insertRecipe = db.prepare('INSERT INTO recipes (id, name, ingredients_json, steps_json) VALUES (?, ?, ?, ?)');
    for (const recipe of data.recipes) {
      if (recipe.id && recipe.name) {
        insertRecipe.run(recipe.id, recipe.name, JSON.stringify(recipe.ingredients ?? []), JSON.stringify(recipe.steps ?? []));
      }
    }

    // Insert patterns
    const insertPattern = db.prepare('INSERT INTO patterns (id, name, mealBlocks_json) VALUES (?, ?, ?)');
    for (const pattern of data.patterns) {
      if (pattern.id && pattern.name) {
        insertPattern.run(pattern.id, pattern.name, JSON.stringify(pattern.mealBlocks ?? []));
      }
    }

    // Insert settings
    if (data.settings && data.settings.id) {
      db.prepare('INSERT INTO settings (id, patternStartDate, patternOrder_json) VALUES (?, ?, ?)').run(
        data.settings.id,
        data.settings.patternStartDate ?? '',
        JSON.stringify(data.settings.patternOrder ?? [])
      );
    }
  });

  try {
    importTransaction();
    res.status(204).end();
  } catch (err) {
    res.status(500).send('Import failed: ' + (err instanceof Error ? err.message : 'unknown error'));
  }
});

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`WeekPlan server listening on port ${port}`);
});
