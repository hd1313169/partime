# Design

## Context

見 proposal.md。`MonthlyReport` 透過 `computeMonthlyReport(logs, jobs, year, month)` 取得各工作項目加總，所有 logs 已在前端，`date` 為 `yyyy-MM-dd` 字串。`recharts` 已在相依中。

## Goals / Non-Goals

**Goals:**
- 資料彙總為純函式，可單元測試。
- 圖表使用固定配色 `--color-accent`（近 6 個月的非當前月為 `--color-line-strong`），不使用 `job.color`：多份工作同日堆疊會讓單日總額難以閱讀。

**Non-Goals:**
- 依工作項目堆疊、累積曲線、上月同期比較線、時薪比較、熱力圖。
- tab 狀態持久化（localStorage）。
- 匯出圖表。

## Decisions

- **彙總函式放在 `src/utils/monthly.ts`**：新增 `computeDailyBreakdown(logs, jobs, year, month)` 回傳每日 `{ day, total, byJob: Record<jobId, amount> }`（補齊整月），每日收入折線只取 `total`；「各項工作」直接重用 `computeMonthlyReport().stats`，確保與明細表一致；新增 `computeMonthlyTrend(logs, jobs, year, month, span = 6)` 回傳 `{ year, month, total }[]`。沿用 `computeMonthlyReport` 排除已刪除工作項目的規則，確保總額一致。替代方案：在元件內 `useMemo` 計算 — 不易測試，捨棄。
- **元件拆分**：`MonthlyCharts.tsx` 負責 tab 與切換，三張圖各為小元件。tab 狀態放在 `MonthlyReport`（或 `MonthlyCharts` 且不隨月份 remount），確保切月保留。
- **Tab 樣式**：使用 `role="tablist"`/`role="tab"`/`aria-selected`，鍵盤左右鍵切換，樣式依現有按鈕/segment 風格。
- **圖表**：recharts `LineChart`（每日收入）、`PieChart` 環圈圖（各項工作；桌機外側標籤「名稱 金額（%）」，窄螢幕切片內標 %、下方圖例列名稱與金額；固定 8 色調色盤依序循環）、`BarChart`（近 6 個月，強調當前月的 Cell）。`ResponsiveContainer` 固定高度約 240px。
- **數值標籤**：`LabelList` 顯示精簡金額（如 `1.2k`），0 不顯示。寬度 < 640px 時每日收入折線改用直書標籤（自訂 content、rotate -90）並加大上邊距，避免 30 個標籤重疊。X 軸每日圖只標 1、5、10、15、20、25、月底。Tooltip 顯示 NT$ 千分位。
- **字串月份前綴比對**：沿用 `startsWith('yyyy-MM')`，避免時區問題。

## Risks / Trade-offs

- [手機上 30 個資料點標籤擁擠；工作數多時圓餅小切片標籤可能擁擠；圓餅配色與明細表圓點顏色不同（使用者要求固定配色）] → 固定稀疏刻度、直書標籤；不做橫向捲動。
- [recharts 在 jsdom 測試中 `ResponsiveContainer` 寬度為 0] → 元件測試只驗證 tab 行為與存在性，數值正確性由純函式單元測試覆蓋。
- [bundle 體積增加] → recharts 已是相依，影響有限。
