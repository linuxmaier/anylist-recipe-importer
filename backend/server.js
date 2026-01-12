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

// --- ROUTES ---

// Test route to create a dummy recipe in AnyList
// POST http://localhost:3001/api/test-recipe
app.post('/api/test-recipe', async (req, res) => {
    try {
        const dummyRecipe = {
            name: "Test Recipe from Gemini CLI",
            note: "This was created during the setup of the AnyList Importer project.",
            ingredients: [
                "1 cup of enthusiasm",
                "2 tablespoons of code",
                "A pinch of AI"
            ],
            instructions: [
                "Initialize the project repository.",
                "Set up the Node.js backend.",
                "Call the AnyList API successfully."
            ],
            cookTime: 300 // 5 minutes
        };

        const result = await anylistService.createRecipe(dummyRecipe);
        res.json({ 
            success: true, 
            message: "Recipe created!", 
            recipeId: result.identifier 
        });
    } catch (error) {
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
