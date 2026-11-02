/**
 * Vocal Recording Engine (vocalRecordingEngine.ts)
 * 
 * Provides high-precision audio capture for vocal studio:
 * - Direct 16-bit PCM WAV recording via AudioContext (low latency, lossless)
 * - Fallback to MediaRecorder (audio/webm, audio/mp4)
 * - 5-second mic check & real-time VU meter
 * - Configurable DSP constraints (Echo Cancellation, Noise Suppression, Auto Gain Control)
 * - Input device selection and hot-swapping
 * - Normalized waveform peak extraction for visual timeline alignment
 */

export interface IMicCheckResult {
  hasSignal: boolean;
  peakDb: number;
  averageDb: number;
  message: string;
}

export interface IAudioInputConfig {
  deviceId?: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface IRecordingResult {
  blob: Blob;
  durationSec: number;
  sampleRate: number;
  waveformData: number[]; // 100-200 normalized peaks (0..1)
  mimeType: string;
}

export class VocalRecordingEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;

  // Recording buffers (PCM Float32Array chunks)
  private recordedChunks: Float32Array[] = [];
  private totalSamples = 0;
  private isRecording = false;
  private recordingStartTime = 0;

  // Fallback MediaRecorder
  private mediaRecorder: MediaRecorder | null = null;
  private mediaRecorderChunks: Blob[] = [];
  private isUsingMediaRecorderFallback = false;

  // Realtime VU meter animation frame
  private vuAnimationId: number | null = null;

  // Config
  private currentConfig: IAudioInputConfig = {
    echoCancellation: false, // Default off for singing studio with headphones to preserve vocal tone
    noiseSuppression: true,
    autoGainControl: false,  // Default off to avoid vocal dynamic compression during singing
  };

  /**
   * Initializes audio context and requests user media with constraints.
   */
  public async setupMic(config?: Partial<IAudioInputConfig>): Promise<MediaStream> {
    if (config) {
      this.currentConfig = { ...this.currentConfig, ...config };
    }

    this.cleanupStream();

    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: this.currentConfig.deviceId ? { exact: this.currentConfig.deviceId } : undefined,
        echoCancellation: this.currentConfig.echoCancellation,
        noiseSuppression: this.currentConfig.noiseSuppression,
        autoGainControl: this.currentConfig.autoGainControl,
      },
      video: false,
    };

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      // Fallback: If exact deviceId fails, request generic audio
      if (this.currentConfig.deviceId) {
        console.warn('Exact deviceId failed, retrying generic audio:', err);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: this.currentConfig.echoCancellation,
            noiseSuppression: this.currentConfig.noiseSuppression,
            autoGainControl: this.currentConfig.autoGainControl,
          },
          video: false,
        });
      } else {
        throw err;
      }
    }

    // Initialize AudioContext
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Connect Source & Analyser
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.3;
    this.sourceNode.connect(this.analyserNode);

    return this.mediaStream;
  }

  /**
   * Runs a 5-second microphone check with real-time VU meter callback.
   * Tests whether an active audio signal is detected.
   */
  public runMicCheck(
    onVuUpdate: (rms: number, peakDb: number, isDetected: boolean) => void,
    durationMs = 5000
  ): Promise<IMicCheckResult> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.mediaStream || !this.analyserNode) {
          await this.setupMic();
        }

        const analyser = this.analyserNode!;
        const dataArray = new Float32Array(analyser.fftSize);

        let maxDb = -100;
        let sumDb = 0;
        let framesCount = 0;
        let detectedSignalCount = 0;
        const startTime = performance.now();

        const tick = () => {
          if (!this.analyserNode) return;

          analyser.getFloatTimeDomainData(dataArray);

          // Calculate RMS
          let sumSquares = 0;
          let peak = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const val = dataArray[i];
            const abs = Math.abs(val);
            if (abs > peak) peak = abs;
            sumSquares += val * val;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          const currentDb = rms > 0.00001 ? Math.max(-80, 20 * Math.log10(rms)) : -80;

          if (currentDb > maxDb) maxDb = currentDb;
          sumDb += currentDb;
          framesCount++;

          // Voice presence threshold (-42 dBFS or RMS > 0.008)
          const isVoicePresent = currentDb > -42;
          if (isVoicePresent) {
            detectedSignalCount++;
          }

          onVuUpdate(Math.min(1, rms * 4), currentDb, isVoicePresent);

          const elapsed = performance.now() - startTime;
          if (elapsed < durationMs) {
            this.vuAnimationId = requestAnimationFrame(tick);
          } else {
            // Completed 5s check
            const averageDb = framesCount > 0 ? sumDb / framesCount : -80;
            const hasSignal = detectedSignalCount >= 5; // Detected at least 5 frames of sound

            resolve({
              hasSignal,
              peakDb: Math.round(maxDb),
              averageDb: Math.round(averageDb),
              message: hasSignal
                ? 'Tín hiệu microphone rất tốt! Sẵn sàng thu âm.'
                : 'Chưa phát hiện âm thanh rõ ràng. Hãy thử nói to hơn hoặc chọn lại Micro.',
            });
          }
        };

        this.vuAnimationId = requestAnimationFrame(tick);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Stop ongoing VU animation or mic check.
   */
  public stopMicCheck(): void {
    if (this.vuAnimationId !== null) {
      cancelAnimationFrame(this.vuAnimationId);
      this.vuAnimationId = null;
    }
  }

  /**
   * Starts high-precision PCM recording.
   */
  public async startRecording(onVuUpdate?: (rms: number, peakDb: number) => void): Promise<void> {
    if (this.isRecording) return;

    if (!this.mediaStream || !this.audioContext || !this.sourceNode) {
      await this.setupMic();
    }

    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }

    this.recordedChunks = [];
    this.totalSamples = 0;
    this.isRecording = true;
    this.recordingStartTime = performance.now();
    this.isUsingMediaRecorderFallback = false;

    try {
      // 1. Preferred Method: ScriptProcessor / AudioWorklet for sample-accurate PCM
      const bufferSize = 4096;
      this.scriptProcessorNode = this.audioContext!.createScriptProcessor(bufferSize, 1, 1);

      this.scriptProcessorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Clone float32 buffer
        const chunk = new Float32Array(inputData.length);
        chunk.set(inputData);
        this.recordedChunks.push(chunk);
        this.totalSamples += chunk.length;
      };

      this.sourceNode!.connect(this.scriptProcessorNode);
      // Connect to a mute gain node to keep processor pulling audio in browsers without outputting feedback
      const muteGain = this.audioContext!.createGain();
      muteGain.gain.value = 0;
      this.scriptProcessorNode.connect(muteGain);
      muteGain.connect(this.audioContext!.destination);

      // Start VU meter loop if callback provided
      if (onVuUpdate && this.analyserNode) {
        const dataArray = new Float32Array(this.analyserNode.fftSize);
        const updateVu = () => {
          if (!this.isRecording || !this.analyserNode) return;
          this.analyserNode.getFloatTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sumSquares += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          const db = rms > 0.00001 ? Math.max(-80, 20 * Math.log10(rms)) : -80;
          onVuUpdate(Math.min(1, rms * 4), db);
          this.vuAnimationId = requestAnimationFrame(updateVu);
        };
        this.vuAnimationId = requestAnimationFrame(updateVu);
      }
    } catch (e) {
      console.warn('ScriptProcessor PCM recording setup failed, using MediaRecorder fallback:', e);
      this.startMediaRecorderFallback(onVuUpdate);
    }
  }

  /**
   * Fallback using browser MediaRecorder API if Web Audio node pipeline fails.
   */
  private startMediaRecorderFallback(onVuUpdate?: (rms: number, peakDb: number) => void): void {
    this.isUsingMediaRecorderFallback = true;
    this.mediaRecorderChunks = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.mediaStream!, {
      mimeType,
      audioBitsPerSecond: 128000,
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.mediaRecorderChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100);

    if (onVuUpdate && this.analyserNode) {
      const dataArray = new Float32Array(this.analyserNode.fftSize);
      const updateVu = () => {
        if (!this.isRecording || !this.analyserNode) return;
        this.analyserNode.getFloatTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const db = rms > 0.00001 ? Math.max(-80, 20 * Math.log10(rms)) : -80;
        onVuUpdate(Math.min(1, rms * 4), db);
        this.vuAnimationId = requestAnimationFrame(updateVu);
      };
      this.vuAnimationId = requestAnimationFrame(updateVu);
    }
  }

  /**
   * Stops recording and encodes the vocal take into a high-quality WAV Blob + waveform peaks.
   */
  public async stopRecording(): Promise<IRecordingResult> {
    if (!this.isRecording) {
      throw new Error('Chưa bắt đầu thu âm.');
    }

    this.isRecording = false;
    this.stopMicCheck();

    const durationSec = Math.max(0.1, (performance.now() - this.recordingStartTime) / 1000);
    const sampleRate = this.audioContext?.sampleRate || 44100;

    // Disconnect ScriptProcessor
    if (this.scriptProcessorNode) {
      try {
        this.scriptProcessorNode.disconnect();
      } catch (e) {
        // Ignored
      }
      this.scriptProcessorNode = null;
    }

    if (this.isUsingMediaRecorderFallback && this.mediaRecorder) {
      return new Promise<IRecordingResult>((resolve) => {
        this.mediaRecorder!.onstop = async () => {
          const blob = new Blob(this.mediaRecorderChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });
          const waveform = await this.extractWaveformFromBlob(blob);
          resolve({
            blob,
            durationSec,
            sampleRate,
            waveformData: waveform,
            mimeType: blob.type,
          });
        };
        this.mediaRecorder!.stop();
      });
    }

    // Merge PCM Float32 chunks
    const mergedPcm = new Float32Array(this.totalSamples);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      mergedPcm.set(chunk, offset);
      offset += chunk.length;
    }

    // Extract waveform peaks (140 points for visual track display)
    const waveformData = this.extractWaveformFromPcm(mergedPcm, 140);

    // Encode to standard 16-bit PCM WAV Blob
    const wavBlob = this.encodePcmToWav(mergedPcm, sampleRate);

    return {
      blob: wavBlob,
      durationSec,
      sampleRate,
      waveformData,
      mimeType: 'audio/wav',
    };
  }

  /**
   * Helper: Downsamples PCM Float32Array into normalized peak amplitudes (0..1).
   */
  public extractWaveformFromPcm(pcm: Float32Array, pointCount = 120): number[] {
    if (!pcm || pcm.length === 0) {
      return new Array(pointCount).fill(0.05);
    }

    const blockSize = Math.floor(pcm.length / pointCount);
    const result: number[] = [];

    for (let i = 0; i < pointCount; i++) {
      const start = i * blockSize;
      let maxVal = 0;
      for (let j = 0; j < blockSize && start + j < pcm.length; j++) {
        const abs = Math.abs(pcm[start + j]);
        if (abs > maxVal) maxVal = abs;
      }
      // Floor at 0.05 for visual aesthetics so flat segments still show a sleek baseline
      result.push(Math.max(0.05, Math.min(1.0, maxVal * 1.5)));
    }

    return result;
  }

  /**
   * Extracts waveform from an audio Blob by decoding via AudioContext.
   */
  public async extractWaveformFromBlob(blob: Blob, pointCount = 120): Promise<number[]> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const tempCtx = new AudioCtx();
      const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
      const channelData = decodedBuffer.getChannelData(0);
      const waveform = this.extractWaveformFromPcm(channelData, pointCount);
      tempCtx.close();
      return waveform;
    } catch (e) {
      console.warn('Failed to extract waveform from blob:', e);
      return new Array(pointCount).fill(0.1);
    }
  }

  /**
   * Encoders raw 32-bit Float PCM to standard 16-bit PCM Stereo/Mono WAV Blob.
   */
  private encodePcmToWav(samples: Float32Array, sampleRate: number): Blob {
    const numChannels = 1; // Mono for voice
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // file size - 8
    this.writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // BitsPerSample

    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM 16-bit samples with clipping protection
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      // Convert float [-1..1] to int16 [-32768..32767]
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Returns list of audio input devices (microphones).
   */
  public async getAvailableMicrophones(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'audioinput');
  }

  /**
   * Hot-swaps current audio input device.
   */
  public async switchMicrophone(deviceId: string): Promise<void> {
    this.currentConfig.deviceId = deviceId;
    if (this.mediaStream) {
      await this.setupMic();
    }
  }

  /**
   * Toggles DSP settings (echoCancellation, noiseSuppression, autoGainControl).
   */
  public async updateDspSettings(settings: Partial<IAudioInputConfig>): Promise<void> {
    this.currentConfig = { ...this.currentConfig, ...settings };
    if (this.mediaStream) {
      await this.setupMic();
    }
  }

  public getConfig(): IAudioInputConfig {
    return { ...this.currentConfig };
  }

  public cleanupStream(): void {
    this.stopMicCheck();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignored
      }
      this.sourceNode = null;
    }
  }

  public dispose(): void {
    this.cleanupStream();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignored
      }
      this.audioContext = null;
    }
  }
}

export const vocalRecordingEngine = new VocalRecordingEngine();
