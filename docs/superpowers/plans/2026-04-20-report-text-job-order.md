# 當日回報文字依表格順序排列 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 當日回報文字的工作項目敘述，依照表格（`jobs` 陣列）的順序排列，而非依資料庫回傳的 log 順序。

**Architecture:** `WeeklySheet.tsx` 中的 `generateReportText` 目前用 `dayLogs.forEach` 迭代（順序依 `logs` prop 的陣列順序）；改為先走 `jobs` 陣列、再查對應 log，即可與表格列順序一致。不需新增任何檔案或工具。

**Tech Stack:** React (TypeScript)、Vitest、date-fns

---

## 檔案對應

| 動作 | 路徑 |
|------|------|
| Modify | `src/components/WeeklySheet.tsx`（`generateReportText` 函式，第 54–74 行） |
| Test | `tests/client/weekly-sheet-contrast.test.tsx`（加入新 describe block） |

---

### Task 1: 新增失敗測試 — 回報文字須依 jobs 順序

**Files:**
- Modify: `tests/client/weekly-sheet-contrast.test.tsx`

- [ ] **Step 1: 在現有測試檔末尾加入新 describe block**

在 `tests/client/weekly-sheet-contrast.test.tsx` 的最後一個 `});`（整個 describe 的結尾）**前面**，插入以下 describe（注意放在外層 describe 結尾之前）：

```tsx
// 放在最外層 describe 的最後，緊接在最後一個 it() 之後
describe('generateReportText - 依 jobs 順序輸出', () => {
  it('回報文字的行序應與 jobs 陣列順序一致，而非 logs 順序', async () => {
    const { render, screen, fireEvent } = await import('@testing-library/react');
    const { WeeklySheet } = await import('../../src/components/WeeklySheet');

    const jobs: JobType[] = [
      { id: 'j-a', name: '工作A', calcType: 'PIECE', unitPrice: 10, color: '#aaa' },
      { id: 'j-b', name: '工作B', calcType: 'PIECE', unitPrice: 20, color: '#bbb' },
    ];

    // logs 順序刻意與 jobs 顛倒：j-b 先，j-a 後
    const logs: WorkLog[] = [
      { id: 'l2', jobId: 'j-b', date: '2026-04-20', quantity: 3, amount: 60, unitPriceAtTime: 20 },
      { id: 'l1', jobId: 'j-a', date: '2026-04-20', quantity: 5, amount: 50, unitPriceAtTime: 10 },
    ];

    const weeklyPrices: Record<string, number> = { 'j-a': 10, 'j-b': 20 };
    const capturedText: string[] = [];

    render(
      <WeeklySheet
        logs={logs}
        jobs={jobs}
        currentDate={new Date('2026-04-20')}
        weeklyPrices={weeklyPrices}
        onUpdateWeeklyPrice={vi.fn()}
        onCellClick={vi.fn()}
        onGenerateReport={(text) => capturedText.push(text)}
      />
    );

    // 找到 04/20 當天的回報按鈕並點擊
    const reportButtons = screen.getAllByRole('button');
    const reportButton = reportButtons.find(btn => btn.querySelector('svg'));
    fireEvent.click(reportButton!);

    expect(capturedText).toHaveLength(1);
    const lines = capturedText[0].split('\n');
    // 第一行是日期
    expect(lines[0]).toBe('04/20');
    // 第二行應是 jobs[0]（工作A），不是 logs 裡先出現的工作B
    expect(lines[1]).toMatch(/^工作A/);
    // 第三行應是 jobs[1]（工作B）
    expect(lines[2]).toMatch(/^工作B/);
  });
});
```

- [ ] **Step 2: 確認測試失敗**

```powershell
npx vitest run tests/client/weekly-sheet-contrast.test.tsx
```

預期輸出包含：
```
FAIL  tests/client/weekly-sheet-contrast.test.tsx
 × 回報文字的行序應與 jobs 陣列順序一致，而非 logs 順序
```

（失敗原因：目前 lines[1] 是「工作B」，因為 logs 陣列 j-b 排在前）

- [ ] **Step 3: Commit 失敗測試**

```powershell
git add tests/client/weekly-sheet-contrast.test.tsx
git commit -m "test: 驗證當日回報文字依 jobs 順序排列（目前失敗）"
```

---

### Task 2: 修正 `generateReportText` 改為依 jobs 順序迭代

**Files:**
- Modify: `src/components/WeeklySheet.tsx`

- [ ] **Step 1: 找到並修改 `generateReportText`**

目前程式碼（`src/components/WeeklySheet.tsx`，`generateReportText` 函式）：

```typescript
const generateReportText = (dateStr: string) => {
    const dayLogs = logs.filter(l => l.date === dateStr);
    if (dayLogs.length === 0) return;

    const formattedDate = format(new Date(dateStr), 'MM/dd');
    let report = `${formattedDate}\n`;
    
    const amounts: number[] = [];
    dayLogs.forEach(log => {
      const job = jobs.find(j => j.id === log.jobId);
      if (!job) return;

      const currentPrice = weeklyPrices[job.id];
      let detail = '';
      if (job.calcType === 'HOURLY') {
        detail = `${log.startTime}-${log.endTime}`;
      } else {
        detail = `${currentPrice}*${log.quantity}`;
      }
      
      report += `${job.name} ${detail} ${log.amount}\n`;
      amounts.push(log.amount);
    });

    if (amounts.length > 1) {
      const sumStr = amounts.join('+');
      const total = amounts.reduce((a, b) => a + b, 0);
      report += `${sumStr}=${total}`;
    }

    onGenerateReport(report);
  };
```

將其**完整替換**為：

```typescript
const generateReportText = (dateStr: string) => {
    const dayLogMap = new Map(
      logs.filter(l => l.date === dateStr).map(l => [l.jobId, l])
    );
    if (dayLogMap.size === 0) return;

    const formattedDate = format(new Date(dateStr), 'MM/dd');
    let report = `${formattedDate}\n`;

    const amounts: number[] = [];
    jobs.forEach(job => {
      const log = dayLogMap.get(job.id);
      if (!log) return;

      const currentPrice = weeklyPrices[job.id];
      let detail = '';
      if (job.calcType === 'HOURLY') {
        detail = `${log.startTime}-${log.endTime}`;
      } else {
        detail = `${currentPrice}*${log.quantity}`;
      }

      report += `${job.name} ${detail} ${log.amount}\n`;
      amounts.push(log.amount);
    });

    if (amounts.length > 1) {
      const sumStr = amounts.join('+');
      const total = amounts.reduce((a, b) => a + b, 0);
      report += `${sumStr}=${total}`;
    }

    onGenerateReport(report);
  };
```

**重點差異：**
- 原本：`dayLogs.forEach(log => { const job = jobs.find(...) })` → 順序由 `logs` 決定
- 修正後：先建 `dayLogMap`（jobId → log），再 `jobs.forEach(job => { const log = dayLogMap.get(...) })` → 順序由 `jobs` 決定

- [ ] **Step 2: 執行測試，確認新測試通過且既有測試不受影響**

```powershell
npx vitest run tests/client/weekly-sheet-contrast.test.tsx
```

預期輸出：
```
PASS  tests/client/weekly-sheet-contrast.test.tsx
 ✓ WeeklySheet Contrast - Width and Contrast Hooks > renders WeeklySheet component ...
 ✓ generateReportText - 依 jobs 順序輸出 > 回報文字的行序應與 jobs 陣列順序一致，而非 logs 順序
```

- [ ] **Step 3: 執行全部前端測試確認無回歸**

```powershell
npx vitest run tests/client
```

預期：所有 client 測試通過，無失敗。

- [ ] **Step 4: Commit**

```powershell
git add src/components/WeeklySheet.tsx
git commit -m "fix: 當日回報文字依表格（jobs）順序排列"
```

---

## 自我審查

**Spec 覆蓋：**
- ✅ 回報文字順序依 `jobs` 陣列（表格列順序）→ Task 2 修正
- ✅ TDD：先有失敗測試（Task 1）→ 再有實作（Task 2）

**無 placeholder：** 每個步驟均含完整程式碼與指令。

**型別一致性：** `WorkLog`、`JobType` 均沿用 `src/types.ts` 既有定義，未引入新型別。
