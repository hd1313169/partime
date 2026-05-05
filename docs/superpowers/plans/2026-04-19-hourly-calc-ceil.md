# 時薪制計算改為無條件進位 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將時薪制（HOURLY）的薪資計算從四捨五入（`Math.round`）改為無條件進位（`Math.ceil`），確保工作者不因零頭分鐘被少算薪水。

**Architecture:** 邏輯集中在單一函式 `calculateLogAmount`（`src/utils/salary.ts`），只需一行變更。新增對應的 unit test 以驗證行為，並回歸跑整套 client 測試確保無破壞。

**Tech Stack:** TypeScript、Vitest、date-fns、jsdom（測試環境）

---

## 檔案對照

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/utils/salary.ts` | 修改 | 第 18 行 `Math.round` → `Math.ceil` |
| `tests/client/salary.test.ts` | 新增 | `calculateLogAmount` 的 unit tests（目前不存在） |

---

### Task 1：為 `calculateLogAmount` 補上失敗的測試

**Files:**
- Create: `tests/client/salary.test.ts`

- [ ] **Step 1：撰寫失敗的測試**

建立 `tests/client/salary.test.ts`，內容如下：

```typescript
import { describe, it, expect } from 'vitest';
import { calculateLogAmount } from '../../src/utils/salary';

const hourlyJob = { id: 'j1', name: '早班', calcType: 'HOURLY' as const, unitPrice: 120, color: '#ff0000' };
const pieceJob  = { id: 'j2', name: '計件', calcType: 'PIECE'  as const, unitPrice: 10,  color: '#00ff00' };
const fixedJob  = { id: 'j3', name: '固定', calcType: 'FIXED'  as const, unitPrice: 500, color: '#0000ff' };

describe('calculateLogAmount', () => {
  describe('HOURLY', () => {
    it('整點工時：120 元/時 × 1 小時 = 120', () => {
      expect(calculateLogAmount(hourlyJob, 120, '09:00', '10:00')).toBe(120);
    });

    it('30 分鐘：120 元/時 × 0.5 小時 = 60（整除，無進位）', () => {
      expect(calculateLogAmount(hourlyJob, 120, '09:00', '09:30')).toBe(60);
    });

    it('10 分鐘：150 元/時 → ceil(150 * 10/60) = ceil(25) = 25', () => {
      // 150 * 10 / 60 = 25.0 → ceil = 25
      expect(calculateLogAmount(hourlyJob, 150, '09:00', '09:10')).toBe(25);
    });

    it('20 分鐘：130 元/時 → ceil(130 * 20/60) = ceil(43.33) = 44（無條件進位）', () => {
      // Math.round(43.33) = 43，Math.ceil(43.33) = 44
      expect(calculateLogAmount(hourlyJob, 130, '09:00', '09:20')).toBe(44);
    });

    it('1 分鐘：120 元/時 → ceil(120 / 60) = ceil(2) = 2', () => {
      expect(calculateLogAmount(hourlyJob, 120, '09:00', '09:01')).toBe(2);
    });

    it('缺少 startTime 或 endTime 時回傳 0', () => {
      expect(calculateLogAmount(hourlyJob, 120, undefined, undefined)).toBe(0);
      expect(calculateLogAmount(hourlyJob, 120, '09:00', undefined)).toBe(0);
    });
  });

  describe('PIECE', () => {
    it('計件：10 元 × 5 件 = 50', () => {
      expect(calculateLogAmount(pieceJob, 10, undefined, undefined, 5)).toBe(50);
    });

    it('缺少數量時回傳 0', () => {
      expect(calculateLogAmount(pieceJob, 10, undefined, undefined, undefined)).toBe(0);
    });
  });

  describe('FIXED', () => {
    it('固定：500 × 1 = 500', () => {
      expect(calculateLogAmount(fixedJob, 500, undefined, undefined, 1)).toBe(500);
    });
  });
});
```

- [ ] **Step 2：跑測試，確認有失敗**

```
npm run test:client -- --reporter=verbose tests/client/salary.test.ts
```

預期：`FAIL`，`20 分鐘 130 元` 那個 case 應該失敗（目前是 `Math.round(43.33) = 43`，但斷言要 `44`）。

- [ ] **Step 3：提交失敗的測試**

```bash
git add tests/client/salary.test.ts
git commit -m "test: add calculateLogAmount unit tests (ceil expectation, currently failing)"
```

---

### Task 2：修改 `calculateLogAmount` 改用無條件進位

**Files:**
- Modify: `src/utils/salary.ts:18`

- [ ] **Step 1：修改實作**

開啟 `src/utils/salary.ts`，將第 18 行的 `Math.round` 改為 `Math.ceil`：

```typescript
// 修改前
return Math.round((diffMinutes / 60) * unitPrice);

// 修改後
return Math.ceil((diffMinutes / 60) * unitPrice);
```

完整函式修改後如下（供確認）：

```typescript
export function calculateLogAmount(
  job: JobType,
  unitPrice: number,
  startTime?: string,
  endTime?: string,
  quantity?: number
): number {
  if (job.calcType === 'HOURLY' && startTime && endTime) {
    const start = parse(startTime, 'HH:mm', new Date(0));
    const end = parse(endTime, 'HH:mm', new Date(0));

    const diffMinutes = differenceInMinutes(end, start);

    return Math.ceil((diffMinutes / 60) * unitPrice);
  }

  if ((job.calcType === 'PIECE' || job.calcType === 'FIXED') && quantity) {
    return quantity * unitPrice;
  }

  return 0;
}
```

- [ ] **Step 2：跑 salary 測試，確認全數通過**

```
npm run test:client -- --reporter=verbose tests/client/salary.test.ts
```

預期：所有 case `PASS`。

- [ ] **Step 3：跑完整 client 測試，確認無回歸**

```
npm run test:client
```

預期：全部 `PASS`，無新增失敗。

- [ ] **Step 4：提交實作**

```bash
git add src/utils/salary.ts
git commit -m "feat: change hourly salary rounding from Math.round to Math.ceil"
```

---

## Self-Review

### 1. Spec 覆蓋

| 需求 | 對應 Task |
|------|-----------|
| 時薪制改為無條件進位 | Task 2 Step 1 |
| 驗證有零頭分鐘時進位正確 | Task 1 Step 1（`20 分鐘 130 元` case） |
| PIECE / FIXED 不受影響 | Task 1 Step 1（PIECE / FIXED describe 區塊） |

### 2. Placeholder 掃描

無 TBD / TODO / 類似 Task N 等佔位符。所有步驟均包含完整程式碼。

### 3. 型別一致性

`calculateLogAmount` 的簽名在 Task 1（測試）與 Task 2（實作）完全一致，均使用 `JobType`、`unitPrice: number`、可選的 `startTime / endTime / quantity`。
