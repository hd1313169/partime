# Spec Delta

## Purpose

在薪資月報中以圖表呈現收入的每日分佈、各工作項目當月累積與近幾個月的趨勢，協助使用者回顧收入。

## ADDED Requirements

### Requirement: Chart tabs in monthly report
月報 SHALL 在當月有工作紀錄時，於總工資區塊與明細表之間顯示圖表區，包含「每日收入」、「各項工作」、「近 6 個月」三個 tab，預設選中「每日收入」，一次只顯示一張圖。

#### Scenario: Default tab
- **WHEN** 使用者開啟有工作紀錄的月份
- **THEN** 圖表區顯示三個 tab，且「每日收入」為選中狀態並顯示其圖表

#### Scenario: Switch tab
- **WHEN** 使用者點選「各項工作」tab
- **THEN** 圖表區改為顯示各項工作圓餅圖，其他圖表不顯示

### Requirement: Tab selection persists across month changes
切換月份時系統 SHALL 保留目前選中的 tab；重新載入頁面後 SHALL 回到預設 tab。

#### Scenario: Change month keeps tab
- **GIVEN** 使用者選中「近 6 個月」tab
- **WHEN** 使用者切換到上一月且該月有紀錄
- **THEN** 圖表區仍顯示「近 6 個月」tab

### Requirement: Empty month hides charts
當選擇的月份沒有任何工作紀錄時，系統 SHALL 維持既有空狀態，且 SHALL NOT 顯示圖表區。

#### Scenario: Month without logs
- **WHEN** 使用者切換到沒有工作紀錄的月份
- **THEN** 顯示「還沒有工作紀錄」空狀態，不顯示 tab 與圖表

### Requirement: Daily income chart
「每日收入」SHALL 以固定顏色的折線呈現當月每一天（1 日至月底，無收入為 0）的總收入（非累積），不依工作項目區分。已刪除工作項目的紀錄 SHALL 被排除，與明細表一致。

#### Scenario: One point per day
- **GIVEN** 當月 5 日有工作 A 收入 500、工作 B 收入 300
- **WHEN** 顯示每日收入圖
- **THEN** 5 日只有一個值為 800 的資料點

#### Scenario: Every day present, not cumulative
- **GIVEN** 30 天的月份，1 日收入 500、3 日收入 300，其他日為 0
- **WHEN** 顯示每日收入圖
- **THEN** X 軸涵蓋 1 至 30 日，1 日值為 500、2 日為 0、3 日為 300

### Requirement: Per-job monthly total chart
「各項工作」SHALL 以圓餅圖呈現當月每個工作項目的累積工資佔比，每個工作項目一個切片，順序與明細表相同，金額與明細表「工資」欄一致；工資為 0 的項目不顯示。切片 SHALL 使用固定調色盤依序配色，不使用工作項目自訂顏色。

#### Scenario: Matches table
- **GIVEN** 當月倉庫理貨工資 9,360、總工資 20,560
- **WHEN** 顯示各項工作圖
- **THEN** 倉庫理貨切片標示金額 9.4k 與佔比 46%

#### Scenario: Narrow screen legend
- **WHEN** 在窄螢幕顯示各項工作圖
- **THEN** 切片內標示百分比，圖下方以圖例列出各工作名稱與金額

### Requirement: Values shown on charts
三張圖表 SHALL 直接在長條、資料點或切片上顯示數值；值為 0 的點 SHALL NOT 顯示標籤。窄螢幕下每日收入圖的標籤 SHALL 以不重疊的方式呈現。

#### Scenario: Labels on bars
- **WHEN** 顯示任一圖表
- **THEN** 每個大於 0 的長條或資料點旁顯示其金額

#### Scenario: Zero not labeled
- **WHEN** 某日收入為 0
- **THEN** 該日不顯示數值標籤

### Requirement: Six-month trend chart
「近 6 個月」SHALL 呈現以目前選擇月份為終點、往回連續 6 個月的月總工資，可跨年；無紀錄的月份值為 0。目前選擇的月份 SHALL 有視覺上的強調。圖表顏色 SHALL 為固定配色，不隨工作項目顏色變化。

#### Scenario: Anchored to selected month
- **WHEN** 使用者選擇 2026 年 3 月並查看「近 6 個月」
- **THEN** 圖表依序顯示 2025 年 10 月至 2026 年 3 月的月總工資，且 2026 年 3 月被強調

#### Scenario: Month with no logs in range
- **GIVEN** 範圍內某月沒有紀錄
- **WHEN** 顯示近 6 個月圖
- **THEN** 該月仍出現在圖中，值為 0

### Requirement: Export excludes charts
Excel 匯出 SHALL 維持既有內容，不包含任何圖表。

#### Scenario: Export unchanged
- **WHEN** 使用者在有圖表的月報點選「匯出」
- **THEN** 匯出的檔案內容與新增圖表前相同
