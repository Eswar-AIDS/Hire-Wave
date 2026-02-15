const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeResumeText = async (text) => {
    // Every single model confirmed authorized for your specific API Key
    const modelsToTry = [
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash-001",
        "gemini-2.0-flash"
    ];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[AI-DIAG] Attempting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
                Analyze the following resume text for HireWave, a college recruitment platform. 
                Return ONLY a JSON object with these keys:
                "summaryCritique": { "summary": "2-sentence overview", "feedback": ["array of critique points"] },
                "scoreBreakdown": { "education": 0-25, "skills": 0-25, "projects": 0-25, "experience": 0-25 },
                "categorizedSkills": { "technical": [], "tools": [], "soft": [] },
                "placementProbability": (Total score 0-100),
                "suitableRoles": ["Array of 3 roles"],
                "companyTypes": ["Array of types"],
                "roadmap": [{ "suggestion": "string", "priority": "High" | "Medium" | "Optional" }],
                "atsCheck": { "keywords": "High" | "Low", "formatting": "Good" | "Bad", "readability": "Good" | "Bad" }

                Text: ${text}
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const resText = response.text();

            console.log(`[AI-DIAG] Raw response from ${modelName} received.`);

            // Basic cleaning
            const jsonStr = resText.replace(/```json\n?|```/g, '').trim();
            const parsed = JSON.parse(jsonStr);

            console.log(`✅ AI Analysis SUCCESS with ${modelName}`);
            return {
                summaryCritique: parsed.summaryCritique || { summary: "", feedback: [] },
                scoreBreakdown: parsed.scoreBreakdown || { education: 0, skills: 0, projects: 0, experience: 0 },
                categorizedSkills: parsed.categorizedSkills || { technical: [], tools: [], soft: [] },
                placementProbability: parsed.placementProbability || 0,
                suitableRoles: parsed.suitableRoles || [],
                companyTypes: parsed.companyTypes || [],
                roadmap: parsed.roadmap || [],
                atsCheck: parsed.atsCheck || { keywords: "Low", formatting: "Good", readability: "Good" }
            };

        } catch (err) {
            lastError = err;
            console.error(`❌ ${modelName} FAILED: ${err.message}`);

            // If it's a 429 or 404, we definitely want the next one
            continue;
        }
    }

    // If we reach here, all fallbacks failed
    const isQuota = lastError?.message?.includes('429');
    return {
        skills: ["Extraction failed"],
        suitableRoles: ["Unavailable"],
        placementProbability: 0,
        companyTypes: ["Offline"],
        recommendations: [isQuota ? "The AI limit is reached. Please wait 1 minute." : "Check API key permissions in Google AI Studio."],
        summary: `Error: ${isQuota ? "Quota Reached (429)" : lastError?.message}`
    };
}

module.exports = { analyzeResumeText };
