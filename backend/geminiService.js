const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
require('dotenv').config();

// Define the schema for the recipe output
// This ensures Gemini returns exactly the JSON structure we need for AnyList
const recipeSchema = {
    description: "Recipe data extracted from an image",
    type: SchemaType.OBJECT,
    properties: {
        name: {
            type: SchemaType.STRING,
            description: "The name of the recipe in Title Case (e.g., 'Apple Pie')",
            nullable: false,
        },
        ingredients: {
            type: SchemaType.ARRAY,
            description: "List of ingredients with quantities (e.g., '2 cups flour')",
            items: { type: SchemaType.STRING }
        },
        instructions: {
            type: SchemaType.ARRAY,
            description: "Step-by-step cooking instructions",
            items: { type: SchemaType.STRING }
        },
        notes: {
            type: SchemaType.STRING,
            description: "Any extra notes, including ingredient substitutions or chef's tips",
            nullable: true
        },
        cookTime: {
            type: SchemaType.INTEGER,
            description: "Estimated cooking time in seconds (0 if not specified)",
            nullable: true
        },
        prepTime: {
            type: SchemaType.INTEGER,
            description: "Estimated preparation time in seconds (0 if not specified)",
            nullable: true
        },
        servings: {
            type: SchemaType.STRING,
            description: "Number of servings (e.g., '4 servings' or 'Makes 12 cookies')",
            nullable: true
        }
    },
    required: ["name", "ingredients", "instructions"]
};

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing from .env file");
        }
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Use gemini-2.5-flash for the latest performance and reasoning capabilities
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            }
        });
    }

    /**
     * Extracts recipe data from an image buffer.
     * @param {Buffer} imageBuffer - The raw image data.
     * @param {string} mimeType - The MIME type of the image (e.g., 'image/jpeg').
     * @returns {Promise<Object>} - The extracted recipe JSON.
     */
    async extractRecipeFromImage(imageBuffer, mimeType) {
        try {
            const prompt = `
            You are an expert recipe digitizer. Extract the recipe from this image.
            
            Follow these rules strictly:
            1. **Title:** Convert the recipe name to Title Case (e.g., "CHOCOLATE CAKE" -> "Chocolate Cake").
            2. **Fractions:** Standardize all fractions using the '/' character (e.g., use "1/2" not "½" or "one half").
            3. **Ingredients:** List each ingredient clearly. If an ingredient has a substitution listed (e.g., "butter or margarine"), include the substitution in the 'notes' field, not the ingredient line, unless it's essential to the name.
            4. **Instructions:** Break down the procedure into clear, sequential steps.
            5. **Times:** Convert all cook and prep times to total SECONDS. If only a total time is given, put it in 'cookTime'.
            `;

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: mimeType
                }
            };

            const result = await this.model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();
            
            // The output is guaranteed to be JSON due to responseMimeType config
            return JSON.parse(text);
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new Error(`Failed to process image with Gemini: ${error.message}`);
        }
    }
}

module.exports = new GeminiService();
