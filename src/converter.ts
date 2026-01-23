import { SchemaOrgRecipe, MealieRecipe } from './types.js';

/**
 * Converts a schema.org/Recipe formatted recipe to Mealie's recipe format
 */
export function convertSchemaOrgToMealie(schemaRecipe: SchemaOrgRecipe): MealieRecipe {
  // Extract categories
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
  const tags: string[] = [];
  if (schemaRecipe.keywords) {
    if (Array.isArray(schemaRecipe.keywords)) {
      tags.push(...schemaRecipe.keywords);
    } else {
      // Split comma-separated keywords
      tags.push(...schemaRecipe.keywords.split(',').map(k => k.trim()));
    }
  }

  // Convert ingredients
  const recipeIngredient = (schemaRecipe.recipeIngredient || []).map(ingredient => ({
    note: ingredient,
    title: '',
    unit: undefined,
    food: undefined,
    disableAmount: false,
    quantity: undefined
  }));

  // Convert instructions
  const recipeInstructions: Array<{ text: string; title?: string }> = [];
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
          recipeInstructions.push({
            text: instruction.text,
            title: instruction.name
          });
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
