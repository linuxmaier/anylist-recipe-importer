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
            // Explicitly load recipes to ensure recipeDataId and _userData are set
            await this.anylist.getRecipes();
            
            // BUG FIX: The library fails to set the UID (User ID) internally.
            // We find it in the shared users list and set it manually.
            if (!this.anylist.uid && this.anylist._userData) {
                const allLists = this.anylist._userData.shoppingListsResponse.newLists;
                // Look for current user in the shared users of the first list
                const me = allLists[0].sharedUsers.find(
                    u => u.email.toLowerCase() === process.env.ANYLIST_EMAIL.toLowerCase()
                );
                if (me) {
                    this.anylist.uid = me.userId;
                }
            }

            // Format ingredients as objects with 'rawIngredient'
            const formattedIngredients = recipeData.ingredients.map(ing => ({
                rawIngredient: ing,
                name: ing, 
                quantity: "", 
                note: ""
            }));

            // Create the recipe object structure expected by the library
            const newRecipeData = {
                name: recipeData.name,
                note: recipeData.note || '',
                cookTime: recipeData.cookTime || 0,
                prepTime: recipeData.prepTime || 0,
                servings: recipeData.servings || "",
                preparationSteps: recipeData.instructions || [],
                ingredients: formattedIngredients,
                creationTimestamp: Math.floor(Date.now() / 1000) // Set current time for sorting
            };

            // Create and save the recipe
            const recipe = await this.anylist.createRecipe(newRecipeData);
            await recipe.save();

            // CRITICAL: New recipes MUST be added to the "All Recipes" collection
            // to be visible in the AnyList UI.
            const allRecipesColRaw = this.anylist._userData.recipeDataResponse.allRecipesCollection;
            if (allRecipesColRaw) {
                const RecipeCollection = require('anylist/lib/recipe-collection');
                const allRecipesCol = new RecipeCollection(allRecipesColRaw, {
                    client: this.anylist.client,
                    protobuf: this.anylist.protobuf,
                    uid: this.anylist.uid,
                    recipeDataId: this.anylist.recipeDataId
                });
                console.log('Adding recipe to "All Recipes" master collection...');
                await allRecipesCol.addRecipe(recipe.identifier);
            }

            console.log(`Recipe "${recipeData.name}" saved successfully!`);
            return recipe;
        } catch (error) {
            console.error('Failed to create recipe:', error);
            throw error;
        }
    }

    /**
     * Adds a recipe to a specific collection.
     * @param {string} recipeId 
     * @param {string} collectionId 
     */
    async addRecipeToCollection(recipeId, collectionId) {
        if (!this.isAuthenticated) {
            await this.login();
        }

        // We need the raw user data to find the collection object
        const userData = await this.anylist._getUserData();
        const rawCollection = userData.recipeDataResponse.recipeCollections.find(c => c.identifier === collectionId);
        
        if (!rawCollection) {
            throw new Error(`Collection with ID ${collectionId} not found.`);
        }

        // Create a wrapper instance using the internal library class
        // We have to use the internal method because 'anylist' doesn't expose RecipeCollection directly in a public way easily
        const RecipeCollection = require('anylist/lib/recipe-collection');
        const collection = new RecipeCollection(rawCollection, {
            client: this.anylist.client,
            protobuf: this.anylist.protobuf,
            uid: this.anylist.uid,
            recipeDataId: this.anylist.recipeDataId
        });

        console.log(`Adding recipe ${recipeId} to collection ${collection.name}...`);
        await collection.addRecipe(recipeId);
        console.log('Recipe added to collection.');
    }
}

module.exports = new AnyListService();
