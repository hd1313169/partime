# Design

## Context

See proposal.md – Why. The change touches every UI component plus global styles, and introduces a reusable control. The app is React + Tailwind v4; client tests assert on several CSS hook class names and on the 「生成回報文字」 button title.

## Goals / Non-Goals

**Goals:**
- One token-based visual system (`@theme` in `src/index.css`) shared by all screens.
- Behavioral improvements in the spec deltas without changing data, API, or pricing logic.

**Non-Goals:**
- Changing how edited logs are priced (they still use this week's unit price).
- Dark mode, i18n, or new screens.

## Decisions

- **Tokens in Tailwind `@theme`, shared classes in `@layer components`.** Keeps colors and radii in one place. `btn` is declared with `@utility` because Tailwind v4 cannot `@apply` a class defined in a component layer. Alternative (inline utilities everywhere) rejected for drift.
- **Keep legacy hook class names** (`app-shell-wide`, `app-topbar`, `button-secondary-strong`, `feedback-banner-strong`, `mobile-day-card-header`, `desktop-weekly-head`, `desktop-weekly-sticky-total`), restyled rather than renamed, so existing tests stay valid.
- **Custom `Select` component** instead of a styled native `<select>`: native option popups cannot be styled. Implemented as a button plus a `role="listbox"` popover with keyboard handling; Escape stops propagation so enclosing dialogs stay open. Alternative: a headless UI library, rejected to avoid a new dependency for three controls.
- **System font stack with tabular numerals** rather than self-hosted fonts: no asset weight, CJK coverage from the OS.
- **Repricing notice instead of a pricing change**: surfaces existing behavior honestly without altering saved amounts; changing pricing is a separate product decision.
- **Scroll-to-today runs after jobs load** (effect depends on the week, today, and job count) and only below the 1024px breakpoint.

## Risks / Trade-offs

- [The light plus sign and faint text fall below WCAG 4.5:1, by user request] → Used only for add affordances and empty markers; amounts and labels meet contrast. Revisit if older users report difficulty.
- [Custom dropdown differs from native mobile pickers] → Option lists are short (12 items or fewer) and options are 40px tall.
- [A dropdown inside the scrolling job dialog can require scrolling to see its last options] → Accepted; lists are short.
- [Job color #6366f1 sits close to the indigo action color] → Documented in DESIGN.md as a known clash; not changed because job colors are user data.
