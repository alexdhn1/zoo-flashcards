# Contract: UI Components

**File**: `src/components.jsx` (additions)
**Date**: 2026-03-23

---

## Component: `CsvImportZone`

The primary UI surface for the CSV import feature. Rendered in `App.jsx` inside
the input view, below the copy-paste textarea.

### Props

```js
CsvImportZone({
  onImport:    (cards: Flashcard[]) => void,  // called on confirmed import
  disabled:    boolean,                        // true while syncStatus === 'saving'
})
```

### Internal state (managed inside component)

| State         | Type                    | Initial  | Description                          |
|---------------|-------------------------|----------|--------------------------------------|
| `dragOver`    | boolean                 | false    | true while a file is being dragged over |
| `preview`     | Flashcard[] \| null     | null     | parsed cards awaiting confirmation   |
| `skipped`     | number                  | 0        | rows skipped during parse            |
| `error`       | string \| null          | null     | inline error message                 |

### Behaviour contract

1. **Idle state**: Renders a dashed drop zone with label "Drop a NotebookLM CSV".
   `dragOver=true` applies a highlighted visual state (darker border + background).
2. **File received** (drop or click-to-browse):
   - Accept only `.csv` extension and/or `text/csv` MIME type.
   - Read file as UTF-8 text; call `parseCSV(text)`.
   - If `result.error !== null` → set `error` message, stay in idle state.
   - If `result.cards.length > 0` → set `preview = result.cards`, `skipped = result.skipped`.
3. **Preview state**: Renders a scrollable list of cards (question / answer pairs).
   Shows a skipped-rows warning if `skipped > 0`.
   Renders "Add to deck" (primary) and "Cancel" (secondary) buttons.
4. **Confirm**: Calls `onImport(preview)`. Parent (`App.jsx`) handles Firestore
   write and navigation. `disabled` prop blocks the button while saving.
5. **Cancel**: Resets all internal state to initial values.
6. **New file while preview open**: New drop replaces `preview` (implicit cancel).

### Visual distinction from paste area

The import zone MUST use a dashed border and a background colour that differs from
the `<textarea>` above it. Suggested: `border: 2px dashed #d6d3d0`, `background:
#fafaf9`. Exact values are implementation choices; the key requirement is visual
separation.

---

## Component: `CsvPreviewList` (optional sub-component)

May be extracted from `CsvImportZone` if the preview list logic exceeds ~40 lines.

### Props

```js
CsvPreviewList({
  cards:    Flashcard[],
  skipped:  number,
})
```

Renders a scrollable ordered list. Each item shows `card.question` and
`card.answer`. If `skipped > 0`, renders a top warning banner:
`"{skipped} row(s) skipped — missing question or answer"`.
