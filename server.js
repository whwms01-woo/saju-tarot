import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

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
        const { cardIndex, cardName, topic } = req.body;
        
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
        
        const memeList = `
        - 재물/돈: "https://media.giphy.com/media/xTiTnqUxyWbsAXq7Ju/giphy.gif"
        - 파산/거지: "https://media.giphy.com/media/Km2YiI2mzRKgw/giphy.gif"
        - 연애/사랑: "https://media.giphy.com/media/l41lUjUgLLwWrz20w/giphy.gif"
        - 솔로/슬픔: "https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif"
        - 직장/스트레스/분노: "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif"
        - 피곤/퇴사/탈주: "https://media.giphy.com/media/3o7TKEP6YlGQ40A59m/giphy.gif"
        - 성공/자신감: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
        - 충격/팩폭: "https://media.giphy.com/media/3kzJvEciJa94SMW3hN/giphy.gif"
        - 무념무상/존버: "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif"
        `;
        
        const prompt = `너는 MZ세대가 좋아하는 트렌디하고 유쾌한 타로 마스터야. 
        사용자가 궁금해하는 주제는 '${topic || '오늘의 운세'}'이고, 뽑은 카드는 '${cardName}'이야.
        이 타로 카드가 상징하는 본래의 의미(팩트)를 바탕으로, 사용자가 질문한 주제에 맞게 상황을 해석하고 조언해 줘. 
        
        조건:
        1. 너무 길지 않게 3~4문장으로 답변할 것.
        2. '~요', '~습니다' 대신 '~함', '~셈', '각' 같은 MZ 인터넷 밈이나 팩폭(팩트폭력) 말투를 적절히 사용할 것.
        3. 카드의 실제 상징적 의미(팩트)를 꼭 반영해서 설득력 있게 설명할 것.
        4. 이모지(Emoji)를 적극적으로 사용할 것.
        5. 아래 제공된 밈(짤) URL 목록 중에서 운세 결과와 가장 잘 어울리는 이미지 URL 하나를 골라 'imageUrl' 필드에 넣어줘.
        [밈 URL 목록]
        ${memeList}
        
        반드시 아래 JSON 형식으로만 답변해:
        {
            "quote": "핵심 조언이나 팩폭 한 줄",
            "desc": "상세 운세 풀이 내용",
            "imageUrl": "선택한 URL"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up markdown block if present
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonResult = JSON.parse(text);

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
        
        const memeList = `
        - 재물/돈: "https://media.giphy.com/media/xTiTnqUxyWbsAXq7Ju/giphy.gif"
        - 파산/거지: "https://media.giphy.com/media/Km2YiI2mzRKgw/giphy.gif"
        - 연애/사랑: "https://media.giphy.com/media/l41lUjUgLLwWrz20w/giphy.gif"
        - 솔로/슬픔: "https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif"
        - 직장/스트레스/분노: "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif"
        - 피곤/퇴사/탈주: "https://media.giphy.com/media/3o7TKEP6YlGQ40A59m/giphy.gif"
        - 성공/자신감: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
        - 충격/팩폭: "https://media.giphy.com/media/3kzJvEciJa94SMW3hN/giphy.gif"
        - 무념무상/존버: "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif"
        `;

        const prompt = `너는 팩트폭력을 날리면서도 유쾌하게 사주를 봐주는 MZ 도사야.
        사용자 정보:
        - 이름: ${name || '익명'}
        - 사는 지역(태어난 곳): ${region || '모름'}
        - 생년월일: ${birthDate || '모름'}
        - 태어난 시간: ${birthTime || '모름'}
        
        위 정보를 바탕으로 이 사람의 올해 사주(운세)를 풀이해 줘. (사는 지역 정보가 있다면 이를 반영해서 재치있게 엮어줘)
        
        조건:
        1. 3~4문장으로 간결하게 작성할 것.
        2. 킹받지만 반박할 수 없는 유쾌한 말투를 사용할 것 (~임, ~셈, ~각 등).
        3. 이모지(Emoji)를 적극적으로 사용할 것.
        4. 아래 제공된 밈(짤) URL 목록 중에서 사주 결과와 가장 잘 어울리는 이미지 URL 하나를 골라 'imageUrl' 필드에 넣어줘.
        [밈 URL 목록]
        ${memeList}
        
        반드시 아래 JSON 형식으로만 답변해:
        {
            "quote": "사주 핵심 요약 한 줄",
            "desc": "상세 사주 풀이 내용",
            "imageUrl": "선택한 URL"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up markdown block if present
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonResult = JSON.parse(text);

        res.json(jsonResult);
    } catch (error) {
        console.error('Saju API Error:', error);
        res.status(500).json({ error: "사주 분석 중 오류가 발생했습니다." });
    }
});

app.listen(port, () => {
    console.log(`서버가 성공적으로 켜졌습니다! http://localhost:${port} 로 접속하세요.`);
});
