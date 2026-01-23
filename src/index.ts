#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './config.js';
import { MealieClient } from './mealie-client.js';
import { convertSchemaOrgToMealie } from './converter.js';
import { SchemaOrgRecipe } from './types.js';

// Create MCP server
const server = new Server(
  {
    name: 'mealie-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definition for saving recipes
const SAVE_RECIPE_TOOL = {
  name: 'save_recipe',
  description: 'Save a recipe to Mealie. Accepts a recipe in schema.org/Recipe format and saves it to your Mealie instance.',
  inputSchema: {
    type: 'object',
    properties: {
      recipe: {
        type: 'object',
        description: 'Recipe in schema.org/Recipe format',
        properties: {
          name: {
            type: 'string',
            description: 'Recipe name (required)'
          },
          description: {
            type: 'string',
            description: 'Recipe description'
          },
          recipeYield: {
            type: 'string',
            description: 'Number of servings (e.g., "4 servings")'
          },
          totalTime: {
            type: 'string',
            description: 'Total time in ISO 8601 duration format (e.g., "PT30M" for 30 minutes)'
          },
          prepTime: {
            type: 'string',
            description: 'Preparation time in ISO 8601 duration format'
          },
          cookTime: {
            type: 'string',
            description: 'Cooking time in ISO 8601 duration format'
          },
          recipeCategory: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'Recipe category or categories'
          },
          recipeCuisine: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'Recipe cuisine type'
          },
          keywords: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'Keywords or tags for the recipe'
          },
          recipeIngredient: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of ingredients as strings'
          },
          recipeInstructions: {
            oneOf: [
              { type: 'string' },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    name: { type: 'string' }
                  }
                }
              }
            ],
            description: 'Cooking instructions'
          },
          nutrition: {
            type: 'object',
            properties: {
              calories: { type: 'string' },
              fatContent: { type: 'string' },
              proteinContent: { type: 'string' },
              carbohydrateContent: { type: 'string' },
              fiberContent: { type: 'string' },
              sodiumContent: { type: 'string' },
              sugarContent: { type: 'string' }
            },
            description: 'Nutritional information'
          },
          image: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'Image URL or URLs'
          },
          url: {
            type: 'string',
            description: 'Original source URL'
          },
          aggregateRating: {
            type: 'object',
            properties: {
              ratingValue: { type: 'number' }
            },
            description: 'Recipe rating'
          }
        },
        required: ['name']
      }
    },
    required: ['recipe']
  }
};

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [SAVE_RECIPE_TOOL]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'save_recipe') {
    try {
      const args = request.params.arguments as { recipe: SchemaOrgRecipe };

      if (!args.recipe) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Missing recipe parameter'
        );
      }

      if (!args.recipe.name) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Recipe name is required'
        );
      }

      // Load config
      const config = await loadConfig();

      // Create Mealie client
      const client = new MealieClient(config);

      // Convert recipe format
      const mealieRecipe = convertSchemaOrgToMealie(args.recipe);

      // Save recipe
      const slug = await client.saveRecipe(mealieRecipe);

      return {
        content: [
          {
            type: 'text',
            text: `Recipe "${args.recipe.name}" saved successfully to Mealie!\nSlug: ${slug}\nURL: ${config.mealieUrl}/recipe/${slug}`
          }
        ]
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        content: [
          {
            type: 'text',
            text: `Error saving recipe: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  }

  throw new McpError(
    ErrorCode.MethodNotFound,
    `Unknown tool: ${request.params.name}`
  );
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('Mealie MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
