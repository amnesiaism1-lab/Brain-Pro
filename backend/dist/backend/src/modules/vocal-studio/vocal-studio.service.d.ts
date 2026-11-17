export interface IAiAlignedWord {
    text: string;
    timeMs: number;
    endMs: number;
    isSustained?: boolean;
}
export interface IAiAlignedLine {
    timeMs: number;
    text: string;
    words: IAiAlignedWord[];
}
export interface IAlignLyricsPayload {
    audioBase64: string;
    mimeType?: string;
    language?: 'vi' | 'en';
    hintLyrics?: string;
    chunkOffsetMs?: number;
    phraseHints?: Array<{
        phraseIndex: number;
        startMs: number;
        endMs: number;
    }>;
}
export declare class VocalStudioService {
    alignLyricsWithGemini(payload: IAlignLyricsPayload, userApiKey?: string): Promise<{
        lines: IAiAlignedLine[];
        model: string;
    }>;
}
