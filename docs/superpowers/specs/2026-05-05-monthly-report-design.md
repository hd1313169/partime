# 月報功能設計規格

**日期：** 2026-05-05  
**狀態：** 已核准

---

## 概述

在現有個人工資管理系統中新增「月報」頁面，統計每個月各工作項目的時數（或件數）與工資，以及當月總工資。月報與現有週報共用同一份資料，以純前端聚合計算實作，不需要後端變動。

---

## 架構

### View 切換

在 `App.tsx` 新增 `view` state（`'weekly' | 'monthly'`），頂部 header 加入分頁標籤切換兩個 view。兩個 view 共用同一份 `logs`、`jobs`、`weeklyPrices` bootstrap 資料。

```
App (view: 'weekly' | 'monthly')
├── header：分頁標籤「週報 | 月報」
├── view === 'weekly' → <WeeklySheet>（現有，不動）
└── view === 'monthly' → <MonthlyReport>（新增）
```

### 新增檔案

| 檔案 | 用途 |
|------|------|
| `src/components/MonthlyReport.tsx` | 月報 UI 元件 |
| `src/utils/monthly.ts` | 純計算函數（可獨立測試） |
| `tests/client/monthly-report.test.ts` | 計算邏輯單元測試 |

### 修改檔案

| 檔案 | 修改內容 |
|------|---------|
| `src/App.tsx` | 新增 `view` state、header 分頁標籤、條件渲染 `<MonthlyReport>` |

---

## 資料流

`MonthlyReport` 元件接收：
- `logs: WorkLog[]`（全部，從 App state 傳入）
- `jobs: JobType[]`

元件內部維護 `selectedMonth: Date` state，初始值為當月。

計算函數 `computeMonthlyReport(logs, jobs, year, month)` 回傳：

```ts
interface MonthlyJobStat {
  job: JobType;
  totalHours?: number;   // 計時型：分鐘加總後無條件進位到整小時
  totalQuantity?: number; // 計件/固定型：件數加總
  totalAmount: number;   // 工資加總
}

interface MonthlyReport {
  stats: MonthlyJobStat[]; // 只包含有記錄的工作項目
  grandTotal: number;
}
```

### 跨月處理

完全依 `log.date`（ISO 日期字串）的年/月比對，與「當週是否跨月」無關。例如跨月週 4/28–5/4，4/28–4/30 的 log 自動歸入 4 月，5/1–5/4 的 log 自動歸入 5 月。

### 時數計算

計時型工作的時數：將該月所有 log 的分鐘數（`endTime - startTime`）加總後，以 `Math.ceil` 無條件進位到整小時，與現有 `salary.ts` 邏輯一致。

---

## UI 規格

### Header 分頁標籤

在現有 header 左側 logo 旁新增分頁標籤群：

- 未選中：`bg-white border border-slate-200 text-slate-600 rounded-xl`
- 選中：`bg-emerald-600 text-white rounded-xl`

```
[💰 個人工資管理系統]  [週報] [月報]        [回到本週*] [工作項目管理]
```

*「回到本週」按鈕只在週報 view 且非本週時顯示。

### `MonthlyReport` 元件

**月份導覽（頂部）**

```
[<<年] [<月]   2026年 5月   [月>] [年>>]    [2026 ▾] [5月 ▾]
```

左側箭頭組：逐年/逐月切換。右側下拉選單：年份（近 5 年）和月份（1–12 月）快速跳轉。

**工作項目統計表格（中央）**

| 工作項目 | 時數 / 件數 | 工資 |
|---------|-----------|------|
| 工作A（計時）| 48 小時 | $12,000 |
| 工作B（計件）| 320 件  | $9,600  |
| 工作C（固定）| 5 次    | $2,500  |

- 計時型：顯示「X 小時」
- 計件型：顯示「X 件」
- 固定型：顯示「X 次」
- 無記錄的工作項目不顯示

**當月總工資卡片（底部）**

樣式沿用現有 `bg-white rounded-3xl shadow` 卡片風格，總工資以 `text-4xl font-black text-emerald-600` 顯示。

**空月份狀態**

若 `stats` 為空陣列，顯示「本月尚無工作記錄」置中提示，仍可切換月份。

---

## 邊界情況

| 情境 | 處理方式 |
|------|---------|
| 該月無任何記錄 | 顯示空白提示，可正常切換月份 |
| 跨月週 | 依 `log.date` 月份歸類，自動正確 |
| 已刪除工作項目（`jobId` 找不到對應 job）| 略過該筆 log，不顯示、不計入總額 |
| 計時型 log 缺少 startTime/endTime | 時數計為 0，工資仍依 `log.amount` 計入 |

---

## 測試

`tests/client/monthly-report.test.ts` 測試 `computeMonthlyReport` 純函數：

1. 同月多筆計時型 log 正確加總時數與工資
2. 同月多筆計件型 log 正確加總件數與工資
3. 跨月 log 只計入正確月份
4. 空月份回傳 `{ stats: [], grandTotal: 0 }`
5. `jobId` 不存在的 log 被略過
6. 計時型時數使用 `Math.ceil` 無條件進位

---

## 不在範圍內

- 月報文字匯出（現有「當日回報」功能已涵蓋每日）
- 後端 API 變動
- 月報資料的持久化快取
