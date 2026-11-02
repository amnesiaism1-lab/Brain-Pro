import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  extractYouTubeVideoId,
  extractYouTubeStartTime,
  diagnoseYouTubeError,
  POPULAR_BEAT_PRESETS,
} from '../youtubeBeatService';
import { vocalRecordingEngine } from '../vocalRecordingEngine';
import { youtubeSyncMixer } from '../youtubeSyncMixer';

describe('YouTube Beat Service & Recording Engine', () => {
  describe('extractYouTubeVideoId', () => {
    it('extracts ID from standard watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=vB6gQo5v_6g&feature=share')).toBe('vB6gQo5v_6g');
    });

    it('extracts ID from short youtu.be URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://youtu.be/5qap5aO4i9A?t=42')).toBe('5qap5aO4i9A');
    });

    it('extracts ID from embed URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
    });

    it('extracts ID from shorts URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/DWcJFNfaw9c')).toBe('DWcJFNfaw9c');
    });

    it('accepts raw 11-char ID', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for empty or invalid input', () => {
      expect(extractYouTubeVideoId('')).toBeNull();
      expect(extractYouTubeVideoId('https://google.com')).toBeNull();
      expect(extractYouTubeVideoId('invalid-string')).toBeNull();
    });

    it('extracts start timestamps in seconds', () => {
      expect(extractYouTubeStartTime('https://youtu.be/dQw4w9WgXcQ?t=45')).toBe(45);
      expect(extractYouTubeStartTime('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=80s')).toBe(80);
      expect(extractYouTubeStartTime('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s')).toBe(90);
      expect(extractYouTubeStartTime('https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=12')).toBe(12);
      expect(extractYouTubeStartTime('https://youtu.be/dQw4w9WgXcQ')).toBeNull();
    });

    it('has valid curated beat presets', () => {
      expect(POPULAR_BEAT_PRESETS.length).toBeGreaterThanOrEqual(4);
      for (const preset of POPULAR_BEAT_PRESETS) {
        expect(preset.videoId).toHaveLength(11);
        expect(preset.title).toBeDefined();
        expect(preset.suggestedStartSec).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('diagnoseYouTubeError', () => {
    it('identifies embed forbidden error 101/150', () => {
      const err101 = diagnoseYouTubeError(101);
      expect(err101.isEmbedForbidden).toBe(true);
      expect(err101.title).toContain('101/150');
      expect(err101.actionHint).toContain('chọn link beat khác');

      const err150 = diagnoseYouTubeError(150);
      expect(err150.isEmbedForbidden).toBe(true);
    });

    it('handles not found error 100', () => {
      const err = diagnoseYouTubeError(100);
      expect(err.isEmbedForbidden).toBe(false);
      expect(err.title).toContain('100');
    });

    it('handles invalid ID error 2', () => {
      const err = diagnoseYouTubeError(2);
      expect(err.code).toBe(2);
    });

    it('handles generic unknown errors', () => {
      const err = diagnoseYouTubeError(999);
      expect(err.code).toBe(999);
      expect(err.isEmbedForbidden).toBe(false);
    });
  });

  describe('vocalRecordingEngine waveform extraction', () => {
    it('extracts normalized waveform from PCM Float32Array', () => {
      const pcm = new Float32Array(2000);
      // Fill with sinusoidal wave
      for (let i = 0; i < pcm.length; i++) {
        pcm[i] = Math.sin(i / 10) * 0.8;
      }

      const points = 50;
      const waveform = vocalRecordingEngine.extractWaveformFromPcm(pcm, points);
      expect(waveform).toHaveLength(points);
      for (const peak of waveform) {
        expect(peak).toBeGreaterThanOrEqual(0.05);
        expect(peak).toBeLessThanOrEqual(1.0);
      }
    });

    it('handles empty PCM gracefully', () => {
      const waveform = vocalRecordingEngine.extractWaveformFromPcm(new Float32Array(0), 40);
      expect(waveform).toHaveLength(40);
      expect(waveform[0]).toBe(0.05);
    });
  });

  describe('YouTube Karaoke Synchronization & Player State Rules', () => {
    it('verifies that YouTube player state 2 (PAUSED) or 0 (ENDED) signals stop-condition for active recording', () => {
      const YT_STATE_ENDED = 0;
      const YT_STATE_PAUSED = 2;
      const YT_STATE_PLAYING = 1;

      const shouldStopRecording = (state: number, isRecording: boolean) => {
        return (state === YT_STATE_ENDED || state === YT_STATE_PAUSED) && isRecording;
      };

      expect(shouldStopRecording(YT_STATE_PAUSED, true)).toBe(true);
      expect(shouldStopRecording(YT_STATE_ENDED, true)).toBe(true);
      expect(shouldStopRecording(YT_STATE_PLAYING, true)).toBe(false);
      expect(shouldStopRecording(YT_STATE_PAUSED, false)).toBe(false);
    });

    it('calculates effective vocal start time with latency nudge correctly', () => {
      const startPointSec = 15.0;
      const nudgeOffsetMs = 40; // 40ms ahead
      const effectiveStartSec = startPointSec - (nudgeOffsetMs / 1000);
      expect(effectiveStartSec).toBe(14.96);

      const negativeNudge = -60; // 60ms delay
      const effectiveStartDelayed = startPointSec - (negativeNudge / 1000);
      expect(effectiveStartDelayed).toBe(15.06);
    });
  });

  describe('Full Master Mix (Beat + Vocal) Export Logic', () => {
    it('generates valid 16-bit PCM WAV headers via encodeAudioBufferToWav', () => {
      const sampleRate = 44100;
      const numChannels = 2;
      const length = 1000;

      // Mock AudioBuffer
      const mockBuffer = {
        sampleRate,
        numberOfChannels: numChannels,
        length,
        duration: length / sampleRate,
        getChannelData: (ch: number) => new Float32Array(length).fill(ch === 0 ? 0.25 : -0.25),
      } as unknown as AudioBuffer;

      // Call encodeAudioBufferToWav
      const wavBlob = youtubeSyncMixer.encodeAudioBufferToWav(mockBuffer);

      expect(wavBlob).toBeDefined();
      expect(wavBlob.type).toBe('audio/wav');
      // 44 bytes header + (1000 * 2 channels * 2 bytes/sample) = 4044 bytes
      expect(wavBlob.size).toBe(44 + 4000);
    });

    it('correctly calculates trim-to-take vs full-track render windows', () => {
      const beatDuration = 180.0;
      const takeStartSec = 30.0;
      const vocalDuration = 45.0;
      const nudgeOffsetMs = 50; // 50ms ahead

      const effectiveVocalStart = Math.max(0, takeStartSec - (nudgeOffsetMs / 1000));
      expect(effectiveVocalStart).toBe(29.95);

      // Trimmed calculation: 1.5s lead-in, 3.0s tail
      const leadIn = Math.min(1.5, effectiveVocalStart);
      const renderStartSec = Math.max(0, effectiveVocalStart - leadIn);
      const renderEndSec = Math.min(beatDuration, effectiveVocalStart + vocalDuration + 3.0);
      const trimmedDurationSec = renderEndSec - renderStartSec;

      expect(renderStartSec).toBe(28.45);
      expect(renderEndSec).toBe(77.95);
      expect(trimmedDurationSec).toBe(49.5);

      // Full track calculation
      const fullDurationSec = Math.max(beatDuration, effectiveVocalStart + vocalDuration);
      expect(fullDurationSec).toBe(180.0);
    });
  });
});
