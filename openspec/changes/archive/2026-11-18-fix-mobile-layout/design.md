# Design

## Context

見 proposal.md。截圖比對（360px、改版前 `50f53ac` vs 現在）找出的根因：

- `WeeklySheet.tsx` 單價 `<input>` 使用 `h-10 -my-2 border-b`：40px 高的框塞進 14px 行，底線落到列外形成孤立短線，負邊距也讓點擊範圍侵入相鄰列。
- `LogModal.tsx` 時間欄位在 `grid-cols-2` 中，但 `<input type="time">` 在 WebKit 有固有最小寬度且未設 `min-w-0`，iOS 上溢出重疊。iPhone 上的 Chrome 同為 WebKit。
- `.price-input` 為 15px，iOS 聚焦小於 16px 的輸入框會自動縮放。
- `MonthlyReport.tsx` 控制列是單一不換行的 flex，360px 下寬 399px。

## Goals / Non-Goals

**Goals:** 修正上述根因；桌機外觀不變。

**Non-Goals:** 恢復舊版卡片風格、調整色彩系統、週報桌機表格、圖表內部版面。

## Decisions

- **單價輸入框**：改為 `h-7 px-1.5 bg-sunken rounded-[6px]` 的淺底小框，移除 `-my-2` 與 `border-b`；列的 `min-h-[52px]` 足以容納。替代方案：保留底線但縮短高度 — 底線樣式與列分隔線視覺上仍易混淆，捨棄。
- **列分隔線**：`divide-line/70` 改為 `divide-line`，與日期標題下的線一致。
- **時間輸入框**：加 `.field-time`（`min-width:0; appearance:none`、`::-webkit-date-and-time-value { text-align: left }`），格子加 `min-w-0`；320px 下文字仍被截，故 `grid-cols-1 min-[360px]:grid-cols-2`。
- **iOS 縮放**：`.field` 本來即 17px；只有手機單價框（15px）需改，直接在 `.price-input.mobile-price-input` 設 16px（全域 `input` 規則會蓋掉 `text-[19px]` 等 utility，捨棄）。不使用 `maximum-scale=1`（會阻擋使用者縮放，有無障礙問題）。
- **月報控制列**：外層 `flex-wrap`；年月導覽（«、‹、年／月選單、›、»）包成一個 `w-full sm:w-auto` 的不換行群組，匯出在手機上為第二行全寬按鈕。320px 下仍擠，故手機縮小 `Select` inline 與 ‹ › 的水平內距（`px-1.5`/`px-2`）。
- **明細表**：類型標籤在手機改為名稱下方（`flex-col sm:flex-row`），名稱 `whitespace-nowrap`；合計金額 `whitespace-nowrap` 且 `NT$` 縮小；手機儲存格內距 `px-2.5` 讓 320px 下工資欄不被裁切。
- **其他 320px 修正**：新增紀錄副標題 `flex-wrap` + 各段不斷字；週報日期範圍 `whitespace-nowrap`。
- **驗證**：以 headless Edge（CDP）在 320／360／390 檢查 `document.documentElement.scrollWidth === innerWidth` 並截圖；iOS 專屬行為（時間輸入框、縮放）由使用者在 iPhone 實機確認。

## Risks / Trade-offs

- [Chromium 無法重現 iOS 時間輸入框行為] → 依 WebKit 已知行為修正，請使用者實機驗證後再封存。
- [16px 輸入字級使手機列表略大] → 僅限 < 640px，桌機不變。
