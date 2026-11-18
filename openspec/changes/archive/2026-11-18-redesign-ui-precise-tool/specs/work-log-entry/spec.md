# Spec Delta

## Purpose

Defines how the app validates a work log and communicates its pricing while the user creates or edits it, so that every saved amount is correct and traceable.

## ADDED Requirements

### Requirement: Hourly logs require a positive time range
For an hourly job, the log entry SHALL NOT allow saving when the end time is equal to or earlier than the start time, and SHALL tell the user why.

#### Scenario: End time earlier than start time
- **WHEN** the user sets an end time that is not later than the start time on an hourly job
- **THEN** the save action is disabled and the message 「結束時間要晚於開始時間。」 is shown

#### Scenario: Valid range restored
- **WHEN** the user changes the times so the end time is later than the start time
- **THEN** the message disappears and saving is enabled again

### Requirement: Live amount with visible arithmetic
The log entry SHALL show the amount that will be saved, together with the unit price and the hours or quantity it is computed from, updating as the user edits.

#### Scenario: Editing quantity
- **WHEN** the user changes the quantity of a piece-rate or fixed job
- **THEN** the displayed unit price × quantity and the resulting amount update immediately

### Requirement: Repricing notice when editing an existing log
When an existing log is opened and this week's unit price differs from the price stored on the log, the log entry SHALL state the original price and amount and that saving will apply this week's price.

#### Scenario: Price changed since the log was recorded
- **WHEN** the user opens a log recorded at NT$180 while this week's price is NT$185
- **THEN** the entry shows 「原紀錄單價 NT$ 180（NT$ 原金額），儲存後改用本週單價 NT$ 185。」

#### Scenario: Price unchanged
- **WHEN** the stored price equals this week's price
- **THEN** no repricing notice is shown
