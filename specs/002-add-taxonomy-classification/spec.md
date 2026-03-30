# Feature Specification: Taxonomy-Based Species Classification

**Feature Branch**: `[002-add-taxonomy-classification]`  
**Created**: 2026-03-30  
**Status**: Draft  
**Input**: User description: "Add taxonomy-based species classification to the flashcard application, enabling Jenna to filter flashcards by animal group and order according to the Fowler veterinary taxonomy."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classify Imported Flashcards Reliably (Priority: P1)

As Jenna, I can import flashcards where each card is assigned to a canonical taxonomy group and order so that all cards are consistently classified for later filtering.

**Why this priority**: Correct classification at ingestion is foundational. Without it, taxonomy filtering and taxonomy-based browsing are not trustworthy.

**Independent Test**: Import a CSV containing recognized, misspelled, and unrecognized order values and verify each created flashcard receives expected taxonomy fields and fallback behavior.

**Acceptance Scenarios**:

1. **Given** an imported row with an order value that clearly corresponds to a known taxonomy order, **When** import processing runs, **Then** the flashcard is saved with the canonical taxonomy order and its corresponding taxonomy group.
2. **Given** an imported row with an order value that does not confidently match any known taxonomy order, **When** import processing runs, **Then** the flashcard is saved with taxonomy group set to "others" and taxonomy order set to "others".
3. **Given** an imported row that includes a species display label, **When** the flashcard is saved, **Then** the species label is stored as informational text without changing filtering behavior.

---

### User Story 2 - Filter Flashcards by Taxonomy (Priority: P2)

As Jenna, I can use a searchable taxonomy filter to find flashcards by group or order so that I can study targeted animal sets quickly.

**Why this priority**: This is the primary user-facing value of taxonomy classification and directly supports taxonomy-driven study workflows.

**Independent Test**: Open the flashcard interface with mixed taxonomy data, apply group and order selections from the taxonomy filter, and verify that visible cards match expected sets.

**Acceptance Scenarios**:

1. **Given** taxonomy selection options grouped by animal group, **When** Jenna selects a group, **Then** all flashcards belonging to any order in that group are shown.
2. **Given** taxonomy selection options grouped by animal group, **When** Jenna selects a specific order, **Then** only flashcards for that order are shown.
3. **Given** the taxonomy filter has a reset option, **When** Jenna selects "Tous", **Then** taxonomy filtering is removed and all flashcards are eligible to display.
4. **Given** taxonomy and category filters are both available, **When** Jenna switches between OR and AND combination modes, **Then** results update according to the selected logical mode.
5. **Given** the taxonomy list is long, **When** Jenna types in the taxonomy search input, **Then** visible order options update in real time to match the search term.

---

### User Story 3 - Maintain a Single Taxonomy Reference (Priority: P3)

As a maintainer, I can manage taxonomy groups and orders from one authoritative reference so that ingestion and UI filtering stay aligned.

**Why this priority**: A single source of truth reduces mismatch risk between imported data, persisted data, and user-facing filter options.

**Independent Test**: Verify that all configured taxonomy groups and orders are represented in both import normalization and taxonomy filter options, including currently empty groups.

**Acceptance Scenarios**:

1. **Given** the taxonomy reference includes six top-level groups, **When** the application loads taxonomy options, **Then** all six groups are available in the taxonomy filter structure.
2. **Given** Invertébrés and Poissons are intentionally empty, **When** taxonomy options are rendered, **Then** these groups appear without order entries and do not break filtering behavior.

### Edge Cases

- A CSV row has an empty taxonomy order value.
- A CSV row contains mixed-language or variant naming for an order and still needs canonical mapping when confidence is sufficient.
- A CSV row contains a value that partially matches multiple orders with low confidence and must fall back to "others".
- Jenna selects a taxonomy group with no cards currently available; result set should be empty but stable.
- Jenna applies taxonomy and category filters in AND mode where no cards satisfy both filters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain one authoritative taxonomy reference containing exactly these top-level groups: Amphibiens, Reptiles, Oiseaux, Mammifères, Invertébrés, and Poissons.
- **FR-002**: The taxonomy reference MUST define the Fowler order lists for Amphibiens, Reptiles, Oiseaux, and Mammifères using canonical order identifiers and display labels.
- **FR-003**: The taxonomy reference MUST include Invertébrés and Poissons as valid groups with no orders defined for this release.
- **FR-004**: The system MUST support an "others" fallback taxonomy group and an "others" fallback taxonomy order for unrecognized imported values.
- **FR-005**: Every flashcard created through import MUST include taxonomyGroup and taxonomyOrder values.
- **FR-006**: Every flashcard MAY include speciesLabel as optional free text for display-only purposes.
- **FR-007**: Import processing MUST normalize raw taxonomy order input against the authoritative taxonomy reference by comparing both canonical identifiers and display labels.
- **FR-008**: Import processing MUST apply a confidence threshold of 0.7 for taxonomy normalization decisions.
- **FR-009**: If normalization confidence is below 0.7, import processing MUST set taxonomyGroup to "others" and taxonomyOrder to "others".
- **FR-010**: If normalization confidence is 0.7 or above, import processing MUST persist the matched canonical taxonomyOrder and its corresponding taxonomyGroup.
- **FR-011**: The flashcard visualization interface MUST provide one searchable taxonomy selector that displays groups as sections and orders as selectable items within each section.
- **FR-012**: Selecting a taxonomy group MUST select results using OR logic across all orders in that group.
- **FR-013**: Selecting a taxonomy order MUST select results to that specific order only.
- **FR-014**: The taxonomy selector MUST provide a "Tous" option that clears taxonomy filtering.
- **FR-015**: Taxonomy filtering MUST combine with the existing category filter in both OR and AND modes.
- **FR-016**: The searchable taxonomy selector MUST update matching order options in real time as the user types.
- **FR-017**: Reclassifying existing flashcards via migration is out of scope; existing flashcards may be deleted and recreated manually.

### Key Entities *(include if feature involves data)*

- **Taxonomy Group**: A top-level animal classification bucket containing a canonical group identifier, display label, and zero or more taxonomy orders.
- **Taxonomy Order**: A canonical order entry associated with exactly one taxonomy group, including canonical identifier and user-facing label used for mapping and filtering.
- **Flashcard Taxonomy Metadata**: Per-flashcard classification fields composed of taxonomyGroup, taxonomyOrder, and optional speciesLabel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: newly imported flashcards could contain non-empty taxonomyGroup and taxonomyOrder values.
- **SC-002**:  imported rows with normalization confidence below 0.7 are classified as taxonomyGroup "others" and taxonomyOrder "others".
- **SC-003**: In user acceptance testing, Jenna can apply a taxonomy group or taxonomy order filter or selection and see expected results in under 10 seconds for each attempt.
- **SC-004**: In validation scenarios covering group selection, order selection, reset, and category-combination modes, expected and actual filtered result sets match in 100% of tested cases.

## Assumptions

- The provided Fowler order names in the feature request are the authoritative list for this release, even though a separate count statement is present in the request.
- Taxonomy filtering applies to flashcard visualization contexts where category filtering already exists.
- The reset option label is presented as "Tous" in the user interface.
- Existing flashcard records will be manually removed and re-imported; no automated backfill is required.
