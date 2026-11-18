# Proposal

## Why

UI 改版後手機版明顯退步：週報出現斷裂的孤立格線、單價輸入框與相鄰列重疊、iPhone 上新增紀錄的時間輸入框互相重疊、月報控制列超出螢幕（360px 寬時頁面寬 399px）。使用者主要在 iPhone（Chrome，WebKit 引擎）上使用，需優先修正。

## What Changes

- 週報手機列表：單價輸入框改為淺底小框，移除負邊距與底線，不再侵入相鄰列；列分隔線改為一致的實線。
- 新增紀錄視窗：時間輸入框可在窄螢幕縮小，不互相重疊。
- 手機上所有文字輸入框字體至少 16px，避免 iOS 聚焦時自動放大。
- 月報：手機上控制列拆為兩行，頁面不產生水平捲動。
- 月報明細表：手機上工作類型標籤移到名稱下方，名稱與合計金額不逐字換行。

## Capabilities

### New Capabilities
- `mobile-layout`: 手機寬度（320–639px）下各畫面的版面完整性：不溢出、不重疊、輸入不觸發縮放。

### Modified Capabilities
（無）

## Impact

- `src/components/WeeklySheet.tsx`（手機列表）
- `src/components/LogModal.tsx`
- `src/components/MonthlyReport.tsx`（控制列、明細表）
- `src/index.css`（`.price-input`、`.field` 手機字級）
- 桌機版（≥ 640px，週報表格 ≥ 1024px）外觀不變。
