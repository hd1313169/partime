# Shopee-Inspired (Low Similarity) UI Redesign Spec

Date: 2026-04-08  
Project: Partime 個人工資管理系統  
Status: Approved for planning

## 1. Goals And Scope

### Goals
- Redesign the UI to borrow a lively, promotion-oriented shopping style without copying Shopee layouts or assets.
- Prioritize mobile-first interaction.
- Make quick log creation the primary homepage task.
- Use orange as the primary visual color while preserving readability and product clarity.

### Explicit Product Direction (Validated)
- Similarity level: Low similarity to Shopee.
- Homepage top priority: Quick log creation.
- Device priority: Mobile first.
- Color direction: Orange-dominant primary theme.

### Out Of Scope (YAGNI)
- No backend schema changes.
- No multi-theme switcher.
- No major report system redesign.

## 2. Experience Architecture

### Overall UX Positioning
- "Efficient utility + commerce-like rhythm": bold CTA focus, clear status chips, segmented cards, and high-contrast key numbers.
- Preserve existing domain behavior while changing visual hierarchy and interaction emphasis.

### Mobile Homepage Information Hierarchy (Top To Bottom)
1. Top bar: week range, quick week navigation, settings entry.
2. Hero area: dominant `Quick Add Log` CTA and today's summary (entries + total amount).
3. Job shortcuts: one-tap cards that open add-log with job preselected.
4. Today timeline: list of today's logs with quick edit/delete.
5. Weekly overview: collapsed by default to avoid competing with the main CTA.

### Core Interaction Principle
- The main CTA must be visible in first viewport on mobile.
- Add-log completion target: 3 steps (select job -> fill time/quantity -> save).
- After save success: toast feedback + animated amount update + newest log pinned near top.

## 3. Visual System

### Color Tokens
- `--color-primary`: `#FF6A00`
- `--color-primary-hover`: `#E85F00`
- `--color-primary-soft`: `#FFF1E8`
- `--color-accent-warm`: `#FFB26B`
- `--color-text-main`: `#1F2937`
- `--color-text-sub`: `#6B7280`
- `--color-surface`: `#FFFFFF`
- `--color-page-bg`: `#FFF7F2`
- `--color-success`: `#16A34A`
- `--color-danger`: `#DC2626`

### Typography
- Primary CJK font: `Noto Sans TC`.
- Numeric emphasis font: `Barlow Condensed` for salary and KPI amounts.
- Heading weights: 700-800.
- Body weights: 400-500.
- Currency format is unified as `$12,450`.

### Components
- Primary button: 48px height, 14px radius, warm shadow, pressed scale 0.97.
- Secondary button: white fill with orange border and deep-orange text.
- Cards: 16px radius, light shadow, optional micro-label (`Today`, `Frequent`, etc.).
- Chips: `info`, `success`, `warn` variants.
- Inputs: 44px height, orange focus ring with soft glow.

### Motion
- First-load stagger for hero and shortcut cards (80ms cadence).
- Amount pop animation on successful add (300ms).
- Modal enter: slide-up with backdrop blur; close returns visual focus to trigger zone.

## 4. Data Flow And State

### Existing API Contract
- Keep current API endpoints and domain model intact.
- Continue bootstrap via `getBootstrap()`.

### Frontend State Segmentation
- `quickDraftState`: temporary fields for quick add flow.
- `todayLogsState`: today's visible log list.
- `weekSummaryState`: weekly aggregates and display values.

### Add Log Behavior
- Use optimistic update:
  1. Insert into today list and update totals immediately.
  2. Call `createLog` in background.
  3. On failure, rollback state and show retry prompt.

### Weekly Price Editing
- Keep `setWeeklyPrice` behavior.
- Move weekly price controls to a secondary section so they do not disrupt quick-add primary flow.

## 5. Error Handling And Empty States

### Network Errors
- Show a collapsible top error bar with retry action.
- If quick-add save fails, preserve user input for resubmission.

### Empty States
- If no jobs exist: replace quick-add CTA with `Create your first job` guidance.
- If no logs today: show timeline guidance card inviting immediate quick-add.

### Validation Guards
- Block save when end time is earlier than start time.
- Disallow negative/invalid numeric input for quantity-based jobs.

## 6. Testing Strategy

### Unit Tests
- Validate amount calculation in quick flow for hourly and quantity jobs.
- Validate rollback correctness when optimistic save fails.

### Component Tests
- Mobile first viewport contains primary quick-add CTA.
- After save success, today list order and totals update correctly.

### E2E Journey
- Home -> quick add -> save success -> edit from today list.
- Error path (offline/500) supports retry and draft retention.

## 7. Implementation Boundaries

### Must Deliver
- Homepage hierarchy redesign for mobile-first use.
- Quick-add-centric interaction path.
- New orange-led visual language and component styling.
- Focused test additions for critical journey and failure handling.

### Must Not Expand In This Iteration
- Backend field/model changes.
- Large report refactor.
- Non-essential feature additions outside the quick-add-centered redesign.

## 8. Acceptance Criteria

- On mobile, the primary quick-add CTA is visible above the fold on initial load.
- A user can complete add-log in 3 steps or fewer.
- Successful save updates today's summary and list immediately.
- Failed save does not lose input and offers retry.
- Weekly overview remains available but is visually secondary by default.
- Visual language is orange-led, promotion-rhythm inspired, and clearly non-identical to Shopee UI.