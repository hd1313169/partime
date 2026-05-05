# Visual Width And Contrast Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen the desktop shell enough for the existing weekly table to render as the normal no-horizontal-scroll experience on typical desktop screens, while increasing visual contrast for headers and action controls without changing product behavior.

**Architecture:** Keep the current App -> WeeklySheet -> modal flow intact and solve the width problem at the page-shell level by widening the shared header/main container. Strengthen contrast by introducing a clearer surface hierarchy in CSS and then applying it selectively to page chrome, weekly table structure, mobile day-card headers, and secondary actions. Validate the result with focused client rendering tests that assert layout and contrast-driving class hooks rather than pixel snapshots.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, react-dom/server, Tailwind CSS 4, lucide-react

---

## File Structure Map

- Keep and reuse:
  - `src/App.tsx` - page shell, header, week controls, top-level state and error/loading surfaces
  - `src/components/WeeklySheet.tsx` - mobile day-card layout and desktop weekly table structure
  - `src/components/LogModal.tsx` - existing modal interaction surface that should retain behavior while receiving any contrast-only polish if needed
  - `src/index.css` - Tailwind entry point; lowest-friction place to define shared semantic utility classes for the updated surface hierarchy
- Create:
  - `tests/client/app-shell-layout.test.tsx` - focused rendering checks for widened desktop shell and stronger shell/button class hooks
  - `tests/client/weekly-sheet-contrast.test.tsx` - focused rendering checks for mobile day-card headers and desktop table structural contrast hooks
- Modify:
  - `src/App.tsx`
  - `src/components/WeeklySheet.tsx`
  - `src/index.css`
- Optional modify only if contrast is still inconsistent after Tasks 1-3:
  - `src/components/LogModal.tsx`

---

### Task 1: Lock In Test Coverage For Width And Contrast Hooks

**Files:**
- Create: `tests/client/app-shell-layout.test.tsx`, `tests/client/weekly-sheet-contrast.test.tsx`
- Modify: none
- Test: `tests/client/app-shell-layout.test.tsx`, `tests/client/weekly-sheet-contrast.test.tsx`

- [ ] **Step 1: Write the failing App shell rendering test**

```tsx
// tests/client/app-shell-layout.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../../src/App';

vi.mock('../../src/services/salaryApi', () => ({
  salaryApi: {
    getBootstrap: vi.fn().mockResolvedValue({ jobs: [], logs: [], weeklyPrices: {} }),
    setWeeklyPrice: vi.fn(),
    createLog: vi.fn(),
    updateLog: vi.fn(),
    deleteLog: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    deleteJob: vi.fn(),
  },
}));

describe('App shell layout', () => {
  it('uses the widened shared desktop shell and stronger secondary action styling', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('app-shell-wide');
    expect(html).toContain('app-topbar');
    expect(html).toContain('button-secondary-strong');
  });
});
```

- [ ] **Step 2: Run the new App shell test to verify it fails**

Run: `npx vitest run tests/client/app-shell-layout.test.tsx --reporter=verbose`
Expected: FAIL because `app-shell-wide`, `app-topbar`, and `button-secondary-strong` do not exist in the rendered markup yet.

- [ ] **Step 3: Write the failing WeeklySheet contrast test**

```tsx
// tests/client/weekly-sheet-contrast.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WeeklySheet } from '../../src/components/WeeklySheet';

const currentDate = new Date('2026-04-15T00:00:00.000Z');

describe('WeeklySheet contrast hooks', () => {
  it('renders mobile header and desktop table structure with stronger contrast class hooks', () => {
    const html = renderToStaticMarkup(
      <WeeklySheet
        logs={[]}
        jobs={[{ id: 'job-1', name: 'Packing', calcType: 'PIECE', unitPrice: 12, color: '#22c55e' }]}
        currentDate={currentDate}
        weeklyPrices={{ 'job-1': 12 }}
        onUpdateWeeklyPrice={vi.fn()}
        onCellClick={vi.fn()}
        onGenerateReport={vi.fn()}
      />,
    );

    expect(html).toContain('mobile-day-card-header');
    expect(html).toContain('desktop-weekly-head');
    expect(html).toContain('desktop-weekly-sticky-total');
  });
});
```

- [ ] **Step 4: Run the WeeklySheet contrast test to verify it fails**

Run: `npx vitest run tests/client/weekly-sheet-contrast.test.tsx --reporter=verbose`
Expected: FAIL because the contrast hook classes are not present in `WeeklySheet` yet.

- [ ] **Step 5: Run the full client test suite to confirm only the new visual tests are red**

Run: `npm run test:client`
Expected: Existing `tests/client/apiClient.test.ts` cases stay green, and only the two new rendering tests fail.

- [ ] **Step 6: Commit the failing tests**

```bash
git add tests/client/app-shell-layout.test.tsx tests/client/weekly-sheet-contrast.test.tsx
git commit -m "test: cover visual width and contrast hooks"
```

---

### Task 2: Widen The Shared App Shell And Strengthen Global Surface Utilities

**Files:**
- Modify: `src/App.tsx`, `src/index.css`
- Test: `tests/client/app-shell-layout.test.tsx`

- [ ] **Step 1: Add semantic shell and button utilities in the CSS entry point**

```css
/* src/index.css */
@import "tailwindcss";

@layer components {
  .app-shell-wide {
    @apply w-full max-w-[92rem] mx-auto px-4 sm:px-6 xl:px-8;
  }

  .app-topbar {
    @apply bg-slate-900 text-white border-b border-slate-800;
  }

  .surface-structural {
    @apply bg-slate-100 text-slate-900 border border-slate-200;
  }

  .surface-structural-strong {
    @apply bg-slate-900 text-white border border-slate-800;
  }

  .button-secondary-strong {
    @apply bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200;
  }
}
```

- [ ] **Step 2: Run the App shell test to verify it still fails before component wiring**

Run: `npx vitest run tests/client/app-shell-layout.test.tsx --reporter=verbose`
Expected: FAIL because `App.tsx` still does not render the new class hooks.

- [ ] **Step 3: Update the App shell to use the widened container and stronger secondary action styling**

```tsx
// src/App.tsx (relevant excerpts)
return (
  <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
    <header className="app-topbar sticky top-0 z-30 backdrop-blur-md">
      <div className="app-shell-wide h-20 flex items-center justify-between">
        {/* existing title and actions */}
        <button
          onClick={() => setJobManagementOpen(true)}
          className="button-secondary-strong flex items-center gap-2 px-4 py-2 font-bold rounded-2xl transition-all shadow-sm group"
        >
          <Settings2 className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 transition-colors" />
          <span className="hidden sm:inline">工作項目管理</span>
        </button>
      </div>
    </header>

    <main className="app-shell-wide py-10">
      {/* existing page content */}
    </main>
  </div>
);
```

- [ ] **Step 4: Run the focused App shell test to verify it passes**

Run: `npx vitest run tests/client/app-shell-layout.test.tsx --reporter=verbose`
Expected: PASS because the widened shared shell and stronger secondary action class hooks are now present.

- [ ] **Step 5: Run the client suite to confirm only WeeklySheet contrast coverage remains red**

Run: `npm run test:client`
Expected: `tests/client/app-shell-layout.test.tsx` passes, `tests/client/weekly-sheet-contrast.test.tsx` still fails, and `tests/client/apiClient.test.ts` remains green.

- [ ] **Step 6: Commit the shell-width and utility-class change**

```bash
git add src/App.tsx src/index.css
git commit -m "feat: widen app shell and strengthen surface utilities"
```

---

### Task 3: Apply Stronger Contrast To WeeklySheet Mobile Headers And Desktop Table Structure

**Files:**
- Modify: `src/components/WeeklySheet.tsx`, `src/index.css`
- Test: `tests/client/weekly-sheet-contrast.test.tsx`

- [ ] **Step 1: Add focused utility hooks for mobile day-card headers and desktop table structure**

```css
/* src/index.css */
@layer components {
  .mobile-day-card-header {
    @apply p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between;
  }

  .desktop-weekly-head {
    @apply bg-slate-200 border-b border-slate-300;
  }

  .desktop-weekly-sticky-lead {
    @apply bg-slate-200 text-slate-800 border-r border-slate-300;
  }

  .desktop-weekly-sticky-total {
    @apply bg-slate-900 text-white border-l border-slate-800;
  }

  .button-icon-strong {
    @apply bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700;
  }
}
```

- [ ] **Step 2: Run the WeeklySheet test to verify it still fails before wiring the component**

Run: `npx vitest run tests/client/weekly-sheet-contrast.test.tsx --reporter=verbose`
Expected: FAIL because `WeeklySheet.tsx` still renders the old class strings.

- [ ] **Step 3: Update the mobile card header, desktop head row, and sticky total cells to use the new hooks**

```tsx
// src/components/WeeklySheet.tsx (relevant excerpts)
<div key={dateStr} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
  <div className="mobile-day-card-header">
    <div>
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
        {format(day, 'EEEE', { locale: zhTW })}
      </div>
      <div className="text-lg font-black text-white">
        {format(day, 'MM/dd')}
      </div>
    </div>
    {/* existing daily total + report button */}
  </div>

  {/* ... */}

  <button
    onClick={() => generateReportText(dateStr)}
    className="button-icon-strong p-3 rounded-2xl active:scale-95 transition-all"
  >
    <FileText className="w-5 h-5" />
  </button>

  {/* desktop table */}

  <tr className="desktop-weekly-head">
    <th className="desktop-weekly-sticky-lead p-6 text-xs font-black uppercase tracking-[0.2em] sticky left-0 z-10 whitespace-nowrap">工作項目</th>
    {/* existing date headers */}
    <th className="desktop-weekly-sticky-total p-6 text-xs font-black uppercase tracking-[0.2em] text-right sticky right-0 z-10">週合計</th>
  </tr>
```

- [ ] **Step 4: Strengthen quiet surfaces for mobile cards and empty desktop cells without changing behavior**

```tsx
// src/components/WeeklySheet.tsx (relevant excerpts)
<div className="divide-y divide-slate-100">
  {/* ... */}
  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
    <Plus className="w-4 h-4 text-slate-400" />
  </div>

  <div
    className={`
      min-h-[70px] rounded-2xl flex flex-col items-center justify-center transition-all border-2
      ${log
        ? 'bg-emerald-50 border-emerald-200 group-hover/cell:bg-emerald-100 group-hover/cell:border-emerald-300'
        : 'bg-slate-100 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      }
    `}
  >
```

- [ ] **Step 5: Run the focused WeeklySheet test to verify it passes**

Run: `npx vitest run tests/client/weekly-sheet-contrast.test.tsx --reporter=verbose`
Expected: PASS because the mobile header and desktop structural contrast hooks are now present.

- [ ] **Step 6: Run the full client test suite to confirm all visual tests and existing API client tests pass**

Run: `npm run test:client`
Expected: PASS for `tests/client/apiClient.test.ts`, `tests/client/app-shell-layout.test.tsx`, and `tests/client/weekly-sheet-contrast.test.tsx`.

- [ ] **Step 7: Commit the WeeklySheet contrast work**

```bash
git add src/components/WeeklySheet.tsx src/index.css
git commit -m "feat: strengthen weekly sheet contrast hierarchy"
```

---

### Task 4: Polish Remaining Controls And Verify No Interaction Regressions

**Files:**
- Modify: `src/App.tsx`, `src/components/LogModal.tsx`
- Test: `tests/client/app-shell-layout.test.tsx`, manual browser verification

- [ ] **Step 1: Add a failing rendering test for stronger top-level feedback surfaces if the App shell still uses near-white status banners**

```tsx
// tests/client/app-shell-layout.test.tsx (additional case)
it('renders loading and error feedback with structural contrast classes', () => {
  const html = renderToStaticMarkup(<App />);

  expect(html).toContain('feedback-banner-strong');
});
```

- [ ] **Step 2: Run the focused App shell test to verify the new case fails**

Run: `npx vitest run tests/client/app-shell-layout.test.tsx --reporter=verbose`
Expected: FAIL because `feedback-banner-strong` is not rendered yet.

- [ ] **Step 3: Introduce the feedback banner utility and apply it only to structural status surfaces**

```css
/* src/index.css */
@layer components {
  .feedback-banner-strong {
    @apply rounded-2xl px-4 py-3 text-sm font-bold border;
  }
}
```

```tsx
// src/App.tsx (relevant excerpts)
{isLoading && (
  <div className="feedback-banner-strong border-emerald-300 bg-emerald-100 text-emerald-800">
    正在載入資料...
  </div>
)}
{apiError && (
  <div className="feedback-banner-strong border-rose-300 bg-rose-100 text-rose-800">
    {apiError}
  </div>
)}
```

- [ ] **Step 4: If modal inputs or footer controls still visually disappear into pale surfaces, apply contrast-only polish without changing structure**

```tsx
// src/components/LogModal.tsx (relevant excerpts)
<div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-100">
  {/* existing title */}
</div>

<input
  type="time"
  value={startTime}
  onChange={(e) => setStartTime(e.target.value)}
  className="w-full bg-white border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-2xl px-4 py-3 text-lg font-medium text-slate-900 transition-all outline-none"
/>

<div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-3">
```

- [ ] **Step 5: Run the focused App shell test and then the full client suite**

Run: `npx vitest run tests/client/app-shell-layout.test.tsx --reporter=verbose`
Expected: PASS

Run: `npm run test:client`
Expected: PASS

- [ ] **Step 6: Run project-wide type checking**

Run: `npm run lint`
Expected: PASS with no new TypeScript errors.

- [ ] **Step 7: Manually verify the intended UX in the browser**

Run: `npm run dev`
Expected: Vite starts on `http://localhost:3000` and Worker API on `http://127.0.0.1:8787`.

Manual checks:
- Open the app at desktop width and confirm the weekly table renders without horizontal scrolling in ordinary desktop usage.
- Narrow to mobile width and confirm day-card headers, report buttons, and secondary actions remain visually distinct from white content surfaces.
- Open the log modal and confirm save/delete controls still read clearly and behave unchanged.

- [ ] **Step 8: Commit the polish and verification pass**

```bash
git add src/App.tsx src/components/LogModal.tsx src/index.css tests/client/app-shell-layout.test.tsx
git commit -m "feat: polish contrast surfaces and verify visual flow"
```

---

## Spec Coverage Self-Review

- Covered: widened desktop shell via shared header/main container work in Task 2.
- Covered: stronger mobile card-header, table-header, sticky-summary, and button hierarchy contrast in Task 3.
- Covered: preserve existing information architecture, table density, sticky columns, and interaction flow by restricting implementation to class-level shell and surface changes across Tasks 2-4.
- Covered: acceptance and regression verification through focused client tests, full client suite, typecheck, and manual browser checks in Task 4.
- No spec gap found that requires an extra task.

## Placeholder Scan Self-Review

- No `TBD`, `TODO`, or "implement later" placeholders remain.
- Every code-changing step includes concrete snippets.
- Every validation step includes an exact command and expected outcome.

## Type/Contract Consistency Self-Review

- The plan consistently uses `App`, `WeeklySheet`, and `LogModal` as the implementation units already present in the repo.
- The rendering tests consistently use `renderToStaticMarkup` instead of introducing an unplanned testing library.
- CSS utility hook names are consistent across tasks: `app-shell-wide`, `app-topbar`, `button-secondary-strong`, `mobile-day-card-header`, `desktop-weekly-head`, `desktop-weekly-sticky-total`, and `feedback-banner-strong`.