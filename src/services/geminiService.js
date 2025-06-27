import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiNLPService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async parseNaturalLanguageEvent(userInput, currentDate) {
        const prompt = this.generatePrompt(userInput, currentDate);

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            let parsedEvent;
            try {
                parsedEvent = JSON.parse(text);
            } catch (parseError) {
                throw new Error('APIレスポンスのJSON解析に失敗しました');
            }

            if (!parsedEvent.title || !parsedEvent.date) {
                throw new Error('必須フィールド（title, date）が不足しています');
            }

            return parsedEvent;
        } catch (error) {

            if (error.status === 404) {
                throw new Error('Gemini APIエンドポイントが見つかりません。モデル名またはAPIキーを確認してください。');
            } else if (error.status === 401 || error.status === 403) {
                throw new Error('Gemini APIキーが無効です。.envファイルのAPIキーを確認してください。');
            } else if (error.message.includes('JSON')) {
                throw error;
            } else {
                throw new Error(`Gemini API呼び出しエラー: ${error.message}`);
            }
        }
    }

    generatePrompt(userInput, currentDate) {
        const currentDateStr = currentDate.toISOString();
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][currentDate.getDay()];

        return `
あなたは日本語カレンダーイベント解析専門AIです。
以下の自然言語からカレンダーイベント情報を正確に抽出してください。

【現在の日時情報】
- 現在日時: ${currentDateStr} (${dayOfWeek}曜日)
- タイムゾーン: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

【入力文】
"${userInput}"

【出力形式】
以下のJSON形式で必ず回答してください。他の文章は一切含めないでください。
コードブロックで囲む必要はありません。

{
  "title": "イベントのタイトル",
  "date": "YYYY-MM-DD形式の日付",
  "startTime": "HH:mm形式の開始時刻",
  "endTime": "HH:mm形式の終了時刻",
  "allDay": true/false,
  "description": "詳細説明（なければ空文字）",
  "confidence": 0.0-1.0の信頼度,
  "interpretation": "解析の解釈説明"
}

【解析ルール】
1. 相対日付（明日、来週、来月等）は現在日時を基準に計算
2. 時間が未指定の場合は適切なデフォルト時間を設定
3. 終了時間が未指定の場合は開始時間+1時間
4. 曜日指定は最も近い該当日を選択
5. 「午前」「午後」「朝」「夜」等は適切な時刻に変換
6. 日本の祝日・文化的文脈を考慮
7. 一日中や終日の場合はallDayをtrueに
8. 時刻は24時間形式で出力
`;
    }

    getDayOfWeek(date) {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[date.getDay()];
    }
}
