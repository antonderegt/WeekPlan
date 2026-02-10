import express from 'express';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? '/data/weekplan.db';

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
