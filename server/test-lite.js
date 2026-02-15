const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testLite() {
    const m = "gemini-2.0-flash-lite";
    try {
        console.log(`Testing ${m}...`);
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.generateContent("hi");
        console.log(`✅ Model ${m} is working!`);
    } catch (e) {
        console.log(`❌ Model ${m} failed: ${e.message}`);
    }
}

testLite();
