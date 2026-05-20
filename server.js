import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from current directory
app.use(express.static('./'));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Robust Gemini Helper with Model Fallbacks, Safe JSON Extraction, and Automatic Rate Limit Retries
async function generateGeminiContent(prompt) {
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    const errors = [];

    for (const modelName of models) {
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`[Gemini] Attempting generation with model: ${modelName} (Attempt ${attempts}/${maxAttempts})...`);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" }
                });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text();
                
                // Clean up markdown block if present
                text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                
                // Extract strictly from { to }
                const startIndex = text.indexOf('{');
                const endIndex = text.lastIndexOf('}');
                if (startIndex !== -1 && endIndex !== -1) {
                    text = text.substring(startIndex, endIndex + 1);
                }
                
                const jsonResult = JSON.parse(text);
                console.log(`[Gemini] Successfully generated and parsed content using model: ${modelName}!`);
                return jsonResult;
            } catch (err) {
                const errMessage = err.message || '';
                const isRateLimit = errMessage.includes('429') || 
                                    errMessage.toLowerCase().includes('quota') || 
                                    errMessage.toLowerCase().includes('rate limit') || 
                                    errMessage.toLowerCase().includes('too many requests');
                
                console.error(`[Gemini] Model ${modelName} failed on attempt ${attempts}:`, errMessage);
                
                if (isRateLimit && attempts < maxAttempts) {
                    const delay = attempts === 1 ? 3000 : 5000;
                    console.log(`[Gemini] Rate limit hit. Sleeping for ${delay}ms before retrying ${modelName}...`);
                    await sleep(delay);
                } else {
                    // Record error and move to next model if we ran out of attempts or it's a non-rate-limit error
                    errors.push(`${modelName} (Attempt ${attempts}/${maxAttempts}): ${errMessage}`);
                    break;
                }
            }
        }
    }
    
    throw new Error(`모든 AI 모델 호출 실패:\n- ${errors.join('\n- ')}`);
}


// Tarot API Endpoint
app.post('/api/tarot', async (req, res) => {
    try {
        const { cards } = req.body;
        
        const prompt = `너는 MZ세대가 좋아하는 트렌디하고 유쾌한 타로 마스터야. 
        사용자가 과거, 현재, 미래를 알아보기 위해 총 3장의 카드를 뽑았어.
        - 과거 카드: '${cards[0]}'
        - 현재 카드: '${cards[1]}'
        - 미래 카드: '${cards[2]}'
        
        각 카드의 상징적 의미(팩트)를 바탕으로 하나의 이어지는 스토리처럼 운세를 해석해 줘. 
        
        조건:
        1. '과거(원인)', '현재(상황)', '미래(결과/조언)' 3가지 카테고리로 나누어 답변할 것.
        2. 각 카테고리의 'desc'는 2~3문장으로 짧고 임팩트 있게 쓸 것.
        3. '~요', '~습니다' 대신 '~함', '~셈', '각' 같은 MZ 인터넷 밈이나 팩폭 말투를 사용할 것.
        
        반드시 아래 JSON 형식으로만 답변해:
        {
            "past": { "quote": "과거 핵심", "desc": "상세 풀이" },
            "present": { "quote": "현재 핵심", "desc": "상세 풀이" },
            "future": { "quote": "미래 핵심", "desc": "상세 풀이" }
        }`;

        const jsonResult = await generateGeminiContent(prompt);
        res.json(jsonResult);
    } catch (error) {
        console.error('Tarot API Error:', error);
        res.status(500).json({ error: `타로 분석 에러: ${error.message}` });
    }
});

// Saju API Endpoint
app.post('/api/saju', async (req, res) => {
    try {
        const { name, region, birthDate, birthTime } = req.body;
        
        const prompt = `너는 팩트폭력을 날리면서도 유쾌하게 사주를 봐주는 MZ 도사야.
        사용자 정보:
        - 이름: ${name || '익명'}
        - 사는 지역(태어난 곳): ${region || '모름'}
        - 생년월일: ${birthDate || '모름'}
        - 태어난 시간: ${birthTime || '모름'}
        
        이 정보를 바탕으로 이 사람의 올해 사주(운세)를 풀이해 줘.
        
        조건:
        1. '올해의 총운', '연애운', '금전운' 3가지 카테고리로 나누어 답변할 것.
        2. 각 카테고리의 'desc'는 2~3문장으로 짧고 임팩트 있게 쓸 것.
        3. 킹받지만 반박할 수 없는 유쾌한 말투를 사용할 것 (~임, ~셈, ~각 등).
        
        반드시 아래 JSON 형식으로만 답변해:
        {
            "today": { "quote": "올해의 총운 핵심", "desc": "상세 풀이" },
            "love": { "quote": "연애운 핵심", "desc": "상세 풀이" },
            "wealth": { "quote": "금전운 핵심", "desc": "상세 풀이" }
        }`;

        const jsonResult = await generateGeminiContent(prompt);
        res.json(jsonResult);
    } catch (error) {
        console.error('Saju API Error:', error);
        res.status(500).json({ error: `사주 분석 에러: ${error.message}` });
    }
});

// Diagnosis endpoint accessible via browser
app.get('/api/diag', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const diag = {
        apiKeyStatus: apiKey ? `LOADED (Length: ${apiKey.length})` : "NOT LOADED",
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 5)}...${apiKey.slice(-5)}` : "NONE",
        models: [],
        error: null
    };
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            diag.models = data.models.map(m => m.name);
        } else if (data.error) {
            diag.error = data.error.message;
        } else {
            diag.error = JSON.stringify(data);
        }
    } catch (err) {
        diag.error = err.message;
    }
    res.json(diag);
});

app.listen(port, () => {
    console.log(`서버가 성공적으로 켜졌습니다! http://localhost:${port} 로 접속하세요.`);
});

// Startup Diagnostic Logs to debug API key and model availability
(async () => {
    console.log("=== STARTUP DIAGNOSTICS ===");
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("GEMINI_API_KEY status:", apiKey ? `LOADED (Length: ${apiKey.length})` : "NOT LOADED");
    if (apiKey) {
        console.log("GEMINI_API_KEY preview:", `${apiKey.substring(0, 5)}...${apiKey.slice(-5)}`);
        try {
            console.log("[Diagnostic] Fetching available models from Google API...");
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();
            if (data.models) {
                console.log("[Diagnostic] Successfully fetched models! Available models:");
                data.models.forEach(m => console.log(`  - ${m.name}`));
            } else if (data.error) {
                console.log("[Diagnostic] Google API returned an error:", data.error.message);
            } else {
                console.log("[Diagnostic] Unknown response structure:", data);
            }
        } catch (err) {
            console.error("[Diagnostic] Failed to fetch models:", err.message);
        }
    }
    console.log("===========================");
})();
