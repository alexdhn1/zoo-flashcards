# Research: Taxonomy-Based Species Classification

**Feature**: 002-add-taxonomy-classification  
**Date**: 2026-03-30

## Decision Log

### D-001: Single Source of Truth for Taxonomy

**Decision**: Store all valid taxonomy groups/orders in `src/data/taxonomy.json` and load from helpers in `src/taxonomy.js`.

**Rationale**: UI options and ingestion normalization must remain aligned. A single JSON source prevents drift between dropdown entries and normalization candidates.

**Alternatives considered**:
- Hardcoded arrays in multiple components: rejected due to duplication risk.
- Firestore-hosted taxonomy config: rejected because spec requires a local JSON source and no backend work.

### D-002: Canonical Identity and Display Naming

**Decision**: Each taxonomy group and order entry includes an `id` (canonical slug) and `label` (display text).

**Rationale**: `id` gives stable matching and persisted values; `label` supports UX and multilingual matching.

**Alternatives considered**:
- Label-only model: rejected because labels can change and may not be unique enough.
- Id-only model: rejected because UI requires human-readable names.

### D-003: Resolve Count Mismatch in Prompt

**Decision**: Treat the explicit Fowler lists as authoritative and encode exactly those listed orders; keep fallback `others` for unmatched values.

**Rationale**: The prompt includes both a numeric total and explicit lists that do not perfectly align. Explicit enumerations are less ambiguous than an aggregate count.

**Alternatives considered**:
- Infer missing orders to force the stated count: rejected because this would invent taxonomy entries not provided by user input.
- Block planning for clarification: rejected because spec assumptions already document this decision.

### D-004: Fuzzy Matching Engine

**Decision**: Use Fuse.js for taxonomy order normalization with threshold `0.7`, matching against both order `id` and `label`.

**Rationale**: Requirement explicitly asks for Fuse.js and confidence-based fallback behavior. Matching both fields improves robustness for Latin/French/English variants and spelling noise.

**Alternatives considered**:
- Levenshtein-only custom logic: rejected because Fuse.js is explicitly requested.
- Exact-match-only normalization: rejected because variant tolerance is required.

### D-005: Fallback Behavior for Unrecognized Input

**Decision**: If confidence is below `0.7` (or input is empty), set `taxonomyGroup="others"` and `taxonomyOrder="others"` before Firebase write.

**Rationale**: Ensures all imported cards remain classifiable and queryable even when source text is noisy.

**Alternatives considered**:
- Persist raw unknown value: rejected because canonical write format is required.
- Reject row import: rejected because spec requires fallback, not rejection.

### D-006: Selection Model Semantics

**Decision**: Use “selection” terminology and include-all defaults: no taxonomy selection means all cards are shown; selecting narrows to chosen subsets.

**Rationale**: Prompt explicitly disambiguates selection from exclusionary filtering and requires this reflected in naming/copy.

**Alternatives considered**:
- Keep current “filter” naming in new code: rejected to avoid semantic confusion and requirement mismatch.
- Force default preselected taxonomy: rejected because default must represent no active selection.

### D-007: TDD Strategy Across Stories

**Decision**: Use Vitest unit tests as mandatory red-green-refactor gate for each user story, with pure helper modules for selection and normalization logic.

**Rationale**: Strict TDD is non-negotiable in the request; pure-function seams make deterministic tests practical.

**Alternatives considered**:
- UI-first implementation then tests: rejected by TDD rule.
- Manual-only checks: rejected as insufficient.

## NEEDS CLARIFICATION Resolution

No unresolved clarifications remain after decisions above. All technical unknowns were resolved within project constraints and documented assumptions.
