import { MealieConfig, MealieRecipe, CreateRecipeResponse } from './types.js';

export class MealieClient {
  private config: MealieConfig;

  constructor(config: MealieConfig) {
    this.config = config;
  }

  /**
   * Step 1: Create a new recipe with just a name to get a slug
   */
  async createRecipe(name: string): Promise<string> {
    const url = `${this.config.mealieUrl}/api/recipes`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiToken}`
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create recipe (${response.status} ${response.statusText}): ${errorText}`
        );
      }

      const data = await response.json() as CreateRecipeResponse;

      if (!data.slug) {
        throw new Error('No slug returned from create recipe API');
      }

      return data.slug;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error creating recipe: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Step 2: Update the recipe with full details
   */
  async updateRecipe(slug: string, recipe: MealieRecipe): Promise<void> {
    const url = `${this.config.mealieUrl}/api/recipes/${slug}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiToken}`
        },
        body: JSON.stringify(recipe)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update recipe (${response.status} ${response.statusText}): ${errorText}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error updating recipe: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Complete workflow: Create recipe and update with full details
   */
  async saveRecipe(recipe: MealieRecipe): Promise<string> {
    // Step 1: Create recipe with name to get slug
    const slug = await this.createRecipe(recipe.name);

    try {
      // Step 2: Update recipe with full details
      await this.updateRecipe(slug, recipe);
      return slug;
    } catch (error) {
      // If update fails, we've already created the recipe
      // Return the error but include the slug for reference
      throw new Error(
        `Recipe created with slug '${slug}' but failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
