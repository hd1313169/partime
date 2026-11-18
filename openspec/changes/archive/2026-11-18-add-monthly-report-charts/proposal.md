# Proposal

## Why

月報目前只有總工資、佔比條與明細表，無法看出「哪幾天有收入」、「每天收入起伏」、「哪份工作賺最多」、「跟前幾個月比起來是多是少」。加入圖表讓使用者能快速回顧收入分佈與趨勢。

## What Changes

- 月報在總工資區塊與明細表之間新增圖表區，以 tab 切換三種圖表：
  - **每日收入**：當月每日總收入折線圖，單一固定顏色。
  - **各項工作**：當月各工作項目累積工資圓餅圖（金額與佔比）。
  - **近 6 個月**：以目前選擇的月份為終點，往回共 6 個月的月總工資趨勢。
- 圖表直接標示數值（0 不標示），配色固定，不跟隨工作項目顏色。
- 切換月份時保留目前選中的 tab（不持久化）。
- 當月無工作紀錄時維持現有空狀態，不顯示圖表區。
- Excel 匯出不變，不包含圖表。

## Capabilities

### New Capabilities
- `monthly-report-charts`: 月報中的圖表視覺化（每日收入、各項工作、跨月趨勢）與其切換行為。

### Modified Capabilities
（無）

## Impact

- `src/components/MonthlyReport.tsx`：加入圖表區與 tab。
- 新增圖表元件（`src/components/` 下）。
- `src/utils/monthly.ts`：新增每日彙總、跨月彙總的純函式。
- 使用既有相依 `recharts`，不新增套件。
- `exportMonthToExcel` 不變。
