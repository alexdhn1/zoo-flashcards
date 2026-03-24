# Feature Specification: CSV Import from NotebookLM

**Feature Branch**: `001-csv-import-notebooklm`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "Add a CSV import feature to the flashcard application
that allows Jenna to drag and drop a CSV file exported from NotebookLM directly
onto the interface."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drag-and-Drop CSV Import with Preview (Priority: P1)

Jenna has generated a set of flashcards in NotebookLM and exported them as a CSV
file. She opens the Zoo Board Flashcards app, sees a clearly distinct drag-and-drop
import zone in the input view, drags her CSV file onto it, reviews the parsed cards
in a preview list, confirms the import, and the cards are added to her deck and
synced to the cloud.

**Why this priority**: This is the core of the feature. Without the import zone,
preview, and confirmation flow, there is no usable deliverable.

**Independent Test**: Can be fully tested by dragging `example/flashcards_example.csv`
onto the import zone, verifying the preview shows the 35 correct question/answer
pairs, confirming, and checking that the cards appear in the deck and persist after
a page reload.

**Acceptance Scenarios**:

1. **Given** Jenna is on the input view (logged in), **When** she drags a valid
   NotebookLM CSV onto the import zone, **Then** a preview list appears showing all
   parsed cards (question + answer, one row per card) before any data is saved.
2. **Given** the preview is displayed, **When** Jenna clicks "Add to deck",
   **Then** all cards are batch-written to the cloud, a success toast is shown
   ("N cards imported & synced"), and the app navigates to the cards view.
3. **Given** the preview is displayed, **When** Jenna clicks "Cancel",
   **Then** no cards are saved and the import zone returns to its idle state.
4. **Given** the import zone is visible, **When** Jenna drops a file that is not a
   CSV or is an empty CSV, **Then** an inline error message is shown and no preview
   appears.

---

### User Story 2 - Error Handling for Malformed / Unrecognized Files (Priority: P2)

Jenna accidentally drops a non-CSV file or a malformed CSV. The app detects the
problem, shows a clear and actionable error message directly in the import zone,
and leaves her existing deck untouched.

**Why this priority**: Graceful error handling is explicitly required and prevents
silent data corruption or confusing UI states.

**Independent Test**: Drop a `.txt` file, an empty CSV, and a CSV with only one
column — verify each produces a distinct, readable error message in the import
zone with no preview shown.

**Acceptance Scenarios**:

1. **Given** the import zone is idle, **When** a non-CSV file (e.g., `.txt`, `.pdf`,
   `.json`) is dropped, **Then** an error message reads "Please drop a CSV file (.csv)"
   and the zone resets to idle.
2. **Given** a CSV file is dropped but is empty (0 parseable rows),
   **Then** an error message reads "The file contains no flashcards" and no preview
   appears.
3. **Given** a CSV file is dropped but has only one column per row,
   **Then** an error message reads "Format not recognized — expected two columns:
   question and answer" and no preview appears.
4. **Given** a CSV with some valid rows and some rows where question or answer is
   empty is dropped, **Then** only valid rows appear in the preview, and a warning
   banner states how many rows were skipped (e.g., "3 rows skipped — missing
   question or answer").

---

### Edge Cases

- What if the CSV contains accented or Unicode characters (é, à, ü, 中文)?
  → Characters MUST be preserved as-is; the file is read as UTF-8.
- What if a row's question or answer is only whitespace?
  → Treated as empty and skipped (counted in the skipped-rows warning).
- What if the CSV has more than 200 rows?
  → All rows are parsed and shown in a scrollable preview; no artificial cap.
- What if Jenna drops a second CSV while a preview is already open?
  → The new file replaces the current preview (previous selection is implicitly
  cancelled).
- What if the cloud write fails on confirmation?
  → The existing sync-error toast pattern fires ("Failed to save to cloud"),
  no cards are added to local state, and the preview remains visible so Jenna
  can retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The input view MUST display a drag-and-drop import zone that is
  visually distinct from the existing copy-paste textarea.
- **FR-002**: The import zone MUST accept `.csv` files via drag-and-drop. A
  click-to-browse fallback (hidden file input) MUST also be supported.
- **FR-003**: The parser MUST correctly read the NotebookLM export format: a
  headerless two-column CSV where column 1 is the question and column 2 is the
  answer. Quoted fields containing commas or newlines MUST be handled per RFC 4180.
- **FR-004**: After a file is accepted, the system MUST display a preview of all
  parsed cards before any data is committed to storage.
- **FR-005**: Users MUST be able to confirm or cancel from the preview; the app
  MUST NOT navigate away or modify the deck until confirmation is given.
- **FR-006**: On confirmation, cards MUST be persisted to the cloud using the
  existing batch-write pattern. Each card MUST have a unique ID and an `addedAt`
  timestamp generated at import time.
- **FR-007**: The `category` and `species` fields MUST default to empty string for
  CSV-imported cards, matching the existing card data model.
- **FR-008**: On successful import, the system MUST show a success toast and
  navigate to the cards view.
- **FR-009**: Format/file errors MUST be displayed inline inside the import zone
  (not via toast) so the rest of the input view remains usable.
- **FR-010**: Rows where question or answer resolves to an empty string MUST be
  skipped; if one or more rows are skipped, a visible count MUST appear in the
  preview.
- **FR-011**: The feature MUST NOT modify the existing copy-paste import flow, the
  card visualization flow, or any other existing behavior.

### Key Entities

- **CSV Row**: A pair of strings (question, answer) extracted from one line of the
  NotebookLM export. Maps 1-to-1 to a Flashcard after ID and timestamp generation.
- **Flashcard** (existing): `{ id, question, answer, category, species, addedAt }`.
  CSV import populates `question` and `answer`; `category` and `species` default to
  empty string; `id` and `addedAt` are generated at import time.
- **Import Preview**: A transient in-memory list of parsed flashcards displayed to
  the user before confirmation. Discarded on cancel or replaced by a new file drop.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from dropping a 35-row NotebookLM CSV to seeing all
  cards in their deck in under 15 seconds on a standard broadband connection.
- **SC-002**: All 35 rows of `example/flashcards_example.csv` parse correctly and
  appear in the preview with their original text intact — no truncation, no encoding
  artefacts, no missing rows.
- **SC-003**: Any file-type or format error produces a visible, human-readable error
  message within 1 second of the drop — no blank screen, no silent failure.
- **SC-004**: After confirmation, imported cards persist across a full page reload
  (durably stored in the cloud), verifiable in the deck view.
- **SC-005**: The existing copy-paste workflow and card navigation work identically
  after the feature is added — zero regression on the two existing flows.

## Assumptions

- The NotebookLM CSV is headerless (no column-name row), as confirmed by
  `example/flashcards_example.csv`. If NotebookLM ever adds a header, the parser
  will need a guard — this is a known future fragility.
- The CSV import zone is placed in the existing input view (`view === 'input'`),
  below the copy-paste textarea; no new route or screen is introduced.
- No de-duplication against the existing deck is required; duplicate questions are
  allowed, consistent with current app behavior.
- Category assignment from CSV is out of scope; all imported cards start with an
  empty category string.
