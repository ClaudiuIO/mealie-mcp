# Categories and Tags Limitation in Mealie API

## Issue

The Mealie API does not support creating categories or tags on-the-fly when creating or updating recipes. Categories and tags must already exist in the Mealie database before they can be assigned to recipes.

## Current Behavior

The `MealieClient.updateRecipe()` method automatically removes any `recipeCategory` and `tags` arrays from the recipe data before sending it to the Mealie API. This prevents API errors when attempting to assign non-existent categories or tags.

### Code Location

- **Client**: [mealie-client.ts:87-95](src/mealie-client.ts#L87-L95)
- **Converter**: [converter.ts:7-36](src/converter.ts#L7-L36) (extracts but will be removed)

## Workaround

If you need to use categories and tags with your recipes:

1. **Create categories/tags manually** via the Mealie web UI:
   - Navigate to your Mealie instance
   - Go to Settings → Categories or Tags
   - Create the categories/tags you want to use

2. **Modify the code** to keep categories/tags:
   - Remove or comment out lines 90-95 in `mealie-client.ts`
   - Ensure all categories/tags you reference exist in Mealie

## Why This Happens

The Mealie API expects category and tag objects to reference existing database entries. When you send a new category/tag name that doesn't exist, Mealie tries to look it up in the database and fails because:

1. Categories and tags have their own database tables
2. They need to be associated with a group (user group)
3. The API doesn't auto-create these relationships

## Future Improvements

Potential solutions for future versions:

1. **Pre-create categories/tags**: Add an API call to create categories/tags before creating the recipe
2. **Lookup existing**: Query the Mealie API for existing categories/tags and only assign those that exist
3. **Error handling**: Catch the error and retry without categories/tags
4. **API enhancement**: Request Mealie team to add auto-creation feature

## Example

### What the LLM sends:
```json
{
  "name": "Chocolate Chip Cookies",
  "recipeCategory": ["Dessert", "Baking"],
  "keywords": ["cookies", "chocolate", "sweet"]
}
```

### What gets converted:
```typescript
{
  name: "Chocolate Chip Cookies",
  recipeCategory: ["Dessert", "Baking"],
  tags: ["cookies", "chocolate", "sweet"]
}
```

### What actually gets sent to Mealie:
```typescript
{
  name: "Chocolate Chip Cookies",
  recipeCategory: [],  // Removed
  tags: []             // Removed
}
```

## Related Issues

This is similar to the `group_id` issue with ingredients, where Mealie requires certain entities to pre-exist in the database before they can be referenced.

## References

- [MEALIE_API_STRUCTURE.md](MEALIE_API_STRUCTURE.md) - Main API documentation
- Mealie GitHub: https://github.com/mealie-recipes/mealie
