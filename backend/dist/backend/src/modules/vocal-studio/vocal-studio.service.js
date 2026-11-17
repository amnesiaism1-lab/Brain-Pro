"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocalStudioService = void 0;
const common_1 = require("@nestjs/common");
let VocalStudioService = class VocalStudioService {
    async alignLyricsWithGemini(payload, userApiKey) {
        const apiKey = (userApiKey || process.env.GEMINI_API_KEY || '').trim();
        if (!apiKey) {
            throw new common_1.BadRequestException('Chưa cấu hình GEMINI_API_KEY trên máy chủ. Bạn có thể nhập Gemini API Key cá nhân trong hộp thoại Tạo Lời AI hoặc dùng chế độ Tap-to-Sync miễn phí.');
        }
        if (!payload.audioBase64 || payload.audioBase64.length < 100) {
            throw new common_1.BadRequestException('Dữ liệu âm thanh không hợp lệ.');
        }
        const chunkOffsetMs = Number(payload.chunkOffsetMs || 0);
        const langLabel = payload.language === 'en' ? 'English' : 'Tiếng Việt (đúng chính tả và thanh điệu)';
        const hintSection = payload.hintLyrics?.trim()
            ? `\nLỜI GỐC THAM CHIẾU (Forced Alignment Mode - BẮT BUỘC bám sát đúng từng chữ trong lời này, chỉ định vị thời gian xuất hiện trong đoạn âm thanh):\n"""\n${payload.hintLyrics.trim()}\n"""\n`
            : '\nKhông có lời gợi ý: hãy nghe kỹ giọng hát chính (bỏ qua nhạc nền/nhạc cụ) và phiên âm chính xác từng câu hát.\n';
        const phraseHintStr = payload.phraseHints && payload.phraseHints.length > 0
            ? `\nCác khung câu hát gợi ý (tính bằng ms từ đầu đoạn audio này): ${payload.phraseHints
                .map((p) => `[Câu ${p.phraseIndex}: ${Math.max(0, p.startMs - chunkOffsetMs)}ms -> ${Math.max(0, p.endMs - chunkOffsetMs)}ms]`)
                .join(', ')}\n`
            : '';
        const prompt = `Bạn là chuyên gia phân tích thanh nhạc và đồng bộ lời bài hát Karaoke chính xác tới mili-giây.
Ngôn ngữ hát: ${langLabel}.${hintSection}${phraseHintStr}
Yêu cầu:
1. Tách riêng từng câu hát có trong đoạn audio này.
2. Trong mỗi câu, trả về thời điểm bắt đầu (timeMs) và kết thúc (endMs) tính từ đầu đoạn audio (0ms) cho TỪNG CHỮ (từng âm tiết) khớp với lúc ca sĩ thực sự cất tiếng hát chữ đó.
3. Đánh dấu "isSustained": true nếu chữ đó được ca sĩ ngân dài (>= 600ms) hoặc luyến ngân rõ rệt.
4. Trả về đúng định dạng JSON thuần theo schema:
{
  "lines": [
    {
      "timeMs": 1200,
      "text": "Nội dung cả câu hát",
      "words": [
        { "text": "Nội", "timeMs": 1200, "endMs": 1480, "isSustained": false },
        { "text": "dung", "timeMs": 1490, "endMs": 2250, "isSustained": true }
      ]
    }
  ]
}`;
        const model = 'gemini-2.5-flash';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: payload.mimeType || 'audio/wav',
                                    data: payload.audioBase64,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                },
            }),
        });
        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            throw new common_1.BadRequestException(`Gemini Audio API trả về lỗi (${response.status}): ${errBody.slice(0, 240)}`);
        }
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"lines":[]}';
        let parsed = {};
        try {
            parsed = JSON.parse(rawText);
        }
        catch {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        }
        const lines = Array.isArray(parsed.lines) ? parsed.lines : [];
        const normalizedLines = lines
            .filter((l) => l && typeof l.text === 'string' && l.text.trim().length > 0)
            .map((l) => {
            const lineStart = Math.max(0, Math.round(Number(l.timeMs || 0) + chunkOffsetMs));
            const words = Array.isArray(l.words)
                ? l.words
                    .filter((w) => w && typeof w.text === 'string' && w.text.trim().length > 0)
                    .map((w) => {
                    const wStart = Math.max(0, Math.round(Number(w.timeMs || 0) + chunkOffsetMs));
                    const wEnd = Math.max(wStart + 60, Math.round(Number(w.endMs || wStart + 220) + chunkOffsetMs));
                    return {
                        text: w.text.trim(),
                        timeMs: wStart,
                        endMs: wEnd,
                        isSustained: Boolean(w.isSustained),
                    };
                })
                : [];
            return {
                timeMs: words.length > 0 ? words[0].timeMs : lineStart,
                text: l.text.trim(),
                words,
            };
        });
        return { lines: normalizedLines, model };
    }
};
exports.VocalStudioService = VocalStudioService;
exports.VocalStudioService = VocalStudioService = __decorate([
    (0, common_1.Injectable)()
], VocalStudioService);
//# sourceMappingURL=vocal-studio.service.js.map