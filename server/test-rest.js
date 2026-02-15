const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash";

async function testREST() {
    const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

    console.log(`Testing REST API (v1) for model: ${MODEL}`);
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "hi" }] }]
        });
        console.log("✅ REST API Success!");
        console.log("Response:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.log("❌ REST API Failed!");
        console.log("Status:", err.response?.status);
        console.log("Error Body:", JSON.stringify(err.response?.data, null, 2));

        // Try v1beta as well
        console.log("\nAttempting v1beta...");
        const urlBeta = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        try {
            const responseBeta = await axios.post(urlBeta, {
                contents: [{ parts: [{ text: "hi" }] }]
            });
            console.log("✅ REST (v1beta) Success!");
        } catch (errBeta) {
            console.log("❌ REST (v1beta) Failed!");
            console.log("Error Body:", JSON.stringify(errBeta.response?.data, null, 2));
        }
    }
}

testREST();
