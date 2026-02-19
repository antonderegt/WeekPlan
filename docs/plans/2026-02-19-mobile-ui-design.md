# Mobile UI Redesign

**Date:** 2026-02-19
**Approach:** CSS-only mobile overrides (Option A)

## Problem

On mobile the app requires excessive scrolling: the top bar collapses into multiple stacked rows, the week view header renders 4 text buttons, and 7 day cards stack vertically. Everything is too tall and chunky.

## Goals

- All 7 days visible at a glance on mobile
- Slim, single-row week navigation
- Standard mobile bottom tab bar
- Desktop layout completely unchanged

## Design

### 1. Bottom tab bar (≤700px)

- Fixed to the bottom of the screen, ~56px tall
- 4 tabs: Week · Recipes · Ingredients · Settings
- Each tab: icon stacked above label, centered
- Active tab uses accent color (`--accent`)
- `main` gets `padding-bottom: 70px` to avoid content hiding behind the bar
- Top bar hides its nav links; shows brand only as a slim strip

### 2. Week view header (≤700px)

Single row, ~44px tall:

```
❮   Feb 17–23 · Week A   ❯   🛒
```

- `❮` / `❯` icon-only ghost buttons for prev/next week
- Week range + pattern name as centered compact label
- Shopping cart icon button on the right
- "Today", "Previous week", "Next week" text buttons hidden on mobile
- App defaults to current week on load so "Today" shortcut not needed

### 3. Day grid (≤700px)

- 2-column grid (Sunday spans full width)
- Day card padding: 10px (down from 16px)
- No fixed min-height (content-driven)
- Day header: name + date on one line, e.g. **Mon 17**
- Meal name below, or small "+" for empty days
- `main` padding: 12px (down from 20px)

## Files to change

- `src/styles.css` — extend `@media (max-width: 700px)`, add `.bottom-nav` styles
- `src/App.tsx` — render `.bottom-nav` bar, hide nav links in top bar on mobile
- `src/components/WeekView.tsx` — icon-only prev/next/shopping buttons on mobile
