# Tasks

## 1. 資料彙總

- [x] 1.1 在 `src/utils/monthly.ts` 新增 `computeDailyBreakdown`（補齊整月、依 job 拆分、排除已刪除 job），並在 `tests/client/monthly-report.test.ts` 加測試驗證堆疊金額與補 0
- [x] 1.2 確認 `computeDailyBreakdown` 的每日 total 可直接供每日折線使用（不累積），測試補 0 日值
- [x] 1.3 新增 `computeMonthlyTrend`（以選擇月份為終點、跨年、無紀錄補 0），測試 2026-03 回傳 2025-10 至 2026-03

## 2. 圖表元件

- [x] 2.1 建立每日收入折線圖元件（固定顏色、不分工作、稀疏 X 軸刻度、NT$ tooltip），在瀏覽器中確認顯示正確
- [x] 2.2 建立各項工作當月累積圓餅圖元件（窄螢幕改內標 % 加圖例）（重用 `computeMonthlyReport`），在瀏覽器中確認數值與明細表一致
- [x] 2.3 建立近 6 個月趨勢圖元件，當前月有強調樣式，確認跨年顯示正確
- [x] 2.4 三張圖加上數值標籤（0 不顯示、窄螢幕直書），以桌機與 390px 寬截圖確認不重疊

## 3. Tab 與月報整合

- [x] 3.1 建立 `MonthlyCharts` tab 容器（tablist ARIA、方向鍵切換、預設「每日收入」），加元件測試驗證預設與切換
- [x] 3.2 在 `MonthlyReport` 總工資區塊與明細表間插入圖表區，僅在有紀錄時顯示；加測試驗證空月份不顯示 tab、切換月份保留 tab
- [x] 3.3 確認 `exportMonthToExcel` 未改動且 `tests/client/export.test.ts` 通過

## 4. 整合驗證

- [x] 4.1 執行 `npm run test:client` 全部通過，並以 demo 資料在桌機與手機寬度檢視三個 tab
