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
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

/**
 * Download an image from a URL to a temporary file
 * @param imageUrl - The URL of the image to download
 * @returns An object with the temp file path and extension, or null if download failed
 */
async function downloadImage(imageUrl: string): Promise<{ tempPath: string; extension: string } | null> {
  try {
    // Validate URL
    const url = new URL(imageUrl);

    // Download the image
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`Failed to download image from ${imageUrl}: ${response.status} ${response.statusText}`);
      return null;
    }

    // Get content type to determine extension
    const contentType = response.headers.get('content-type');
    let extension = 'jpg'; // default

    if (contentType) {
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
      else if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('gif')) extension = 'gif';
      else {
        console.error(`Unsupported image format: ${contentType}`);
        return null;
      }
    } else {
      // Try to extract extension from URL
      const urlExtension = path.extname(url.pathname).toLowerCase().replace('.', '');
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExtension)) {
        extension = urlExtension === 'jpeg' ? 'jpg' : urlExtension;
      }
    }

    // Create temp file
    const tempDir = os.tmpdir();
    const tempFileName = `mealie-recipe-image-${Date.now()}.${extension}`;
    const tempPath = path.join(tempDir, tempFileName);

    // Write image data to temp file
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempPath, buffer);

    return { tempPath, extension };
  } catch (error) {
    console.error(`Error downloading image from ${imageUrl}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

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

      // Extract image URL if present
      let imageUrl: string | null = null;
      if (args.recipe.image) {
        if (typeof args.recipe.image === 'string') {
          imageUrl = args.recipe.image;
        } else if (Array.isArray(args.recipe.image) && args.recipe.image.length > 0) {
          imageUrl = args.recipe.image[0]; // Use the first image
        }
      }

      // Download image if URL provided
      let imageDownload: { tempPath: string; extension: string } | null = null;
      if (imageUrl) {
        console.error(`Downloading image from: ${imageUrl}`);
        imageDownload = await downloadImage(imageUrl);
        if (!imageDownload) {
          console.error(`Warning: Failed to download image from ${imageUrl}, continuing without image`);
        }
      }

      // Convert recipe format
      const mealieRecipe = convertSchemaOrgToMealie(args.recipe);

      // Save recipe
      const slug = await client.saveRecipe(mealieRecipe);

      // Upload image if downloaded successfully
      let imageStatus = '';
      if (imageDownload) {
        try {
          await client.updateRecipeImage(slug, imageDownload.tempPath, imageDownload.extension);
          imageStatus = '\nImage uploaded successfully!';
          console.error(`Image uploaded for recipe: ${slug}`);
        } catch (error) {
          imageStatus = `\nWarning: Recipe saved but image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`Failed to upload image for recipe ${slug}:`, error);
        } finally {
          // Clean up temp file
          try {
            fs.unlinkSync(imageDownload.tempPath);
            console.error(`Cleaned up temp file: ${imageDownload.tempPath}`);
          } catch (cleanupError) {
            console.error(`Failed to clean up temp file ${imageDownload.tempPath}:`, cleanupError);
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Recipe "${args.recipe.name}" saved successfully to Mealie!${imageStatus}\nSlug: ${slug}\nURL: ${config.mealieUrl}/recipe/${slug}`
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
