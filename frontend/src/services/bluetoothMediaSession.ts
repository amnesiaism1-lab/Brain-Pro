/**
 * Bluetooth MediaSession & Silent Audio Keeper Service
 * 
 * Giải pháp khắc phục triệt để lỗi tai nghe Bluetooth (Moondrop Pudding, AirPods, Galaxy Buds, v.v.)
 * không bắt được cử chỉ chạm (1-click / 2-click) trên Windows và trình duyệt:
 * 
 * NGUYÊN NHÂN GỐC RỄ:
 * Trình duyệt Chromium (Chrome / Edge) và Windows SMTC (System Media Transport Controls)
 * CHỈ kích hoạt bộ điều khiển media phần cứng (AVRCP: Play/Pause/Next/Prev) khi có một phần tử
 * HTMLMediaElement (<audio> hoặc <video>) THỰC SỰ ĐANG PHÁT. Vì Web Audio API (AudioContext)
 * chạy ngầm độc lập nên Windows không gửi tín hiệu media key của tai nghe cho trình duyệt.
 * 
 * GIẢI PHÁP:
 * 1. Chạy ngầm một track âm thanh yên lặng (Silent Audio Loop) qua HTMLAudioElement.
 * 2. Đăng ký session với Windows Media Controller (playbackState = 'playing').
 * 3. Bắt các sự kiện AVRCP: 'play', 'pause', 'nexttrack', 'previoustrack', 'seekbackward', 'seekforward'.
 * 4. Phát âm thanh phản hồi (Chime) qua tai nghe và hiển thị Toast trên giao diện để người dùng biết ngay cử chỉ đã được nhận.
 */

import { auditoryEngine } from './auditoryEngine';

export interface EarbudNotificationEvent {
  gesture: string;
  actionLabel: string;
  timestamp: number;
}

type EarbudListener = (event: EarbudNotificationEvent) => void;

class BluetoothMediaSessionService {
  private silentAudio: HTMLAudioElement | null = null;
  private isActivated = false;
  private listeners: Set<EarbudListener> = new Set();
  private dataUriCache: string | null = null;

  /**
   * Tạo chuỗi Data URI cho file WAV âm thanh hoàn toàn yên lặng (1 giây, 8kHz, mono)
   */
  private getSilentWavDataUri(): string {
    if (this.dataUriCache) return this.dataUriCache;

    const sampleRate = 8000;
    const numSamples = sampleRate; // 1s
    const buffer = new Uint8Array(44 + numSamples);

    // RIFF header
    buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
    const fileSize = 36 + numSamples;
    buffer[4] = fileSize & 0xff;
    buffer[5] = (fileSize >> 8) & 0xff;
    buffer[6] = (fileSize >> 16) & 0xff;
    buffer[7] = (fileSize >> 24) & 0xff;
    buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"

    // fmt subchunk
    buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20; // "fmt "
    buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // Subchunk1Size
    buffer[20] = 1; buffer[21] = 0; // AudioFormat = 1 (PCM)
    buffer[22] = 1; buffer[23] = 0; // NumChannels = 1
    buffer[24] = sampleRate & 0xff;
    buffer[25] = (sampleRate >> 8) & 0xff;
    buffer[26] = (sampleRate >> 16) & 0xff;
    buffer[27] = (sampleRate >> 24) & 0xff;
    buffer[28] = sampleRate & 0xff;
    buffer[29] = (sampleRate >> 8) & 0xff;
    buffer[30] = (sampleRate >> 16) & 0xff;
    buffer[31] = (sampleRate >> 24) & 0xff;
    buffer[32] = 1; buffer[33] = 0; // BlockAlign = 1
    buffer[34] = 8; buffer[35] = 0; // BitsPerSample = 8

    // data subchunk
    buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61; // "data"
    buffer[40] = numSamples & 0xff;
    buffer[41] = (numSamples >> 8) & 0xff;
    buffer[42] = (numSamples >> 16) & 0xff;
    buffer[43] = (numSamples >> 24) & 0xff;

    // Byte 128 là mẫu tĩnh lặng hoàn toàn trong 8-bit PCM
    buffer.fill(128, 44);

    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }

    this.dataUriCache = 'data:audio/wav;base64,' + (typeof window !== 'undefined' ? window.btoa(binary) : '');
    return this.dataUriCache;
  }

  /**
   * Kích hoạt phiên âm thanh nền giữ kết nối với hệ điều hành Windows
   */
  public async ensureActive(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.silentAudio) {
        const uri = this.getSilentWavDataUri();
        this.silentAudio = new Audio(uri);
        this.silentAudio.loop = true;
        this.silentAudio.volume = 0.01; // Cực nhỏ, không làm phiền người dùng nhưng giữ driver audio mở
        this.silentAudio.setAttribute('playsinline', 'true');
      }

      if (this.silentAudio.paused) {
        await this.silentAudio.play();
      }

      this.isActivated = true;

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }

      return true;
    } catch (err) {
      console.warn('BluetoothMediaSession keepalive activation pending user gesture:', err);
      return false;
    }
  }

  /**
   * Tạm dừng hoặc tắt session
   */
  public deactivate(): void {
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
      } catch (e) {
        // ignore
      }
    }
    this.isActivated = false;
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Kiểm tra xem phiên MediaSession có đang hoạt động hay không
   */
  public isActive(): boolean {
    return this.isActivated && !!this.silentAudio && !this.silentAudio.paused;
  }

  /**
   * Cập nhật thông tin bài tập hiển thị trên Windows Volume OSD / Lockscreen
   */
  public updateMetadata(title: string, subtitle = 'Brain Pro • Luyện Tai Ngầm'): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: subtitle,
        album: 'Moondrop / Bluetooth TWS Mode'
      });
      navigator.mediaSession.playbackState = 'playing';
    } catch (e) {
      // ignore
    }
  }

  /**
   * Phát âm thanh phản hồi nhẹ qua tai nghe khi nhận được cử chỉ chạm
   */
  public playFeedbackChime(type: 'tap' | 'double-tap' | 'skip'): void {
    try {
      const note = type === 'double-tap' ? 'E5' : type === 'skip' ? 'G5' : 'C5';
      auditoryEngine.playNote(note, 0.15, { volume: 0.35 });
    } catch (e) {
      // ignore
    }
  }

  /**
   * Bắn thông báo cử chỉ đã nhận được tới UI để hiển thị Badge / Toast
   */
  public emitNotification(gesture: string, actionLabel: string): void {
    const event: EarbudNotificationEvent = {
      gesture,
      actionLabel,
      timestamp: Date.now()
    };
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Earbud listener error:', e);
      }
    });
  }

  /**
   * Đăng ký lắng nghe sự kiện chạm tai nghe từ bất kỳ component UI nào
   */
  public subscribe(listener: EarbudListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const bluetoothMediaSession = new BluetoothMediaSessionService();
