# Research: CSV Import from NotebookLM

**Feature**: 001-csv-import-notebooklm
**Date**: 2026-03-23

## Decision Log

---

### D-001: CSV Parsing Strategy

**Decision**: Hand-rolled parser in `src/csvParser.js`, no third-party library.

**Rationale**: The NotebookLM format (`example/flashcards_example.csv`) is a
simple 2-column, headerless CSV. Fields containing commas are double-quoted per
RFC 4180. The existing `parser.js` already demonstrates the project's preference
for in-house regex/string parsing over dependencies. A bespoke function keeps the
bundle size unchanged and is trivially unit-testable as a pure function.

**Alternatives considered**:
- `papaparse` — feature-rich but adds ~30 KB and violates the no-new-deps
  constitution principle.
- Native `text.split(',')` — too naive; fails on quoted fields containing commas
  (e.g., row 11 of the example CSV: `"...Webassessor, de préférence..."`).
- `csv-parse` (streaming) — overkill for a ≤500-row client-side file.

---

### D-002: Drag-and-Drop Implementation

**Decision**: Native HTML5 Drag and Drop API (`dragover`, `dragleave`, `drop`
events on a `<div>`), with a hidden `<input type="file" accept=".csv">` for
click-to-browse fallback.

**Rationale**: The same pattern is already used in `App.jsx` for JSON import
(`fileRef` + `<input type="file" accept=".json">`). Reusing this pattern keeps
the approach consistent. No library needed for a single drop zone.

**Alternatives considered**:
- `react-dropzone` — popular but adds a dependency. The native API is sufficient.

---

### D-003: File Reading

**Decision**: `FileReader.readAsText(file, 'utf-8')` inside the `drop` /
`change` event handler, identical to the existing JSON import in `App.jsx`
(`handleImport`).

**Rationale**: Already in use in the codebase. Zero new API surface.

---

### D-004: Test Framework

**Decision**: Add `vitest` as a **devDependency only**.

**Rationale**: The user's mandate — "TDD is NON-NEGOTIABLE" — requires a test
runner. The constitution notes "No test framework is configured" as a current
state, not a permanent constraint. Vitest is the zero-config companion to Vite:
it reuses `vite.config.js`, supports ES modules natively, and runs in a jsdom
environment suitable for pure-function tests. It is a **devDependency** that
adds nothing to the production bundle.

This is a justified, minimal constitution deviation (see Complexity Tracking in
plan.md). It is the least intrusive addition possible to honour TDD.

**Alternatives considered**:
- Jest — requires Babel transformation for ES modules; incompatible with the
  project's `"type": "module"` without significant config overhead.
- Manual browser testing only — satisfies the constitution but violates TDD.
- Node `assert` + `node --test` — no React/browser globals; breaks for any code
  that imports browser APIs (FileReader, Blob).

---

### D-005: Preview UI Placement

**Decision**: The CSV import zone and preview are placed **below the copy-paste
textarea** in the existing input view (`view === 'input'`). No new route or
screen is created.

**Rationale**: Spec FR-010 forbids touching the existing paste flow. Constitution
Principle IV prohibits introducing a router. A single additional UI block in the
same view satisfies both.

---

### D-006: Card ID Generation

**Decision**: Reuse the same ID generation pattern already in the codebase:
```js
Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
```
`addedAt` is `new Date().toISOString()` at parse time, same as `handleImport`.

**Rationale**: Consistency with existing code. No UUID library needed.

---

### D-007: Category & Species Defaults

**Decision**: `category` and `species` default to `''` (empty string) for all
CSV-imported cards.

**Rationale**: The NotebookLM CSV has no category/species columns. Empty string
is the existing model default (JSON import already does this). `getCatNum('')`
returns `'0'` (uncategorized) and the filter chip for `'0'` is simply not
rendered if no uncategorized cards exist — no UI change needed.

---

### NEEDS CLARIFICATION — Resolved

None. All decisions derived from the spec, the example CSV, and the codebase.
