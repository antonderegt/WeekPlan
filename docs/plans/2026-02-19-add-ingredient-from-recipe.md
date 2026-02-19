# Add Ingredient from Recipe Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to create new ingredients inline from the ingredient combobox inside RecipeEditor, without leaving the recipe modal.

**Architecture:** Extend `ComboState` in `RecipeEditor.tsx` with `createMode`, `newIngredientName`, and `newIngredientUnit` fields. When the user types a query with no exact match, a "Create '[name]'" option appears at the bottom of the dropdown. Selecting it transforms the dropdown in-place into a small form (name + unit). On submit, `upsertIngredient` (from `useData()`) is called, the new ingredient is auto-selected in the row, and focus moves to the quantity input.

**Tech Stack:** React, TypeScript, `useData()` hook, plain CSS in `styles.css`.

---

### Task 1: Wire upsertIngredient, add refs, move blur handling to wrapper

**Files:**
- Modify: `src/components/RecipeEditor.tsx`

**Step 1: Import and call useData**

Add to the imports at the top of the file:
```typescript
import { useData } from '../store/DataContext';
```

Add inside the `RecipeEditor` function body, near the top:
```typescript
const { upsertIngredient } = useData();
```

**Step 2: Add quantity input refs**

Add below `ingredientInputRefs`:
```typescript
const quantityInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
```

Attach to the quantity `<input>` inside the ingredient row map:
```tsx
<input
  ref={(element) => { quantityInputRefs.current[index] = element; }}
  type="number"
  min={0}
  step="0.1"
  value={item.quantity}
  onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
/>
```

**Step 3: Remove the "no ingredients" guards**

In `handleAddItem`, remove:
```typescript
if (ingredients.length === 0) return;
```

Change the "Add ingredient" button from:
```tsx
<button type="button" className="ghost" onClick={handleAddItem} disabled={ingredients.length === 0}>
```
to:
```tsx
<button type="button" className="ghost" onClick={handleAddItem}>
```

Change the outer render condition from:
```tsx
{ingredients.length === 0 ? (
  <p className="empty-state">Add ingredients to the catalog first.</p>
) : items.length === 0 ? (
```
to:
```tsx
{items.length === 0 ? (
```
(Remove one branch entirely — the `ingredients.length === 0` branch and its ternary arm.)

**Step 4: Move onBlur from input to wrapper div**

The `.ingredient-combobox` div needs to handle focus-out for the whole widget (including the create form inputs). This replaces the `onBlur` on the combobox `<input>`.

Add a `comboboxWrapperRefs` ref:
```typescript
const comboboxWrapperRefs = useRef<Record<number, HTMLDivElement | null>>({});
```

Change the `.ingredient-combobox` div to:
```tsx
<div
  className="ingredient-combobox"
  ref={(el) => { comboboxWrapperRefs.current[index] = el; }}
  onBlur={(event) => {
    if ((event.currentTarget as HTMLDivElement).contains(event.relatedTarget as Node)) return;
    setComboState(index, {
      isOpen: false,
      query: ingredientName,
      highlightedIndex: 0,
      createMode: false,
      newIngredientName: '',
      newIngredientUnit: ''
    });
  }}
>
```

Remove `onBlur` from the combobox `<input>` entirely (the wrapper div now handles it).

**Step 5: Commit**

```bash
git add src/components/RecipeEditor.tsx
git commit -m "feat: wire upsertIngredient, add quantity refs, move blur to wrapper"
```

---

### Task 2: Extend ComboState and add "Create" option to dropdown

**Files:**
- Modify: `src/components/RecipeEditor.tsx`

**Step 1: Extend the ComboState interface**

Change the `ComboState` interface (defined inside the component) from:
```typescript
interface ComboState {
  isOpen: boolean;
  query: string;
  highlightedIndex: number;
}
```
to:
```typescript
interface ComboState {
  isOpen: boolean;
  query: string;
  highlightedIndex: number;
  createMode: boolean;
  newIngredientName: string;
  newIngredientUnit: string;
}
```

**Step 2: Update the setComboState default fallback**

In the `setComboState` helper, change the `previous` fallback to:
```typescript
const previous = prev[index] ?? {
  isOpen: false,
  query: getIngredientName(items[index]?.ingredientId ?? ''),
  highlightedIndex: 0,
  createMode: false,
  newIngredientName: '',
  newIngredientUnit: ''
};
```

**Step 3: Update selectIngredient to reset createMode fields**

```typescript
const selectIngredient = (index: number, ingredient: Ingredient) => {
  updateItem(index, {
    ingredientId: ingredient.id,
    unit: ingredient.unit
  });
  setComboState(index, {
    isOpen: false,
    query: ingredient.name,
    highlightedIndex: 0,
    createMode: false,
    newIngredientName: '',
    newIngredientUnit: ''
  });
};
```

**Step 4: Compute create option variables inside the row map**

After the `highlightedIndex` computation inside `items.map`, add:
```typescript
const showCreateOption = normalizedQuery.length > 0;
const createOptionIndex = filteredIngredients.length;
const totalOptions = filteredIngredients.length + (showCreateOption ? 1 : 0);
```

Update the `highlightedIndex` computation to use `totalOptions` instead of `filteredIngredients.length`:
```typescript
const highlightedIndex =
  totalOptions === 0
    ? -1
    : Math.min(comboState.highlightedIndex, totalOptions - 1);
```

**Step 5: Update ArrowDown and ArrowUp handlers to use totalOptions**

Replace:
```typescript
if (filteredIngredients.length === 0) return;
setComboState(index, {
  highlightedIndex: Math.min(
    Math.max(0, comboState.highlightedIndex) + 1,
    filteredIngredients.length - 1
  )
});
```
with:
```typescript
if (totalOptions === 0) return;
setComboState(index, {
  highlightedIndex: Math.min(
    Math.max(0, comboState.highlightedIndex) + 1,
    totalOptions - 1
  )
});
```

And for ArrowUp, replace `filteredIngredients.length === 0` with `totalOptions === 0` (no other change needed).

**Step 6: Update Enter handler to support create option**

Replace the Enter handler block:
```typescript
if (event.key === 'Enter') {
  if (!comboState.isOpen) return;
  event.preventDefault();
  if (showCreateOption && highlightedIndex === createOptionIndex) {
    setComboState(index, {
      createMode: true,
      newIngredientName: comboState.query.trim()
    });
    setPendingCreateFocusIndex(index);
    return;
  }
  const selected = filteredIngredients[highlightedIndex];
  if (!selected) return;
  selectIngredient(index, selected);
}
```

(You will add `setPendingCreateFocusIndex` state in Task 3 — add a `// TODO` comment for now if TypeScript complains, or add the state declaration here early.)

**Step 7: Update the dropdown listbox render**

Replace the entire listbox JSX (the `<ul>` and its contents) with:
```tsx
<ul id={listboxId} role="listbox" className="ingredient-combobox-list">
  {filteredIngredients.map((option, optionIndex) => (
    <li
      key={option.id}
      id={`ingredient-option-${index}-${optionIndex}`}
      role="option"
      aria-selected={optionIndex === highlightedIndex}
      className={optionIndex === highlightedIndex ? 'is-active' : undefined}
      onMouseDown={(event) => {
        event.preventDefault();
        selectIngredient(index, option);
      }}
    >
      {option.name}
    </li>
  ))}
  {showCreateOption && (
    <li
      id={`ingredient-option-${index}-${createOptionIndex}`}
      role="option"
      aria-selected={highlightedIndex === createOptionIndex}
      className={`ingredient-combobox-create${highlightedIndex === createOptionIndex ? ' is-active' : ''}`}
      onMouseDown={(event) => {
        event.preventDefault();
        setComboState(index, {
          createMode: true,
          newIngredientName: comboState.query.trim()
        });
        setPendingCreateFocusIndex(index);
      }}
    >
      Create "{comboState.query.trim()}"
    </li>
  )}
</ul>
```

Note: The old `filteredIngredients.length === 0` branch that showed "No matches" is removed — when there's a query, the "Create" option appears instead; when there's no query, `showCreateOption` is false and the full list shows.

**Step 8: Commit**

```bash
git add src/components/RecipeEditor.tsx
git commit -m "feat: extend ComboState and add Create option to ingredient combobox"
```

---

### Task 3: Implement the inline create form

**Files:**
- Modify: `src/components/RecipeEditor.tsx`

**Step 1: Add state and refs for create mode**

Add these near the other `useState`/`useRef` declarations:
```typescript
const [pendingCreateFocusIndex, setPendingCreateFocusIndex] = useState<number | null>(null);
const newIngredientUnitRefs = useRef<Record<number, HTMLInputElement | null>>({});
```

**Step 2: Add useEffect to focus the unit input when create mode is entered**

Add after the existing `pendingFocusIndex` useEffect:
```typescript
useEffect(() => {
  if (pendingCreateFocusIndex === null) return;
  const input = newIngredientUnitRefs.current[pendingCreateFocusIndex];
  if (!input) return;
  input.focus();
  setPendingCreateFocusIndex(null);
}, [pendingCreateFocusIndex]);
```

**Step 3: Add handleCreateIngredient function**

Add after `selectIngredient`:
```typescript
const handleCreateIngredient = async (index: number, name: string, unit: string) => {
  const newIngredient: Ingredient = { id: createId(), name: name.trim(), unit: unit.trim() };
  await upsertIngredient(newIngredient);
  selectIngredient(index, newIngredient);
  setTimeout(() => {
    quantityInputRefs.current[index]?.focus();
  }, 0);
};
```

**Step 4: Wrap the dropdown in a createMode branch**

Change the dropdown render from:
```tsx
{comboState.isOpen ? (
  <ul ...>...</ul>
) : null}
```
to:
```tsx
{comboState.isOpen ? (
  comboState.createMode ? (
    <div className="ingredient-combobox-list ingredient-create-form">
      <p className="ingredient-create-label">New ingredient</p>
      <div className="ingredient-create-fields">
        <input
          value={comboState.newIngredientName}
          placeholder="Name"
          onChange={(event) => setComboState(index, { newIngredientName: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setComboState(index, { createMode: false });
            }
          }}
        />
        <input
          ref={(element) => { newIngredientUnitRefs.current[index] = element; }}
          value={comboState.newIngredientUnit}
          placeholder="Unit (e.g. g, tbsp)"
          onChange={(event) => setComboState(index, { newIngredientUnit: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const name = comboState.newIngredientName.trim();
              const unit = comboState.newIngredientUnit.trim();
              if (name && unit) void handleCreateIngredient(index, name, unit);
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setComboState(index, { createMode: false });
            }
          }}
        />
      </div>
      <div className="ingredient-create-actions">
        <button
          type="button"
          className="ghost"
          onMouseDown={(event) => {
            event.preventDefault();
            setComboState(index, { createMode: false });
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!comboState.newIngredientName.trim() || !comboState.newIngredientUnit.trim()}
          onMouseDown={(event) => {
            event.preventDefault();
            const name = comboState.newIngredientName.trim();
            const unit = comboState.newIngredientUnit.trim();
            if (name && unit) void handleCreateIngredient(index, name, unit);
          }}
        >
          Create
        </button>
      </div>
    </div>
  ) : (
    <ul id={listboxId} role="listbox" className="ingredient-combobox-list">
      {/* ... the listbox from Task 2 ... */}
    </ul>
  )
) : null}
```

**Step 5: Commit**

```bash
git add src/components/RecipeEditor.tsx
git commit -m "feat: implement inline create form in ingredient combobox"
```

---

### Task 4: Add CSS for the create form

**Files:**
- Modify: `src/styles.css`

**Step 1: Add styles after the `.ingredient-combobox-list li.ingredient-combobox-empty` block (around line 327)**

```css
.ingredient-combobox-create {
  color: var(--accent);
  font-style: italic;
}

.ingredient-create-form {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ingredient-create-label {
  margin: 0;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ingredient-create-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ingredient-create-fields input {
  width: 100%;
  box-sizing: border-box;
}

.ingredient-create-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
```

**Step 2: Commit**

```bash
git add src/styles.css
git commit -m "feat: add CSS for inline ingredient create form"
```

---

### Task 5: Verify

**Step 1: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

**Step 2: Manual smoke test**

1. `npm run dev`
2. Navigate to Recipes page, click "Add recipe"
3. Click "Add ingredient"
4. Type "Quinoa" (assuming it doesn't exist)
5. Verify "Create 'Quinoa'" appears at the bottom of the dropdown
6. Click it — verify the dropdown transforms to the create form with Name = "Quinoa" and focus on Unit
7. Type "g" in Unit, click Create
8. Verify the ingredient row shows "Quinoa" / unit "g", and focus moves to the quantity input
9. Navigate to Ingredients page — verify "Quinoa" is in the catalog
10. Back in a recipe, type "ch" in the ingredient combobox (assuming "Chicken" exists) — verify both "Chicken" in the list AND "Create 'ch'" at the bottom
11. Press ArrowDown repeatedly to navigate to "Create 'ch'", press Enter — verify create form opens with Name = "ch"
12. Press Escape — verify create form closes and combobox returns to normal with "ch" still in the input
13. Click "Add ingredient" with zero existing ingredients — verify the button is no longer disabled and a new row appears

**Step 3: Commit if any fixes needed**

```bash
git add -p
git commit -m "fix: <describe fix>"
```
