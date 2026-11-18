# Spec Delta

## Purpose

Defines how the weekly view presents each job-by-day cell and orients the user to the current day, so logging is fast and amounts are easy to scan.

## ADDED Requirements

### Requirement: Cells show amount only
A weekly cell that has a log SHALL display only the logged amount, without formula, quantity, or time-range sub-text.

#### Scenario: Hourly log in a cell
- **WHEN** a day has an hourly log of NT$720 for 09:00–13:00
- **THEN** the cell shows 「720」 and no time range or formula text

### Requirement: Empty cells show an add affordance
Every empty job-by-day cell SHALL show a plus sign indicating it can be tapped or clicked to add a log; the sign SHALL be visually lighter than logged amounts so it does not compete with them.

#### Scenario: Desktop empty cell
- **WHEN** a job has no log on a given day in the desktop table
- **THEN** the cell shows a light plus sign at all times, not only on hover

#### Scenario: Mobile empty row
- **WHEN** a job has no log on a given day in the mobile list
- **THEN** the row shows 「＋ 記錄」

### Requirement: Mobile view opens at today
On viewports narrower than the desktop table breakpoint, when the displayed week contains today, the view SHALL scroll so today's day group is at the top once data has loaded.

#### Scenario: Opening the current week on a phone
- **WHEN** the user opens the app on a phone during the current week
- **THEN** today's day group (marked 「今天」) is visible at the top of the first viewport

#### Scenario: Another week on a phone
- **WHEN** the displayed week does not contain today
- **THEN** no automatic scrolling occurs
