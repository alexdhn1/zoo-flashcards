# Quickstart: CSV Import from NotebookLM

**Feature**: 001-csv-import-notebooklm
**Date**: 2026-03-23

Use this guide to validate the feature end-to-end after implementation.

---

## Prerequisites

```bash
npm install          # installs vitest devDep (added by this feature)
npm run dev          # http://localhost:5173
```

---

## Step 1 — Run unit tests (TDD red → green)

```bash
npm run test         # vitest — should all pass after implementation
```

Expected output: 8 tests passing in `tests/csvParser.test.js`.

---

## Step 2 — Manual end-to-end validation

### Happy path (US1)

1. Open http://localhost:5173 and sign in with an allowlisted Google account.
2. You are on the input view. Below the copy-paste textarea, confirm you see a
   distinct dashed drop zone labelled "Drop a NotebookLM CSV".
3. Drag `example/flashcards_example.csv` onto the drop zone.
4. **Verify**: A preview list appears showing 35 card pairs. No skipped-rows
   warning. No error message.
5. Click "Add to deck".
6. **Verify**: Toast "35 cards imported & synced" appears. App navigates to
   cards view. 35 cards are present. Sync dot is green (ok).
7. Reload the page. Sign in again if prompted.
8. **Verify**: The 35 imported cards are still present (persisted in Firestore).

### Cancel flow

1. Drop `example/flashcards_example.csv` — preview appears.
2. Click "Cancel".
3. **Verify**: Preview disappears, drop zone returns to idle, deck is unchanged.

### Error flows

| Action | Expected result |
|--------|-----------------|
| Drop a `.txt` file | Inline error: "Please drop a CSV file (.csv)" |
| Drop an empty `.csv` file (`echo "" > empty.csv`) | Inline error: "The file contains no flashcards" |
| Drop a single-column CSV (`echo "question only" > bad.csv`) | Inline error: "Format not recognized — expected two columns: question and answer" |

### Regression check (US2 / FR-011)

1. After importing CSV cards, use the copy-paste textarea to add one more card
   via the Claude format.
2. **Verify**: New card appears and syncs correctly. Existing CSV-imported cards
   are unaffected.

---

## Step 3 — Build check

```bash
npm run build        # must complete without errors
```

The `dist/` output size should not increase by more than ~1 KB compared to the
pre-feature baseline (no new production dependency was added).
