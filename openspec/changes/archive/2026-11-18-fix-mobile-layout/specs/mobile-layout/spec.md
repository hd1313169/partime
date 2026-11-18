# Spec Delta

## Purpose

確保手機寬度下週報、月報與各對話框的版面完整，不出現水平溢出、元素重疊或 iOS 輸入縮放。

## ADDED Requirements

### Requirement: No horizontal overflow on mobile
在 320px、360px、390px 寬度下，週報與月報頁面（含開啟的對話框）的內容寬度 SHALL NOT 超過視窗寬度。

#### Scenario: Monthly report at 360px
- **WHEN** 使用者在 360px 寬的裝置開啟月報
- **THEN** 頁面無水平捲動，年月切換與匯出按鈕皆完整顯示於螢幕內

#### Scenario: Weekly report at 320px
- **WHEN** 使用者在 320px 寬的裝置開啟週報
- **THEN** 頁面無水平捲動

### Requirement: Monthly controls wrap on mobile
窄於 640px 時，月報的月份切換列 SHALL 分為兩行：第一行為上一年、上一月、年／月選單、下一月、下一年，第二行為匯出按鈕；兩行皆 SHALL 不再換行。

#### Scenario: Two-row controls
- **WHEN** 在 360px 寬開啟月報
- **THEN** 月份切換（含年月選單）位於第一行、匯出位於第二行，且皆可點擊

### Requirement: Weekly price input stays within its row
手機週報列表中的單價輸入框 SHALL 完整位於所屬列內，其邊框或底線 SHALL NOT 跨出該列，且點擊範圍 SHALL NOT 與相鄰列重疊。

#### Scenario: No stray lines
- **WHEN** 在手機寬度檢視週報
- **THEN** 每一列之間只有一條分隔線，不出現孤立的短線段

#### Scenario: Tapping price does not open log
- **WHEN** 使用者點擊單價輸入框
- **THEN** 輸入框取得焦點，不開啟新增紀錄視窗，也不觸發上下相鄰列

### Requirement: Time inputs do not overlap
新增／編輯紀錄視窗中的開始與結束時間輸入框，在 320px 以上的寬度 SHALL 各自完整顯示且互不重疊（包含 iOS WebKit）。

#### Scenario: iPhone time inputs
- **WHEN** 使用者在 iPhone 開啟計時型工作的新增紀錄
- **THEN** 開始時間與結束時間兩個輸入框並排或上下排列，邊框互不重疊

### Requirement: Inputs do not trigger iOS zoom
手機寬度下所有文字、數字與時間輸入框的字體 SHALL 不小於 16px。

#### Scenario: Focus price input on iPhone
- **WHEN** 使用者在 iPhone 點擊週報單價輸入框
- **THEN** 頁面不自動放大

### Requirement: Monthly table readable on mobile
手機寬度下月報明細表的工作名稱 SHALL 不在 4 個字以內斷行，合計金額 SHALL 顯示於單行，且表格 SHALL 不超出外框（工資欄完整可見）。

#### Scenario: Job name on one line
- **WHEN** 在 360px 寬檢視含「倉庫理貨」的月報
- **THEN** 「倉庫理貨」顯示於同一行，計時／計件標籤位於名稱下方
