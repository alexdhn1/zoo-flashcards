# Implementation Plan: Taxonomy-Based Species Classification

**Branch**: `002-add-taxonomy-classification` | **Date**: 2026-03-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-add-taxonomy-classification/spec.md`

## Summary

Add taxonomy-based species classification using a single taxonomy source file,
client-side fuzzy normalization (Fuse.js) at CSV ingestion, and a taxonomy
selection UI that works together with category selection in OR/AND modes.
Implementation is strictly TDD + SDD: every user story starts with explicit unit
tests in red phase, then minimal green implementation, then refactor.

## Technical Context

**Language/Version**: JavaScript + JSX (ES modules)
**Primary Dependencies**: React ^18.3, Firebase ^10.12, Vite ^5.4, Fuse.js (new; only allowed new dependency)
**Storage**: Firebase Firestore at `users/{uid}/cards/{cardId}`
**Testing**: Vitest (existing), run in TDD red-green-refactor cycles for every story
**Target Platform**: Browser SPA (Vite/GitHub Pages)
**Project Type**: Single-project frontend web app
**Performance Goals**: Taxonomy option search reacts within 100 ms for all configured orders; ingestion normalization remains client-side and synchronous per row
**Constraints**: No new dependencies except Fuse.js; keep Firebase-first write pattern; no backend/functions/migration scripts; selection wording must replace filter wording in new UI/API names
**Scale/Scope**: Existing single-user private study app; taxonomy covers 6 groups with configured orders and fallback "others"

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Firebase-First Persistence | PASS | New taxonomy fields are written client-side before existing batch Firestore write path; no server-side write introduced |
| II. Ingestion Pipeline | PASS | CSV ingestion path already exists; taxonomy normalization extends client-side parsing before write |
| III. Whitelist-Gated Access | PASS | No auth or allowlist change |
| IV. Flat, Minimal Architecture | PASS | Changes stay in existing flat `src/` + `tests/`; only small new data/module files |
| V. Domain-Specific Category System | PASS | Existing category system remains authoritative for categories; taxonomy is additive and combined in selection logic |

**Gate result (pre-Phase 0): PASS**

## Project Structure

### Documentation (this feature)

```text
specs/002-add-taxonomy-classification/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── taxonomy-schema.md
│   ├── taxonomy-normalization-api.md
│   └── selection-ui-contract.md
└── tasks.md             # generated later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── App.jsx                 # modify selection state + combined selection logic
├── components.jsx          # add taxonomy selection UI and mode controls
├── csvParser.js            # extend parsed card shape for taxonomy fields
├── parser.js               # include taxonomy defaults for non-CSV ingestion
├── firestore.js            # no API change, persists richer card objects
├── data/
│   └── taxonomy.json       # new taxonomy source of truth
└── taxonomy.js             # new normalization + taxonomy helpers

tests/
├── taxonomy.test.js        # taxonomy schema and normalization tests
├── selectionLogic.test.js  # combined taxonomy/category selection tests
└── csvParser.test.js       # updated ingestion shape tests
```

**Structure Decision**: Keep the existing single-project, flat React structure and
add one data folder (`src/data/`) only for the taxonomy source-of-truth JSON.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## User Story Plan (TDD + SDD Non-Negotiable)

### US1 — taxonomy.json source of truth

1. User story description
Create and validate a single taxonomy reference file containing six groups and
the Fowler orders, with empty Invertébrés and Poissons groups, plus fallback
"others" support consumed consistently by ingestion and UI.

2. Acceptance criteria
- `src/data/taxonomy.json` exists and is the single source for valid groups/orders.
- File includes six top-level groups exactly as specified.
- Amphibiens/Reptiles/Oiseaux/Mammifères include the specified order entries.
- Invertébrés and Poissons exist and have empty order arrays.
- Taxonomy helper loader can flatten group/order records for search and UI.

3. Unit tests to write (red first)
- `tests/taxonomy.test.js`:
  - validates all six groups exist with canonical ids and labels.
  - validates empty groups are present and do not throw in helper functions.
  - validates every order id is unique across all groups.
  - validates "others" fallback constants are exposed and not present as a normal order entry.

4. Implementation tasks (green after red)
- Add `src/data/taxonomy.json` with canonical group/order structure.
- Add `src/taxonomy.js` helpers: `getTaxonomyGroups()`, `getAllTaxonomyOrders()`.
- Refactor helper internals only after tests pass.

### US2 — Firebase data model

1. User story description
Ensure every saved flashcard can carry taxonomy metadata (`taxonomyGroup`,
`taxonomyOrder`, optional `speciesLabel`) while preserving existing write/read
patterns and compatibility with current cards.

2. Acceptance criteria
- New cards from all ingestion paths include taxonomyGroup and taxonomyOrder.
- `speciesLabel` is optional and informational only.
- Existing Firestore write functions continue to persist full card objects.
- Read path tolerates older cards missing taxonomy fields.

3. Unit tests to write (red first)
- `tests/csvParser.test.js` additions:
  - CSV parse result includes taxonomy defaults on each card.
- `tests/taxonomy.test.js` additions:
  - parser helper for manual-text ingestion produces taxonomy defaults (`others`).
- `tests/selectionLogic.test.js` seed fixtures include mixed old/new cards and verify selection logic handles missing taxonomy as `others`.

4. Implementation tasks (green after red)
- Extend card-shaping in `src/csvParser.js` and `src/parser.js` to include taxonomy fields.
- Update card rendering usage in `src/components.jsx` to display `speciesLabel` when present while keeping existing `species` behavior intact.
- Keep `src/firestore.js` API unchanged; rely on existing batch set behavior.

### US3 — Fuse.js normalization at CSV ingestion

1. User story description
Normalize raw taxonomy order strings from CSV against taxonomy reference using
Fuse.js before writing cards, using threshold 0.7 and fallback to "others".

2. Acceptance criteria
- Matching compares against both order ids and labels.
- Score >= 0.7 maps to canonical order and group.
- Score < 0.7 maps to taxonomyGroup="others", taxonomyOrder="others".
- Handles Latin/French/English variants through id+label candidates.

3. Unit tests to write (red first)
- `tests/taxonomy.test.js` additions:
  - exact canonical id resolves correctly.
  - label variant resolves to canonical id.
  - misspelled near-match above threshold resolves.
  - low-confidence input resolves to others/others.
  - empty/null input resolves to others/others.
- `tests/csvParser.test.js` additions:
  - parsing a CSV row with taxonomy raw value applies normalized canonical fields.

4. Implementation tasks (green after red)
- Install Fuse.js dependency.
- Implement `normalizeTaxonomyOrder(rawOrder)` in `src/taxonomy.js`.
- Integrate normalization call in CSV ingestion flow before `addCardsToFirestore`.
- Refactor search index creation to memoized helper after green tests.

### US4 — Taxonomy selection UI

1. User story description
Provide a searchable taxonomy selection dropdown with group sections and order
items where selecting a group selects all orders in that group and selecting an
order selects only that order; default no selection shows all cards.

2. Acceptance criteria
- One dropdown includes search input + grouped options.
- Search narrows visible order options in real time.
- Group selection means OR across that group's orders.
- Order selection targets only that specific order.
- "Tous" clears taxonomy selection.
- Default state (nothing selected) shows all cards.

3. Unit tests to write (red first)
- `tests/selectionLogic.test.js`:
  - no taxonomy selection returns all cards.
  - selected group returns all cards whose taxonomyOrder is in group order set.
  - selected order returns only that order.
  - selecting "Tous" resets to no taxonomy selection.
  - search filter function returns matching grouped options by query.

4. Implementation tasks (green after red)
- Add taxonomy selection component in `src/components.jsx` using selection naming.
- Add taxonomy selection state in `src/App.jsx` (`selectedTaxonomy`, not filter naming).
- Implement dropdown group/order interactions and reset behavior.
- Refactor component extraction only after green tests if file size/readability warrants.

### US5 — Category selection (OR / AND modes)

1. User story description
Extend category interaction from simple toggles to explicit multi-select modes
(OR/AND) while maintaining current default behavior and integrating cleanly with
taxonomy selection.

2. Acceptance criteria
- Category selection supports multi-select in OR mode and AND mode semantics.
- Mode toggle is clearly visible and persists while browsing cards.
- Default selection state still allows immediate study flow (all cards visible).

3. Unit tests to write (red first)
- `tests/selectionLogic.test.js` additions:
  - category OR mode includes cards with any selected category.
  - category AND mode includes cards matching all selected category conditions.
  - empty category selection returns all cards.

4. Implementation tasks (green after red)
- Introduce explicit category selection mode state in `src/App.jsx`.
- Update `CategoryFilters` UI in `src/components.jsx` to support multi-select + mode toggle.
- Keep naming/copy as selection language (not hide/filter language).

### US6 — Combined selection state

1. User story description
Ensure taxonomy selection and category selection interact correctly in both OR
and AND modes without conflict, and preserve stable card navigation behavior.

2. Acceptance criteria
- Combined OR mode behaves as union across active selection dimensions.
- Combined AND mode behaves as intersection across active selection dimensions.
- Empty selection in one or both dimensions defaults to include-all semantics.
- Card index/navigation remains valid when selection results shrink to zero.

3. Unit tests to write (red first)
- `tests/selectionLogic.test.js` additions:
  - taxonomy + category in OR mode returns expected union fixture set.
  - taxonomy + category in AND mode returns expected intersection fixture set.
  - mixed empty/non-empty selection sets produce expected include-all behavior.
  - result shrink adjusts active index safely (can be covered with pure helper).

4. Implementation tasks (green after red)
- Add pure combined selection helper in `src/taxonomy.js` or dedicated module.
- Wire combined helper into `filteredCards` computation in `src/App.jsx`.
- Validate manual UX text/copy uses selection wording consistently.
- Refactor naming from legacy filter vars only after tests confirm no regressions.

## Post-Design Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Firebase-First Persistence | PASS | All taxonomy normalization occurs before existing Firestore batch writes |
| II. Ingestion Pipeline | PASS | CSV path enhanced but still client-side and parser-centered |
| III. Whitelist-Gated Access | PASS | No auth boundary change |
| IV. Flat, Minimal Architecture | PASS | Adds only focused modules/files in existing project layout |
| V. Domain-Specific Category System | PASS | Category system preserved; taxonomy selection is additive |

**Gate result (post-Phase 1): PASS**
