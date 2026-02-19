# Add Ingredient from Recipe Editor — Design

Date: 2026-02-19

## Problem

When creating or editing a recipe, users must navigate away to the Ingredients page to add a new ingredient before they can reference it in a recipe. There is no way to create an ingredient inline from the RecipeEditor.

## Solution

Extend the ingredient combobox in `RecipeEditor` to support inline ingredient creation directly within the dropdown.

## Trigger Condition

- When the combobox input has text and the filtered ingredient list is **empty** (zero matches), the dropdown shows a single item: **"Create '[typed name]'"**
- When there are partial matches, the dropdown shows those matches normally with the "Create" option appended at the bottom as a separator item

## Inline Create Form

Selecting "Create '[name]'" (via click, Enter, or ArrowDown + Enter) expands the dropdown in-place — the dropdown stays open and transforms to show a small form:

```
┌─────────────────────────────────┐
│  New ingredient                 │
│  Name: [Olive Oil            ]  │
│  Unit: [                     ]  │
│  [Create]  [Cancel]             │
└─────────────────────────────────┘
```

- Name is pre-filled from the combobox text, editable
- Unit field is focused automatically
- "Create" button is disabled until unit is non-empty
- Pressing Escape or clicking "Cancel" collapses back to the normal combobox view (typed text preserved)

## On Submit

1. `upsertIngredient()` is called with the new name + unit
2. The ingredient is immediately selected in that recipe row (name filled, unit filled from the new ingredient's default)
3. The dropdown closes, focus moves to the quantity input for that row

## Focus Management

- When the create form appears, focus moves to the Unit field
- Tab order within form: Unit → Create button → Cancel button
- Escape at any point cancels and returns focus to the combobox input

## Components Affected

- `src/components/RecipeEditor.tsx` — primary change; combobox logic extended with create-mode state
- `src/store/DataContext.tsx` — `upsertIngredient` already exists, no changes needed
- `src/styles.css` — minor styles for the inline create form within the dropdown

## Out of Scope

- Editing or deleting ingredients from the recipe editor
- Nutritional data or advanced ingredient fields
- Duplicate name detection (server already handles upsert semantics)
