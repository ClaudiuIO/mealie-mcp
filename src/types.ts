// schema.org/Recipe format (input from LLM)
export interface SchemaOrgRecipe {
  name: string;
  "@type"?: string;
  description?: string;
  recipeYield?: string;
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
  recipeCategory?: string | string[];
  recipeCuisine?: string | string[];
  keywords?: string | string[];
  recipeIngredient?: string[];
  recipeInstructions?: string | Array<{
    "@type"?: string;
    text?: string;
    name?: string;
  }>;
  nutrition?: {
    calories?: string;
    fatContent?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
    fiberContent?: string;
    sodiumContent?: string;
    sugarContent?: string;
  };
  image?: string | string[];
  url?: string;
  author?: string | { name?: string };
  aggregateRating?: {
    ratingValue?: number;
  };
}

// Mealie API format
export interface MealieRecipe {
  id?: string;
  userId?: string;
  groupId?: string;
  name: string;
  slug?: string;
  image?: string;
  recipeYield?: string;
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
  performTime?: string;
  description?: string;
  recipeCategory?: string[];
  tags?: string[];
  tools?: Array<{
    id?: string;
    name: string;
    slug?: string;
    onHand?: boolean;
  }>;
  rating?: number;
  orgURL?: string;
  dateAdded?: string;
  dateUpdated?: string;
  createdAt?: string;
  updateAt?: string;
  lastMade?: string;
  recipeIngredient?: Array<{
    id?: string;
    title?: string;
    note?: string;
    unit?: string | { id?: string; name: string } | null;
    food?: string | { id?: string; name: string } | null;
    disableAmount?: boolean;
    isFood?: boolean;
    display?: string;
    quantity?: number;
    originalText?: string | null;
    referenceId?: string;
  }>;
  recipeInstructions?: Array<{
    id?: string;
    title?: string;
    text: string;
    ingredientReferences?: Array<{
      referenceId?: string;
    }>;
  }>;
  nutrition?: {
    calories?: string;
    fatContent?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
    fiberContent?: string;
    sodiumContent?: string;
    sugarContent?: string;
  };
  settings?: {
    public?: boolean;
    showNutrition?: boolean;
    showAssets?: boolean;
    landscapeView?: boolean;
    disableComments?: boolean;
    disableAmount?: boolean;
    locked?: boolean;
  };
  assets?: any[];
  notes?: any[];
  extras?: Record<string, any>;
  comments?: any[];
}

export interface MealieConfig {
  mealieUrl: string;
  apiToken: string;
}

export interface CreateRecipeResponse {
  slug: string;
}
