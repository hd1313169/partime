# Mobile-First Quick Add UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the salary tracker homepage into a mobile-first, orange-led quick-add dashboard with optimistic save behavior, validation, and automated coverage for the critical user journey.

**Architecture:** Keep the existing Express + SQLite API and current domain types intact. Reshape the frontend by moving dashboard-specific data shaping into pure utility functions, splitting the homepage into focused dashboard components, and upgrading the log modal into a validated quick-add flow with optimistic create/update handling. Add missing client-side testing infrastructure first, then finish with one browser-level smoke test using Playwright against mocked API responses.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Vitest, Testing Library, Playwright, date-fns, lucide-react, motion

---

## File Structure And Responsibilities

- Modify: `package.json` — add client/E2E test dependencies and scripts.
- Modify: `vitest.config.ts` — allow `.test.tsx` files and add a shared setup file.
- Modify: `index.html` — load `Noto Sans TC` and `Barlow Condensed` fonts.
- Modify: `src/index.css` — define orange-led theme tokens, typography defaults, and reusable motion helpers.
- Modify: `src/App.tsx` — own bootstrap loading, retry handling, quick-add open state, optimistic log mutations, and dashboard composition.
- Modify: `src/components/LogModal.tsx` — support validation, async save result handling, and draft persistence.
- Create: `src/utils/dashboard.ts` — pure selectors/helpers for current-week prices, today logs, and hero summary.
- Create: `src/components/dashboard/ErrorBanner.tsx` — collapsible retryable API error banner.
- Create: `src/components/dashboard/MobileTopBar.tsx` — week label, prev/next controls, and settings entry.
- Create: `src/components/dashboard/QuickAddHero.tsx` — main CTA, today summary, and no-jobs fallback CTA.
- Create: `src/components/dashboard/JobShortcutGrid.tsx` — one-tap job cards that open quick-add prefilled for a selected job.
- Create: `src/components/dashboard/TodayLogTimeline.tsx` — today log list, empty state card, and edit affordances.
- Create: `src/components/dashboard/WeeklyOverviewSection.tsx` — collapsed-by-default wrapper for the existing weekly table.
- Create: `tests/client/setup.ts` — jest-dom setup and browser API shims.
- Create: `tests/client/renderApp.tsx` — reusable app render helper with salary API mocks.
- Create: `tests/client/fixtures/bootstrap.ts` — deterministic bootstrap payload fixtures.
- Create: `tests/client/app-shell.test.tsx` — dashboard shell and mobile-first CTA assertions.
- Create: `tests/client/dashboard-utils.test.ts` — pure utility coverage for summary and pricing logic.
- Create: `tests/client/quick-add-flow.test.tsx` — validation, optimistic update, and rollback coverage.
- Create: `playwright.config.ts` — E2E runner setup against the Vite dev server.
- Create: `tests/e2e/fixtures/bootstrap.ts` — browser-level bootstrap fixture.
- Create: `tests/e2e/quick-add.spec.ts` — smoke test for quick-add, retry, and preserved draft behavior.

### Task 1: Add Client UI Test Foundation

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.ts`
- Create: `tests/client/setup.ts`
- Create: `tests/client/renderApp.tsx`
- Create: `tests/client/fixtures/bootstrap.ts`
- Test: `tests/client/app-shell.test.tsx`

- [ ] **Step 1: Write the failing client render smoke test**

```tsx
// tests/client/app-shell.test.tsx
import { screen } from '@testing-library/react';
import { renderApp } from './renderApp';
import { bootstrapFixture } from './fixtures/bootstrap';

describe('dashboard shell', () => {
  it('shows loading state first, then renders the quick-add CTA', async () => {
    renderApp({ bootstrap: bootstrapFixture() });

    expect(screen.getByText('正在載入資料...')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '快速新增紀錄' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails because the UI test stack does not exist yet**

Run: `npx vitest run tests/client/app-shell.test.tsx --reporter=verbose`

Expected: FAIL with module/config errors such as `Cannot find module '@testing-library/react'` or `Failed to load setup file`.

- [ ] **Step 3: Add Testing Library dependencies, Vitest setup, and shared client fixtures**

```json
// package.json
{
  "scripts": {
    "test:client": "vitest run tests/client --reporter=verbose"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1"
  }
}
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: true,
    setupFiles: ['tests/client/setup.ts'],
    environmentMatchGlobs: [
      ['tests/client/**', 'jsdom'],
      ['tests/server/**', 'node'],
    ],
  },
});
```

```ts
// tests/client/setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});
```

```tsx
// tests/client/renderApp.tsx
import { render } from '@testing-library/react';
import App from '../../src/App';
import { salaryApi } from '../../src/services/salaryApi';
import { BootstrapData } from '../../src/services/salaryApi';
import { vi } from 'vitest';

export function renderApp({ bootstrap }: { bootstrap: BootstrapData }) {
  vi.spyOn(salaryApi, 'getBootstrap').mockResolvedValue(bootstrap);
  vi.spyOn(salaryApi, 'createLog').mockResolvedValue(undefined as never);
  vi.spyOn(salaryApi, 'updateLog').mockResolvedValue(undefined as never);
  vi.spyOn(salaryApi, 'deleteLog').mockResolvedValue(undefined as never);
  vi.spyOn(salaryApi, 'setWeeklyPrice').mockResolvedValue(undefined as never);
  return render(<App />);
}
```

```ts
// tests/client/fixtures/bootstrap.ts
import { BootstrapData } from '../../../src/services/salaryApi';

export function bootstrapFixture(): BootstrapData {
  return {
    jobs: [
      { id: 'job-hourly', name: '早班', calcType: 'HOURLY', unitPrice: 220, color: '#FF6A00' },
      { id: 'job-piece', name: '包貨', calcType: 'PIECE', unitPrice: 15, color: '#FFB26B' },
    ],
    logs: [
      {
        id: 'log-today-1',
        jobId: 'job-hourly',
        date: '2026-04-08',
        startTime: '08:00',
        endTime: '12:00',
        amount: 880,
        unitPriceAtTime: 220,
      },
    ],
    weeklyPrices: {
      '2026-04-06': {
        'job-hourly': 220,
        'job-piece': 15,
      },
    },
  };
}
```

- [ ] **Step 4: Install dependencies and rerun the smoke test**

Run: `npm install`

Expected: PASS install output ending with `added ... packages` and no dependency resolution errors.

Run: `npx vitest run tests/client/app-shell.test.tsx --reporter=verbose`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit the test foundation**

```bash
git add package.json vitest.config.ts tests/client/setup.ts tests/client/renderApp.tsx tests/client/fixtures/bootstrap.ts tests/client/app-shell.test.tsx
git commit -m "test: add client ui test foundation"
```

### Task 2: Extract Dashboard View Helpers

**Files:**
- Create: `src/utils/dashboard.ts`
- Test: `tests/client/dashboard-utils.test.ts`

- [ ] **Step 1: Write failing tests for week-price inheritance and today summary shaping**

```ts
// tests/client/dashboard-utils.test.ts
import { describe, expect, it } from 'vitest';
import { buildTodaySummary, getTodayLogs, resolveWeekPrices } from '../../src/utils/dashboard';
import { bootstrapFixture } from './fixtures/bootstrap';

describe('dashboard utils', () => {
  it('inherits the latest weekly price at or before the selected week', () => {
    const data = bootstrapFixture();

    const resolved = resolveWeekPrices(data.jobs, {
      ...data.weeklyPrices,
      '2026-03-30': { 'job-hourly': 200 },
    }, '2026-04-06');

    expect(resolved).toEqual({
      'job-hourly': 220,
      'job-piece': 15,
    });
  });

  it('builds a sorted today summary with totals and count', () => {
    const data = bootstrapFixture();

    const logs = getTodayLogs(data.logs, '2026-04-08');
    const summary = buildTodaySummary(logs);

    expect(logs.map((log) => log.id)).toEqual(['log-today-1']);
    expect(summary).toEqual({
      totalAmount: 880,
      logCount: 1,
    });
  });
});
```

- [ ] **Step 2: Run the utility tests to verify they fail because the helper file does not exist yet**

Run: `npx vitest run tests/client/dashboard-utils.test.ts --reporter=verbose`

Expected: FAIL with `Cannot find module '../../src/utils/dashboard'`.

- [ ] **Step 3: Implement the pure dashboard selectors used by the new homepage**

```ts
// src/utils/dashboard.ts
import { JobType, WeeklyPriceConfig, WorkLog } from '../types';

export function resolveWeekPrices(
  jobs: JobType[],
  weeklyPrices: WeeklyPriceConfig,
  weekStartISO: string,
): Record<string, number> {
  const prices: Record<string, number> = {};
  const weekKeys = Object.keys(weeklyPrices).sort().reverse();

  for (const job of jobs) {
    const sourceWeek = weekKeys.find((weekKey) => weekKey <= weekStartISO && weeklyPrices[weekKey]?.[job.id] !== undefined);
    prices[job.id] = sourceWeek ? weeklyPrices[sourceWeek][job.id] : job.unitPrice;
  }

  return prices;
}

export function getTodayLogs(logs: WorkLog[], isoDate: string): WorkLog[] {
  return logs
    .filter((log) => log.date === isoDate)
    .sort((left, right) => {
      const leftKey = `${left.startTime ?? '99:99'}-${left.id}`;
      const rightKey = `${right.startTime ?? '99:99'}-${right.id}`;
      return leftKey.localeCompare(rightKey);
    });
}

export function buildTodaySummary(logs: WorkLog[]) {
  return {
    totalAmount: logs.reduce((sum, log) => sum + log.amount, 0),
    logCount: logs.length,
  };
}
```

- [ ] **Step 4: Rerun the utility tests and keep them green**

Run: `npx vitest run tests/client/dashboard-utils.test.ts --reporter=verbose`

Expected: PASS with `2 passed`.

- [ ] **Step 5: Commit the extracted view-model utilities**

```bash
git add src/utils/dashboard.ts tests/client/dashboard-utils.test.ts
git commit -m "refactor: extract dashboard view helpers"
```

### Task 3: Build The Mobile-First Dashboard Shell

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Create: `src/components/dashboard/ErrorBanner.tsx`
- Create: `src/components/dashboard/MobileTopBar.tsx`
- Create: `src/components/dashboard/QuickAddHero.tsx`
- Create: `src/components/dashboard/JobShortcutGrid.tsx`
- Create: `src/components/dashboard/TodayLogTimeline.tsx`
- Create: `src/components/dashboard/WeeklyOverviewSection.tsx`
- Test: `tests/client/app-shell.test.tsx`

- [ ] **Step 1: Expand the shell test to describe the approved homepage behavior**

```tsx
// tests/client/app-shell.test.tsx
import { screen } from '@testing-library/react';
import { renderApp } from './renderApp';
import { bootstrapFixture } from './fixtures/bootstrap';

describe('dashboard shell', () => {
  it('renders the mobile-first quick-add hero and keeps the weekly table collapsed initially', async () => {
    renderApp({ bootstrap: bootstrapFixture() });

    expect(await screen.findByRole('button', { name: '快速新增紀錄' })).toBeVisible();
    expect(screen.getByText('今天已記錄 1 筆')).toBeVisible();
    expect(screen.getByRole('button', { name: '展開本週總覽' })).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the shell test and verify it fails against the current weekly-table-first layout**

Run: `npx vitest run tests/client/app-shell.test.tsx --reporter=verbose`

Expected: FAIL because `快速新增紀錄` and `展開本週總覽` do not exist yet.

- [ ] **Step 3: Implement the orange-led visual system and split the homepage into focused dashboard components**

```html
<!-- index.html -->
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Noto+Sans+TC:wght@400;500;700;800&display=swap" rel="stylesheet" />
  <title>Partime 個人工資管理系統</title>
</head>
```

```css
/* src/index.css */
@import "tailwindcss";

:root {
  --color-primary: #ff6a00;
  --color-primary-hover: #e85f00;
  --color-primary-soft: #fff1e8;
  --color-accent-warm: #ffb26b;
  --color-text-main: #1f2937;
  --color-text-sub: #6b7280;
  --color-page-bg: #fff7f2;
  --color-surface: #ffffff;
  --color-success: #16a34a;
  --color-danger: #dc2626;
}

body {
  font-family: 'Noto Sans TC', sans-serif;
  background:
    radial-gradient(circle at top right, rgba(255, 178, 107, 0.24), transparent 30%),
    linear-gradient(180deg, #fffaf6 0%, var(--color-page-bg) 100%);
  color: var(--color-text-main);
}

.amount-display {
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.02em;
}
```

```tsx
// src/components/dashboard/QuickAddHero.tsx
interface QuickAddHeroProps {
  amount: number;
  count: number;
  hasJobs: boolean;
  onQuickAdd: () => void;
  onCreateFirstJob: () => void;
}

export function QuickAddHero({ amount, count, hasJobs, onQuickAdd, onCreateFirstJob }: QuickAddHeroProps) {
  return (
    <section className="rounded-[28px] bg-gradient-to-br from-[#FF7A1A] via-[#FF6A00] to-[#E85F00] p-6 text-white shadow-[0_24px_60px_-24px_rgba(255,106,0,0.65)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/70">快速記錄</p>
      <h2 className="mt-2 text-3xl font-black">三步內完成今天的工時登記</h2>
      <p className="mt-3 text-sm text-white/80">今天已記錄 {count} 筆</p>
      <p className="amount-display mt-1 text-5xl font-bold">NT$ {amount.toLocaleString()}</p>
      {hasJobs ? (
        <button className="mt-5 w-full rounded-2xl bg-white px-4 py-4 text-base font-black text-[#E85F00]" onClick={onQuickAdd}>
          快速新增紀錄
        </button>
      ) : (
        <button className="mt-5 w-full rounded-2xl bg-white px-4 py-4 text-base font-black text-[#E85F00]" onClick={onCreateFirstJob}>
          先建立第一個工作
        </button>
      )}
    </section>
  );
}
```

```tsx
// src/components/dashboard/JobShortcutGrid.tsx
import { JobType } from '../../types';

interface JobShortcutGridProps {
  jobs: JobType[];
  weeklyPrices: Record<string, number>;
  onSelectJob: (job: JobType) => void;
}

export function JobShortcutGrid({ jobs, weeklyPrices, onSelectJob }: JobShortcutGridProps) {
  if (jobs.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900">快速選工作</h3>
        <p className="text-xs font-bold text-slate-400">點一下直接帶入</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelectJob(job)}
            className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: job.color }} />
              <span className="text-sm font-black text-slate-900">{job.name}</span>
            </div>
            <p className="amount-display mt-3 text-3xl text-[#E85F00]">NT$ {weeklyPrices[job.id]?.toLocaleString() ?? job.unitPrice.toLocaleString()}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
```

```tsx
// src/components/dashboard/TodayLogTimeline.tsx
import { JobType, WorkLog } from '../../types';

interface TodayLogTimelineProps {
  logs: WorkLog[];
  jobs: JobType[];
  onEdit: (job: JobType, log: WorkLog) => void;
  onCreate: () => void;
}

export function TodayLogTimeline({ logs, jobs, onEdit, onCreate }: TodayLogTimelineProps) {
  if (logs.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-orange-200 bg-white/80 p-5 text-center">
        <p className="text-sm font-black text-slate-900">今天還沒紀錄</p>
        <p className="mt-1 text-xs text-slate-500">先按一次快速新增，把第一筆記錄存起來。</p>
        <button type="button" className="mt-4 rounded-2xl bg-[#FF6A00] px-4 py-3 text-sm font-black text-white" onClick={onCreate}>
          立即新增今天紀錄
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-black text-slate-900">今日時間軸</h3>
      <div className="space-y-3">
        {logs.map((log) => {
          const job = jobs.find((item) => item.id === log.jobId);
          if (!job) return null;

          return (
            <button
              key={log.id}
              type="button"
              onClick={() => onEdit(job, log)}
              className="flex w-full items-center justify-between rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100"
            >
              <div>
                <p className="text-sm font-black text-slate-900">{job.name}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{log.startTime && log.endTime ? `${log.startTime}-${log.endTime}` : `數量 ${log.quantity}`}</p>
              </div>
              <p className="amount-display text-3xl text-slate-900">{log.amount.toLocaleString()}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

```tsx
// src/components/dashboard/ErrorBanner.tsx
import { useState } from 'react';

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-rose-700" onClick={onRetry}>
            重試
          </button>
          <button type="button" className="rounded-xl px-2 py-1.5 text-xs font-black text-rose-500" onClick={() => setVisible(false)}>
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/components/dashboard/MobileTopBar.tsx
import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';

interface MobileTopBarProps {
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onOpenSettings: () => void;
}

export function MobileTopBar({ weekLabel, onPrevWeek, onNextWeek, onOpenSettings }: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-30 rounded-[28px] bg-white/85 p-4 backdrop-blur-md shadow-sm ring-1 ring-orange-100">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">本週區間</p>
          <p className="mt-1 text-base font-black text-slate-900">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-xl bg-orange-50 p-2 text-[#E85F00]" onClick={onPrevWeek}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" className="rounded-xl bg-orange-50 p-2 text-[#E85F00]" onClick={onNextWeek}>
            <ChevronRight className="h-5 w-5" />
          </button>
          <button type="button" className="rounded-xl bg-slate-100 p-2 text-slate-600" onClick={onOpenSettings}>
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

```tsx
// src/components/dashboard/WeeklyOverviewSection.tsx
import { ReactNode, useState } from 'react';

export function WeeklyOverviewSection({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label={isOpen ? '收合本週總覽' : '展開本週總覽'}
        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-left text-sm font-bold text-slate-700"
      >
        {isOpen ? '收合本週總覽' : '展開本週總覽'}
      </button>
      {isOpen ? children : null}
    </section>
  );
}
```

```tsx
// src/App.tsx (composition excerpt)
import { format, startOfWeek, isSameWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { buildTodaySummary, getTodayLogs, resolveWeekPrices } from './utils/dashboard';
import { ErrorBanner } from './components/dashboard/ErrorBanner';
import { MobileTopBar } from './components/dashboard/MobileTopBar';
import { JobShortcutGrid } from './components/dashboard/JobShortcutGrid';
import { QuickAddHero } from './components/dashboard/QuickAddHero';
import { TodayLogTimeline } from './components/dashboard/TodayLogTimeline';
import { WeeklyOverviewSection } from './components/dashboard/WeeklyOverviewSection';

const todayISO = format(new Date(), 'yyyy-MM-dd');
const todayLogs = useMemo(() => getTodayLogs(logs, todayISO), [logs, todayISO]);
const todaySummary = useMemo(() => buildTodaySummary(todayLogs), [todayLogs]);
const currentWeekPrices = useMemo(
  () => resolveWeekPrices(jobs, weeklyPrices, weekStartISO),
  [jobs, weeklyPrices, weekStartISO],
);
const weekLabel = `${format(weekStart, 'yyyy/MM/dd')} - ${format(addDays(weekStart, 6), 'yyyy/MM/dd')}`;

<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  <div className="space-y-5">
    <MobileTopBar
      weekLabel={weekLabel}
      onPrevWeek={prevWeek}
      onNextWeek={nextWeek}
      onOpenSettings={() => setJobManagementOpen(true)}
    />
    {apiError ? <ErrorBanner message={apiError} onRetry={() => void loadBootstrap()} /> : null}
    <QuickAddHero
      amount={todaySummary.totalAmount}
      count={todaySummary.logCount}
      hasJobs={jobs.length > 0}
      onQuickAdd={() => setLogModal({ isOpen: true, job: jobs[0], date: todayISO })}
      onCreateFirstJob={() => setJobManagementOpen(true)}
    />
    <JobShortcutGrid jobs={jobs} weeklyPrices={currentWeekPrices} onSelectJob={(job) => setLogModal({ isOpen: true, job, date: todayISO })} />
    <TodayLogTimeline logs={todayLogs} jobs={jobs} onEdit={(job, log) => setLogModal({ isOpen: true, job, date: log.date, log })} onCreate={() => setLogModal({ isOpen: true, job: jobs[0], date: todayISO })} />
    <WeeklyOverviewSection>
      <WeeklySheet
        logs={logs}
        jobs={jobs}
        currentDate={currentDate}
        weeklyPrices={currentWeekPrices}
        onUpdateWeeklyPrice={handleUpdateWeeklyPrice}
        onCellClick={(job, date, log) => setLogModal({ isOpen: true, job, date, log })}
        onGenerateReport={(text) => setReportModal({ isOpen: true, text })}
      />
    </WeeklyOverviewSection>
  </div>
</main>
```

- [ ] **Step 4: Rerun the shell test and verify the new layout contract passes**

Run: `npx vitest run tests/client/app-shell.test.tsx --reporter=verbose`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit the dashboard shell split**

```bash
git add index.html src/index.css src/App.tsx src/components/dashboard/ErrorBanner.tsx src/components/dashboard/MobileTopBar.tsx src/components/dashboard/QuickAddHero.tsx src/components/dashboard/JobShortcutGrid.tsx src/components/dashboard/TodayLogTimeline.tsx src/components/dashboard/WeeklyOverviewSection.tsx tests/client/app-shell.test.tsx
git commit -m "feat: add mobile-first dashboard shell"
```

### Task 4: Upgrade Quick Add Validation And Optimistic Save

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/LogModal.tsx`
- Modify: `src/utils/salary.ts`
- Modify: `src/types.ts`
- Test: `tests/client/quick-add-flow.test.tsx`

- [ ] **Step 1: Write failing tests for validation, optimistic insert, and rollback with preserved draft**

```tsx
// tests/client/quick-add-flow.test.tsx
import { vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './renderApp';
import { bootstrapFixture } from './fixtures/bootstrap';
import { salaryApi } from '../../src/services/salaryApi';

describe('quick add flow', () => {
  it('blocks save when the end time is earlier than the start time', async () => {
    renderApp({ bootstrap: bootstrapFixture() });
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: '快速新增紀錄' }));
    await user.clear(screen.getByLabelText('開始時間'));
    await user.type(screen.getByLabelText('開始時間'), '14:00');
    await user.clear(screen.getByLabelText('結束時間'));
    await user.type(screen.getByLabelText('結束時間'), '10:00');
    await user.click(screen.getByRole('button', { name: '儲存' }));

    expect(screen.getByText('結束時間必須晚於開始時間')).toBeVisible();
  });

  it('optimistically inserts the new log, then rolls back and preserves draft when create fails', async () => {
    vi.spyOn(salaryApi, 'createLog').mockRejectedValueOnce({
      error: { code: 'INTERNAL_ERROR', message: 'boom' },
    });

    renderApp({ bootstrap: bootstrapFixture() });
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: '快速新增紀錄' }));
    await user.clear(screen.getByLabelText('開始時間'));
    await user.type(screen.getByLabelText('開始時間'), '13:00');
    await user.clear(screen.getByLabelText('結束時間'));
    await user.type(screen.getByLabelText('結束時間'), '18:00');
    await user.click(screen.getByRole('button', { name: '儲存' }));

    expect(screen.getByText('13:00-18:00')).toBeVisible();
    await waitFor(() => expect(screen.getByText('系統忙碌中，請稍後再試')).toBeVisible());
    expect(screen.getByDisplayValue('13:00')).toBeVisible();
    expect(screen.getByDisplayValue('18:00')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the quick-add flow tests and confirm they fail against the current synchronous modal behavior**

Run: `npx vitest run tests/client/quick-add-flow.test.tsx --reporter=verbose`

Expected: FAIL because the modal has no validation message, no optimistic insert, and no preserved draft state.

- [ ] **Step 3: Add explicit validation and async save handling to the modal contract**

```ts
// src/types.ts
export interface LogDraft {
  startTime?: string;
  endTime?: string;
  quantity?: number;
}
```

```ts
// src/utils/salary.ts
export function validateLogInput(job: JobType, startTime?: string, endTime?: string, quantity?: number): string | null {
  if (job.calcType === 'HOURLY') {
    if (!startTime || !endTime) return '請完整輸入開始與結束時間';
    const amount = calculateLogAmount(job, 1, startTime, endTime, quantity);
    if (amount <= 0) return '結束時間必須晚於開始時間';
    return null;
  }

  if (!quantity || quantity <= 0) {
    return '數量必須大於 0';
  }

  return null;
}
```

```tsx
// src/components/LogModal.tsx (contract excerpt)
interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobType;
  date: string;
  unitPrice: number;
  existingLog?: WorkLog;
  draft?: LogDraft;
  onDraftChange: (draft: LogDraft) => void;
  onSave: (log: WorkLog, draft: LogDraft) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const [formError, setFormError] = useState<string | null>(null);

const handleSave = async () => {
  const nextDraft = { startTime, endTime, quantity };
  const validationError = validateLogInput(job, startTime, endTime, quantity);

  if (validationError) {
    setFormError(validationError);
    onDraftChange(nextDraft);
    return;
  }

  const amount = calculateLogAmount(job, unitPrice, startTime, endTime, quantity);
  const log: WorkLog = {
    id: existingLog?.id || crypto.randomUUID(),
    jobId: job.id,
    date,
    startTime: job.calcType === 'HOURLY' ? startTime : undefined,
    endTime: job.calcType === 'HOURLY' ? endTime : undefined,
    quantity: job.calcType !== 'HOURLY' ? quantity : undefined,
    amount,
    unitPriceAtTime: unitPrice,
  };

  onDraftChange(nextDraft);
  const succeeded = await onSave(log, nextDraft);
  if (succeeded) {
    setFormError(null);
    onClose();
  }
};
```

- [ ] **Step 4: Implement optimistic insert, rollback, and retryable error state in the app container**

```tsx
// src/App.tsx (save handler excerpt)
const [quickDraft, setQuickDraft] = useState<LogDraft>({});

const handleSaveLog = async (log: WorkLog, draft: LogDraft) => {
  const previousLogs = logs;
  const exists = logs.some((entry) => entry.id === log.id);

  setLogs((prev) => {
    if (exists) {
      return prev.map((entry) => (entry.id === log.id ? log : entry));
    }
    return [log, ...prev];
  });

  try {
    if (exists) {
      await salaryApi.updateLog(log);
    } else {
      await salaryApi.createLog(log);
    }
    setQuickDraft({});
    return true;
  } catch (error) {
    setLogs(previousLogs);
    setApiError(mapApiError(error as never));
    setQuickDraft(draft);
    return false;
  }
};

<LogModal
  isOpen={logModal.isOpen}
  onClose={() => setLogModal((prev) => ({ ...prev, isOpen: false }))}
  job={logModal.job}
  date={logModal.date}
  unitPrice={currentWeekPrices[logModal.job.id]}
  existingLog={logModal.log}
  draft={quickDraft}
  onDraftChange={setQuickDraft}
  onSave={handleSaveLog}
  onDelete={(id) => {
    void handleDeleteLog(id);
  }}
/>
```

- [ ] **Step 5: Rerun the quick-add tests and keep the shell test green**

Run: `npx vitest run tests/client/quick-add-flow.test.tsx tests/client/app-shell.test.tsx --reporter=verbose`

Expected: PASS with all quick-add and shell assertions green.

- [ ] **Step 6: Commit the quick-add behavior upgrade**

```bash
git add src/App.tsx src/components/LogModal.tsx src/utils/salary.ts src/types.ts tests/client/quick-add-flow.test.tsx tests/client/app-shell.test.tsx
git commit -m "feat: add validated optimistic quick add flow"
```

### Task 5: Add Browser Smoke Coverage For The Critical Journey

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/fixtures/bootstrap.ts`
- Create: `tests/e2e/quick-add.spec.ts`

- [ ] **Step 1: Write the failing Playwright smoke test for quick-add and retry behavior**

```ts
// tests/e2e/quick-add.spec.ts
import { expect, test } from '@playwright/test';
import { bootstrapFixture } from './fixtures/bootstrap';

test('quick add preserves draft after a failed save and succeeds on retry', async ({ page }) => {
  const data = bootstrapFixture();
  let createAttempts = 0;

  await page.route('**/api/bootstrap', async (route) => {
    await route.fulfill({ json: { data } });
  });

  await page.route('**/api/logs', async (route) => {
    createAttempts += 1;
    if (createAttempts === 1) {
      await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'boom' } } });
      return;
    }

    await route.fulfill({ json: { data: JSON.parse(route.request().postData() ?? '{}') } });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '快速新增紀錄' }).click();
  await page.getByLabel('開始時間').fill('13:00');
  await page.getByLabel('結束時間').fill('18:00');
  await page.getByRole('button', { name: '儲存' }).click();

  await expect(page.getByText('系統忙碌中，請稍後再試')).toBeVisible();
  await expect(page.getByDisplayValue('13:00')).toBeVisible();
  await expect(page.getByDisplayValue('18:00')).toBeVisible();

  await page.getByRole('button', { name: '儲存' }).click();
  await expect(page.getByText('13:00-18:00')).toBeVisible();
});
```

- [ ] **Step 2: Run the browser test and confirm it fails because Playwright is not configured yet**

Run: `npx playwright test tests/e2e/quick-add.spec.ts`

Expected: FAIL with missing package/config errors.

- [ ] **Step 3: Add Playwright to the repo and configure it against the Vite client server**

```json
// package.json
{
  "devDependencies": {
    "@playwright/test": "^1.54.2"
  },
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
  },
  webServer: {
    command: 'npm run dev:client -- --host 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

```ts
// tests/e2e/fixtures/bootstrap.ts
export function bootstrapFixture() {
  return {
    jobs: [
      { id: 'job-hourly', name: '早班', calcType: 'HOURLY', unitPrice: 220, color: '#FF6A00' },
    ],
    logs: [],
    weeklyPrices: {
      '2026-04-06': {
        'job-hourly': 220,
      },
    },
  };
}
```

- [ ] **Step 4: Install the browser tooling and run the smoke test end-to-end**

Run: `npm install`

Expected: PASS install output with Playwright dependency present.

Run: `npx playwright install --with-deps chromium`

Expected: PASS browser install output ending without missing dependency errors.

Run: `npx playwright test tests/e2e/quick-add.spec.ts`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Run the full validation set before the final commit**

Run: `npm run lint`

Expected: PASS with no TypeScript errors.

Run: `npm run test:client`

Expected: PASS with all client utility, shell, and quick-add tests green.

Run: `npm run test:e2e`

Expected: PASS with the quick-add smoke test green.

- [ ] **Step 6: Commit the browser coverage and final validation state**

```bash
git add package.json playwright.config.ts tests/e2e/fixtures/bootstrap.ts tests/e2e/quick-add.spec.ts
git commit -m "test: add quick add browser smoke coverage"
```

## Self-Review

### Spec Coverage
- Mobile-first homepage hierarchy: Task 3.
- Quick-add primary CTA and job shortcuts: Task 3.
- Orange-led visual system and typography: Task 3.
- Validation, optimistic save, rollback, retry, and preserved draft: Task 4.
- Empty/no-jobs handling and retryable error surfaces: Task 3 and Task 4.
- Unit, component, and browser-journey testing: Tasks 1, 2, 4, and 5.

### Placeholder Scan
- No `TBD`, `TODO`, or deferred implementation notes remain.
- Every task includes exact file paths, code snippets, commands, and expected outcomes.

### Type Consistency
- `LogDraft` is introduced once in `src/types.ts` and used consistently by `App.tsx` and `LogModal.tsx`.
- `resolveWeekPrices`, `getTodayLogs`, and `buildTodaySummary` are defined in `src/utils/dashboard.ts` before any component tasks depend on them.
- The Playwright smoke test uses the same quick-add labels introduced by Task 3 and Task 4.