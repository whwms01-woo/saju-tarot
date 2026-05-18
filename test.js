import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
    console.log("🔍 API 키 검증 및 사용 가능한 모델 목록을 불러옵니다...");
    console.log("사용 중인 API 키 앞부분:", process.env.GEMINI_API_KEY.substring(0, 15) + "...");
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("\n✅ [성공] 이 API 키로 사용할 수 있는 모델 목록:");
            data.models.forEach(m => {
                if(m.name.includes('gemini')) {
                    console.log("- " + m.name);
                }
            });
            console.log("\n이 목록에 models/gemini-1.5-flash 가 없다면 API 키에 권한 문제가 있는 것입니다.");
        } else if (data.error) {
            console.log("\n❌ [에러 발생] API 키 자체가 거부되었습니다:");
            console.log(data.error.message);
        } else {
            console.log("\n❓ 알 수 없는 응답:", data);
        }
    } catch (error) {
        console.error("통신 에러:", error);
    }
}

checkModels();
