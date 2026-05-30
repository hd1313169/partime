# Excel 匯出功能設計

**日期：** 2026-05-30  
**狀態：** 已核准

## 概覽

在月報表頁面新增一鍵匯出功能，將所選月份的每日工作明細下載為 `.xlsx` 檔案，作為資料備份用途。

## 技術選型

- **函式庫：** SheetJS（`xlsx`）純前端實作，不依賴後端
- **觸發點：** `MonthlyReport` 元件內月份選擇器旁的「匯出 Excel」按鈕
- **不影響：** App.tsx、所有 API routes、server / worker 相關程式碼

## 資料流

1. 使用者在 `MonthlyReport` 選好月份後，點擊「匯出 Excel」按鈕
2. 呼叫純函式 `exportMonthToExcel(logs, jobs, year, month)`（位於 `src/utils/export.ts`）
3. 函式篩選該月 logs → 組成二維陣列 → 建立 SheetJS workbook → 觸發瀏覽器下載
4. 下載檔名：`partime-YYYY-MM.xlsx`

`MonthlyReport` 已收到 `logs`、`jobs`，月份由元件內部 state 管理，不需改動上層元件。

## Excel 結構

### Sheet 命名

`YYYY年MM月`，例如 `2026年05月`。

### 欄位配置

| 日期 | 星期 | [Job1 名稱] | [Job2 名稱] | … | 當日合計 |
|------|------|-------------|-------------|---|----------|

工作項目欄位順序與 `jobs` 陣列順序一致。

### 每日資料列

- **計時型（HOURLY）：** 顯示小時數（`Math.ceil(分鐘 / 60)`），格式為 `3h`
- **計件／固定型（PIECE / FIXED）：** 顯示件數，格式為 `5件`
- **當天無記錄：** 顯示 `-`
- **當日合計：** 顯示該日所有工作的工資加總，格式為 `NT$1,400`

### 週合計列

每週日（或月底最後一天）之後插入一列：
- 第一欄顯示 `▸ 週合計`
- 各工作欄顯示該週同欄的加總（計時顯示小時數、計件顯示件數）
- 最後欄顯示該週工資合計

### 月合計列

檔案最底部插入一列：
- 第一欄顯示 `▸ 月合計`
- 各工作欄顯示全月加總
- 最後欄顯示全月工資合計

### 範例

```
日期    星期  搬運   包裝   當日合計
05/01  五    3h    10件   NT$1,400
05/02  六    -     5件    NT$350
05/03  日    2h    -      NT$600
▸ 週合計    5h    15件   NT$2,350
05/04  一    4h    8件    NT$1,200
...
▸ 月合計    42h   120件  NT$18,500
```

## 異動檔案

### 新增

| 檔案 | 說明 |
|------|------|
| `src/utils/export.ts` | 純函式 `exportMonthToExcel(logs, jobs, year, month): void`，不含 React 依賴 |
| `tests/client/export.test.ts` | 單元測試，驗證二維陣列組裝邏輯（不測實際下載） |

### 修改

| 檔案 | 說明 |
|------|------|
| `src/components/MonthlyReport.tsx` | 在月份選擇器區塊右側新增 `Download` 圖示按鈕，點擊呼叫 `exportMonthToExcel` |
| `package.json` | 新增 `xlsx` 依賴 |

## 錯誤處理

- **當月無 log：** 正常產生檔案，只有欄位 header，無資料列，不擋 UI
- **loading 狀態：** 不需要（同步操作，毫秒內完成）

## 測試範圍

`tests/client/export.test.ts` 驗證以下情境：
1. 一般月份：有多個 job、跨週，欄位順序、週合計列、月合計列皆正確
2. 計時型 job 的小時數計算（Math.ceil）
3. 當月無 log：只有 header 列，無資料列
4. 跨週邊界：確認週合計列插入位置正確（週日後或月底最後一天後）
