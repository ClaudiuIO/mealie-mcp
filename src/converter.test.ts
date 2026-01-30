import { convertSchemaOrgToMealie } from './converter.js';
import { SchemaOrgRecipe } from './types.js';

describe('convertSchemaOrgToMealie', () => {
  it('should convert a schema.org recipe to Mealie format', () => {
    const schemaRecipe: SchemaOrgRecipe = {
      '@type': 'Recipe',
      name: 'Tuna & Corn Salad (Classic Style)',
      description: 'A simple and delicious tuna and corn salad made with canned tuna, sweet corn kernels, mayonnaise, lemon juice, and Dijon mustard.',
      recipeYield: '4 servings',
      totalTime: 'PT20M',
      prepTime: 'PT15M',
      cookTime: 'PT5M',
      recipeCategory: ['Salad'],
      keywords: ['tuna salad', 'corn salad', 'classic salad'],
      recipeIngredient: [
        '2 cans of tuna in water or oil (drained)',
        '½ cup sweet corn kernels (fresh or canned)',
        '¼ cup mayonnaise',
        '1 tablespoon lemon juice',
        '1 teaspoon Dijon mustard',
        'Salt and pepper to taste',
        'Optional: chopped dill, red onion, or celery'
      ],
      recipeInstructions: [
        {
          text: 'In a large bowl, flake the tuna with a fork.',
          name: 'Step 1'
        },
        {
          text: 'Add the corn kernels, mayonnaise, lemon juice, mustard, salt, and pepper.',
          name: 'Step 2'
        },
        {
          text: 'Mix well until all ingredients are combined.',
          name: 'Step 3'
        },
        {
          text: 'Taste and adjust seasoning if needed.',
          name: 'Step 4'
        },
        {
          text: 'Chill for 1 hour before serving.',
          name: 'Step 5'
        }
      ],
      nutrition: {
        calories: '280',
        fatContent: '12g',
        proteinContent: '25g',
        carbohydrateContent: '15g',
        fiberContent: '2g',
        sodiumContent: '600mg',
        sugarContent: '3g'
      }
    };

    const mealieRecipe = convertSchemaOrgToMealie(schemaRecipe);

    // Basic fields
    expect(mealieRecipe.name).toBe('Tuna & Corn Salad (Classic Style)');
    expect(mealieRecipe.description).toBe('A simple and delicious tuna and corn salad made with canned tuna, sweet corn kernels, mayonnaise, lemon juice, and Dijon mustard.');
    expect(mealieRecipe.recipeYield).toBe('4 servings');
    expect(mealieRecipe.totalTime).toBe('PT20M');
    expect(mealieRecipe.prepTime).toBe('PT15M');
    expect(mealieRecipe.cookTime).toBe('PT5M');

    // Categories and tags
    expect(mealieRecipe.recipeCategory).toEqual(['Salad']);
    expect(mealieRecipe.tags).toEqual(['tuna salad', 'corn salad', 'classic salad']);

    // Ingredients - should be in simplified format
    expect(mealieRecipe.recipeIngredient).toHaveLength(7);
    expect(mealieRecipe.recipeIngredient?.[0]).toEqual({
      note: '2 cans of tuna in water or oil (drained)'
    });
    expect(mealieRecipe.recipeIngredient?.[1]).toEqual({
      note: '½ cup sweet corn kernels (fresh or canned)'
    });

    // Instructions - should be in simplified format
    expect(mealieRecipe.recipeInstructions).toHaveLength(5);
    expect(mealieRecipe.recipeInstructions?.[0]).toEqual({
      text: 'In a large bowl, flake the tuna with a fork.'
    });
    expect(mealieRecipe.recipeInstructions?.[4]).toEqual({
      text: 'Chill for 1 hour before serving.'
    });

    // Nutrition
    expect(mealieRecipe.nutrition).toEqual({
      calories: '280',
      fatContent: '12g',
      proteinContent: '25g',
      carbohydrateContent: '15g',
      fiberContent: '2g',
      sodiumContent: '600mg',
      sugarContent: '3g'
    });

    // Settings
    expect(mealieRecipe.settings).toBeDefined();
    expect(mealieRecipe.settings?.public).toBe(false);
    expect(mealieRecipe.settings?.showNutrition).toBe(true);
  });

  it('should handle string recipeInstructions', () => {
    const schemaRecipe: SchemaOrgRecipe = {
      name: 'Simple Recipe',
      recipeInstructions: '1. Mix ingredients\n2. Cook for 20 minutes\n3. Serve hot'
    };

    const mealieRecipe = convertSchemaOrgToMealie(schemaRecipe);

    expect(mealieRecipe.recipeInstructions).toHaveLength(3);
    expect(mealieRecipe.recipeInstructions?.[0]).toEqual({ text: 'Mix ingredients' });
    expect(mealieRecipe.recipeInstructions?.[1]).toEqual({ text: 'Cook for 20 minutes' });
    expect(mealieRecipe.recipeInstructions?.[2]).toEqual({ text: 'Serve hot' });
  });

  it('should handle comma-separated keywords', () => {
    const schemaRecipe: SchemaOrgRecipe = {
      name: 'Test Recipe',
      keywords: 'quick, easy, healthy'
    };

    const mealieRecipe = convertSchemaOrgToMealie(schemaRecipe);

    expect(mealieRecipe.tags).toEqual(['quick', 'easy', 'healthy']);
  });

  it('should handle recipeCuisine as additional categories', () => {
    const schemaRecipe: SchemaOrgRecipe = {
      name: 'Test Recipe',
      recipeCategory: 'Dinner',
      recipeCuisine: ['Italian', 'Mediterranean']
    };

    const mealieRecipe = convertSchemaOrgToMealie(schemaRecipe);

    expect(mealieRecipe.recipeCategory).toEqual(['Dinner', 'Italian', 'Mediterranean']);
  });
});
