# 月報功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在現有工資管理系統中新增月報頁面，透過頂部分頁標籤切換週報/月報，月報以工作項目為主行統計當月時數（或件數）與工資，並顯示當月總工資。

**Architecture:** 純前端計算方案。從 App 已載入的 `logs` state 篩選當月資料，`computeMonthlyReport()` 純函數做聚合，`MonthlyReport` 元件負責呈現。不需要後端變動。

**Tech Stack:** React, TypeScript, date-fns, Tailwind CSS v4, Vitest

---

## 檔案結構

| 操作 | 路徑 | 用途 |
|------|------|------|
| 新增 | `src/utils/monthly.ts` | 純計算函數 `computeMonthlyReport` |
| 新增 | `src/components/MonthlyReport.tsx` | 月報 UI 元件 |
| 新增 | `tests/client/monthly-report.test.ts` | 計算函數單元測試 |
| 修改 | `src/App.tsx` | 新增 `view` state、header 分頁標籤、條件渲染 |

---

## Task 1：計算函數與單元測試

**Files:**
- Create: `src/utils/monthly.ts`
- Create: `tests/client/monthly-report.test.ts`

### Step 1.1：建立 `src/utils/monthly.ts`（型別與函數骨架）

```typescript
// src/utils/monthly.ts
import { differenceInMinutes, parse } from 'date-fns';
import { JobType, WorkLog } from '../types';

export interface MonthlyJobStat {
  job: JobType;
  totalMinutes?: number;    // 計時型：分鐘加總（顯示時再 Math.ceil 為小時）
  totalQuantity?: number;   // 計件/固定型：件數加總
  totalAmount: number;
}

export interface MonthlyReportData {
  stats: MonthlyJobStat[];
  grandTotal: number;
}

export function computeMonthlyReport(
  logs: WorkLog[],
  jobs: JobType[],
  year: number,
  month: number // 1-based (1=January)
): MonthlyReportData {
  const jobMap = new Map(jobs.map(j => [j.id, j]));
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const monthLogs = logs.filter(l => l.date.startsWith(prefix));

  const statMap = new Map<string, MonthlyJobStat>();

  for (const log of monthLogs) {
    const job = jobMap.get(log.jobId);
    if (!job) continue; // 已刪除的工作項目略過

    if (!statMap.has(job.id)) {
      statMap.set(job.id, {
        job,
        totalMinutes: job.calcType === 'HOURLY' ? 0 : undefined,
        totalQuantity: job.calcType !== 'HOURLY' ? 0 : undefined,
        totalAmount: 0,
      });
    }

    const stat = statMap.get(job.id)!;
    stat.totalAmount += log.amount;

    if (job.calcType === 'HOURLY') {
      if (log.startTime && log.endTime) {
        const start = parse(log.startTime, 'HH:mm', new Date(0));
        const end = parse(log.endTime, 'HH:mm', new Date(0));
        stat.totalMinutes = (stat.totalMinutes ?? 0) + differenceInMinutes(end, start);
      }
    } else {
      stat.totalQuantity = (stat.totalQuantity ?? 0) + (log.quantity ?? 0);
    }
  }

  const stats = Array.from(statMap.values());
  const grandTotal = stats.reduce((sum, s) => sum + s.totalAmount, 0);

  return { stats, grandTotal };
}
```

- [ ] **Step 1.2：建立測試檔（確認失敗）**

```typescript
// tests/client/monthly-report.test.ts
import { describe, it, expect } from 'vitest';
import { computeMonthlyReport } from '../../src/utils/monthly';
import { JobType, WorkLog } from '../../src/types';

const hourlyJob: JobType = { id: 'j1', name: '早班', calcType: 'HOURLY', unitPrice: 120, color: '#ff0000' };
const pieceJob: JobType  = { id: 'j2', name: '計件', calcType: 'PIECE',  unitPrice: 10,  color: '#00ff00' };
const fixedJob: JobType  = { id: 'j3', name: '固定', calcType: 'FIXED',  unitPrice: 500, color: '#0000ff' };

const makeLog = (overrides: Partial<WorkLog> & Pick<WorkLog, 'id' | 'jobId' | 'date' | 'amount'>): WorkLog => ({
  unitPriceAtTime: 120,
  ...overrides,
});

describe('computeMonthlyReport', () => {
  it('空月份回傳空 stats 與 grandTotal 0', () => {
    const result = computeMonthlyReport([], [hourlyJob], 2026, 5);
    expect(result).toEqual({ stats: [], grandTotal: 0 });
  });

  it('計時型：多筆 log 加總分鐘，工資加總', () => {
    const logs = [
      makeLog({ id: 'l1', jobId: 'j1', date: '2026-05-01', startTime: '09:00', endTime: '11:00', amount: 240 }),
      makeLog({ id: 'l2', jobId: 'j1', date: '2026-05-03', startTime: '09:00', endTime: '10:30', amount: 180 }),
    ];
    const result = computeMonthlyReport(logs, [hourlyJob], 2026, 5);
    expect(result.stats).toHaveLength(1);
    expect(result.stats[0].totalMinutes).toBe(210); // 120 + 90
    expect(result.stats[0].totalAmount).toBe(420);
    expect(result.grandTotal).toBe(420);
  });

  it('計件型：多筆 log 加總件數與工資', () => {
    const logs = [
      makeLog({ id: 'l3', jobId: 'j2', date: '2026-05-01', quantity: 50, amount: 500 }),
      makeLog({ id: 'l4', jobId: 'j2', date: '2026-05-02', quantity: 30, amount: 300 }),
    ];
    const result = computeMonthlyReport(logs, [pieceJob], 2026, 5);
    expect(result.stats[0].totalQuantity).toBe(80);
    expect(result.stats[0].totalAmount).toBe(800);
  });

  it('跨月 log 只計入正確月份', () => {
    const logs = [
      makeLog({ id: 'l5', jobId: 'j1', date: '2026-04-30', startTime: '09:00', endTime: '10:00', amount: 120 }),
      makeLog({ id: 'l6', jobId: 'j1', date: '2026-05-01', startTime: '09:00', endTime: '10:00', amount: 120 }),
    ];
    const mayResult = computeMonthlyReport(logs, [hourlyJob], 2026, 5);
    expect(mayResult.stats[0].totalMinutes).toBe(60);
    expect(mayResult.grandTotal).toBe(120);

    const aprResult = computeMonthlyReport(logs, [hourlyJob], 2026, 4);
    expect(aprResult.stats[0].totalMinutes).toBe(60);
  });

  it('已刪除工作項目（jobId 不存在）被略過', () => {
    const logs = [
      makeLog({ id: 'l7', jobId: 'deleted', date: '2026-05-01', amount: 999 }),
      makeLog({ id: 'l8', jobId: 'j2', date: '2026-05-01', quantity: 10, amount: 100 }),
    ];
    const result = computeMonthlyReport(logs, [pieceJob], 2026, 5);
    expect(result.stats).toHaveLength(1);
    expect(result.grandTotal).toBe(100);
  });

  it('多工作項目各自加總，grandTotal 為全部工資總和', () => {
    const logs = [
      makeLog({ id: 'l9',  jobId: 'j1', date: '2026-05-01', startTime: '09:00', endTime: '10:00', amount: 120 }),
      makeLog({ id: 'l10', jobId: 'j2', date: '2026-05-01', quantity: 10, amount: 100 }),
      makeLog({ id: 'l11', jobId: 'j3', date: '2026-05-01', quantity: 1,  amount: 500 }),
    ];
    const result = computeMonthlyReport(logs, [hourlyJob, pieceJob, fixedJob], 2026, 5);
    expect(result.stats).toHaveLength(3);
    expect(result.grandTotal).toBe(720);
  });

  it('計時型 log 缺少 startTime/endTime 時，時數不計但工資仍計入', () => {
    const logs = [
      makeLog({ id: 'l12', jobId: 'j1', date: '2026-05-01', amount: 120 }),
    ];
    const result = computeMonthlyReport(logs, [hourlyJob], 2026, 5);
    expect(result.stats[0].totalMinutes).toBe(0);
    expect(result.stats[0].totalAmount).toBe(120);
  });
});
```

- [ ] **Step 1.3：執行測試確認失敗**

```
npm run test:client -- --reporter=verbose tests/client/monthly-report.test.ts
```

預期：`Cannot find module '../../src/utils/monthly'` 或全部 FAIL

- [ ] **Step 1.4：建立 `src/utils/monthly.ts`（照 Step 1.1 內容）**

建立該檔案，貼入 Step 1.1 的完整程式碼。

- [ ] **Step 1.5：執行測試確認全部通過**

```
npm run test:client -- --reporter=verbose tests/client/monthly-report.test.ts
```

預期：7 個測試全部 PASS

- [ ] **Step 1.6：Commit**

```bash
git add src/utils/monthly.ts tests/client/monthly-report.test.ts
git commit -m "feat: add computeMonthlyReport utility with tests"
```

---

## Task 2：MonthlyReport 元件

**Files:**
- Create: `src/components/MonthlyReport.tsx`

- [ ] **Step 2.1：建立 `src/components/MonthlyReport.tsx`**

```tsx
// src/components/MonthlyReport.tsx
import React, { useState, useMemo } from 'react';
import { JobType, WorkLog } from '../types';
import { computeMonthlyReport } from '../utils/monthly';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { addMonths, subMonths, addYears, subYears, format, getYear, getMonth } from 'date-fns';

interface MonthlyReportProps {
  logs: WorkLog[];
  jobs: JobType[];
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ logs, jobs }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = getYear(selectedMonth);
  const month = getMonth(selectedMonth) + 1; // date-fns getMonth is 0-based

  const report = useMemo(
    () => computeMonthlyReport(logs, jobs, year, month),
    [logs, jobs, year, month]
  );

  // Year options: current year ± 2
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(new Date(Number(e.target.value), month - 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(new Date(year, Number(e.target.value) - 1, 1));
  };

  const selectClass = "text-xs font-bold bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400";

  return (
    <div className="space-y-8">
      {/* Title + Nav */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">薪資月報表</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">依實際工作日期統計，跨月週自動分開計算</p>
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3">
          {/* Arrow nav */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button onClick={() => setSelectedMonth(prev => subYears(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="上一年">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setSelectedMonth(prev => subMonths(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="上一月">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black px-2 text-slate-700 min-w-[80px] text-center">
              {format(selectedMonth, 'yyyy/MM')}
            </span>
            <button onClick={() => setSelectedMonth(prev => addMonths(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="下一月">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setSelectedMonth(prev => addYears(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="下一年">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dropdowns */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <select value={year} onChange={handleYearChange} className={selectClass}>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>
            <select value={month} onChange={handleMonthChange} className={selectClass}>
              {monthOptions.map(m => (
                <option key={m} value={m}>{m} 月</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {report.stats.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
          <p className="text-slate-400 font-bold text-lg">本月尚無工作記錄</p>
          <p className="text-slate-300 text-sm mt-2">切換月份或前往週報新增記錄</p>
        </div>
      ) : (
        <>
          {/* Stats Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-black text-slate-500 uppercase tracking-wider px-6 py-4">工作項目</th>
                  <th className="text-right text-xs font-black text-slate-500 uppercase tracking-wider px-6 py-4">時數 / 件數</th>
                  <th className="text-right text-xs font-black text-slate-500 uppercase tracking-wider px-6 py-4">工資</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.stats.map(({ job, totalMinutes, totalQuantity, totalAmount }) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }} />
                        <span className="font-bold text-slate-800">{job.name}</span>
                        <span className="text-xs text-slate-400 font-medium">
                          {job.calcType === 'HOURLY' ? '計時' : job.calcType === 'PIECE' ? '計件' : '固定'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {job.calcType === 'HOURLY'
                        ? `${Math.ceil((totalMinutes ?? 0) / 60)} 小時`
                        : job.calcType === 'PIECE'
                          ? `${totalQuantity ?? 0} 件`
                          : `${totalQuantity ?? 0} 次`
                      }
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      ${totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-emerald-100/50 border border-emerald-100 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{year} 年 {month} 月</p>
                <p className="text-lg font-black text-slate-700 mt-1">當月總工資</p>
              </div>
              <p className="text-4xl font-black text-emerald-600">${report.grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2.2：Commit**

```bash
git add src/components/MonthlyReport.tsx
git commit -m "feat: add MonthlyReport component"
```

---

## Task 3：App.tsx 整合（分頁標籤 + 條件渲染）

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 3.1：在 App.tsx 新增 `view` state 與 import**

在 `src/App.tsx` 找到以下 import 區塊：

```tsx
import { WeeklySheet } from './components/WeeklySheet';
import { LogModal } from './components/LogModal';
import { ReportModal } from './components/ReportModal';
import { JobManagementModal } from './components/JobManagementModal';
```

改為：

```tsx
import { WeeklySheet } from './components/WeeklySheet';
import { MonthlyReport } from './components/MonthlyReport';
import { LogModal } from './components/LogModal';
import { ReportModal } from './components/ReportModal';
import { JobManagementModal } from './components/JobManagementModal';
```

- [ ] **Step 3.2：新增 `view` state**

在 `src/App.tsx` 找到：

```tsx
  const [jobManagementOpen, setJobManagementOpen] = useState(false);
```

改為：

```tsx
  const [jobManagementOpen, setJobManagementOpen] = useState(false);
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
```

- [ ] **Step 3.3：在 header 加入分頁標籤**

在 `src/App.tsx` 找到：

```tsx
          <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight text-slate-900">個人工資管理系統</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Salary Tracker</p>
            </div>
```

改為：

```tsx
          <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight text-slate-900">個人工資管理系統</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Salary Tracker</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setView('weekly')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${view === 'weekly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                週報
              </button>
              <button
                onClick={() => setView('monthly')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${view === 'monthly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                月報
              </button>
            </div>
```

- [ ] **Step 3.4：「回到本週」按鈕只在 weekly view 顯示**

在 `src/App.tsx` 找到：

```tsx
            {!isCurrentWeek && (
              <button 
                onClick={jumpToToday}
```

改為：

```tsx
            {view === 'weekly' && !isCurrentWeek && (
              <button 
                onClick={jumpToToday}
```

- [ ] **Step 3.5：條件渲染月報/週報**

在 `src/App.tsx` 找到：

```tsx
          <WeeklySheet 
            logs={logs} 
            jobs={jobs} 
            currentDate={currentDate} 
            weeklyPrices={currentWeekPrices}
            onUpdateWeeklyPrice={handleUpdateWeeklyPrice}
            onCellClick={(job, date, log) => setLogModal({ isOpen: true, job, date, log })}
            onGenerateReport={(text) => setReportModal({ isOpen: true, text })}
          />
```

改為：

```tsx
          {view === 'weekly' ? (
            <WeeklySheet 
              logs={logs} 
              jobs={jobs} 
              currentDate={currentDate} 
              weeklyPrices={currentWeekPrices}
              onUpdateWeeklyPrice={handleUpdateWeeklyPrice}
              onCellClick={(job, date, log) => setLogModal({ isOpen: true, job, date, log })}
              onGenerateReport={(text) => setReportModal({ isOpen: true, text })}
            />
          ) : (
            <MonthlyReport logs={logs} jobs={jobs} />
          )}
```

- [ ] **Step 3.6：週報週份導覽只在 weekly view 顯示**

找到 `src/App.tsx` 中的以下標題區塊（控制週報標題顯示），確認只在 `view === 'weekly'` 時渲染週份導覽按鈕群及週報標題文字。

找到：

```tsx
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">薪資週報表</h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">點擊儲存格即可新增或編輯工作紀錄，單價欄位可手動調整本週工資</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3">
```

將整個此 `div`（包含標題、年/月/週導覽按鈕群）用 `{view === 'weekly' && (...)}` 包起來。注意整個區塊在 `</div>` 結束於週導覽容器的最後一個 `</div>`，結構如下：

```tsx
          {view === 'weekly' && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">薪資週報表</h2>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">點擊儲存格即可新增或編輯工作紀錄，單價欄位可手動調整本週工資</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3">
                {/* ... 年月週導覽按鈕，保持原有內容不動 ... */}
              </div>
            </div>
          )}
```

- [ ] **Step 3.7：執行 lint 確認型別正確**

```
npm run lint
```

預期：無錯誤

- [ ] **Step 3.8：Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate MonthlyReport into App with tab navigation"
```

---

## Task 4：整合測試與驗證

**Files:**
- Run: `npm run test:client`

- [ ] **Step 4.1：執行全部 client 測試**

```
npm run test:client -- --reporter=verbose
```

預期：所有測試 PASS，包含新增的 `monthly-report.test.ts` 7 個測試

- [ ] **Step 4.2：手動驗證（開發伺服器）**

```
npm run dev
```

確認以下項目：
1. Header 出現「週報」「月報」分頁標籤，點擊可切換
2. 月報頁面顯示當月統計表格，工資合計正確
3. 箭頭切換月份，下拉選單可快速跳月份
4. 切換到無資料月份，顯示「本月尚無工作記錄」提示
5. 週報功能完全不受影響

- [ ] **Step 4.3：最終 commit**

```bash
git add -A
git commit -m "feat: monthly report - complete implementation"
```

---

## 自我審查

- [x] 規格所有需求均有對應 Task（頁面切換→Task3、月份導覽→Task2、工作項目統計→Task2、跨月處理→Task1計算函數、空月份→Task2 UI）
- [x] 無 TBD / TODO 佔位符
- [x] 型別命名一致：`MonthlyJobStat`、`MonthlyReportData`、`computeMonthlyReport` 在 Task 1 定義，Task 2/3 使用
- [x] `getMonth()` 0-based 已在 Task 2 Step 2.1 轉換為 1-based（`getMonth(selectedMonth) + 1`）
- [x] 時數顯示 `Math.ceil((totalMinutes ?? 0) / 60)` 無條件進位
