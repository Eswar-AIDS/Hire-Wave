const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log("Fetching authorized models for this API key...");
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;

    try {
        const response = await axios.get(url);
        console.log("✅ Successfully fetched models!");
        const models = response.data.models;
        if (models && models.length > 0) {
            console.log("Available Model IDs:");
            models.forEach(m => console.log(` - ${m.name.replace('models/', '')}`));
        } else {
            console.log("⚠️ No models found for this key.");
        }
    } catch (err) {
        console.log("❌ Failed to fetch models!");
        console.log("Status:", err.response?.status);
        console.log("Error Body:", JSON.stringify(err.response?.data, null, 2));
    }
}

listModels();
