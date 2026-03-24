# Data Model: CSV Import from NotebookLM

**Feature**: 001-csv-import-notebooklm
**Date**: 2026-03-23

## Existing Canonical Model (unchanged)

```
Flashcard {
  id:        string   — base36 timestamp + 5-char random suffix
  question:  string   — card front (non-empty)
  answer:    string   — card back (non-empty)
  category:  string   — e.g. "1 — Diagnosis" or "" (empty)
  species:   string   — e.g. "Panthera leo" or "" (empty)
  addedAt:   string   — ISO 8601 UTC timestamp
}
```

Firestore path: `users/{uid}/cards/{cardId}`

No schema changes. CSV import populates exactly this model.

---

## New Transient Model: ParseResult

Used only in-memory between file drop and user confirmation. Never stored.

```
ParseResult {
  cards:    Flashcard[]  — valid parsed cards (question + answer both non-empty)
  skipped:  number       — count of rows dropped due to empty question or answer
  error:    string|null  — 'FORMAT_ERROR' | 'EMPTY_FILE' | null
}
```

### Error values

| Value          | Meaning                                              |
|----------------|------------------------------------------------------|
| `null`         | Parse succeeded (may have skipped rows)              |
| `'EMPTY_FILE'` | File had 0 parseable rows after splitting            |
| `'FORMAT_ERROR'`| Every row had < 2 columns after RFC 4180 parsing    |

If `error` is non-null, `cards` is `[]` and no preview is shown.

---

## CSV Row → Flashcard Mapping

| CSV column | Flashcard field | Notes                        |
|------------|-----------------|------------------------------|
| Column 1   | `question`      | Trimmed; skip row if empty   |
| Column 2   | `answer`        | Trimmed; skip row if empty   |
| (absent)   | `category`      | Always `''`                  |
| (absent)   | `species`       | Always `''`                  |
| (generated)| `id`            | `Date.now().toString(36) + Math.random().toString(36).slice(2,7)` |
| (generated)| `addedAt`       | `new Date().toISOString()`   |

---

## Validation Rules

- A row is **valid** if and only if both `question.trim()` and `answer.trim()`
  are non-empty strings after parsing.
- A file is a **FORMAT_ERROR** if every single row (after splitting) has fewer
  than 2 columns (i.e., no comma found outside quotes in any row).
- A file is an **EMPTY_FILE** if it produces zero valid rows AND zero skipped
  rows (the raw text was blank or contained only whitespace/blank lines).
- If some rows are valid and some are skipped, the result is `{ cards: [...],
  skipped: N, error: null }`.

---

## State Transitions (UI)

```
idle
 │  ← drop/browse valid .csv
 ▼
parsing   (synchronous, <50ms for ≤500 rows)
 │  ← ParseResult.error !== null
 ├──────────────────────────► error (show inline message, back to idle)
 │  ← ParseResult.cards.length > 0
 ▼
preview   (shows ParseResult.cards + skipped warning if skipped > 0)
 │  ← user clicks "Cancel"
 ├──────────────────────────► idle
 │  ← user clicks "Add to deck"
 ▼
saving    (setSyncStatus('saving'), batch-write to Firestore)
 │  ← Firestore error
 ├──────────────────────────► error-toast (preview stays open for retry)
 │  ← success
 ▼
success   (toast shown, navigate to 'cards' view)
```
