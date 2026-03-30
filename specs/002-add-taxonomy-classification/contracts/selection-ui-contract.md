# Contract: Taxonomy and Category Selection UI

**Files**: `src/components.jsx`, `src/App.jsx`  
**Date**: 2026-03-30

## Naming and Semantics

Selection terminology is mandatory for new artifacts:
- Use `selection` in component names, props, and local state where behavior represents active study choices.
- Avoid new names that imply exclusion-only filtering.

## TaxonomySelection Component

### Purpose

Provide a searchable dropdown with:
- groups as sections
- orders as selectable items
- `Tous` reset option

### Proposed Props

```js
TaxonomySelection({
  taxonomyGroups,
  selectedGroupId,
  selectedOrderId,
  searchQuery,
  onSearchChange,
  onSelectGroup,
  onSelectOrder,
  onResetSelection
})
```

### Behavior

1. Default with no selected group/order means include-all behavior.
2. Selecting a group selects all orders in that group (OR across group orders).
3. Selecting an order selects only that order.
4. Search input narrows visible order options in real time.
5. Selecting `Tous` resets taxonomy selection to include-all.

## Category Selection Mode Contract

### Inputs

- `selectedCategories: string[]`
- `mode: 'OR' | 'AND'`

### Behavior

- OR: match cards with any selected category.
- AND: match cards satisfying all selected category criteria.
- Empty category selection means include-all for category dimension.

## Combined Selection Engine Contract

### Function Shape (pure helper)

```js
applyCombinedSelection(cards, taxonomySelection, categorySelection, dimensionMode)
```

### Rules

1. No active selection in a dimension contributes all cards for that dimension.
2. `dimensionMode='OR'` returns union across taxonomy/category dimension matches.
3. `dimensionMode='AND'` returns intersection across taxonomy/category dimension matches.
4. Output must be deterministic for same inputs.

## UI Text Contract

- Default hint text communicates selection semantics: no selection means all cards are shown.
- Reset text remains `Tous` for taxonomy.
- Empty-state messaging must describe selection result clearly without implying data loss.
