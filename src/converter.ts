import { SchemaOrgRecipe, MealieRecipe } from './types.js';

/**
 * Converts a schema.org/Recipe formatted recipe to Mealie's recipe format
 */
export function convertSchemaOrgToMealie(schemaRecipe: SchemaOrgRecipe): MealieRecipe {
  // Extract categories
  // NOTE: Categories and tags are extracted here but will be automatically
  // removed by updateRecipe() as they must pre-exist in Mealie database
  const categories: string[] = [];
  if (schemaRecipe.recipeCategory) {
    if (Array.isArray(schemaRecipe.recipeCategory)) {
      categories.push(...schemaRecipe.recipeCategory);
    } else {
      categories.push(schemaRecipe.recipeCategory);
    }
  }
  if (schemaRecipe.recipeCuisine) {
    if (Array.isArray(schemaRecipe.recipeCuisine)) {
      categories.push(...schemaRecipe.recipeCuisine);
    } else {
      categories.push(schemaRecipe.recipeCuisine);
    }
  }

  // Extract tags from keywords
  // NOTE: Tags will be automatically removed by updateRecipe()
  const tags: string[] = [];
  if (schemaRecipe.keywords) {
    if (Array.isArray(schemaRecipe.keywords)) {
      tags.push(...schemaRecipe.keywords);
    } else {
      // Split comma-separated keywords
      tags.push(...schemaRecipe.keywords.split(',').map(k => k.trim()));
    }
  }

  // Convert ingredients - use simplified format
  // The updateRecipe method will automatically add all required fields
  const recipeIngredient = (schemaRecipe.recipeIngredient || []).map(ingredient => ({
    note: ingredient
  }));

  // Convert instructions - use simplified format
  // The updateRecipe method will automatically add title and ingredientReferences
  const recipeInstructions: Array<{ text: string }> = [];
  if (schemaRecipe.recipeInstructions) {
    if (typeof schemaRecipe.recipeInstructions === 'string') {
      // Split by newlines or numbered steps
      const steps = schemaRecipe.recipeInstructions
        .split(/\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      steps.forEach(step => {
        // Remove leading numbers like "1.", "2)", etc.
        const cleanStep = step.replace(/^\d+[\.\)]\s*/, '');
        recipeInstructions.push({ text: cleanStep });
      });
    } else if (Array.isArray(schemaRecipe.recipeInstructions)) {
      schemaRecipe.recipeInstructions.forEach(instruction => {
        if (typeof instruction === 'string') {
          recipeInstructions.push({ text: instruction });
        } else if (instruction.text) {
          // Just use the text, ignore the name/title from schema.org
          recipeInstructions.push({ text: instruction.text });
        }
      });
    }
  }

  // Extract image URL
  let imageUrl: string | undefined;
  if (schemaRecipe.image) {
    if (Array.isArray(schemaRecipe.image)) {
      imageUrl = schemaRecipe.image[0];
    } else {
      imageUrl = schemaRecipe.image;
    }
  }

  // Extract rating
  let rating: number | undefined;
  if (schemaRecipe.aggregateRating?.ratingValue) {
    rating = schemaRecipe.aggregateRating.ratingValue;
  }

  // Build Mealie recipe
  const mealieRecipe: MealieRecipe = {
    name: schemaRecipe.name,
    description: schemaRecipe.description || '',
    recipeYield: schemaRecipe.recipeYield,
    totalTime: schemaRecipe.totalTime,
    prepTime: schemaRecipe.prepTime,
    cookTime: schemaRecipe.cookTime,
    recipeCategory: categories.length > 0 ? categories : undefined,
    tags: tags.length > 0 ? tags : undefined,
    recipeIngredient,
    recipeInstructions,
    nutrition: schemaRecipe.nutrition,
    image: imageUrl,
    orgURL: schemaRecipe.url,
    rating,
    settings: {
      public: false,
      showNutrition: true,
      showAssets: false,
      landscapeView: false,
      disableComments: false,
      disableAmount: false,
      locked: false
    }
  };

  return mealieRecipe;
}
