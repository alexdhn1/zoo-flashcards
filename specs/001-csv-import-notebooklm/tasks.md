---

description: "Task list for CSV Import from NotebookLM"
---

# Tasks: CSV Import from NotebookLM

**Input**: Design documents from `/specs/001-csv-import-notebooklm/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅,
contracts/csvParser-api.md ✅, contracts/component-props.md ✅, quickstart.md ✅

**TDD Mandate** (NON-NEGOTIABLE): Tests are written and confirmed FAILING before
any implementation code. The [TDD-RED] and [TDD-GREEN] checkpoints are hard gates.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependency)
- **[Story]**: US1 or US2 — maps to user story in spec.md
- File paths are absolute from repository root

---

## Phase 1: Setup

**Purpose**: Install test infrastructure and create the new directory. These are
prerequisites for the TDD red phase — nothing else can start until T001 is done.

- [x] T001 Add `"vitest": "^1.0.0"` to `devDependencies` and `"test": "vitest"` to `scripts` in `package.json`, then run `npm install` to install it
- [x] T002 [P] Create `tests/` directory at repository root (sibling to `src/`)

**Checkpoint**: `npm test` is now a valid command (exits with "no test files found", not an error).

---

## Phase 2: Foundational — TDD Red Phase

**Purpose**: Write ALL 8 unit tests before any implementation. This is the TDD
contract — do NOT proceed to Phase 3 until T004 confirms all tests fail.

**⚠️ CRITICAL**: No implementation code may be written until this phase is complete.

- [x] T003 Write all 8 unit tests in `tests/csvParser.test.js` — import `parseCSV` from `'../src/csvParser.js'` (file does not exist yet); include TC-01/05/06/08 (US1) and TC-02/03/04/07 (US2) exactly as specified in `specs/001-csv-import-notebooklm/plan.md`
- [x] T004 Run `npm test` and **confirm all 8 tests FAIL** with "Cannot find module" or equivalent error — screenshot or record the failing output as proof of red phase

**Checkpoint**: 8 tests red. Implementation may now begin.

---

## Phase 3: User Story 1 — Drag-and-Drop CSV Import with Preview (Priority: P1) 🎯 MVP

**Goal**: Jenna can drop a valid NotebookLM CSV, see a preview of all parsed cards,
confirm, and have them batch-written to Firestore and visible in her deck.

**Independent Test**: Drag `example/flashcards_example.csv` → preview shows 35 cards
→ confirm → deck has 35 cards → reload → cards still present.

### TDD: Green Phase for US1 tests

- [x] T005 [US1] Implement `parseCSV(text)` in `src/csvParser.js` — happy paths only: valid 2-column CSV, RFC 4180 quoted fields, UTF-8 accented characters, 200-row file; match the `ParseResult` return shape `{ cards, skipped, error }` from `specs/001-csv-import-notebooklm/contracts/csvParser-api.md`
- [x] T006 [US1] Run `npm test` — confirm TC-01, TC-05, TC-06, TC-08 pass (4 green); TC-02/03/04/07 still red is expected

### Implementation for User Story 1

- [x] T007 [P] [US1] Add `CsvImportZone` component (drag handlers, hidden file input, FileReader, parseCSV call, preview state, confirm/cancel buttons) and `CsvPreviewList` sub-component to `src/components.jsx` — follow props contract in `specs/001-csv-import-notebooklm/contracts/component-props.md`
- [x] T008 [P] [US1] Add `.csv-drop-zone`, `.csv-drop-zone.dragover`, `.csv-preview-list`, and `.csv-skip-warning` CSS classes to `src/styles.css` — dashed border, distinct background, scrollable preview list (max-height 320px, overflow-y auto)
- [x] T009 [US1] Add `handleCsvImport` async callback to `src/App.jsx` — mirrors the `handleImport` JSON pattern: calls `addCardsToFirestore(user.uid, cards)`, updates `allCards`, sets `syncStatus`, shows toast `"N cards imported & synced"`, navigates to `'cards'` view; on Firestore error shows `"❌ Failed to save to cloud"` toast and does NOT update `allCards`
- [x] T010 [US1] Render `<CsvImportZone onImport={handleCsvImport} disabled={syncStatus === 'saving'} />` inside the input view in `src/App.jsx`, below the `<textarea>` and above the action buttons row

**Checkpoint**: User Story 1 is independently functional and testable.

### US1 Manual Validation

- [ ] T011 [US1] Execute quickstart.md Step 2 — happy path: drag `example/flashcards_example.csv`, verify preview shows 35 rows with correct text, confirm, verify toast + navigation + deck count + persistence after reload; also test Cancel flow

---

## Phase 4: User Story 2 — Error Handling for Malformed / Unrecognized Files (Priority: P2)

**Goal**: Wrong-type files, empty CSVs, and malformed CSVs all produce clear inline
error messages in the import zone with no data written to Firestore.

**Independent Test**: Drop `.txt` file → "Please drop a CSV file (.csv)"; drop empty
CSV → "The file contains no flashcards"; drop single-column CSV → "Format not
recognized — expected two columns: question and answer".

### TDD: Green Phase for US2 tests

- [x] T012 [US2] Extend `src/csvParser.js` with error-path logic: `EMPTY_FILE` (blank input or all-whitespace), `FORMAT_ERROR` (every row has < 2 columns), whitespace-only field trimming; TC-04 mixed-row skipping with `skipped` count
- [x] T013 [US2] Run `npm test` — confirm all 8 tests pass (full green); if any TC-01/05/06/08 regress, fix before continuing

### Implementation for User Story 2

- [x] T014 [US2] Add file-type guard to the drop/change handler in `CsvImportZone` in `src/components.jsx` — reject non-.csv files before calling `parseCSV`, set inline error "Please drop a CSV file (.csv)"; map `ParseResult.error` values to user-facing strings: `'EMPTY_FILE'` → "The file contains no flashcards", `'FORMAT_ERROR'` → "Format not recognized — expected two columns: question and answer"; render skipped-rows warning `"N row(s) skipped — missing question or answer"` in preview header when `skipped > 0`

**Checkpoint**: User Stories 1 and 2 are both independently functional.

### US2 Manual Validation

- [ ] T015 [US2] Execute quickstart.md Step 2 error flows — drop `.txt`, empty CSV, single-column CSV; verify each inline error message; verify deck is unchanged after each error; verify a second valid CSV drop after an error works correctly

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build integrity, regression safety, and constitution compliance.

- [x] T016 Run `npm run build` — verify clean build with no errors; confirm `dist/` bundle size has not increased by more than ~1 KB vs pre-feature baseline (no new production dep was added)
- [ ] T017 [P] Regression check — open the app, use the copy-paste textarea to add a Claude-format card, verify it parses and syncs correctly; navigate cards view, verify flip/next/prev/shuffle/filter all work as before (quickstart.md Step 2 regression section)
- [x] T018 [P] Amend `.specify/memory/constitution.md` to version 1.1.0 — update Principle II body to list CSV as the third ingestion path; update `LAST_AMENDED_DATE` to 2026-03-23; add entry to Sync Impact Report comment at top of file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001+T002 complete — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on T004 (red phase confirmed)
- **User Story 2 (Phase 4)**: Depends on T011 (US1 manual validation passed) — US2 error paths build on the same `csvParser.js` and `CsvImportZone` established in US1
- **Polish (Phase 5)**: Depends on T015 (US2 validation complete)

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2
- **US2 (P2)**: Depends on US1 complete (shares `csvParser.js` and `CsvImportZone`)

### Within Each User Story

```
Tests (T003) → Confirm RED (T004) → Implement parser (T005) → Confirm GREEN (T006/T013)
  → Components + CSS [parallel: T007 ‖ T008] → App wiring (T009 → T010) → Validate (T011/T015)
```

### Parallel Opportunities

```
# Phase 1
T001 (package.json) ‖ T002 (mkdir tests/)

# Phase 3 — after T006 confirms green
T007 (components.jsx: CsvImportZone)  ‖  T008 (styles.css: drag-zone classes)

# Phase 5 — after T015
T016 (build check)  ‖  T017 (regression check)  ‖  T018 (constitution amendment)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Write tests + confirm RED (gate)
3. Complete Phase 3: US1 implementation → validate
4. **STOP and VALIDATE**: drag `example/flashcards_example.csv`, confirm 35 cards in deck, reload
5. US1 is a fully usable feature even without error handling (US2)

### Incremental Delivery

1. Setup + Foundational (Phase 1+2) → TDD infrastructure ready
2. US1 (Phase 3) → happy-path import works → **shippable MVP**
3. US2 (Phase 4) → error handling added → **production-ready**
4. Polish (Phase 5) → build check + regression + constitution updated

---

## Notes

- `[P]` tasks = different files, no blocking dependencies — safe to run in parallel
- `[Story]` label maps each task to its user story for traceability
- **T004 is a hard gate** — never skip the red-phase confirmation
- `parseCSV` in `src/csvParser.js` MUST remain a pure function (no imports from
  React, Firebase, or browser APIs) — this is what makes it unit-testable in Vitest
- If `src/components.jsx` exceeds ~300 lines after T007/T014, extract
  `CsvImportZone` into `src/csvImport.jsx` per Constitution Principle IV
- After T018: commit constitution amendment separately with message
  `docs: amend constitution to v1.1.0 — add CSV as third ingestion path`
