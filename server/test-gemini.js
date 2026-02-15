const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testMore() {
    // Try v1 explicitly if possible, or just more model names
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    console.log("Deep testing models...");

    for (const m of models) {
        try {
            console.log(`Checking ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("test");
            console.log(`✅ ${m} WORKS!`);
            return;
        } catch (e) {
            console.log(`❌ ${m} failed: ${e.message}`);
        }
    }
    console.log("All standard models failed. Checking if there's an issue with the API Key or Network.");
}

testMore();
