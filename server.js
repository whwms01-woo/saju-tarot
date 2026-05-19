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

// Tarot API Endpoint
app.post('/api/tarot', async (req, res) => {
    try {
        const { cards } = req.body;
        
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
        
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
        4. 이 전체 운세 흐름(과거->미래)과 가장 잘 어울리는 상황을 '재미있는 서양 레트로 만화책 한 컷' 스타일로 표현할 수 있도록, 영어 프롬프트를 10~15단어로 작성해 'imagePrompt'에 넣어줘. (반드시 "retro comic book panel, pop art style, halftone texture" 키워드를 포함할 것)
        
        반드시 아래 JSON 형식으로만 답변해:
        {
            "imagePrompt": "retro comic book panel, pop art style, halftone texture, a confident person opening a magical door",
            "past": { "quote": "과거 핵심", "desc": "상세 풀이" },
            "present": { "quote": "현재 핵심", "desc": "상세 풀이" },
            "future": { "quote": "미래 핵심", "desc": "상세 풀이" }
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up markdown block if present
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonResult = JSON.parse(text);

        if (jsonResult.imagePrompt) {
            jsonResult.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(jsonResult.imagePrompt)}?width=600&height=400&nologo=true`;
        }

        res.json(jsonResult);
    } catch (error) {
        console.error('Tarot API Error:', error);
        res.status(500).json({ error: "운세 분석 중 오류가 발생했습니다." });
    }
});

// Saju API Endpoint
app.post('/api/saju', async (req, res) => {
    try {
        const { name, region, birthDate, birthTime } = req.body;
        
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
        
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
        4. 이 운세 결과와 가장 잘 어울리는 상황을 '재미있는 서양 레트로 만화책 한 컷' 스타일로 표현할 수 있도록, 영어 프롬프트를 10~15단어로 작성해 'imagePrompt'에 넣어줘. (반드시 "retro comic book panel, pop art style, halftone texture" 키워드를 포함할 것)
        
        반드시 아래 JSON 형식으로만 답변해:
        {
            "imagePrompt": "retro comic book panel, pop art style, halftone texture, a frustrated person surrounded by fire",
            "today": { "quote": "올해의 총운 핵심", "desc": "상세 풀이" },
            "love": { "quote": "연애운 핵심", "desc": "상세 풀이" },
            "wealth": { "quote": "금전운 핵심", "desc": "상세 풀이" }
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up markdown block if present
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonResult = JSON.parse(text);

        if (jsonResult.imagePrompt) {
            jsonResult.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(jsonResult.imagePrompt)}?width=600&height=400&nologo=true`;
        }

        res.json(jsonResult);
    } catch (error) {
        console.error('Saju API Error:', error);
        res.status(500).json({ error: "사주 분석 중 오류가 발생했습니다." });
    }
});

app.listen(port, () => {
    console.log(`서버가 성공적으로 켜졌습니다! http://localhost:${port} 로 접속하세요.`);
});
