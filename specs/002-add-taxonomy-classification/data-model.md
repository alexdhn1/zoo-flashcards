# Data Model: Taxonomy-Based Species Classification

**Feature**: 002-add-taxonomy-classification  
**Date**: 2026-03-30

## Core Entities

### TaxonomyReference

Single in-repo source loaded from `src/data/taxonomy.json`.

```json
{
  "groups": [TaxonomyGroup...],
  "fallback": {
    "group": "others",
    "order": "others"
  }
}
```

Validation rules:
- Must include exactly 6 configured top-level groups for this release.
- Group ids must be unique.
- Order ids must be unique across all groups.
- Invertébrés and Poissons groups must exist with empty `orders` arrays.

### TaxonomyGroup

```json
{
  "id": "mammiferes",
  "label": "Mammifères",
  "orders": [TaxonomyOrder...]
}
```

Validation rules:
- `id`: non-empty canonical slug.
- `label`: non-empty display value.
- `orders`: array (can be empty).

### TaxonomyOrder

```json
{
  "id": "chiroptera",
  "label": "Chiroptera"
}
```

Validation rules:
- `id`: non-empty canonical slug, unique globally.
- `label`: non-empty display value for UI and matching.

### Flashcard (extended)

Canonical persisted shape with additive taxonomy metadata:

```json
{
  "id": "string",
  "question": "string",
  "answer": "string",
  "category": "string",
  "species": "string",
  "speciesLabel": "string?",
  "taxonomyGroup": "string",
  "taxonomyOrder": "string",
  "addedAt": "ISO-8601"
}
```

Validation rules:
- `taxonomyGroup` and `taxonomyOrder` are always present on newly written cards.
- Unknown/low-confidence mappings use `taxonomyGroup="others"`, `taxonomyOrder="others"`.
- `speciesLabel` is optional informational text only.

## Derived/Operational Models

### TaxonomyNormalizationResult

```json
{
  "taxonomyGroup": "string",
  "taxonomyOrder": "string",
  "score": "number",
  "matchedBy": "id|label|none"
}
```

Use:
- Produced client-side before Firebase write.
- Confidence threshold: `score >= 0.7` => canonical match, else fallback.

### TaxonomySelectionState

```json
{
  "selectedGroupId": "string|null",
  "selectedOrderId": "string|null",
  "searchQuery": "string"
}
```

Rules:
- Default `selectedGroupId=null` and `selectedOrderId=null` means include all cards.
- Selecting a group clears order-specific selection.
- Selecting an order implies one concrete target order.

### CategorySelectionState

```json
{
  "selectedCategoryIds": ["string"],
  "mode": "OR|AND"
}
```

Rules:
- Empty category selection means include all cards.
- OR mode: card matches if any selected category is present.
- AND mode: card matches only if all selected criteria are satisfied.

### CombinedSelectionResult

Input:
- `cards[]`
- `taxonomySelection`
- `categorySelection`
- `combinationMode` (`OR|AND`) across dimensions

Output:
- `selectedCards[]`

Rules:
- Empty selection in a dimension contributes include-all semantics.
- OR across dimensions returns union of dimension matches.
- AND across dimensions returns intersection of dimension matches.

## State Transitions

### Ingestion Normalization

1. Parse CSV row.
2. Extract raw taxonomy order text.
3. Normalize via Fuse.js against taxonomy ids+labels.
4. If score >= 0.7, attach canonical taxonomy group/order.
5. Else attach fallback others/others.
6. Batch-write enriched cards to Firestore.

### Study Selection Flow

1. Initial state: no taxonomy/category selection => all cards shown.
2. User selects taxonomy group or order.
3. User optionally selects categories and mode.
4. Combined selection engine recomputes visible cards.
5. If result is empty, UI shows empty-state message while preserving selection controls.
