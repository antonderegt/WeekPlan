# Mobile Layout Fixes — Design

Date: 2026-02-19

## Problems

1. **Table overflow on Recipe and Ingredient pages** — tables are wider than the viewport on mobile, pushing the Actions column (Edit/Delete buttons) off-screen to the right.
2. **Bottom nav clipped / only 3 of 4 items visible** — caused by body-level horizontal overflow from the tables; `position: fixed` nav gets clipped at the viewport edge.
3. **Bottom nav not sticky on inner pages** — same root cause as above; the body scroll container grows wider than the viewport, causing erratic fixed positioning.
4. **Shopping list modal can't be closed** — no `max-height` constraint on `.modal`, so a long list grows past the viewport height and pushes the footer (Close button) off-screen.
5. **Settings pattern actions overflow** — `.pattern-row` with Up/Down/Delete buttons doesn't wrap on narrow screens.

## Approach

CSS-only fixes in `src/styles.css`. No HTML or component changes. All fixes are scoped to `≤700px` mobile breakpoint except the modal fix which applies at all sizes.

## Changes

### 1. Body overflow

```css
body {
  overflow-x: hidden;
}
```

Prevents the body from growing wider than the viewport, which fixes bottom nav clipping.

### 2. Responsive tables (≤700px)

- Hide middle columns (Ingredients count + Steps count on Recipes; Unit on Ingredients) using nth-child selectors.
- Make the Actions cell use `flex-direction: column` so buttons stack vertically and stay on-screen.
- Set `table-layout: fixed; width: 100%` so the Name and Actions columns share available width predictably.

### 3. Modal max-height

- `.modal`: `max-height: 90vh; display: flex; flex-direction: column; overflow: hidden`
- `.modal-body`: `overflow-y: auto; flex: 1`

Header and footer always visible; only the content area scrolls.

### 4. Settings pattern actions

- `.pattern-row`: `flex-wrap: wrap`
- `.pattern-actions`: `flex-wrap: wrap`

Buttons wrap to a second line on narrow screens rather than overflowing.

## Constraints

- Desktop layout is untouched.
- No new CSS classes or HTML changes required.
