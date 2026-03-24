<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Modified principles:
  - Principle II: "Claude-Powered Ingestion Pipeline" — updated to list CSV as
    third ingestion path (alongside Claude paste and JSON import)
Added sections: none
Removed sections: none
Templates requiring updates: none (existing templates remain valid)
Deferred TODOs: none

--- Prior report (v1.0.0, 2026-03-23) ---
Version change: (none — initial fill) → 1.0.0
Modified principles: N/A (all placeholders replaced for the first time)
Added sections:
  - Core Principles (5 principles derived from codebase)
  - Technology Stack
  - Development Workflow
  - Governance
Removed sections: none (template comments stripped)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅
  - .specify/templates/spec-template.md ✅
  - .specify/templates/tasks-template.md ✅
Deferred TODOs:
  - TODO(RATIFICATION_DATE): first formal adoption assumed to be 2026-03-23;
    update if a prior agreement date is known.
-->

# Zoo Board Flashcards Constitution

## Core Principles

### I. Firebase-First Persistence

Firestore is the single source of truth for all card data. Every card mutation
(add, delete, clear) MUST be committed to Firestore before local React state is
updated. Local state is a reflection of Firestore, never the authoritative store.

Data is isolated per user under the path `users/{uid}/cards/{cardId}`. No card
data MUST ever be written outside this namespace. Batch writes MUST be used when
persisting multiple cards in a single operation to guarantee atomicity.

Sync status MUST be surfaced to the user at all times (`ok` / `saving` / `error`).
Operations that fail to reach Firestore MUST surface an error toast and NOT silently
drop the change.

**Rationale**: The app's core promise is cloud-persisted study decks accessible from
any device. Silent data loss or stale local state would break that promise entirely.

### II. Ingestion Pipeline

Flashcards enter the system through three paths:
- Paste of raw Claude-AI output into the text area (primary path)
- Import of a previously exported JSON file (secondary path)
- Drag-and-drop of a NotebookLM CSV export (added v1.1.0)

The Claude-paste parser (`src/parser.js`) MUST accept the exact text format that
Claude produces. Both French and English field labels are first-class (Q/A and Q/R;
Catégorie and Category; Espèce and Species). Any format change MUST be
backward-compatible with existing Claude outputs or explicitly versioned.

The CSV parser (`src/csvParser.js`) MUST accept the NotebookLM headerless
2-column format per RFC 4180. It MUST remain a pure function with no browser,
Firebase, or React imports so it stays unit-testable.

The card data model is canonical:
```
{ id, question, answer, category, species, addedAt }
```
No extra fields MUST be stored in Firestore without updating the parser and
`categories.js` accordingly.

**Rationale**: The entire workflow depends on frictionless copy-paste from Claude.
Brittle parsing breaks the primary user journey.

### III. Whitelist-Gated Access

Authentication MUST use Google Sign-In (via Firebase Auth). Access is restricted to
an explicit email allowlist defined in `src/firebase-config.js`. Any account not in
`ALLOWED_EMAILS` MUST be signed out immediately and shown a clear denial message.

There is no public registration path. Adding a new authorized user MUST require a
code change to `ALLOWED_EMAILS`. This is intentional — the app is a private study
tool, not a public service.

**Rationale**: The deck may contain copyrighted veterinary exam content. Unrestricted
access is unacceptable.

### IV. Flat, Minimal Architecture

This is a single-page application with no client-side routing. View switching is
managed through a single `view` state variable in `App.jsx`. New views MUST NOT
introduce a routing library unless the view count exceeds five distinct screens.

The file structure MUST remain flat:
- All source files live directly under `src/` — no sub-directories unless a
  module group exceeds five files with clear cohesion.
- All UI components live in `src/components.jsx` (split only when the file exceeds
  ~300 lines of JSX).
- Styles MUST live in `src/styles.css`; inline styles are permitted for
  dynamic/data-driven values (category colors, conditional visibility).

TypeScript is NOT used in this project. Do not introduce it unless explicitly decided.
No test framework is configured; manual validation against the dev server is the
current quality gate.

YAGNI strictly applies: do not add abstractions, utilities, or patterns for
hypothetical future requirements.

**Rationale**: The codebase is maintained by a small, possibly solo team. Cognitive
overhead from unnecessary structure costs more than it saves.

### V. Domain-Specific Category System

The 8 EBVZM clinical categories defined in `src/categories.js` are the authoritative
taxonomy. They MUST NOT be renamed, reordered, or removed without updating all
consumers (`components.jsx`, `App.jsx`, `parser.js`).

| # | Name | Icon |
|---|------|------|
| 1 | Diagnosis | 🔍 |
| 2 | Therapeutics | 💊 |
| 3 | Prognosis | 📈 |
| 4 | Prevention | 🛡️ |
| 5 | Anesthesia | 😴 |
| 6 | Species specifics | 🧬 |
| 7 | Diagnostic proc. | 🩺 |
| 8 | Therapeutic proc. | ✂️ |

Category filtering MUST always operate on the category number (extracted via
`getCatNum()`), not the raw category string. At least one category MUST remain
active at all times — the toggle function MUST enforce this invariant.

**Rationale**: Categories map directly to EBVZM exam sections. Consistency between
the app and the exam taxonomy is essential for effective revision.

## Technology Stack

| Layer | Choice | Version |
|-------|--------|---------|
| UI Framework | React | ^18.3 |
| Build tool | Vite | ^5.4 |
| Language | JavaScript + JSX | ES modules |
| Database | Firebase Firestore | ^10.12 |
| Auth | Firebase Auth (Google) | ^10.12 |
| Deployment | GitHub Pages (static) | — |
| Package manager | npm | — |

**No TypeScript.** **No test framework.** **No routing library.**

All Firebase config (including API keys) lives in `src/firebase-config.js`.
The API key is a client-side web key scoped to this Firebase project and is safe
to commit — security is enforced by Firebase Security Rules and the auth allowlist,
not by keeping the key secret.

## Development Workflow

1. **Local dev**: `npm run dev` → http://localhost:5173
2. **Test manually**: Sign in with an allowlisted Google account, paste Claude output,
   verify cards appear and sync.
3. **Build**: `npm run build` — output in `dist/`
4. **Deploy**: GitHub Actions on push to `main` → GitHub Pages, OR manual
   `npx gh-pages -d dist`.
5. **New authorized user**: Add email to `ALLOWED_EMAILS` in `firebase-config.js`
   + add the GitHub Pages domain to Firebase Auth authorized domains.
6. **New category**: Add entry to all four maps in `categories.js`
   (`catIcons`, `catColors`, `catNames`) + verify parser regex handles new label.

No CI/CD quality gates (lint, tests) are currently configured. Any PR to `main`
SHOULD be manually validated end-to-end in the dev server before merging.

## Governance

This constitution supersedes all other implicit conventions in this repository.
Any pattern that contradicts a principle above MUST be treated as technical debt.

**Amendment procedure**:
1. Propose change in a PR description referencing the principle being amended.
2. Update `.specify/memory/constitution.md` with a new version number.
3. Update `.specify/templates/` files if the amendment affects how specs, plans,
   or tasks are structured.
4. Record the amendment in the Sync Impact Report HTML comment at the top of
   this file.

**Versioning policy** (semantic):
- MAJOR: A principle is removed or fundamentally redefined.
- MINOR: A new principle or mandatory section is added.
- PATCH: Clarifications, wording, typo fixes, table updates.

**Compliance**: Every feature spec (`spec.md`) and implementation plan (`plan.md`)
MUST include a Constitution Check section confirming which principles are exercised
or explicitly noting any justified deviation with a Complexity Tracking entry.

**Version**: 1.1.0 | **Ratified**: 2026-03-23 | **Last Amended**: 2026-03-23
