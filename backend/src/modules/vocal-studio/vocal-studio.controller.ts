import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IAlignLyricsPayload, VocalStudioService } from './vocal-studio.service';

@ApiTags('vocal-studio')
@Controller('api/vocal-studio')
export class VocalStudioController {
  constructor(private readonly vocalStudioService: VocalStudioService) {}

  @Post('align-lyrics')
  @ApiOperation({
    summary: 'Phiên âm và khớp lời từng chữ theo thời gian thực từ đoạn âm thanh vocal bằng Gemini Audio API',
  })
  async alignLyrics(
    @Body() payload: IAlignLyricsPayload,
    @Headers('x-gemini-api-key') userApiKey?: string
  ) {
    return this.vocalStudioService.alignLyricsWithGemini(payload, userApiKey);
  }
}
