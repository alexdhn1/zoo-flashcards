import { describe, expect, test } from 'vitest'
import {
  applyCombinedSelection,
  filterTaxonomyGroups,
  getSafeSelectedIndex,
  getTaxonomyGroups,
  normalizeCardTaxonomy,
} from '../src/taxonomy.js'
import { selectionCards } from './fixtures/selectionCards.js'
import { getTestTaxonomyReference } from './fixtures/taxonomyReference.js'

describe('Foundational selection scaffolding', () => {
  test('shared fixtures and helper imports resolve', () => {
    expect(selectionCards).toHaveLength(3)
    expect(getTestTaxonomyReference()).toBeDefined()
    expect(applyCombinedSelection(selectionCards).map(card => card.id)).toEqual([
      'legacy-1',
      'bird-1',
      'mammal-1',
    ])
  })

  test('legacy cards are safe to use in later selection logic', () => {
    const normalized = normalizeCardTaxonomy(selectionCards[0])
    expect(normalized.taxonomyGroup).toBe('others')
    expect(normalized.taxonomyOrder).toBe('others')
  })
})

describe('US4 — taxonomy selection behavior', () => {
  test('returns all cards when no taxonomy selection is active', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: null,
      selectedOrderId: null,
    }, {
      selectedCategoryIds: [],
      mode: 'AND',
    }, 'AND')

    expect(result.map(card => card.id)).toEqual(['legacy-1', 'bird-1', 'mammal-1'])
  })

  test('returns all cards from the selected taxonomy group', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: 'oiseaux',
      selectedOrderId: null,
    }, {
      selectedCategoryIds: [],
      mode: 'AND',
    }, 'AND')

    expect(result.map(card => card.id)).toEqual(['bird-1'])
  })

  test('returns only cards from the selected taxonomy order', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: null,
      selectedOrderId: 'canidae',
    }, {
      selectedCategoryIds: [],
      mode: 'AND',
    }, 'AND')

    expect(result.map(card => card.id)).toEqual(['mammal-1'])
  })

  test('resets back to include-all when selection is cleared', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: null,
      selectedOrderId: null,
    }, {
      selectedCategoryIds: [],
      mode: 'AND',
    }, 'AND')

    expect(result).toHaveLength(selectionCards.length)
  })

  test('filters grouped taxonomy options by search query in real time', () => {
    const result = filterTaxonomyGroups(getTaxonomyGroups(), 'apes')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('mammiferes')
    expect(result[0].orders.map(order => order.id)).toEqual(['great_apes'])
  })
})

describe('US5 — category selection modes', () => {
  test('category OR mode returns cards matching any selected category', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: null,
      selectedOrderId: null,
    }, {
      selectedCategoryIds: ['1', '2'],
      mode: 'OR',
    }, 'AND')

    expect(result.map(card => card.id)).toEqual(['legacy-1', 'bird-1'])
  })

  test('category AND mode returns no cards when multiple exclusive categories are selected', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: null,
      selectedOrderId: null,
    }, {
      selectedCategoryIds: ['1', '2'],
      mode: 'AND',
    }, 'AND')

    expect(result).toEqual([])
  })

  test('empty category selection keeps include-all behavior', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: null,
      selectedOrderId: null,
    }, {
      selectedCategoryIds: [],
      mode: 'OR',
    }, 'AND')

    expect(result).toHaveLength(selectionCards.length)
  })
})

describe('US6 — combined selection state', () => {
  test('OR dimension mode returns the union of taxonomy and category matches', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: null,
      selectedOrderId: 'psittaciformes',
    }, {
      selectedCategoryIds: ['1'],
      mode: 'OR',
    }, 'OR')

    expect(result.map(card => card.id)).toEqual(['legacy-1', 'bird-1'])
  })

  test('AND dimension mode returns the intersection of taxonomy and category matches', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: null,
      selectedOrderId: 'psittaciformes',
    }, {
      selectedCategoryIds: ['2'],
      mode: 'OR',
    }, 'AND')

    expect(result.map(card => card.id)).toEqual(['bird-1'])
  })

  test('mixed empty and non-empty selections preserve include-all semantics', () => {
    const result = applyCombinedSelection(selectionCards, {
      selectedGroupId: 'mammiferes',
      selectedOrderId: null,
    }, {
      selectedCategoryIds: [],
      mode: 'OR',
    }, 'AND')

    expect(result.map(card => card.id)).toEqual(['mammal-1'])
  })

  test('clamps the active card index when result sets shrink', () => {
    expect(getSafeSelectedIndex(2, 0)).toBe(0)
    expect(getSafeSelectedIndex(2, 1)).toBe(0)
    expect(getSafeSelectedIndex(1, 3)).toBe(1)
  })
})