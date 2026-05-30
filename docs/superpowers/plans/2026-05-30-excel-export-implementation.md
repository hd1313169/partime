# Excel 匯出功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在月報表頁面新增「匯出 Excel」按鈕，將所選月份每日工作明細以 `.xlsx` 格式下載。

**Architecture:** 純前端實作——`buildMonthRows` 將 logs/jobs 組裝成二維陣列，`exportMonthToExcel` 呼叫 SheetJS 產生並下載 xlsx 檔。`MonthlyReport` 元件加一個 Download 按鈕，直接呼叫 `exportMonthToExcel`，不需要改動後端或 App.tsx。

**Tech Stack:** SheetJS (`xlsx`)、lucide-react `Download` icon、date-fns（已有）。

---

## File Map

| 動作 | 路徑 | 說明 |
|------|------|------|
| 安裝 | `package.json` | 新增 `xlsx` runtime dependency |
| 新增 | `src/utils/export.ts` | `buildMonthRows`（純函式）+ `exportMonthToExcel` |
| 新增 | `tests/client/export.test.ts` | `buildMonthRows` 單元測試 |
| 修改 | `src/components/MonthlyReport.tsx` | 新增 Download 按鈕 |

---

## Task 1: 安裝 xlsx

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安裝套件**

```bash
npm install xlsx
```

- [ ] **Step 2: 確認已出現在 dependencies**

執行後在 `package.json` 的 `"dependencies"` 區段應可見：
```json
"xlsx": "^0.18.x"
```

---

## Task 2: 寫失敗測試（TDD — 先寫測試）

**Files:**
- Create: `tests/client/export.test.ts`

- [ ] **Step 1: 建立測試檔**

```typescript
// tests/client/export.test.ts
import { describe, it, expect } from 'vitest';
import { buildMonthRows } from '../../src/utils/export';
import { JobType, WorkLog } from '../../src/types';

const jobHourly: JobType = {
  id: 'j1',
  name: '搬運',
  calcType: 'HOURLY',
  unitPrice: 200,
  color: '#ff0000',
};

const jobPiece: JobType = {
  id: 'j2',
  name: '包裝',
  calcType: 'PIECE',
  unitPrice: 70,
  color: '#00ff00',
};

// 2026-05-01 = 五（Friday），2026-05-03 = 日（Sunday）
const logs: WorkLog[] = [
  {
    id: 'l1',
    jobId: 'j1',
    date: '2026-05-01',
    startTime: '09:00',
    endTime: '12:00', // 180 min → 3h
    amount: 600,
    unitPriceAtTime: 200,
  },
  {
    id: 'l2',
    jobId: 'j2',
    date: '2026-05-02',
    quantity: 10,
    amount: 700,
    unitPriceAtTime: 70,
  },
];

describe('buildMonthRows', () => {
  it('produces correct header row', () => {
    const rows = buildMonthRows(logs, [jobHourly, jobPiece], 2026, 5);
    expect(rows[0]).toEqual(['日期', '星期', '搬運', '包裝', '當日合計']);
  });

  it('renders daily rows with correct weekday and values', () => {
    const rows = buildMonthRows(logs, [jobHourly, jobPiece], 2026, 5);
    // rows[1] = 05/01（五）
    expect(rows[1]).toEqual(['05/01', '五', '3h', '-', 'NT$600']);
    // rows[2] = 05/02（六）
    expect(rows[2]).toEqual(['05/02', '六', '-', '10件', 'NT$700']);
    // rows[3] = 05/03（日）無 log
    expect(rows[3]).toEqual(['05/03', '日', '-', '-', '-']);
  });

  it('inserts week total row after Sunday', () => {
    const rows = buildMonthRows(logs, [jobHourly, jobPiece], 2026, 5);
    // rows[0]=header, rows[1..3]=05/01~05/03, rows[4]=week total
    expect(rows[4][0]).toBe('▸ 週合計');
    expect(rows[4][2]).toBe('3h');    // 搬運週合計
    expect(rows[4][3]).toBe('10件'); // 包裝週合計
    expect(rows[4][4]).toBe('NT$1,300'); // 600 + 700
  });

  it('applies Math.ceil to partial hours', () => {
    const partialLog: WorkLog = {
      id: 'l3',
      jobId: 'j1',
      date: '2026-05-04',
      startTime: '09:00',
      endTime: '09:30', // 30 min → ceil(0.5) = 1h
      amount: 200,
      unitPriceAtTime: 200,
    };
    const rows = buildMonthRows([partialLog], [jobHourly], 2026, 5);
    const may4Row = rows.find(r => r[0] === '05/04');
    expect(may4Row?.[2]).toBe('1h');
  });

  it('handles empty month: header + week totals + month total only', () => {
    const rows = buildMonthRows([], [jobHourly, jobPiece], 2026, 5);
    expect(rows[0]).toEqual(['日期', '星期', '搬運', '包裝', '當日合計']);
    expect(rows[rows.length - 1][0]).toBe('▸ 月合計');
  });

  it('month total is last row with correct grand total', () => {
    const rows = buildMonthRows(logs, [jobHourly, jobPiece], 2026, 5);
    const lastRow = rows[rows.length - 1];
    expect(lastRow[0]).toBe('▸ 月合計');
    expect(lastRow[2]).toBe('3h');    // 搬運月合計
    expect(lastRow[3]).toBe('10件'); // 包裝月合計
    expect(lastRow[4]).toBe('NT$1,300');
  });
});
```

- [ ] **Step 2: 執行測試，確認全部失敗（找不到模組）**

```bash
npx vitest run tests/client/export.test.ts --reporter=verbose
```

預期輸出包含：
```
Cannot find module '../../src/utils/export'
```

---

## Task 3: 實作 buildMonthRows 與 exportMonthToExcel

**Files:**
- Create: `src/utils/export.ts`

- [ ] **Step 1: 建立 export.ts**

```typescript
// src/utils/export.ts
import * as XLSX from 'xlsx';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  getDay,
  differenceInMinutes,
  parse,
} from 'date-fns';
import { JobType, WorkLog } from '../types';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'] as const;

function formatAmount(amount: number): string {
  return `NT$${amount.toLocaleString('en-US')}`;
}

/**
 * 組裝月份資料為二維陣列（純函式，不觸發下載，可單元測試）。
 * 結構：header | 每日資料列 | 週合計列（每週日後或月底後插入）| 月合計列
 */
export function buildMonthRows(
  logs: WorkLog[],
  jobs: JobType[],
  year: number,
  month: number,
): (string | number)[][] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthLogs = logs.filter(l => l.date.startsWith(prefix));

  // date -> jobId -> WorkLog
  const logMap = new Map<string, Map<string, WorkLog>>();
  for (const log of monthLogs) {
    if (!logMap.has(log.date)) logMap.set(log.date, new Map());
    logMap.get(log.date)!.set(log.jobId, log);
  }

  const header: string[] = ['日期', '星期', ...jobs.map(j => j.name), '當日合計'];
  const rows: (string | number)[][] = [header];

  const days = eachDayOfInterval({
    start: startOfMonth(new Date(year, month - 1)),
    end: endOfMonth(new Date(year, month - 1)),
  });

  // 週累計器
  let wkMinutes: (number | undefined)[] = jobs.map(j => (j.calcType === 'HOURLY' ? 0 : undefined));
  let wkQuantities: (number | undefined)[] = jobs.map(j => (j.calcType !== 'HOURLY' ? 0 : undefined));
  let wkTotal = 0;

  const resetWeek = () => {
    wkMinutes = jobs.map(j => (j.calcType === 'HOURLY' ? 0 : undefined));
    wkQuantities = jobs.map(j => (j.calcType !== 'HOURLY' ? 0 : undefined));
    wkTotal = 0;
  };

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayLogs = logMap.get(dateStr) ?? new Map<string, WorkLog>();
    const row: (string | number)[] = [format(day, 'MM/dd'), WEEKDAY_NAMES[getDay(day)]];
    let dailyTotal = 0;

    for (let j = 0; j < jobs.length; j++) {
      const job = jobs[j];
      const log = dayLogs.get(job.id);

      if (!log) {
        row.push('-');
        continue;
      }

      dailyTotal += log.amount;
      wkTotal += log.amount;

      if (job.calcType === 'HOURLY') {
        let mins = 0;
        if (log.startTime && log.endTime) {
          const s = parse(log.startTime, 'HH:mm', new Date(0));
          const e = parse(log.endTime, 'HH:mm', new Date(0));
          mins = differenceInMinutes(e, s);
        }
        wkMinutes[j] = (wkMinutes[j] ?? 0) + mins;
        row.push(`${Math.ceil(mins / 60)}h`);
      } else {
        const qty = log.quantity ?? 0;
        wkQuantities[j] = (wkQuantities[j] ?? 0) + qty;
        row.push(`${qty}件`);
      }
    }

    row.push(dailyTotal > 0 ? formatAmount(dailyTotal) : '-');
    rows.push(row);

    // 週合計列：週日後或月底最後一天後插入
    const isLastDay = i === days.length - 1;
    const isSunday = getDay(day) === 0;

    if (isSunday || isLastDay) {
      const wkRow: (string | number)[] = ['▸ 週合計', ''];
      for (let j = 0; j < jobs.length; j++) {
        if (jobs[j].calcType === 'HOURLY') {
          const mins = wkMinutes[j] ?? 0;
          wkRow.push(mins > 0 ? `${Math.ceil(mins / 60)}h` : '-');
        } else {
          const qty = wkQuantities[j] ?? 0;
          wkRow.push(qty > 0 ? `${qty}件` : '-');
        }
      }
      wkRow.push(wkTotal > 0 ? formatAmount(wkTotal) : '-');
      rows.push(wkRow);
      resetWeek();
    }
  }

  // 月合計列
  const monthRow: (string | number)[] = ['▸ 月合計', ''];
  let grandTotal = 0;

  for (const job of jobs) {
    const jobLogs = monthLogs.filter(l => l.jobId === job.id);
    grandTotal += jobLogs.reduce((s, l) => s + l.amount, 0);

    if (job.calcType === 'HOURLY') {
      let totalMins = 0;
      for (const l of jobLogs) {
        if (l.startTime && l.endTime) {
          const s = parse(l.startTime, 'HH:mm', new Date(0));
          const e = parse(l.endTime, 'HH:mm', new Date(0));
          totalMins += differenceInMinutes(e, s);
        }
      }
      monthRow.push(totalMins > 0 ? `${Math.ceil(totalMins / 60)}h` : '-');
    } else {
      const totalQty = jobLogs.reduce((s, l) => s + (l.quantity ?? 0), 0);
      monthRow.push(totalQty > 0 ? `${totalQty}件` : '-');
    }
  }

  monthRow.push(grandTotal > 0 ? formatAmount(grandTotal) : '-');
  rows.push(monthRow);

  return rows;
}

/** 產生並觸發瀏覽器下載 xlsx 檔。 */
export function exportMonthToExcel(
  logs: WorkLog[],
  jobs: JobType[],
  year: number,
  month: number,
): void {
  const rows = buildMonthRows(logs, jobs, year, month);
  const sheetName = `${year}年${String(month).padStart(2, '0')}月`;
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `partime-${year}-${String(month).padStart(2, '0')}.xlsx`);
}
```

- [ ] **Step 2: 執行測試，確認全部通過**

```bash
npx vitest run tests/client/export.test.ts --reporter=verbose
```

預期輸出：
```
✓ buildMonthRows > produces correct header row
✓ buildMonthRows > renders daily rows with correct weekday and values
✓ buildMonthRows > inserts week total row after Sunday
✓ buildMonthRows > applies Math.ceil to partial hours
✓ buildMonthRows > handles empty month: header + week totals + month total only
✓ buildMonthRows > month total is last row with correct grand total
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/export.ts tests/client/export.test.ts
git commit -m "feat: add buildMonthRows and exportMonthToExcel"
```

---

## Task 4: 在 MonthlyReport 加入匯出按鈕

**Files:**
- Modify: `src/components/MonthlyReport.tsx`

- [ ] **Step 1: 修改 lucide-react import，加入 Download**

舊：
```tsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
```

新：
```tsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
```

- [ ] **Step 2: 在現有 import 區段加入 exportMonthToExcel**

在 `import { computeMonthlyReport } from '../utils/monthly';` 下方加一行：
```tsx
import { exportMonthToExcel } from '../utils/export';
```

- [ ] **Step 3: 在 Dropdowns div 後方加入匯出按鈕**

找到 `MonthlyReport.tsx` 中以下段落（Dropdowns div 的結尾）：
```tsx
          </div>
        </div>
      </div>
```
（其中第一個 `</div>` 結束 Dropdowns div，第二個結束外層 flex wrap div，第三個結束最外層 flex row div）

在 Dropdowns div 的 `</div>` 後、外層 flex wrap div 的 `</div>` 前插入按鈕：

```tsx
          </div>

          {/* 匯出 Excel */}
          <button
            onClick={() => exportMonthToExcel(logs, jobs, year, month)}
            className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 transition-all text-xs font-bold"
            title="匯出 Excel"
          >
            <Download className="w-4 h-4" />
            <span>匯出</span>
          </button>
        </div>
      </div>
```

- [ ] **Step 4: 執行全部 client 測試**

```bash
npm run test:client
```

預期輸出：全部 PASS（含 export.test.ts 新增的 6 個測試）。

- [ ] **Step 5: Commit**

```bash
git add src/components/MonthlyReport.tsx
git commit -m "feat: add export Excel button to MonthlyReport"
```

---

## Task 5: 最終驗證

- [ ] **Step 1: TypeScript 型別檢查**

```bash
npm run lint
```

預期：無錯誤。

- [ ] **Step 2: 完整測試套件**

```bash
npm run test
```

預期：全部 PASS。

- [ ] **Step 3: 建置確認**

```bash
npm run build
```

預期：build 成功，無錯誤。

- [ ] **Step 4: Final commit（若有未 commit 的修改）**

```bash
git status
```

確認工作樹乾淨，所有變更已 commit。
