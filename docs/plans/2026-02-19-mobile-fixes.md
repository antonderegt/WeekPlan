# Mobile Layout Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix four mobile layout bugs: table overflow pushing buttons off-screen, bottom nav clipping, shopping list modal close button unreachable, and settings pattern buttons overflowing.

**Architecture:** All changes are CSS-only, scoped to `src/styles.css`. Mobile overrides live in the existing `@media (max-width: 700px)` block and a new all-sizes modal fix. No HTML or component changes.

**Tech Stack:** Plain CSS, React/TypeScript frontend. Dev server: `npm run dev`. No test framework for CSS — verify visually in browser at ≤700px viewport width.

---

### Task 1: Fix body overflow (root cause of bottom nav bug)

**Files:**
- Modify: `src/styles.css:20-25` (the `body` rule)

**Step 1: Add `overflow-x: hidden` to the body rule**

In `src/styles.css`, find the `body` rule (around line 20) and add `overflow-x: hidden`:

```css
body {
  margin: 0;
  font-family: 'Source Sans 3', sans-serif;
  background: radial-gradient(circle at top, #faf5ef 0%, var(--bg) 55%, #efe7dc 100%);
  color: var(--ink);
  overflow-x: hidden;
}
```

**Step 2: Verify in browser**

Run `npm run dev`, open the app on a mobile viewport (≤700px wide, use browser DevTools device emulation). Navigate to the Recipes page. The bottom nav should now show all 4 items and stay fixed at the bottom while scrolling.

**Step 3: Commit**

```bash
git add src/styles.css
git commit -m "fix: prevent body horizontal overflow on mobile"
```

---

### Task 2: Fix shopping list modal (close button off-screen)

**Files:**
- Modify: `src/styles.css` — the `.modal` and `.modal-body` rules (around lines 390–411)

**Step 1: Update `.modal` to be a flex column with max-height**

Find the `.modal` rule and update it:

```css
.modal {
  background: var(--surface);
  border-radius: 16px;
  padding: 20px;
  width: min(560px, 90vw);
  box-shadow: var(--shadow);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

**Step 2: Update `.modal-body` to scroll**

Find the `.modal-body` rule and update it:

```css
.modal-body {
  margin-top: 12px;
  overflow-y: auto;
  flex: 1;
}
```

**Step 3: Verify in browser**

Open the Week view, click the shopping cart icon. With a long shopping list, the modal body should scroll while the header ("Shopping list") and footer ("Close" button) remain visible. The Close button must always be reachable without scrolling.

**Step 4: Commit**

```bash
git add src/styles.css
git commit -m "fix: constrain modal height so footer is always visible"
```

---

### Task 3: Fix responsive tables on Recipes and Ingredients pages

**Files:**
- Modify: `src/styles.css` — the `@media (max-width: 700px)` block (around line 580)

**Step 1: Add table layout fixes inside the mobile media query**

Add the following CSS inside the existing `@media (max-width: 700px)` block, after the existing rules:

```css
  /* Responsive tables */
  .table {
    table-layout: fixed;
  }

  /* Hide middle columns on Recipes table (Ingredients count = col 2, Steps count = col 3) */
  .table th:nth-child(2),
  .table td:nth-child(2),
  .table th:nth-child(3),
  .table td:nth-child(3) {
    display: none;
  }

  /* Stack action buttons vertically so they fit on screen */
  .table td .actions {
    flex-direction: column;
    align-items: flex-start;
  }
```

**Step 2: Verify on Recipes page**

Navigate to Recipes on mobile. The table should show only Name and Actions columns. Edit and Delete buttons should be visible without horizontal scrolling.

**Step 3: Verify on Ingredients page**

Navigate to Ingredients on mobile. The Ingredients table has columns: Name, Unit, Actions. With the above rules, only Name and Actions are visible (Unit is column 2, so it's hidden). Edit and Delete buttons should be visible without scrolling.

> Note: If you want Unit visible on Ingredients (it's just 2-3 chars), change the selector to only hide columns 2 and 3 when there are 4+ columns. But for simplicity and consistency, hiding col 2 on both tables is fine — the unit is visible in the editor modal.

**Step 4: Commit**

```bash
git add src/styles.css
git commit -m "fix: hide extra table columns on mobile, stack action buttons"
```

---

### Task 4: Fix Settings page pattern action buttons

**Files:**
- Modify: `src/styles.css` — the `@media (max-width: 700px)` block

**Step 1: Add wrapping rules for pattern rows**

Inside the existing `@media (max-width: 700px)` block, add:

```css
  /* Settings: let pattern rows and their action buttons wrap */
  .pattern-row {
    flex-wrap: wrap;
  }

  .pattern-actions {
    flex-wrap: wrap;
  }
```

**Step 2: Verify on Settings page**

Navigate to Settings on mobile. The pattern cycle section should show the pattern name input on one line and the Up/Down/Delete buttons on the next line if they don't fit. No horizontal overflow.

**Step 3: Commit**

```bash
git add src/styles.css
git commit -m "fix: wrap pattern action buttons on mobile settings page"
```

---

### Task 5: Final verification pass

**Step 1: Check all four fixes together**

With `npm run dev` running, use DevTools mobile emulation (e.g. iPhone SE, 375px wide). Verify:

- [ ] Recipes page: table shows Name + Actions, buttons visible, bottom nav shows all 4 items and stays fixed
- [ ] Ingredients page: table shows Name + Actions, buttons visible
- [ ] Settings page: pattern rows wrap, no horizontal scroll
- [ ] Week view → shopping cart: modal scrolls internally, Close button always visible
- [ ] Bottom nav: all 4 icons visible on all pages
- [ ] Desktop (≥700px): no visual regressions on any page

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors (CSS-only changes, no TS impact).

**Step 3: Final commit if any cleanup needed**

If any minor tweaks were made during verification:

```bash
git add src/styles.css
git commit -m "fix: mobile layout QA tweaks"
```
