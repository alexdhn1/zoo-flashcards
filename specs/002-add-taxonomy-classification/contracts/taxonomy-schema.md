# Contract: taxonomy.json Schema

**File**: `src/data/taxonomy.json`  
**Date**: 2026-03-30

## Schema

```json
{
  "groups": [
    {
      "id": "string",
      "label": "string",
      "orders": [
        {
          "id": "string",
          "label": "string"
        }
      ]
    }
  ],
  "fallback": {
    "group": "others",
    "order": "others"
  }
}
```

## Mandatory Group Entries

The `groups` array must include these six labels (with stable canonical ids):
- Amphibiens
- Reptiles
- Oiseaux
- Mammifères
- Invertébrés
- Poissons

`Invertébrés` and `Poissons` must be present with empty `orders` arrays.

## Order Constraints

- Each order requires canonical `id` + display `label`.
- `id` values must be globally unique across all groups.
- Configured order sets for Amphibiens, Reptiles, Oiseaux, Mammifères must mirror the feature spec lists.
- `others` must not be stored as a normal order inside any group; it is represented only in `fallback`.

## Consumer Guarantees

Any module reading this file can assume:
- `groups` is always an array.
- `orders` exists for every group and is always an array.
- fallback constants exist and are strings.
