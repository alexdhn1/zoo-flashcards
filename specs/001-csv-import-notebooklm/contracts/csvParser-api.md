# Contract: csvParser.js

**Module**: `src/csvParser.js`
**Type**: Pure function — no side effects, no I/O, no React imports.
**Date**: 2026-03-23

---

## Function: `parseCSV(text)`

### Signature

```js
export function parseCSV(text: string): ParseResult
```

### Input

| Param | Type   | Description                                      |
|-------|--------|--------------------------------------------------|
| text  | string | Raw UTF-8 text content of the dropped .csv file  |

### Output: `ParseResult`

```js
{
  cards:   Array<Flashcard>,  // valid parsed cards, length >= 0
  skipped: number,            // rows dropped (empty Q or A), >= 0
  error:   string | null      // 'FORMAT_ERROR' | 'EMPTY_FILE' | null
}
```

When `error !== null`, `cards` is always `[]` and `skipped` is `0`.

### Behaviour

1. Split text into lines. Ignore blank lines.
2. Parse each non-blank line as a single RFC 4180 CSV row (support quoted fields
   that contain commas and/or embedded newlines in a multi-line quoted field).
3. For each row:
   - If the row has fewer than 2 columns → treat as a format-error candidate.
   - If column 1 (`question`) or column 2 (`answer`) trims to `''` → skip the
     row, increment `skipped`.
   - Otherwise → build a `Flashcard` with generated `id` and `addedAt`, push to
     `cards`.
4. After processing all rows:
   - If `cards.length === 0 && skipped === 0` → `error = 'EMPTY_FILE'`
   - If every row that existed had < 2 columns (none had ≥ 2) → `error = 'FORMAT_ERROR'`
   - Otherwise → `error = null`

### Pure function guarantees

- Same input always produces cards with the same `question`/`answer`/`category`/
  `species` values. `id` and `addedAt` are generated at call time and will differ
  between invocations — tests MUST NOT assert on their exact values, only that they
  are truthy strings.
- Does not call `fetch`, `FireStore`, `FileReader`, `document`, or `window`.

---

## Acceptance criteria (for TDD)

These are the behaviours that unit tests MUST cover before any implementation:

| Test ID | Input                              | Expected output                                  |
|---------|------------------------------------|--------------------------------------------------|
| TC-01   | Full `flashcards_example.csv` text | `{ cards: [35 items], skipped: 0, error: null }` |
| TC-02   | `''` (empty string)                | `{ cards: [], skipped: 0, error: 'EMPTY_FILE' }` |
| TC-03   | `"only one column\nanother row"`   | `{ cards: [], skipped: 0, error: 'FORMAT_ERROR'}`|
| TC-04   | `"Q1,A1\n,A2\nQ3,"`               | `{ cards: [1 item], skipped: 2, error: null }`   |
| TC-05   | `"Q1,\"ans, with comma\""`         | `{ cards: [1 item, answer='ans, with comma'], …}`|
| TC-06   | `"Café,Réponse avec accent"`       | question=`Café`, answer=`Réponse avec accent`    |
| TC-07   | `"   ,A1\nQ2,   "`                 | `{ cards: [], skipped: 2, error: 'EMPTY_FILE' }` |
| TC-08   | 200-row CSV                        | `{ cards: [200 items], skipped: 0, error: null }`|
