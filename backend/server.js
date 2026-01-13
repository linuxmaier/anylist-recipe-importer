// Import necessary libraries
// 'express' is the web framework (like FastAPI/Flask in Python).
const express = require('express');

// 'cors' allows our frontend (running on a different port) to talk to this backend.
const cors = require('cors');

// 'dotenv' loads environment variables from a .env file (API keys, passwords).
require('dotenv').config();

// Initialize the Express application
const app = express();

// Define the port to run on (default to 3001 to avoid conflict with React's default 3000)
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
// Middleware functions run before your routes. They process the incoming request.

// Enable CORS for all requests (allows your React app to hit this API)
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Import our custom services
const anylistService = require('./anylistService');
const geminiService = require('./geminiService');

// Configure Multer for memory storage (uploaded files are held in RAM)
const multer = require('multer');
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
});

// --- ROUTES ---

// Route to scan a recipe image and return structured JSON
// POST http://localhost:3001/api/scan-recipe
app.post('/api/scan-recipe', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: "No image file provided." 
            });
        }

        console.log(`Received image scan request: ${req.file.originalname} (${req.file.size} bytes)`);

        // Send to Gemini
        const recipeData = await geminiService.extractRecipeFromImage(
            req.file.buffer, 
            req.file.mimetype
        );

        console.log("Gemini extraction successful:", recipeData.name);

        // Return the extracted data to the frontend for review
        res.json({ 
            success: true, 
            recipe: recipeData 
        });

    } catch (error) {
        console.error("Scan Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Route to create a real recipe (after review)
// POST http://localhost:3001/api/create-recipe
app.post('/api/create-recipe', async (req, res) => {
    try {
        const recipeData = req.body;
        
        // Basic validation
        if (!recipeData.name || !recipeData.ingredients) {
             return res.status(400).json({ error: "Missing required recipe fields" });
        }

        console.log(`Creating verified recipe: ${recipeData.name}`);

        const result = await anylistService.createRecipe(recipeData);

        res.json({ 
            success: true, 
            message: "Recipe created successfully!", 
            recipeId: result.identifier 
        });

    } catch (error) {
        console.error("Create Recipe Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test route to create a dummy recipe in AnyList
// POST http://localhost:3001/api/test-recipe
app.post('/api/test-recipe', async (req, res) => {
    try {
        const dummyRecipe = {
            name: "Minimal Test Recipe " + Date.now(), // Unique name
            ingredients: [],
            instructions: []
        };

        // Create the recipe
        const result = await anylistService.createRecipe(dummyRecipe);
        
        // HARDCODED: "Main Dishes" collection ID from your previous debug output
        // "Main Dishes" -> 4686dfa9653648a189154fa8578b594c
        const collectionId = "4686dfa9653648a189154fa8578b594c";
        
        try {
            await anylistService.addRecipeToCollection(result.identifier, collectionId);
            res.json({ 
                success: true, 
                message: "Minimal recipe created and added to Main Dishes!", 
                recipeId: result.identifier 
            });
        } catch (collectionError) {
             console.error("Failed to add to collection:", collectionError);
             // Still return success for the recipe creation, but warn about collection
             res.json({ 
                success: true, 
                message: "Recipe created, but failed to add to collection.", 
                recipeId: result.identifier,
                collectionError: collectionError.message
            });
        }

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Debug route to list all recipes
// GET http://localhost:3001/api/debug-recipes
app.get('/api/debug-recipes', async (req, res) => {
    try {
        if (!anylistService.isAuthenticated) {
            await anylistService.login();
        }
        
        // Force a refresh of recipes from the server
        const recipes = await anylistService.anylist.getRecipes(true); 
        
        // Return count and list of names/IDs
        const recipeList = recipes.map(r => ({
            name: r.name,
            id: r.identifier
        }));

        res.json({ 
            success: true,
            totalCount: recipes.length, 
            recipes: recipeList 
        });
    } catch (error) {
        console.error("Debug Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Debug route to list recipe collections
// GET http://localhost:3001/api/debug-collections
app.get('/api/debug-collections', async (req, res) => {
    try {
        if (!anylistService.isAuthenticated) {
            await anylistService.login();
        }
        
        // Refresh user data to get collections
        const userData = await anylistService.anylist._getUserData(true);
        const collections = userData.recipeDataResponse.recipeCollections;

        res.json({ 
            success: true,
            count: collections.length, 
            collections: collections.map(c => ({
                name: c.name,
                id: c.identifier
            }))
        });
    } catch (error) {
        console.error("Debug Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Debug route to inspect a specific recipe
// GET http://localhost:3001/api/debug-recipe/:id
app.get('/api/debug-recipe/:id', async (req, res) => {
    try {
        if (!anylistService.isAuthenticated) {
            await anylistService.login();
        }
        
        const recipes = await anylistService.anylist.getRecipes();
        const recipe = recipes.find(r => r.identifier === req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        // Return the raw recipe object to see all its properties
        res.json({ 
            success: true,
            recipe: recipe 
        });
    } catch (error) {
        console.error("Debug Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/', (req, res) => {
    // Send back a JSON response
    res.json({ message: "AnyList Importer Backend is running!" });
});

// We will add more routes here later, for example:
// app.post('/upload', uploadMiddleware, (req, res) => { ... })

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`To stop the server, press Ctrl+C`);
});
