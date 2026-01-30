import { tr } from 'zod/v4/locales';
import { randomUUID } from 'crypto';
import { MealieClient } from './mealie-client.js';
import { MealieConfig, MealieRecipe, SchemaOrgRecipe } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

// Path to the configuration file
const configPath = path.resolve(process.cwd(), '.mealie-mcp.json');

// Read configuration from the file
let config: MealieConfig | null = null;
try {
  const configFile = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(configFile);
} catch (error) {
  // If the file doesn't exist or is invalid, we'll skip the tests
}

// Helper function to generate a unique recipe name
const generateRecipeName = () => `Test Recipe ${Date.now()}`;

(config ? describe : describe.skip)('MealieClient Integration Tests', () => {
  let client: MealieClient;
  const slugsToDelete: string[] = [];

  beforeAll(() => {
    if (!config) {
      console.log(
        'Skipping integration tests: .mealie-mcp.json not found or invalid.'
      );
      return;
    }
    client = new MealieClient(config);
  });

  afterEach(async () => {
    // Clean up created recipes
    for (const slug of slugsToDelete) {
      try {
        await client.deleteRecipe(slug);
      } catch (error) {
        console.error(`Failed to delete recipe with slug: ${slug}`, error);
      }
    }
    slugsToDelete.length = 0; // Clear the array
  });

  describe('createRecipe', () => {
    it('should create a recipe and return a slug', async () => {
      const recipeName = generateRecipeName();
      const slug = await client.createRecipe(recipeName);
      expect(slug).toBeDefined();
      expect(typeof slug).toBe('string');
      slugsToDelete.push(slug);
    });
  });

  describe('updateRecipe', () => {
    it('should update a recipe successfully', async () => {
      const recipeName = generateRecipeName();
      const slug = await client.createRecipe(recipeName);
      slugsToDelete.push(slug);

      const recipe: MealieRecipe = {
        name: `${recipeName}`,
        // userId: "11af021a-9a0d-45b5-8327-0bc5a2e24645",
        // groupId: "2a3681dd-5337-4d89-83b1-981ee6c30a6c",
        description: 'A delicious chocolate chip cookie recipe perfect for any occasion.',
        recipeYield: '24 cookies',
        totalTime: '45 minutes',
        prepTime: '15 minutes',
        cookTime: '30 minutes',
        recipeCategory: [],
        tags: [],
        rating: 5,
        orgURL: 'https://example.com/chocolate-chip-cookies',
        recipeIngredient: [
          { note: '2.5 cups all-purpose flour (sifted)' },
          { note: '1 tsp baking soda' },
          { note: '0.5 tsp salt' },
          { note: '1 cup butter, softened' },
          { note: '0.75 cup granulated sugar' },
          { note: '0.75 cup brown sugar' },
          { note: '2 large eggs' },
          { note: '2 tsp pure vanilla extract' },
          { note: '2 cups chocolate chips' }
        ],
        recipeInstructions: [
          { text: 'Preheat your oven to 375°F (190°C). In a medium bowl, whisk together the flour, baking soda, and salt. Set aside.' },
          { text: 'In a large mixing bowl, cream together the softened butter, granulated sugar, and brown sugar until light and fluffy, about 3-4 minutes.' },
          { text: 'Beat in the eggs one at a time, followed by the vanilla extract. Mix until well combined.' },
          { text: 'Gradually add the dry ingredient mixture to the wet ingredients, mixing on low speed until just combined. Do not overmix.' },
          { text: 'Fold in the chocolate chips using a spatula or wooden spoon until evenly distributed.' },
          { text: 'Drop rounded tablespoons of dough onto ungreased baking sheets, spacing them about 2 inches apart. Bake for 10-12 minutes, or until the edges are golden brown. The centers should still look slightly underdone.' },
          { text: 'Remove from oven and let cookies cool on the baking sheet for 5 minutes before transferring to a wire rack to cool completely. Enjoy!' }
        ],
        nutrition: {
          calories: '150',
          fatContent: '8g',
          proteinContent: '2g',
          carbohydrateContent: '20g',
          fiberContent: '1g',
          sodiumContent: '95mg',
          sugarContent: '12g'
        },
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

      await expect(client.updateRecipe(slug, recipe as MealieRecipe)).resolves.not.toThrow();

      const imageBase64 = 'R0lGODlhAQABAIABAP8AAP///yH5BAEAAAEALAAAAAABAAEAAAICRAEAOw==';
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const imagePath = path.join(process.cwd(), 'test-image.gif');
      fs.writeFileSync(imagePath, imageBuffer);

      try {
        await expect(client.updateRecipeImage(slug, imagePath, 'gif')).resolves.not.toThrow();
      } finally {
        fs.unlinkSync(imagePath);
      }
    });
  });

  describe('getRecipe', () => {
    it('should retrieve a recipe by its slug', async () => {
      const recipeName = generateRecipeName();
      const slug = 'EXISTING-RECIPE-SLUG'; // Replace with an actual existing slug in your Mealie instance

      const retrievedRecipe = await client.getRecipe(slug);
      expect(retrievedRecipe).toBeDefined();
      expect(retrievedRecipe.name).toBe(recipeName);
      expect(retrievedRecipe.slug).toBe(slug);
    });
  });

  // describe('saveRecipe', () => {
  //   it('should create and then update a recipe', async () => {
  //     const recipeName = generateRecipeName();
  //     const recipe: MealieRecipe = {
  //       name: recipeName,
  //       recipeIngredient: [{ title: '2 cups of flour' }],
  //     };
  //
  //     const slug = await client.saveRecipe(recipe);
  //     expect(slug).toBeDefined();
  //     expect(typeof slug).toBe('string');
  //     slugsToDelete.push(slug);
  //   });
  // });
});
