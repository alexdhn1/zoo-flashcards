# Quickstart: Taxonomy-Based Species Classification

**Feature**: 002-add-taxonomy-classification  
**Date**: 2026-03-30

## Prerequisites

```bash
npm install
```

## TDD Workflow (Mandatory for Every Story)

Use this cycle for each user story:

1. Write the listed unit tests first.
2. Run tests and confirm failure (red):

```bash
npm test
```

3. Implement minimal code to satisfy failing tests.
4. Re-run tests until green:

```bash
npm test
```

5. Refactor without behavior changes.
6. Re-run tests and keep green.

## Story-by-Story Execution Checklist

### US1 taxonomy source

- Add failing tests in `tests/taxonomy.test.js` for structure, uniqueness, and empty groups.
- Implement `src/data/taxonomy.json` and taxonomy loading helpers.
- Re-run tests to green.

### US2 Firebase data model

- Add failing tests that new card objects include taxonomy fields.
- Implement parser/card-shaping updates in ingestion paths.
- Re-run tests to green.

### US3 Fuse.js normalization

- Add failing tests for exact match, variant match, misspelling, and fallback.
- Install Fuse.js and implement normalization helper.
- Re-run tests to green.

### US4 Taxonomy selection UI

- Add failing tests for no-selection include-all, group selection, order selection, reset, and search behavior.
- Implement searchable grouped dropdown and selection state wiring.
- Re-run tests to green.

### US5 Category selection modes

- Add failing tests for OR/AND category semantics.
- Implement category mode toggle and selection logic updates.
- Re-run tests to green.

### US6 Combined selection state

- Add failing tests for OR/AND across taxonomy and category dimensions.
- Implement combined selection engine and index-reset safety.
- Re-run tests to green.

## Manual Validation

After tests are green for all stories:

1. Run dev server:

```bash
npm run dev
```

2. Validate UI behavior:
- Default state shows all cards when nothing is selected.
- Taxonomy dropdown shows grouped orders with real-time search.
- Group and order selections produce expected subsets.
- `Tous` clears taxonomy selection.
- Category OR/AND modes combine correctly with taxonomy selection.
- `AND` mode narrows to the intersection of taxonomy and category selections.
- `OR` mode expands to the union of taxonomy and category selections.

3. Validate ingestion behavior:
- Import CSV rows with known and unknown taxonomy order values.
- Confirm saved cards include canonical taxonomy group/order or others/others fallback.
- Optional CSV column 3 is treated as raw taxonomy order input.
- Optional CSV column 4 is treated as `speciesLabel` display text.

4. Build sanity check:

```bash
npm run build
```
