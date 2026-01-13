// Import necessary libraries
// 'express' is the web framework (like FastAPI/Flask in Python).
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'anylist-import-secret-key';

// --- MIDDLEWARE ---

const allowedOrigins = [
    'http://localhost:5173', // Standard local dev
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost for browser testing on the same machine
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Allow local network IPs for mobile testing during development
        // This regex matches http://192.168.X.X:5173, http://10.X.X.X:5173, etc.
        const localNetworkRegex = /^(http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\d{1,3}\.\d{1,3}):5173$/;
        if (process.env.NODE_ENV !== 'production' && localNetworkRegex.test(origin)) {
            return callback(null, true);
        }

        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiter for login attempts: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Too many login attempts. Please try again in 15 minutes." }
});

// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired session" });
    }
};

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

// Login route with rate limiting
app.post('/api/login', loginLimiter, (req, res) => {
    const { password } = req.body;
    const expectedPassword = process.env.SHARED_PASSWORD;

    if (!expectedPassword) {
        return res.status(500).json({ error: "Server security not configured. Please set SHARED_PASSWORD." });
    }

    if (password === expectedPassword) {
        // Create a token that expires in 30 days
        const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '30d' });
        
        // Set as an HttpOnly cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json({ success: true });
    } else {
        res.status(401).json({ error: "Incorrect password" });
    }
});

// Check if current session is valid
app.get('/api/check-auth', authenticate, (req, res) => {
    res.json({ authenticated: true });
});

// Logout route
app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
});

// Route to scan a recipe image and return structured JSON
// POST http://localhost:3001/api/scan-recipe
app.post('/api/scan-recipe', authenticate, upload.single('image'), async (req, res) => {
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
app.post('/api/create-recipe', authenticate, async (req, res) => {
    try {
        const recipeData = req.body;
        
        // Basic validation
        if (!recipeData.name || !recipeData.ingredients) {
             return res.status(400).json({ error: "Missing required recipe fields" });
        }

        console.log(`Creating verified recipe: ${recipeData.name}`);

        const result = await anylistService.createRecipe(recipeData);

        // If a collection ID was provided, add it to that collection too
        if (recipeData.collectionId) {
            try {
                await anylistService.addRecipeToCollection(result.identifier, recipeData.collectionId);
                console.log(`Added to collection: ${recipeData.collectionId}`);
            } catch (collectionError) {
                console.error("Failed to add to user-selected collection:", collectionError);
                // We don't fail the whole request since the recipe WAS created in "All Recipes"
            }
        }

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
app.post('/api/test-recipe', authenticate, async (req, res) => {
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
app.get('/api/debug-recipes', authenticate, async (req, res) => {
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
app.get('/api/debug-collections', authenticate, async (req, res) => {
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
app.get('/api/debug-recipe/:id', authenticate, async (req, res) => {
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
