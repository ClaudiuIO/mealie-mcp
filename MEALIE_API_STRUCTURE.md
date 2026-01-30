# Mealie API Recipe Structure

This document explains the expected structure for creating and updating recipes using the Mealie API.

## Recipe Update Workflow

The MealieClient handles the complete workflow automatically:

1. **Schema.org Input** → LLM provides recipe in schema.org format
2. **Converter** (`convertSchemaOrgToMealie`) → Converts to simplified Mealie format
3. **Create Recipe** → `POST /api/recipes` with just the name → returns a `slug`
4. **Normalize & Update** → `updateRecipe()` automatically adds all required fields and uses `PATCH /api/recipes/{slug}`

### Internal Workflow
```
schema.org format → converter.ts → simplified format → updateRecipe() → full format → Mealie API
```

## Simplified Input Format

The `MealieClient.updateRecipe()` method automatically normalizes the recipe data. You can provide minimal ingredient and instruction data:

### Ingredients - Minimal Format
```typescript
{
  note: '2.5 cups all-purpose flour (sifted)'
}
```

The client will automatically add:
- `display`: Same as `note`
- `unit`: `null`
- `food`: `null`
- `isFood`: `false`
- `disableAmount`: `true`
- `referenceId`: Auto-generated UUID

### Instructions - Minimal Format
```typescript
{
  text: 'Preheat your oven to 375°F (190°C).'
}
```

The client will automatically add:
- `title`: Empty string
- `ingredientReferences`: Empty array

## Full Mealie API Format

When the data is sent to Mealie, it must include all these fields:

### Recipe Object
```typescript
{
  name: string;
  description?: string;
  recipeYield?: string;
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
  // Note: recipeCategory and tags are automatically removed by updateRecipe()
  // as they require pre-existing entries in Mealie database
  recipeCategory?: string[];  // Removed automatically
  tags?: string[];            // Removed automatically
  rating?: number;
  orgURL?: string;
  recipeIngredient?: Array<{
    note: string;
    display: string;           // Same as note
    unit: null;                // Always null for simple text ingredients
    food: null;                // Always null for simple text ingredients
    isFood: false;             // Always false for simple text ingredients
    disableAmount: true;       // Hides quantity in display
    referenceId: string;       // UUID for the ingredient
  }>;
  recipeInstructions?: Array<{
    text: string;
    title: string;             // Usually empty string
    ingredientReferences: [];  // Empty array (or UUIDs linking to ingredients)
  }>;
  nutrition?: {
    calories?: string;
    fatContent?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
    fiberContent?: string;
    sodiumContent?: string;
    sugarContent?: string;
  };
  settings?: {
    public?: boolean;
    showNutrition?: boolean;
    showAssets?: boolean;
    landscapeView?: boolean;
    disableComments?: boolean;
    disableAmount?: boolean;
    locked?: boolean;
  };
}
```

## Alternative: Schema.org Format

For creating recipes directly with full data, use the `createRecipeFromSchema()` method with the `/api/recipes/create-url` endpoint:

```typescript
{
  name: string;
  description?: string;
  recipeYield?: string;
  totalTime?: string;        // ISO 8601 duration (e.g., "PT45M")
  prepTime?: string;         // ISO 8601 duration (e.g., "PT15M")
  cookTime?: string;         // ISO 8601 duration (e.g., "PT30M")
  recipeCategory?: string | string[];
  keywords?: string | string[];
  recipeIngredient?: string[];  // Simple string array
  recipeInstructions?: string | Array<{
    '@type'?: string;        // e.g., "HowToStep"
    text: string;
  }>;
  nutrition?: {
    calories?: string;
    fatContent?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
    fiberContent?: string;
    sodiumContent?: string;
    sugarContent?: string;
  };
  url?: string;
}
```

## Known Issues with Mealie v2.8.0

1. **group_id Error**: When creating new ingredients without IDs, they need a `referenceId` to avoid errors
2. **Integer Bug**: Mealie has a bug calling `.is_integer()` on int values instead of floats
3. **Unit/Food Objects**: Creating new units or foods requires `group_id`, so it's simpler to use `null` for simple text ingredients
4. **Categories and Tags**: Categories and tags must already exist in the Mealie database before they can be assigned to recipes. The `updateRecipe()` method automatically removes `recipeCategory` and `tags` arrays to prevent errors. To use categories/tags, they must be created via the Mealie web UI first.

## Best Practices

1. **Use the normalized format**: Let the client handle the field normalization
2. **Keep ingredients simple**: Use plain text in the `note` field
3. **No need for referenceId**: The client auto-generates UUIDs
4. **Avoid categories/tags**: The client automatically removes them as they're not supported via API (must pre-exist in Mealie)
5. **Use schema.org for imports**: When scraping or importing recipes, use the schema.org format