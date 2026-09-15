# demo-mode Specification

## Purpose

Lets the app run entirely in the browser with seeded, locally-persisted sample data and no backend calls, so it can be published as a public, self-contained demo without exposing or depending on the real API.

## Requirements

### Requirement: Demo mode makes no backend network requests
When built in demo mode, the app SHALL NOT make any network request to the Worker API, the local Express server, or any other backend for the salary-tracking data (jobs, logs, weekly prices).

#### Scenario: Loading the app in demo mode
- **WHEN** the app is built with demo mode enabled and a visitor opens it
- **THEN** the initial data load completes using only local data, with no request issued to any `/api/*` endpoint

#### Scenario: Creating, editing, or deleting data in demo mode
- **WHEN** a visitor in demo mode adds, edits, or deletes a job, log, or weekly price
- **THEN** the change is applied without issuing any request to any `/api/*` endpoint

### Requirement: Demo starts with seeded sample data
When a visitor opens the demo for the first time (no existing locally-stored demo data), the app SHALL populate the weekly and monthly views with a pre-defined set of sample jobs, logs, and weekly prices spanning multiple weeks.

#### Scenario: First-time visitor
- **WHEN** a visitor opens the demo in a browser with no prior demo data stored
- **THEN** the weekly and monthly views show the pre-defined sample jobs, logs, and weekly prices rather than an empty state

### Requirement: Demo data persists per visitor across reloads
Changes a visitor makes in demo mode SHALL persist in that visitor's own browser storage and SHALL be restored on subsequent reloads in the same browser, without being visible to or shared with any other visitor.

#### Scenario: Reloading after a change
- **WHEN** a visitor edits data in demo mode and then reloads the page in the same browser
- **THEN** the app shows their edited data, not the original seed data

#### Scenario: Different visitor, different browser
- **WHEN** a second visitor opens the demo in a different browser or device
- **THEN** they see the original seed data (or their own prior local edits), not the first visitor's changes

### Requirement: Visitor can reset demo data
Demo mode SHALL provide a visible action that clears the visitor's locally-stored demo data and restores the original seed data, without requiring a manual localStorage clear or page-level workaround.

#### Scenario: Resetting after making changes
- **WHEN** a visitor who has edited demo data triggers the reset action
- **THEN** the app discards their local changes and immediately shows the original seed data again

### Requirement: Reset action is only available in demo mode
The reset action SHALL NOT appear in the normal (non-demo) build of the app.

#### Scenario: Normal build
- **WHEN** the app is built without demo mode enabled
- **THEN** no reset-demo-data action is present in the UI
