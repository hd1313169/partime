# Proposal

## Why

The previous UI (green rounded cards, heavy shadows, dark total slabs) read as a generic bookkeeping app, used small text, and buried the arithmetic behind each amount. The tool must serve both one-handed phone logging and portfolio visitors, so the whole interface was redesigned in a "precise tool" style. A few interaction behaviors changed along with it, and these need to be recorded as requirements.

## What Changes

- Full visual redesign of every screen (app shell, weekly sheet, monthly report, log sheet, job management, report text, unlock gate). Visual rules live in `DESIGN.md` and are not repeated in specs.
- The log sheet blocks saving and shows a message when the end time is not later than the start time. **BREAKING** (behavioral): such logs could previously be saved as NT$0.
- When an existing log is edited and this week's unit price differs from the log's stored price, the log sheet states that saving will reprice it at this week's price.
- On mobile, opening the current week scrolls to today's day group.
- Weekly sheet cells show only the amount (no formula or time-range sub-text); empty cells show a light plus sign as the add affordance.
- Native `<select>` elements are replaced by a custom dropdown that matches the design and supports keyboard and outside-click dismissal.
- Labels: 「預設單價」 renamed to 「單價」; the decorative status pill in the footer and the logo mark in the top bar are removed.

## Capabilities

### New Capabilities
- `work-log-entry`: validation and pricing feedback when creating or editing a work log.
- `weekly-sheet`: how the weekly view presents logs, empty cells, and today's position.
- `form-controls`: behavior of the app's dropdown selection controls.

### Modified Capabilities
- None. (`demo-mode` and `worker-api-auth` requirements are unchanged.)

## Impact

- Code: `src/index.css`, `src/App.tsx`, all files in `src/components/`, new `src/components/Select.tsx`.
- Docs: new `DESIGN.md`, `.impeccable/design.json`.
- No API, data model, or dependency changes. Existing client tests pass unchanged (CSS hook class names preserved).
- Known unchanged behavior: saving an edited log recalculates it with this week's unit price (now surfaced to the user, not altered).
