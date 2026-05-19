import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    console.log("=== GEMINI API CONNECTION TEST ===");
    console.log("Using API KEY:", process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : "NO KEY FOUND");
    
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    for (const modelName of modelsToTry) {
        console.log(`\n[Testing Model: ${modelName}]...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi, say exactly 'SUCCESS' in JSON format: {\"status\":\"SUCCESS\"}");
            const response = await result.response;
            console.log(`✅ ${modelName} SUCCESS! Response text:`, response.text());
        } catch (err) {
            console.error(`❌ ${modelName} FAILED:`, err.message);
        }
    }
}

test();
