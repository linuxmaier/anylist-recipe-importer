const AnyList = require('anylist');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AnyListService handles all communication with the AnyList API.
 * It maintains a single instance of the AnyList client.
 */
class AnyListService {
    constructor() {
        this.anylist = new AnyList({
            email: process.env.ANYLIST_EMAIL,
            password: process.env.ANYLIST_PASSWORD
        });
        this.isAuthenticated = false;
    }

    /**
     * Authenticates with AnyList.
     * Must be called before any other operations.
     */
    async login() {
        try {
            console.log('Logging into AnyList...');
            await this.anylist.login();
            this.isAuthenticated = true;
            console.log('Successfully authenticated with AnyList');
        } catch (error) {
            console.error('AnyList login failed:', error.message);
            throw new Error('Could not authenticate with AnyList. Check your credentials.');
        }
    }

    /**
     * Creates a new recipe in AnyList.
     * @param {Object} recipeData - The formatted recipe data.
     */
    async createRecipe(recipeData) {
        if (!this.isAuthenticated) {
            await this.login();
        }

        try {
            // Create a new recipe instance
            const recipe = this.anylist.createRecipe(recipeData.name);
            
            // Set basic fields
            recipe.note = recipeData.note || '';
            recipe.cookTime = recipeData.cookTime || 0; // In seconds
            recipe.prepTime = recipeData.prepTime || 0; // In seconds
            recipe.servings = recipeData.servings || "";

            // Add ingredients
            // The library expects an array of strings or objects.
            // Using strings is the simplest way to import raw text.
            recipe.ingredients = recipeData.ingredients.map(ing => {
                return this.anylist.createRecipeIngredient(ing);
            });

            // Add preparation steps (Procedure)
            recipe.preparationSteps = recipeData.instructions || [];

            // Save to AnyList server
            await recipe.save();
            console.log(`Recipe "${recipeData.name}" saved successfully!`);
            return recipe;
        } catch (error) {
            console.error('Failed to create recipe:', error);
            throw error;
        }
    }
}

module.exports = new AnyListService();
