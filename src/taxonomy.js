import Fuse from 'fuse.js'
import { getCatNum } from './categories.js'
import taxonomyReference from './data/taxonomy.json'

export const TAXONOMY_FALLBACK_GROUP = taxonomyReference.fallback?.group || 'others'
export const TAXONOMY_FALLBACK_ORDER = taxonomyReference.fallback?.order || 'others'

export function getTaxonomyReference() {
  return taxonomyReference
}

export function getTaxonomyGroups() {
  return taxonomyReference.groups || []
}

export function getAllTaxonomyOrders() {
  return getTaxonomyGroups().flatMap(group =>
    (group.orders || []).map(order => ({
      ...order,
      groupId: group.id,
      groupLabel: group.label,
    }))
  )
}

function normalizeSearchValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function getTaxonomySearchEntries() {
  return getAllTaxonomyOrders().map(order => ({
    ...order,
    normalizedId: normalizeSearchValue(order.id),
    normalizedLabel: normalizeSearchValue(order.label),
  }))
}

function getTaxonomyFallback(reference = taxonomyReference) {
  return {
    taxonomyGroup: reference.fallback?.group || TAXONOMY_FALLBACK_GROUP,
    taxonomyOrder: reference.fallback?.order || TAXONOMY_FALLBACK_ORDER,
  }
}

function getTaxonomyFuse() {
  return new Fuse(getTaxonomySearchEntries(), {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.4,
    keys: ['id', 'label', 'normalizedId', 'normalizedLabel'],
  })
}

export function normalizeTaxonomyOrder(rawOrder, reference = taxonomyReference, options = {}) {
  const threshold = options.threshold ?? 0.7
  const query = normalizeSearchValue(rawOrder)
  const fallback = getTaxonomyFallback(reference)

  if (!query) {
    return {
      ...fallback,
      score: 0,
      matchedBy: 'none',
    }
  }

  const exact = getTaxonomySearchEntries().find(entry =>
    entry.id === rawOrder ||
    entry.label === rawOrder ||
    entry.normalizedId === query ||
    entry.normalizedLabel === query
  )

  if (exact) {
    const rawText = String(rawOrder || '').trim().toLowerCase()
    const matchedBy = rawText === String(exact.id).toLowerCase() ? 'id' : 'label'
    return {
      taxonomyGroup: exact.groupId,
      taxonomyOrder: exact.id,
      score: 1,
      matchedBy,
    }
  }

  const [bestMatch] = getTaxonomyFuse().search(query)
  if (!bestMatch) {
    return {
      ...fallback,
      score: 0,
      matchedBy: 'none',
    }
  }

  const similarity = 1 - (bestMatch.score ?? 1)
  if (similarity < threshold) {
    return {
      ...fallback,
      score: similarity,
      matchedBy: 'none',
    }
  }

  return {
    taxonomyGroup: bestMatch.item.groupId,
    taxonomyOrder: bestMatch.item.id,
    score: similarity,
    matchedBy: bestMatch.item.normalizedId.includes(query) ? 'id' : 'label',
  }
}

export function normalizeCardTaxonomy(card) {
  return {
    ...card,
    taxonomyGroup: card.taxonomyGroup || TAXONOMY_FALLBACK_GROUP,
    taxonomyOrder: card.taxonomyOrder || TAXONOMY_FALLBACK_ORDER,
    speciesLabel: card.speciesLabel || '',
  }
}

export function filterTaxonomyGroups(groups, searchQuery) {
  const query = normalizeSearchValue(searchQuery)
  if (!query) {
    return groups
  }

  return groups
    .map(group => {
      const groupMatches = normalizeSearchValue(group.id).includes(query) || normalizeSearchValue(group.label).includes(query)
      if (groupMatches) {
        return group
      }

      const matchedOrders = (group.orders || []).filter(order =>
        normalizeSearchValue(order.id).includes(query) || normalizeSearchValue(order.label).includes(query)
      )

      if (matchedOrders.length === 0) {
        return null
      }

      return {
        ...group,
        orders: matchedOrders,
      }
    })
    .filter(Boolean)
}

function getCardCategoryIds(card) {
  const categoryId = getCatNum(card.category || '')
  return categoryId === '0' ? [] : [categoryId]
}

export function applyTaxonomySelection(cards, taxonomySelection = {}) {
  const normalizedCards = cards.map(normalizeCardTaxonomy)
  const selectedOrderId = taxonomySelection.selectedOrderId || null
  const selectedGroupId = taxonomySelection.selectedGroupId || null

  if (!selectedGroupId && !selectedOrderId) {
    return normalizedCards
  }

  return normalizedCards.filter(card => {
    if (selectedOrderId) {
      return card.taxonomyOrder === selectedOrderId
    }
    return card.taxonomyGroup === selectedGroupId
  })
}

export function applyCategorySelection(cards, categorySelection = {}) {
  const normalizedCards = cards.map(normalizeCardTaxonomy)
  const selectedCategoryIds = categorySelection.selectedCategoryIds || []
  const mode = categorySelection.mode || 'OR'

  if (selectedCategoryIds.length === 0) {
    return normalizedCards
  }

  return normalizedCards.filter(card => {
    const cardCategoryIds = getCardCategoryIds(card)
    if (mode === 'AND') {
      return selectedCategoryIds.every(categoryId => cardCategoryIds.includes(categoryId))
    }
    return selectedCategoryIds.some(categoryId => cardCategoryIds.includes(categoryId))
  })
}

export function applyCombinedSelection(cards, taxonomySelection = {}, categorySelection = {}, dimensionMode = 'AND') {
  const normalizedCards = cards.map(normalizeCardTaxonomy)
  const hasTaxonomySelection = Boolean(taxonomySelection.selectedGroupId || taxonomySelection.selectedOrderId)
  const hasCategorySelection = Boolean((categorySelection.selectedCategoryIds || []).length)

  if (!hasTaxonomySelection && !hasCategorySelection) {
    return normalizedCards
  }

  const taxonomyMatches = hasTaxonomySelection ? applyTaxonomySelection(normalizedCards, taxonomySelection) : normalizedCards
  const categoryMatches = hasCategorySelection ? applyCategorySelection(normalizedCards, categorySelection) : normalizedCards

  if (hasTaxonomySelection && hasCategorySelection) {
    if (dimensionMode === 'OR') {
      const unionIds = new Set([...taxonomyMatches, ...categoryMatches].map(card => card.id))
      return normalizedCards.filter(card => unionIds.has(card.id))
    }

    const categoryIds = new Set(categoryMatches.map(card => card.id))
    return taxonomyMatches.filter(card => categoryIds.has(card.id))
  }

  return hasTaxonomySelection ? taxonomyMatches : categoryMatches
}

export function getSafeSelectedIndex(currentIndex, totalCount) {
  if (totalCount <= 0) {
    return 0
  }

  return Math.min(Math.max(currentIndex, 0), totalCount - 1)
}