import { readFile } from 'fs/promises';
import { MealieConfig } from './types.js';

const CONFIG_FILE_NAME = '.mealie-mcp.json';

export async function loadConfig(): Promise<MealieConfig> {
  // Try to load from current working directory
  const configPath = CONFIG_FILE_NAME;

  try {
    const configData = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configData) as MealieConfig;

    // Validate required fields
    if (!config.mealieUrl) {
      throw new Error('mealieUrl is required in config file');
    }
    if (!config.apiToken) {
      throw new Error('apiToken is required in config file');
    }

    // Remove trailing slash from URL if present
    config.mealieUrl = config.mealieUrl.replace(/\/$/, '');

    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Config file not found at ${configPath}. ` +
        `Please create a ${CONFIG_FILE_NAME} file in the current directory with the following format:\n` +
        JSON.stringify({ mealieUrl: "https://your-mealie-instance.com", apiToken: "your-api-token" }, null, 2)
      );
    }
    throw error;
  }
}
