# Contract: Taxonomy Normalization API

**Module**: `src/taxonomy.js`  
**Date**: 2026-03-30

## Function: normalizeTaxonomyOrder

### Signature

```js
normalizeTaxonomyOrder(rawOrder, taxonomyReference, options?)
```

### Parameters

- `rawOrder: string | null | undefined`
- `taxonomyReference: TaxonomyReference`
- `options?: { threshold?: number }` (default threshold `0.7`)

### Return Value

```js
{
  taxonomyGroup: string,
  taxonomyOrder: string,
  score: number,
  matchedBy: 'id' | 'label' | 'none'
}
```

## Behavior Contract

1. Build Fuse.js index over all taxonomy orders using both `id` and `label` fields.
2. Normalize raw input (`trim`, lowercase) before search.
3. If best score meets threshold (`>= 0.7`), return canonical `taxonomyOrder` id and owning `taxonomyGroup` id.
4. If no acceptable match, return fallback `taxonomyGroup='others'` and `taxonomyOrder='others'` with `matchedBy='none'`.
5. Empty/null input returns fallback immediately.

## Ingestion Integration Contract

During CSV import, normalization must occur before each card is written to Firestore.
Persisted card fields must use `taxonomyGroup` and `taxonomyOrder` from this function output.

## Non-Goals

- No server-side normalization.
- No mutation of taxonomy reference.
