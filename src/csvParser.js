/**
 * csvParser.js
 * Pure function — no side effects, no I/O, no React/Firebase imports.
 * Parses the NotebookLM CSV export format: headerless 2-column CSV (RFC 4180).
 *
 * @param {string} text  Raw UTF-8 text of the dropped .csv file
 * @returns {{ cards: object[], skipped: number, error: string|null }}
 */
import {
  normalizeTaxonomyOrder,
  TAXONOMY_FALLBACK_GROUP,
  TAXONOMY_FALLBACK_ORDER,
} from './taxonomy.js'

export function parseCSV(text) {
  if (!text || !text.trim()) {
    return { cards: [], skipped: 0, error: 'EMPTY_FILE' }
  }

  const rows = splitCSVRows(text).filter(r => r.trim())

  if (rows.length === 0) {
    return { cards: [], skipped: 0, error: 'EMPTY_FILE' }
  }

  const cards = []
  let skipped = 0
  let formatErrors = 0

  for (const row of rows) {
    const cols = parseCSVRow(row)
    if (cols.length < 2) {
      formatErrors++
      continue
    }
    const question = cols[0].trim()
    const answer = cols[1].trim()
    const rawTaxonomyOrder = cols[2]?.trim() || ''
    const speciesLabel = cols[3]?.trim() || ''
    if (!question || !answer) {
      skipped++
      continue
    }
    const normalizedTaxonomy = normalizeTaxonomyOrder(rawTaxonomyOrder)
    cards.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      question,
      answer,
      category: '',
      species: speciesLabel,
      speciesLabel,
      taxonomyGroup: rawTaxonomyOrder ? normalizedTaxonomy.taxonomyGroup : TAXONOMY_FALLBACK_GROUP,
      taxonomyOrder: rawTaxonomyOrder ? normalizedTaxonomy.taxonomyOrder : TAXONOMY_FALLBACK_ORDER,
      addedAt: new Date().toISOString(),
    })
  }

  if (cards.length === 0) {
    if (formatErrors > 0 && skipped === 0 && formatErrors === rows.length) {
      return { cards: [], skipped: 0, error: 'FORMAT_ERROR' }
    }
    return { cards: [], skipped, error: 'EMPTY_FILE' }
  }

  return { cards, skipped, error: null }
}

/**
 * Split CSV text into rows, preserving multi-line quoted fields (RFC 4180).
 * @param {string} text
 * @returns {string[]}
 */
function splitCSVRows(text) {
  const rows = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"'
        i++ // consume escaped double-quote
      } else if (ch === '"') {
        inQuotes = false
        current += ch
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        current += ch
      } else if (ch === '\r' && next === '\n') {
        rows.push(current)
        current = ''
        i++ // skip the \n of \r\n
      } else if (ch === '\n' || ch === '\r') {
        rows.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }

  if (current) rows.push(current)
  return rows
}

/**
 * Parse a single CSV row into column values, handling RFC 4180 quoting.
 * @param {string} row
 * @returns {string[]}
 */
function parseCSVRow(row) {
  const fields = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < row.length) {
    const ch = row[i]
    const next = row[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"'
        i += 2
      } else if (ch === '"') {
        inQuotes = false
        i++
      } else {
        current += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        fields.push(current)
        current = ''
        i++
      } else {
        current += ch
        i++
      }
    }
  }

  fields.push(current)
  return fields
}
