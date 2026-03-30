# Tasks: Taxonomy-Based Species Classification

**Input**: Design documents from /specs/002-add-taxonomy-classification/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Tests**: Mandatory TDD for every user story (red -> green -> refactor)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared test and source scaffolding used by all stories.

- [X] T001 Create feature test scaffolds in tests/taxonomy.test.js and tests/selectionLogic.test.js
- [X] T002 [P] Create taxonomy source folder scaffold in src/data/taxonomy.json
- [X] T003 [P] Create taxonomy helper scaffold in src/taxonomy.js
- [X] T004 Document red-green-refactor workflow notes in specs/002-add-taxonomy-classification/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared helpers and fixtures required across multiple user stories.

**CRITICAL**: Complete this phase before starting user stories.

- [X] T005 Create shared card fixture data for selection tests in tests/fixtures/selectionCards.js
- [X] T006 [P] Create taxonomy fixture loader for test reuse in tests/fixtures/taxonomyReference.js
- [X] T007 [P] Add safe taxonomy fallback constants in src/taxonomy.js
- [X] T008 Add shared combined-selection function signature in src/taxonomy.js
- [X] T009 Verify foundational test imports resolve in tests/taxonomy.test.js and tests/selectionLogic.test.js

**Checkpoint**: Foundation is ready for independent user story work.

---

## Phase 3: User Story 1 - taxonomy.json Source of Truth

**Goal**: Create and validate a single taxonomy reference file with required groups and orders.

**Independent Test**: Taxonomy schema tests validate group coverage, uniqueness, and empty-group handling without UI changes.

### Tests for User Story 1 (write first, confirm fail)

- [X] T010 [P] [US1] Add group-presence schema tests in tests/taxonomy.test.js
- [X] T011 [P] [US1] Add order-uniqueness tests in tests/taxonomy.test.js
- [X] T012 [P] [US1] Add empty-group behavior tests for Invertebres and Poissons in tests/taxonomy.test.js
- [X] T013 [US1] Run red-phase taxonomy tests in tests/taxonomy.test.js

### Implementation for User Story 1 (after red)

- [X] T014 [US1] Implement full taxonomy reference content in src/data/taxonomy.json
- [X] T015 [US1] Implement taxonomy loading helper getTaxonomyGroups in src/taxonomy.js
- [X] T016 [US1] Implement taxonomy flatten helper getAllTaxonomyOrders in src/taxonomy.js
- [X] T017 [US1] Run green-phase taxonomy tests in tests/taxonomy.test.js
- [X] T018 [US1] Refactor taxonomy helper internals while keeping tests green in src/taxonomy.js

**Checkpoint**: US1 is independently testable and complete.

---

## Phase 4: User Story 2 - Firebase Data Model Fields

**Goal**: Persist taxonomyGroup, taxonomyOrder, and optional speciesLabel on flashcards.

**Independent Test**: Parsing and shaping tests confirm newly created cards include taxonomy fields and older cards remain readable.

### Tests for User Story 2 (write first, confirm fail)

- [X] T019 [P] [US2] Add CSV parser shape tests for taxonomy fields in tests/csvParser.test.js
- [X] T020 [P] [US2] Add parser default taxonomy tests for text ingestion in tests/taxonomy.test.js
- [X] T021 [P] [US2] Add mixed old-new card compatibility tests in tests/selectionLogic.test.js
- [X] T022 [US2] Run red-phase model tests in tests/csvParser.test.js and tests/selectionLogic.test.js

### Implementation for User Story 2 (after red)

- [X] T023 [US2] Add taxonomy defaults to CSV card shaping in src/csvParser.js
- [X] T024 [US2] Add taxonomy defaults to text parser card shaping in src/parser.js
- [X] T025 [US2] Add speciesLabel display fallback behavior in src/components.jsx
- [X] T026 [US2] Confirm Firestore batch writes preserve added fields in src/firestore.js
- [X] T027 [US2] Run green-phase model tests in tests/csvParser.test.js and tests/selectionLogic.test.js
- [X] T028 [US2] Refactor card-shaping duplication with tests green in src/parser.js and src/csvParser.js

**Checkpoint**: US2 is independently testable and complete.

---

## Phase 5: User Story 3 - Fuse.js Normalization at CSV Ingestion

**Goal**: Normalize raw taxonomy order strings to canonical ids before Firebase write.

**Independent Test**: Normalization tests cover exact, variant, misspelled, and fallback outcomes at threshold 0.7.

### Tests for User Story 3 (write first, confirm fail)

- [X] T029 [P] [US3] Add exact-id normalization tests in tests/taxonomy.test.js
- [X] T030 [P] [US3] Add label-variant normalization tests in tests/taxonomy.test.js
- [X] T031 [P] [US3] Add low-confidence fallback tests in tests/taxonomy.test.js
- [X] T032 [P] [US3] Add CSV integration normalization tests in tests/csvParser.test.js
- [X] T033 [US3] Run red-phase normalization tests in tests/taxonomy.test.js and tests/csvParser.test.js

### Implementation for User Story 3 (after red)

- [X] T034 [US3] Install Fuse.js dependency in package.json
- [X] T035 [US3] Implement normalizeTaxonomyOrder API with threshold 0.7 in src/taxonomy.js
- [X] T036 [US3] Integrate taxonomy normalization into CSV ingestion flow in src/components.jsx
- [X] T037 [US3] Ensure canonical taxonomy fields are written before addCardsToFirestore in src/App.jsx
- [X] T038 [US3] Run green-phase normalization tests in tests/taxonomy.test.js and tests/csvParser.test.js
- [X] T039 [US3] Refactor Fuse index setup for reuse with tests green in src/taxonomy.js

**Checkpoint**: US3 is independently testable and complete.

---

## Phase 6: User Story 4 - Taxonomy Selection UI

**Goal**: Provide searchable grouped taxonomy selection with include-all default and Tous reset.

**Independent Test**: Selection logic tests plus UI behavior checks verify group/order selection and real-time search.

### Tests for User Story 4 (write first, confirm fail)

- [X] T040 [P] [US4] Add include-all no-selection tests in tests/selectionLogic.test.js
- [X] T041 [P] [US4] Add group-selection and order-selection tests in tests/selectionLogic.test.js
- [X] T042 [P] [US4] Add taxonomy search-option filtering tests in tests/selectionLogic.test.js
- [X] T043 [US4] Run red-phase taxonomy selection tests in tests/selectionLogic.test.js

### Implementation for User Story 4 (after red)

- [X] T044 [US4] Add TaxonomySelection component with grouped dropdown UI in src/components.jsx
- [X] T045 [US4] Add taxonomy selection state and handlers in src/App.jsx
- [X] T046 [US4] Add Tous reset and include-all default copy in src/components.jsx
- [X] T047 [US4] Run green-phase taxonomy selection tests in tests/selectionLogic.test.js
- [X] T048 [US4] Refactor taxonomy selection props and naming to selection semantics in src/components.jsx and src/App.jsx

**Checkpoint**: US4 is independently testable and complete.

---

## Phase 7: User Story 5 - Category Selection OR/AND Modes

**Goal**: Support category multi-selection with explicit OR and AND modes.

**Independent Test**: Category mode tests verify OR/AND semantics and include-all behavior when no categories are selected.

### Tests for User Story 5 (write first, confirm fail)

- [X] T049 [P] [US5] Add category OR mode tests in tests/selectionLogic.test.js
- [X] T050 [P] [US5] Add category AND mode tests in tests/selectionLogic.test.js
- [X] T051 [P] [US5] Add empty-category include-all tests in tests/selectionLogic.test.js
- [X] T052 [US5] Run red-phase category mode tests in tests/selectionLogic.test.js

### Implementation for User Story 5 (after red)

- [X] T053 [US5] Add category selection mode state in src/App.jsx
- [X] T054 [US5] Update CategoryFilters for multi-select mode controls in src/components.jsx
- [X] T055 [US5] Apply category mode logic in selected-cards computation in src/App.jsx
- [X] T056 [US5] Run green-phase category mode tests in tests/selectionLogic.test.js
- [X] T057 [US5] Refactor category mode UI labels to selection semantics in src/components.jsx

**Checkpoint**: US5 is independently testable and complete.

---

## Phase 8: User Story 6 - Combined Selection State Across Taxonomy and Categories

**Goal**: Ensure taxonomy and category selections combine correctly in OR and AND dimension modes.

**Independent Test**: Combined-selection tests validate union/intersection outputs and stable index behavior on shrinking results.

### Tests for User Story 6 (write first, confirm fail)

- [X] T058 [P] [US6] Add cross-dimension OR union tests in tests/selectionLogic.test.js
- [X] T059 [P] [US6] Add cross-dimension AND intersection tests in tests/selectionLogic.test.js
- [X] T060 [P] [US6] Add mixed-empty selection behavior tests in tests/selectionLogic.test.js
- [X] T061 [P] [US6] Add index-reset safety tests for shrinking results in tests/selectionLogic.test.js
- [X] T062 [US6] Run red-phase combined-selection tests in tests/selectionLogic.test.js

### Implementation for User Story 6 (after red)

- [X] T063 [US6] Implement applyCombinedSelection helper in src/taxonomy.js
- [X] T064 [US6] Wire combined selection helper into filteredCards useMemo in src/App.jsx
- [X] T065 [US6] Update empty-state and helper copy for selection semantics in src/App.jsx
- [X] T066 [US6] Run green-phase combined-selection tests in tests/selectionLogic.test.js
- [X] T067 [US6] Refactor selection state naming consistency in src/App.jsx and src/components.jsx

**Checkpoint**: US6 is independently testable and complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks across all stories.

- [X] T068 [P] Update taxonomy implementation notes in specs/002-add-taxonomy-classification/quickstart.md
- [X] T069 Run full test suite and confirm all stories remain green in tests/taxonomy.test.js and tests/selectionLogic.test.js
- [ ] T070 Validate manual selection scenarios and ingestion fallback paths in specs/002-add-taxonomy-classification/quickstart.md
- [X] T071 [P] Run production build verification in package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Setup: starts immediately.
- Phase 2 Foundational: depends on Phase 1 and blocks all user stories.
- Phases 3-8 User Stories: depend on Phase 2 completion.
- Phase 9 Polish: depends on completion of desired user stories.

### User Story Dependencies

- US1: starts after Foundational; no dependency on other stories.
- US2: depends on US1 taxonomy source and can proceed after US1 checkpoint.
- US3: depends on US1 taxonomy source and US2 card model fields.
- US4: depends on US1 taxonomy source; can start after US1 and in parallel with late US3 work if fixtures are stable.
- US5: depends on existing category UI and can start after Foundational.
- US6: depends on US4 and US5 being complete.

### Within Each User Story

- Write tests first.
- Run red-phase tests and confirm failure.
- Implement minimum code to pass tests.
- Run green-phase tests.
- Refactor with tests still green.

## Parallel Opportunities

- Setup: T002 and T003 can run in parallel.
- Foundational: T006 and T007 can run in parallel.
- US1: T010-T012 can run in parallel.
- US2: T019-T021 can run in parallel.
- US3: T029-T032 can run in parallel.
- US4: T040-T042 can run in parallel.
- US5: T049-T051 can run in parallel.
- US6: T058-T061 can run in parallel.
- Polish: T068 and T071 can run in parallel.

---

## Parallel Example: User Story 1

- Run T010 in tests/taxonomy.test.js
- Run T011 in tests/taxonomy.test.js
- Run T012 in tests/taxonomy.test.js

## Parallel Example: User Story 2

- Run T019 in tests/csvParser.test.js
- Run T020 in tests/taxonomy.test.js
- Run T021 in tests/selectionLogic.test.js

## Parallel Example: User Story 3

- Run T029 in tests/taxonomy.test.js
- Run T030 in tests/taxonomy.test.js
- Run T031 in tests/taxonomy.test.js
- Run T032 in tests/csvParser.test.js

## Parallel Example: User Story 4

- Run T040 in tests/selectionLogic.test.js
- Run T041 in tests/selectionLogic.test.js
- Run T042 in tests/selectionLogic.test.js

## Parallel Example: User Story 5

- Run T049 in tests/selectionLogic.test.js
- Run T050 in tests/selectionLogic.test.js
- Run T051 in tests/selectionLogic.test.js

## Parallel Example: User Story 6

- Run T058 in tests/selectionLogic.test.js
- Run T059 in tests/selectionLogic.test.js
- Run T060 in tests/selectionLogic.test.js
- Run T061 in tests/selectionLogic.test.js

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) only.
3. Validate taxonomy source tests and helper outputs.
4. Demo taxonomy source-of-truth readiness.

### Incremental Delivery

1. Deliver US1 taxonomy source.
2. Deliver US2 data model fields.
3. Deliver US3 normalization.
4. Deliver US4 taxonomy selection UI.
5. Deliver US5 category mode controls.
6. Deliver US6 combined selection behavior.
7. Finish with Phase 9 polish.

### Parallel Team Strategy

1. Team aligns on Setup and Foundational tasks.
2. One engineer drives ingestion stories (US2-US3), another drives selection UI stories (US4-US5).
3. Merge on US6 combined behavior and final polish.

---

## Notes

- All tasks follow the required checklist format.
- Every story includes explicit test tasks before implementation tasks.
- Selection semantics are used in task language for new UI and state naming.
