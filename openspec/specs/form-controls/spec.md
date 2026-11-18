# form-controls Specification

## Purpose

Defines the behavior of the app's dropdown selection controls (year, month, and calculation type) so they are consistent with the interface and fully operable by keyboard and pointer.

## Requirements

### Requirement: Dropdowns are operable by pointer
A dropdown SHALL open its option list on click, select an option on click, and close without changing the value when the user clicks outside it.

#### Scenario: Click outside
- **WHEN** a dropdown list is open and the user clicks elsewhere on the page
- **THEN** the list closes and the selected value is unchanged

### Requirement: Dropdowns are operable by keyboard
A focused dropdown SHALL open with Arrow Down, Arrow Up, Enter, or Space; move the highlight with Arrow Up/Down, Home, and End; select with Enter or Space; and close with Escape or Tab without closing any enclosing dialog.

#### Scenario: Keyboard selection
- **WHEN** the user focuses the month dropdown, presses Arrow Down to open it, moves to another month and presses Enter
- **THEN** the report switches to that month and the list closes

#### Scenario: Escape inside a dialog
- **WHEN** a dropdown inside the job management dialog is open and the user presses Escape
- **THEN** only the dropdown closes; the dialog stays open

### Requirement: Selected option is indicated
The open option list SHALL mark the current value distinctly with a check mark and expose it to assistive technology as the selected option.

#### Scenario: Opening a dropdown
- **WHEN** the user opens the calculation type dropdown for an hourly job
- **THEN** 「時薪制」 is marked as selected
