import { MealieConfig, MealieRecipe } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

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

      const data = await response.json() as string;

      if (!data) {
        throw new Error('No slug returned from create recipe API');
      }

      return data;
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
        method: 'PATCH',
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
   * Gets a recipe by its slug
   */
  async getRecipe(slug: string): Promise<MealieRecipe> {
    const url = `${this.config.mealieUrl}/api/recipes/${slug}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get recipe (${response.status} ${response.statusText}): ${errorText}`
        );
      }

      return await response.json() as MealieRecipe;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting recipe: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Deletes a recipe by its slug
   */
  async deleteRecipe(slug: string): Promise<void> {
    const url = `${this.config.mealieUrl}/api/recipes/${slug}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete recipe (${response.status} ${response.statusText}): ${errorText}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error deleting recipe: ${error.message}`);
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

  async updateRecipeImage(slug: string, imagePath: string, extension: string): Promise<void> {
    const url = `${this.config.mealieUrl}/api/recipes/${slug}/image`;
    
    const imageBuffer = fs.readFileSync(imagePath);
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer]), path.basename(imagePath));
    formData.append('extension', extension);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to upload recipe image (${response.status} ${response.statusText}): ${errorText}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error uploading recipe image: ${error.message}`);
      }
      throw error;
    }
  }
}
