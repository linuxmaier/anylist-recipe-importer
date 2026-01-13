export interface Recipe {
    name: string;
    ingredients: string[];
    instructions: string[];
    notes?: string;
    cookTime?: number;
    prepTime?: number;
    servings?: string;
    creationTimestamp?: number;
}

export interface Collection {
    id: string;
    name: string;
}

export interface ApiScanResponse {
    success: boolean;
    recipe?: Recipe;
    error?: string;
}

export interface ApiCollectionResponse {
    success: boolean;
    count: number;
    collections: Collection[];
}
