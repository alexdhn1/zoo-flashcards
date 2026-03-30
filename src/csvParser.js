/**
 * csvParser.js
 * Pure function — no side effects, no I/O, no React/Firebase imports.
 * Parses two CSV flavours produced by AI tools (auto-detected):
 *
 *  • Comma-delimited (legacy/NotebookLM): Q,A[,TaxonomyOrder[,SpeciesLabel]]
 *  • Semicolon-delimited (Gems/new):      Q;A[;Category[;TaxonomyOrder]]
 *    May include a header row (Column1;Column2;…) which is automatically skipped.
 *
 * @param {string} text  Raw UTF-8 text of the dropped .csv file
 * @returns {{ cards: object[], skipped: number, error: string|null }}
 */
import {
  normalizeTaxonomyOrder,
  TAXONOMY_FALLBACK_GROUP,
  TAXONOMY_FALLBACK_ORDER,
} from './taxonomy.js'

/** Return ';' if the file clearly uses semicolons, else ',' */
function detectDelimiter(rows) {
  for (const row of rows.slice(0, 5)) {
    if (!row.trim()) continue
    const semis = (row.match(/;/g) || []).length
    const commas = (row.match(/,/g) || []).length
    if (semis > 0 || commas > 0) return semis >= commas ? ';' : ','
  }
  return ','
}

/**
 * Return true when a parsed row looks like a column-header row.
 * Only matches "Column1"-style patterns from Gems/AI-generated exports,
 * to avoid false-positives on rows whose question happens to be "Question".
 */
function isHeaderRow(cols) {
  if (!cols.length) return false
  const first = cols[0].trim().toLowerCase()
  return /^column\d+$/.test(first)
}

export function parseCSV(text) {
  if (!text || !text.trim()) {
    return { cards: [], skipped: 0, error: 'EMPTY_FILE' }
  }

  const rawRows = splitCSVRows(text).filter(r => r.trim())

  if (rawRows.length === 0) {
    return { cards: [], skipped: 0, error: 'EMPTY_FILE' }
  }

  const delimiter = detectDelimiter(rawRows)
  const isSemicolon = delimiter === ';'

  const cards = []
  let skipped = 0
  let formatErrors = 0
  let firstDataRow = true

  for (const row of rawRows) {
    const cols = parseCSVRow(row, delimiter)

    // Skip header row (first row only)
    if (firstDataRow) {
      firstDataRow = false
      if (isHeaderRow(cols)) continue
    }

    if (cols.length < 2) {
      formatErrors++
      continue
    }

    const question = cols[0].trim()
    const answer = cols[1].trim()

    if (!question || !answer) {
      skipped++
      continue
    }

    let category = ''
    let rawTaxonomyOrder = ''
    let speciesLabel = ''

    if (isSemicolon) {
      // Semicolon format: Q ; A ; Category ; TaxonomyOrder
      category = cols[2]?.trim() || ''
      rawTaxonomyOrder = cols[3]?.trim() || ''
    } else {
      // Comma format (legacy): Q , A [, TaxonomyOrder [, SpeciesLabel]]
      rawTaxonomyOrder = cols[2]?.trim() || ''
      speciesLabel = cols[3]?.trim() || ''
    }

    const normalizedTaxonomy = rawTaxonomyOrder
      ? normalizeTaxonomyOrder(rawTaxonomyOrder)
      : null

    cards.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      question,
      answer,
      category,
      species: speciesLabel,
      speciesLabel,
      taxonomyGroup: normalizedTaxonomy ? normalizedTaxonomy.taxonomyGroup : TAXONOMY_FALLBACK_GROUP,
      taxonomyOrder: normalizedTaxonomy ? normalizedTaxonomy.taxonomyOrder : TAXONOMY_FALLBACK_ORDER,
      addedAt: new Date().toISOString(),
    })
  }

  if (cards.length === 0) {
    if (formatErrors > 0 && skipped === 0 && formatErrors === rawRows.length) {
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
 * @param {string} [delimiter=',']
 * @returns {string[]}
 */
function parseCSVRow(row, delimiter = ',') {
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
      } else if (ch === delimiter) {
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
