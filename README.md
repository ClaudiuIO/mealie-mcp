# Mealie MCP Server

A Model Context Protocol (MCP) server that allows LLMs to save recipes directly to your [Mealie](https://mealie.io/) instance. This server accepts recipes in schema.org/Recipe format and handles the conversion and saving to Mealie automatically.

## Features

- Accepts recipes in standard schema.org/Recipe format
- Automatically converts to Mealie's recipe format
- Two-step API workflow (create + update) handled transparently
- Supports ingredients, instructions, nutrition info, and more
- Automatic field normalization (referenceId, display fields, etc.)
- Proper error handling with descriptive messages

### Current Limitations

- **Categories and Tags**: Due to Mealie API limitations, categories and tags are not saved automatically. They must be created manually in the Mealie web UI before they can be assigned to recipes. See [CATEGORIES_TAGS_LIMITATION.md](CATEGORIES_TAGS_LIMITATION.md) for details.

## Installation

1. Clone this repository:
```bash
cd mealie-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

Create a configuration file named `.mealie-mcp.json` in the project directory:

```bash
cp .mealie-mcp.json.example .mealie-mcp.json
```

Then edit `.mealie-mcp.json` with your Mealie instance details:

```json
{
  "mealieUrl": "https://your-mealie-instance.com",
  "apiToken": "your-api-token-here"
}
```

### Getting Your Mealie API Token

1. Log into your Mealie instance
2. Navigate to `/user/profile/api-tokens`
3. Create a new API token
4. Copy the token to your configuration file

**Note**: The server looks for `.mealie-mcp.json` in the current working directory when it starts.

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mealie": {
      "command": "node",
      "args": ["/absolute/path/to/mealie-mcp/build/index.js"],
      "cwd": "/absolute/path/to/mealie-mcp"
    }
  }
}
```

Replace `/absolute/path/to/mealie-mcp` with the actual path to this project.

**Important**: The `cwd` (current working directory) must be set to the project directory so the server can find the `.mealie-mcp.json` configuration file.

## Usage Examples

Once configured, you can ask Claude to save recipes to Mealie:

### Example 1: Simple Recipe
```
Save this recipe to Mealie:

Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup butter
- 1 cup sugar
- 2 eggs
- 2 cups chocolate chips

Instructions:
1. Preheat oven to 350°F
2. Mix butter and sugar
3. Add eggs and flour
4. Fold in chocolate chips
5. Bake for 12 minutes
```

### Example 2: Detailed Recipe
```
Save this pasta recipe to Mealie:

Name: Classic Spaghetti Carbonara
Cuisine: Italian
Category: Main Course
Prep Time: 10 minutes
Cook Time: 20 minutes
Servings: 4

Ingredients:
- 400g spaghetti
- 200g guanciale or pancetta
- 4 egg yolks
- 100g Pecorino Romano cheese
- Black pepper
- Salt

Instructions:
1. Cook pasta in salted boiling water until al dente
2. Cut guanciale into small pieces and cook until crispy
3. Mix egg yolks with grated cheese
4. Combine hot pasta with guanciale
5. Remove from heat and mix in egg mixture
6. Season with black pepper and serve

Tags: italian, pasta, quick-meals
```

## Recipe Format

The MCP tool accepts recipes in schema.org/Recipe format with the following fields:

### Required
- `name`: Recipe name

### Optional
- `description`: Recipe description
- `recipeYield`: Number of servings (e.g., "4 servings")
- `totalTime`: Total time (ISO 8601 duration, e.g., "PT30M")
- `prepTime`: Preparation time (ISO 8601 duration)
- `cookTime`: Cooking time (ISO 8601 duration)
- `recipeCategory`: Category or array of categories ⚠️ **Not currently saved** (see limitations)
- `recipeCuisine`: Cuisine type
- `keywords`: Tags/keywords (string or array) ⚠️ **Not currently saved** (see limitations)
- `recipeIngredient`: Array of ingredient strings
- `recipeInstructions`: String or array of instruction objects
- `nutrition`: Object with nutritional information
- `image`: Image URL or array of URLs
- `url`: Original source URL
- `aggregateRating`: Rating information

## Development

### Run in development mode:
```bash
npm run dev
```

### Build the project:
```bash
npm run build
```

### Project Structure
```
mealie-mcp/
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── config.ts                   # Configuration management
│   ├── types.ts                    # TypeScript interfaces
│   ├── converter.ts                # Schema.org to Mealie converter
│   ├── converter.test.ts           # Converter tests
│   ├── mealie-client.ts            # Mealie API client
│   └── mealie-client.test.ts       # Integration tests
├── build/                          # Compiled JavaScript
├── MEALIE_API_STRUCTURE.md         # API format documentation
├── CATEGORIES_TAGS_LIMITATION.md   # Categories/tags limitation details
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Error: Config file not found
- Ensure `.mealie-mcp.json` exists in the project directory
- Check that the JSON is valid
- Verify both `mealieUrl` and `apiToken` are present
- If using Claude Desktop, ensure the `cwd` is set correctly in the config

### Error: Failed to create recipe (401)
- Your API token is invalid or expired
- Generate a new token in Mealie at `/user/profile/api-tokens`

### Error: Failed to create recipe (404)
- Check that your `mealieUrl` is correct
- Ensure the URL does not have a trailing slash
- Verify your Mealie instance is accessible

### Recipe created but update failed
- The recipe was created in Mealie but detailed information failed to save
- Check the slug mentioned in the error and manually update in Mealie if needed

### Categories or tags not showing up
- Categories and tags must be created manually in Mealie first
- Navigate to Settings → Categories/Tags in your Mealie instance
- Create the categories/tags you want to use
- See [CATEGORIES_TAGS_LIMITATION.md](CATEGORIES_TAGS_LIMITATION.md) for more details

## How It Works

The server handles the complete workflow automatically:

1. **Schema.org Input**: LLM provides recipe in standard schema.org format
2. **Conversion**: Converts to Mealie's internal format
3. **Create**: `POST /api/recipes` with just the recipe name → returns a slug
4. **Normalize**: Automatically adds all required Mealie fields:
   - Generates `referenceId` (UUID) for each ingredient
   - Sets `display`, `unit`, `food`, `isFood`, `disableAmount` fields
   - Adds `title` and `ingredientReferences` to instructions
   - Removes categories/tags (Mealie API limitation)
5. **Update**: `PATCH /api/recipes/{slug}` with complete recipe data

If the update fails, the recipe will exist in Mealie with just a name and can be edited manually.

For detailed information about the data structure, see [MEALIE_API_STRUCTURE.md](MEALIE_API_STRUCTURE.md).

## Documentation

- **[MEALIE_API_STRUCTURE.md](MEALIE_API_STRUCTURE.md)** - Detailed explanation of Mealie's recipe format, the data workflow, and known issues
- **[CATEGORIES_TAGS_LIMITATION.md](CATEGORIES_TAGS_LIMITATION.md)** - Why categories and tags aren't saved and how to work around it

## Testing

Run integration tests (requires `.mealie-mcp.json` configuration):
```bash
npm test
```

Run converter tests only:
```bash
npm test -- converter.test
```

## License

ISC

## Contributing

Issues and pull requests are welcome!
