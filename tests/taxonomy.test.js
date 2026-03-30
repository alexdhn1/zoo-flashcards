import { describe, expect, test } from 'vitest'
import {
  getAllTaxonomyOrders,
  getTaxonomyGroups,
  normalizeTaxonomyOrder,
  normalizeCardTaxonomy,
  TAXONOMY_FALLBACK_GROUP,
  TAXONOMY_FALLBACK_ORDER,
} from '../src/taxonomy.js'
import { parseFlashcards } from '../src/parser.js'

describe('US1 — taxonomy reference schema', () => {
  test('includes the six required taxonomy groups', () => {
    const groups = getTaxonomyGroups()
    expect(groups).toHaveLength(6)
    expect(groups.map(group => group.label)).toEqual([
      'Amphibiens',
      'Reptiles',
      'Oiseaux',
      'Mammifères',
      'Invertébrés',
      'Poissons',
    ])
  })

  test('exposes globally unique order ids', () => {
    const orderIds = getAllTaxonomyOrders().map(order => order.id)
    expect(orderIds.length).toBeGreaterThan(0)
    expect(new Set(orderIds).size).toBe(orderIds.length)
  })

  test('includes empty Invertébrés and Poissons groups without breaking helpers', () => {
    const groups = getTaxonomyGroups()
    const invertebres = groups.find(group => group.label === 'Invertébrés')
    const poissons = groups.find(group => group.label === 'Poissons')

    expect(invertebres).toBeDefined()
    expect(poissons).toBeDefined()
    expect(invertebres.orders).toEqual([])
    expect(poissons.orders).toEqual([])
  })

  test('exposes fallback constants separately from configured taxonomy orders', () => {
    const orderIds = getAllTaxonomyOrders().map(order => order.id)
    expect(TAXONOMY_FALLBACK_GROUP).toBe('others')
    expect(TAXONOMY_FALLBACK_ORDER).toBe('others')
    expect(orderIds).not.toContain(TAXONOMY_FALLBACK_ORDER)
  })
})

describe('US2 — taxonomy fields in card models', () => {
  test('adds taxonomy defaults to text-ingested flashcards', () => {
    const parsed = parseFlashcards(`FLASHCARD 1\nQ: What is it?\nA: It works\nSpecies: Iguana iguana`)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].taxonomyGroup).toBe(TAXONOMY_FALLBACK_GROUP)
    expect(parsed[0].taxonomyOrder).toBe(TAXONOMY_FALLBACK_ORDER)
    expect(parsed[0].speciesLabel).toBe('Iguana iguana')
  })

  test('normalizes legacy cards missing taxonomy fields to fallback values', () => {
    const normalized = normalizeCardTaxonomy({
      id: 'legacy-card',
      question: 'Legacy',
      answer: 'Card',
      category: '1 — Diagnosis',
      species: 'Panthera leo',
      addedAt: '2026-03-30T00:00:00.000Z',
    })

    expect(normalized.taxonomyGroup).toBe(TAXONOMY_FALLBACK_GROUP)
    expect(normalized.taxonomyOrder).toBe(TAXONOMY_FALLBACK_ORDER)
    expect(normalized.speciesLabel).toBe('')
  })
})

describe('US3 — taxonomy normalization', () => {
  test('resolves an exact canonical id', () => {
    const result = normalizeTaxonomyOrder('canidae')
    expect(result.taxonomyGroup).toBe('mammiferes')
    expect(result.taxonomyOrder).toBe('canidae')
    expect(result.matchedBy).toBe('id')
    expect(result.score).toBeGreaterThanOrEqual(0.7)
  })

  test('resolves a label variant to the canonical id', () => {
    const result = normalizeTaxonomyOrder('Great Apes')
    expect(result.taxonomyGroup).toBe('mammiferes')
    expect(result.taxonomyOrder).toBe('great_apes')
    expect(result.matchedBy).toBe('label')
    expect(result.score).toBeGreaterThanOrEqual(0.7)
  })

  test('resolves a near-match misspelling above threshold', () => {
    const result = normalizeTaxonomyOrder('psitaciformes')
    expect(result.taxonomyGroup).toBe('oiseaux')
    expect(result.taxonomyOrder).toBe('psittaciformes')
    expect(result.score).toBeGreaterThanOrEqual(0.7)
  })

  test('falls back to others for low-confidence input', () => {
    const result = normalizeTaxonomyOrder('mysterious blob')
    expect(result.taxonomyGroup).toBe('others')
    expect(result.taxonomyOrder).toBe('others')
    expect(result.matchedBy).toBe('none')
    expect(result.score).toBeLessThan(0.7)
  })

  test('falls back to others for empty input', () => {
    const result = normalizeTaxonomyOrder('   ')
    expect(result.taxonomyGroup).toBe('others')
    expect(result.taxonomyOrder).toBe('others')
    expect(result.matchedBy).toBe('none')
    expect(result.score).toBe(0)
  })
})