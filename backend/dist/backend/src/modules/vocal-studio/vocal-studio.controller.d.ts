import { IAlignLyricsPayload, VocalStudioService } from './vocal-studio.service';
export declare class VocalStudioController {
    private readonly vocalStudioService;
    constructor(vocalStudioService: VocalStudioService);
    alignLyrics(payload: IAlignLyricsPayload, userApiKey?: string): Promise<{
        lines: import("./vocal-studio.service").IAiAlignedLine[];
        model: string;
    }>;
}
