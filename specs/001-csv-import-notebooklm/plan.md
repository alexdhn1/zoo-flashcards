# Implementation Plan: CSV Import from NotebookLM

**Branch**: `001-csv-import-notebooklm` | **Date**: 2026-03-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-csv-import-notebooklm/spec.md`

---

## Summary

Add a drag-and-drop CSV import zone to the existing input view so that Jenna can
import flashcards exported from NotebookLM without copy-pasting. The zone parses
the 2-column headerless CSV format client-side, shows a confirmation preview, then
batch-writes cards to Firestore using the existing write pattern. All parsing logic
lives in a new pure-function module (`src/csvParser.js`) that is fully unit-tested
with Vitest (TDD, red-green-refactor) before any UI code is written.

---

## Technical Context

**Language/Version**: JavaScript + JSX — ES modules (unchanged)
**Primary Dependencies**: React ^18.3, Firebase ^10.12, Vite ^5.4 (unchanged)
**New devDependency**: `vitest` ^1.x — test runner (see Complexity Tracking)
**Storage**: Firebase Firestore — `users/{uid}/cards/{cardId}` (unchanged)
**Testing**: Vitest — unit tests for `src/csvParser.js` in `tests/csvParser.test.js`
**Target Platform**: Browser (static SPA, GitHub Pages) — unchanged
**Performance Goals**: Parse ≤500 rows in <50 ms synchronously; import 35 cards
  in <15 s end-to-end on standard broadband (SC-001)
**Constraints**: Zero new production dependencies; no new Firestore schema;
  no change to existing copy-paste or card-view flows (FR-010, FR-011)
**Scale/Scope**: Single user per session; ≤500 rows per import file

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Firebase-First Persistence | ✅ PASS | Batch-write via existing `addCardsToFirestore`; `setSyncStatus` surfaced at all times; Firestore error triggers toast, no silent drop |
| II. Claude-Powered Ingestion Pipeline | ⚠️ JUSTIFIED DEVIATION | Constitution states "exclusively two paths". This feature adds a **third path** (NotebookLM CSV). Justified: additive only, canonical card model unchanged, existing paths untouched. Constitution should be amended to v1.1.0 after merge. |
| III. Whitelist-Gated Access | ✅ PASS | Auth flow is not modified; import zone only renders for authenticated users |
| IV. Flat, Minimal Architecture | ✅ PASS | One new file (`src/csvParser.js`); new components added to existing `src/components.jsx`; no routing library; no TypeScript |
| V. Domain-Specific Category System | ✅ PASS | `category` defaults to `''`; `getCatNum('')` returns `'0'` (harmless); filter chips only render for present categories |

**Gate result: PASS with one justified deviation (Principle II). See Complexity
Tracking below.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-csv-import-notebooklm/
├── plan.md              ← this file
├── research.md          ← Phase 0 output (complete)
├── data-model.md        ← Phase 1 output (complete)
├── quickstart.md        ← Phase 1 output (complete)
├── contracts/
│   ├── csvParser-api.md ← Phase 1 output (complete)
│   └── component-props.md ← Phase 1 output (complete)
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code Changes

```text
src/
├── App.jsx              ← MODIFIED: add <CsvImportZone> in input view;
│                           add handleCsvImport callback
├── components.jsx       ← MODIFIED: add CsvImportZone component (+CsvPreviewList)
├── csvParser.js         ← NEW: pure parseCSV(text) function
└── styles.css           ← MODIFIED: drag-zone styles (.csv-drop-zone, .dragover)

tests/                   ← NEW directory
└── csvParser.test.js    ← NEW: 8 unit tests (Vitest)
```

**Structure Decision**: Single-project flat layout. All files remain under `src/`.
The `tests/` directory at repository root follows the convention from
`tasks-template.md` and does not violate the flat-structure principle (it is a
sibling to `src/`, not a sub-directory of it).

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Principle II: third ingestion path | User requirement: import NotebookLM CSV without modifying the Claude paste flow | There is no way to import CSV via the existing paste parser — it only handles the `FLASHCARD N / Q: / R:` format |
| Principle IV: new devDependency (vitest) | TDD mandate is NON-NEGOTIABLE per user instruction | Jest requires Babel config for ES modules; Node's built-in test runner lacks jsdom; manual-only testing violates TDD |

---

## User Story 1 — Drag-and-Drop CSV Import with Preview (Priority: P1)

### Story Description

Jenna drops a NotebookLM CSV onto the import zone, reviews a preview of all parsed
cards, confirms, and the cards are batch-written to Firestore and appear in her deck.

### Acceptance Criteria

1. Valid CSV drop → preview list appears before any data is saved.
2. "Add to deck" → cards batch-written to Firestore, success toast, navigate to
   cards view.
3. "Cancel" → no cards saved, import zone resets to idle.
4. All 35 rows of `example/flashcards_example.csv` appear in the preview with
   correct text (SC-002).
5. Sync dot shows `saving` during write, `ok` on success, `error` on failure.
6. Imported cards persist across a full page reload (SC-004).

### Unit Tests to Write — `tests/csvParser.test.js`

> **TDD Rule**: Write these tests first. Run `npm test` and confirm ALL FAIL
> before writing `src/csvParser.js`.

```js
// TC-01: Full example file parses to 35 cards
test('parses all 35 rows from flashcards_example.csv', () => {
  const text = readFileSync('./example/flashcards_example.csv', 'utf-8')
  const result = parseCSV(text)
  expect(result.error).toBeNull()
  expect(result.skipped).toBe(0)
  expect(result.cards).toHaveLength(35)
  expect(result.cards[0].question).toBe(
    'Quel est le titre de l\'atelier de préparation à l\'examen présenté dans le document ?'
  )
  expect(result.cards[0].answer).toBe(
    'Professional Machine Learning Engineer: Exam Readiness Workshop.'
  )
  // Each card must have a truthy id and addedAt
  result.cards.forEach(c => {
    expect(c.id).toBeTruthy()
    expect(c.addedAt).toBeTruthy()
    expect(c.category).toBe('')
    expect(c.species).toBe('')
  })
})

// TC-05: Quoted field containing a comma
test('handles RFC 4180 quoted field with embedded comma', () => {
  const text = 'Question simple,"Answer with, a comma inside"'
  const result = parseCSV(text)
  expect(result.error).toBeNull()
  expect(result.cards).toHaveLength(1)
  expect(result.cards[0].answer).toBe('Answer with, a comma inside')
})

// TC-06: Accented characters preserved
test('preserves UTF-8 accented characters', () => {
  const text = 'Café au lait,Réponse avec des accents: é à ü'
  const result = parseCSV(text)
  expect(result.cards[0].question).toBe('Café au lait')
  expect(result.cards[0].answer).toBe('Réponse avec des accents: é à ü')
})

// TC-08: Large file (200 rows)
test('handles 200-row CSV without truncation', () => {
  const rows = Array.from({ length: 200 }, (_, i) => `Q${i + 1},A${i + 1}`)
  const result = parseCSV(rows.join('\n'))
  expect(result.cards).toHaveLength(200)
  expect(result.error).toBeNull()
})
```

### Implementation Tasks (after tests are red)

1. **Create `src/csvParser.js`** — implement `parseCSV(text)` matching the
   contract in `contracts/csvParser-api.md`.
   - Split on newlines; handle multi-line quoted fields.
   - For each row: RFC 4180 column split → trim → validate → push or skip.
   - Return `ParseResult` with `{ cards, skipped, error }`.
   - Run `npm test` — all 4 TC-01/05/06/08 tests MUST be green before continuing.

2. **Add `CsvImportZone` to `src/components.jsx`** — implements the component
   contract in `contracts/component-props.md`.
   - `dragover`/`dragleave`/`drop` handlers on a `<div>`.
   - Hidden `<input type="file" accept=".csv">` for click-to-browse.
   - Calls `parseCSV` on file text.
   - Renders preview list (or `CsvPreviewList` sub-component) when `preview !== null`.
   - "Add to deck" button calls `props.onImport(preview)`.
   - "Cancel" resets state.

3. **Add `.csv-drop-zone` styles to `src/styles.css`**:
   - Dashed border, distinct background.
   - `.dragover` modifier for hover highlight.
   - Scrollable preview list (max-height + overflow-y: auto).

4. **Wire into `App.jsx`**:
   - Add `handleCsvImport` callback (mirrors `handleImport` for JSON but calls
     `addCardsToFirestore` + updates `allCards`).
   - Render `<CsvImportZone onImport={handleCsvImport} disabled={syncStatus === 'saving'} />`
     below the `<textarea>` in the input view.

5. **Red-green-refactor check**:
   - `npm test` — all 8 tests green.
   - `npm run dev` — manual US1 happy path (quickstart.md Step 2).

---

## User Story 2 — Error Handling for Malformed / Unrecognized Files (Priority: P2)

### Story Description

When Jenna drops a wrong-type file, an empty CSV, or a malformed CSV, the import
zone shows a clear inline error message and her deck is untouched.

### Acceptance Criteria

1. Non-CSV file → error "Please drop a CSV file (.csv)".
2. Empty CSV → error "The file contains no flashcards".
3. Single-column CSV → error "Format not recognized — expected two columns:
   question and answer".
4. Mixed CSV (some valid, some empty rows) → valid cards in preview +
   "N row(s) skipped" warning.
5. Error messages appear within 1 second of drop (SC-003).
6. No data is written to Firestore on any error path.

### Unit Tests to Write — `tests/csvParser.test.js`

> **TDD Rule**: Add these tests to `tests/csvParser.test.js` and confirm they
> FAIL before writing the corresponding error-path logic in `csvParser.js`.

```js
// TC-02: Empty file
test('returns EMPTY_FILE error for empty input', () => {
  expect(parseCSV('').error).toBe('EMPTY_FILE')
  expect(parseCSV('   \n\n  ').error).toBe('EMPTY_FILE')
  expect(parseCSV('').cards).toHaveLength(0)
})

// TC-03: Single-column file (no comma in any row)
test('returns FORMAT_ERROR when no row has two columns', () => {
  const result = parseCSV('only one column\nanother single column')
  expect(result.error).toBe('FORMAT_ERROR')
  expect(result.cards).toHaveLength(0)
})

// TC-04: Mixed valid and empty rows
test('skips rows with empty question or answer, counts them', () => {
  const text = 'Q1,A1\n,A2\nQ3,'
  const result = parseCSV(text)
  expect(result.error).toBeNull()
  expect(result.cards).toHaveLength(1)
  expect(result.skipped).toBe(2)
  expect(result.cards[0].question).toBe('Q1')
})

// TC-07: Whitespace-only rows treated as empty
test('treats whitespace-only question or answer as empty (skipped)', () => {
  const result = parseCSV('   ,A1\nQ2,   ')
  expect(result.skipped).toBe(2)
  expect(result.cards).toHaveLength(0)
  expect(result.error).toBe('EMPTY_FILE')
})
```

### Implementation Tasks (after tests are red)

1. **Extend `src/csvParser.js`** with error-path returns:
   - `EMPTY_FILE`: raw text is blank or produces zero lines with content.
   - `FORMAT_ERROR`: every non-blank line has only one column.
   - Whitespace-only fields count as empty.
   - Run `npm test` — all 8 tests MUST be green.

2. **Add error display to `CsvImportZone`** in `src/components.jsx`:
   - Map `ParseResult.error` values to user-facing strings:
     - `'EMPTY_FILE'` → "The file contains no flashcards"
     - `'FORMAT_ERROR'` → "Format not recognized — expected two columns: question and answer"
   - File-type rejection (non-.csv drop) → "Please drop a CSV file (.csv)"
     (handled before `parseCSV` is even called, in the drop handler).
   - Render inline below the drop zone (not a toast).
   - Skipped-rows warning in the preview header when `skipped > 0`.

3. **Red-green-refactor check**:
   - `npm test` — all 8 tests green.
   - `npm run dev` — manual error-path validation (quickstart.md Step 2 error flows).
   - `npm run build` — clean build, no size regression.

---

## Post-Implementation Constitution Amendment

After merging this feature, amend the constitution to v1.1.0:

- **Principle II** — update "exclusively through two paths" to enumerate three:
  1. Paste of raw Claude-AI output (primary)
  2. Import of a previously exported JSON file
  3. Drag-and-drop of a NotebookLM CSV export (added v1.1.0)

Commit message for amendment:
```
docs: amend constitution to v1.1.0 — add CSV as third ingestion path
```

---

## Notes

- `parseCSV` MUST remain a pure function with no browser/Firebase/React imports.
  This is what makes it unit-testable without a browser environment.
- The `FileReader` callback and all React state live in `CsvImportZone`, not in
  the parser. This separation is the key design decision.
- If `components.jsx` exceeds ~300 lines after this feature, extract
  `CsvImportZone` into a new `src/csvImport.jsx` per Principle IV.
- The `tests/` directory is new. Add `"test": "vitest"` to `package.json` scripts.
