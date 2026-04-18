Date: 2026-04-18
Project: Partime 個人工資管理系統
Status: Approved for planning

## 1. Goals And Scope

### Goals
- Widen the desktop layout so the existing weekly table can render fully on typical desktop screens without relying on horizontal scrolling as the default experience.
- Increase visual contrast across the interface, with priority on mobile card headers, table headers, and action buttons that are currently too close to white.
- Preserve the existing information architecture, table density, and interaction flow while improving readability and visual hierarchy.

### Validated Direction
- Priority: desktop width and mobile contrast are equally important in the same iteration.
- Visual direction: conservative refinement.
- Theme direction: keep the current green-led visual language.
- Width strategy: enlarge the page container rather than shrinking table padding, typography, or column density.
- Desktop acceptance baseline: typical desktop and laptop usage should see the full table without horizontal scroll in normal viewing conditions.

### Out Of Scope
- No changes to table columns, field structure, or business data.
- No redesign of modal workflows or log creation flow.
- No change to the green brand/theme identity.
- No structural refactor of page sections beyond layout width and visual hierarchy updates.

## 2. Experience Strategy

### Primary UX Problem
The current desktop table is wrapped inside a page container that limits the usable horizontal space too aggressively, so the table's overflow behavior becomes a frequent fallback instead of a rare safeguard. On mobile, several headers and buttons use very light surfaces that blend into the white page background, weakening scanability and action discoverability.

### Product Intent
This iteration is a readability and clarity pass, not a new UI concept. Users should feel that the same product became easier to scan and more stable to use across screen sizes, without needing to relearn interactions.

### Design Principle
Solve width at the container level, not by compressing content. Solve contrast at the hierarchy level, not by making every surface darker.

## 3. Layout And Width Design

### Desktop Container Strategy
- Increase the maximum width used by the header container and the main content container together so both regions remain visually aligned.
- Reduce the chance that the weekly table enters horizontal overflow under ordinary desktop viewing widths.
- Keep the current desktop table structure, sticky columns, and weekly summary layout intact.

### Responsive Intent
- Desktop and larger laptop widths should use the widened container as the default presentation.
- Tablet and mobile breakpoints should keep the existing card-based weekly presentation.
- Overflow handling may remain in place as a defensive fallback for unusually narrow windows, but it should no longer be the normal desktop experience.

### Non-Goals Within Width Work
- Do not reduce table text size.
- Do not compress table cell padding as a primary strategy.
- Do not remove sticky first/last columns to buy space.

## 4. Visual Hierarchy And Contrast Design

### Contrast Model
The interface will use three clearer surface tiers:
- Primary action tier: saturated green surfaces for primary buttons and outcome-focused actions.
- Structural tier: darker slate or green-tinted surfaces for headers, section tops, sticky summary zones, and control group backgrounds.
- Content tier: white or very light neutral surfaces for ordinary content areas.

### Mobile Priority Adjustments
- Daily card headers should no longer read as near-white blocks. They should become clearly separated header bands that make date, weekday, and daily total immediately scannable.
- Primary actions should remain solid green with clear contrast against the page.
- Secondary buttons should use stronger borders, darker text, and, where needed, a subtle tinted background so they remain distinct from plain surfaces.

### Desktop Table Priority Adjustments
- Table header backgrounds should have stronger presence so the header row reads as a distinct structural band.
- Sticky first-column and weekly-total areas should visually separate from table data cells instead of blending into the same white plane.
- Cells with values may keep a green-tinted success treatment, but empty cells should remain quieter so interactive emphasis stays meaningful.

## 5. Component-Level Expectations

### Page Shell
- Header and main content share the same widened max-width rule.
- Exterior page gutters remain comfortable, but no longer take unnecessary space away from the weekly table on desktop.

### Buttons
- Primary buttons: maintain solid green emphasis and clear hover/active contrast.
- Secondary buttons: strengthen border and text contrast against white backgrounds.
- Icon-only buttons used for actions should remain visually discoverable even when placed on pale surfaces.

### Cards And Section Headers
- Mobile day cards should use a stronger header/background split.
- Status and total sections may use darker or tinted backgrounds to anchor information hierarchy.

### Inputs
- Inputs can remain consistent with the current system, but focus and resting states should not disappear into surrounding pale surfaces.

## 6. Interaction Boundaries

### Must Stay The Same
- Weekly navigation behavior.
- Job price editing behavior.
- Cell click to add or edit logs.
- Report generation action placement.
- Modal structure for creating, editing, saving, and deleting logs.

### Why This Boundary Matters
The user request is about visual expectation and readability. Preserving the existing task flow keeps the scope tight and avoids introducing regressions in well-understood interactions.

## 7. Risks And Controls

### Risk: Header/Main Misalignment
If the header and main area do not share the same widened container rule, the page will feel visually off-balance.

Control:
Use one shared desktop width strategy across both page shell regions.

### Risk: Overcorrected Contrast
If too many surfaces become dark or tinted, the interface will feel heavy and lose its clean utility character.

Control:
Reserve stronger contrast for structural regions and actions only, while keeping content surfaces mostly light.

### Risk: Hidden Desktop Overflow Persists
If width is increased only slightly, the table may still overflow on common devices and fail the user requirement.

Control:
Validate against typical desktop/laptop viewing widths and treat overflow as a fallback rather than a success condition.

## 8. Testing And Acceptance

### Acceptance Criteria
- On typical desktop usage, the weekly table is fully visible without horizontal scrolling as the default presentation.
- On mobile, daily card headers and main actions are visually distinguishable from ordinary white content areas without relying on text reading alone.
- Desktop table headers, sticky summary areas, and ordinary data cells are clearly separated by tone and hierarchy.
- Existing interactions continue to work without behavioral change.

### Verification Focus
- A desktop-oriented UI check should confirm the widened container prevents default horizontal scrolling in normal usage.
- A mobile-oriented UI check should confirm stronger contrast for card headers and action buttons.
- Existing interaction tests should continue covering navigation, modal opening, save, delete, and weekly price editing flows.

## 9. Implementation Boundaries

### Must Deliver
- Wider aligned page containers for header and main content on desktop.
- Stronger contrast for mobile card headers, desktop table headers, and button hierarchy.
- Preservation of current green theme and existing interaction flow.

### Must Not Expand In This Iteration
- No information architecture redesign.
- No typography or spacing compression inside the table as the main solution.
- No new features or workflow changes unrelated to width and contrast.