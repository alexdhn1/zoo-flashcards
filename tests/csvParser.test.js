import { readFileSync } from 'node:fs'
import { describe, test, expect } from 'vitest'
import { parseCSV } from '../src/csvParser.js'

// ─────────────────────────────────────────────
//  US1 — Happy path tests (TC-01, TC-05, TC-06, TC-08)
// ─────────────────────────────────────────────

describe('US1 — Happy path parsing', () => {
  // TC-01: Full example file parses to 35 cards
  test('parses all 35 rows from flashcards_example.csv', () => {
    const text = readFileSync('./example/flashcards_example.csv', 'utf-8')
    const result = parseCSV(text)
    expect(result.error).toBeNull()
    expect(result.skipped).toBe(0)
    expect(result.cards).toHaveLength(35)
    expect(result.cards[0].question).toBe(
      "Quel est le titre de l'atelier de préparation à l'examen présenté dans le document ?"
    )
    expect(result.cards[0].answer).toBe(
      'Professional Machine Learning Engineer: Exam Readiness Workshop.'
    )
    result.cards.forEach(c => {
      expect(c.id).toBeTruthy()
      expect(c.addedAt).toBeTruthy()
      expect(c.category).toBe('')
      expect(c.species).toBe('')
    })
  })

  // TC-05: Quoted field containing a comma
  test('handles RFC 4180 quoted field with embedded comma', () => {
    const text = 'Question simple,"Answer with, a comma inside"'
    const result = parseCSV(text)
    expect(result.error).toBeNull()
    expect(result.cards).toHaveLength(1)
    expect(result.cards[0].answer).toBe('Answer with, a comma inside')
  })

  // TC-06: Accented characters preserved
  test('preserves UTF-8 accented characters', () => {
    const text = 'Café au lait,Réponse avec des accents: é à ü'
    const result = parseCSV(text)
    expect(result.error).toBeNull()
    expect(result.cards[0].question).toBe('Café au lait')
    expect(result.cards[0].answer).toBe('Réponse avec des accents: é à ü')
  })

  // TC-08: Large file (200 rows)
  test('handles 200-row CSV without truncation', () => {
    const rows = Array.from({ length: 200 }, (_, i) => `Q${i + 1},A${i + 1}`)
    const result = parseCSV(rows.join('\n'))
    expect(result.error).toBeNull()
    expect(result.skipped).toBe(0)
    expect(result.cards).toHaveLength(200)
  })
})

// ─────────────────────────────────────────────
//  US2 — Error handling tests (TC-02, TC-03, TC-04, TC-07)
// ─────────────────────────────────────────────

describe('US2 — Error handling', () => {
  // TC-02: Empty file
  test('returns EMPTY_FILE error for empty input', () => {
    expect(parseCSV('').error).toBe('EMPTY_FILE')
    expect(parseCSV('   \n\n  ').error).toBe('EMPTY_FILE')
    expect(parseCSV('').cards).toHaveLength(0)
  })

  // TC-03: Single-column file (no comma in any row)
  test('returns FORMAT_ERROR when no row has two columns', () => {
    const result = parseCSV('only one column\nanother single column')
    expect(result.error).toBe('FORMAT_ERROR')
    expect(result.cards).toHaveLength(0)
  })

  // TC-04: Mixed valid and empty rows
  test('skips rows with empty question or answer, counts them', () => {
    const text = 'Q1,A1\n,A2\nQ3,'
    const result = parseCSV(text)
    expect(result.error).toBeNull()
    expect(result.cards).toHaveLength(1)
    expect(result.skipped).toBe(2)
    expect(result.cards[0].question).toBe('Q1')
  })

  // TC-07: Whitespace-only rows treated as empty
  test('treats whitespace-only question or answer as empty (skipped)', () => {
    const result = parseCSV('   ,A1\nQ2,   ')
    expect(result.skipped).toBe(2)
    expect(result.cards).toHaveLength(0)
    expect(result.error).toBe('EMPTY_FILE')
  })
})
