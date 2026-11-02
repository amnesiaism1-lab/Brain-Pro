/**
 * YouTube Beat Service (youtubeBeatService.ts)
 * 
 * Manages YouTube IFrame Player API dynamic loading, URL parsing,
 * video ID extraction, error diagnostics (errors 101/150 embed restriction),
 * and curated backing track / beat presets for quick testing.
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface IBeatPreset {
  id: string;
  title: string;
  artist?: string;
  genre: string;
  videoId: string;
  suggestedStartSec: number;
  description: string;
}

export const POPULAR_BEAT_PRESETS: IBeatPreset[] = [
  {
    id: 'acoustic-pop-c',
    title: 'Acoustic Guitar Pop Beat (C Major)',
    artist: 'Acoustic Backing Track',
    genre: 'Acoustic',
    videoId: 'vB6gQo5v_6g', // Sample backing track video
    suggestedStartSec: 8,
    description: 'Tone C ấm áp, nhịp điệu nhẹ nhàng cho bài hát ballad acoustic.',
  },
  {
    id: 'lofi-chill-beat',
    title: 'Lofi Chill Hop Beat 80 BPM',
    artist: 'Chill Vocals Practice',
    genre: 'Lo-Fi / R&B',
    videoId: 'jfKfPfyJRdk', // Lofi girl / chill sample
    suggestedStartSec: 15,
    description: 'Nhịp lofi êm dịu, dễ ngân nga và giữ nhịp theo từng câu hát.',
  },
  {
    id: 'piano-ballad-am',
    title: 'Piano Ballad Melancholic (A Minor)',
    artist: 'Piano Backing Track',
    genre: 'Ballad',
    videoId: '5qap5aO4i9A', // Lofi hip hop radio
    suggestedStartSec: 12,
    description: 'Giai điệu piano sâu lắng, phù hợp luyện kỹ thuật thanh nhạc truyền cảm.',
  },
  {
    id: 'pop-acoustic-g',
    title: 'Pop Acoustic Groove (G Major - 100 BPM)',
    artist: 'Studio Grooves',
    genre: 'Pop / RnB',
    videoId: 'DWcJFNfaw9c',
    suggestedStartSec: 10,
    description: 'Tiết tấu tươi vui, chuẩn nhịp cho bài tập luyện phong cách trẻ trung.',
  },
];

/**
 * Parses and extracts an 11-character YouTube video ID from various URL formats.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If user pasted pure 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL regex patterns
  // 1. https://www.youtube.com/watch?v=VIDEO_ID
  // 2. https://youtu.be/VIDEO_ID
  // 3. https://www.youtube.com/embed/VIDEO_ID
  // 4. https://www.youtube.com/shorts/VIDEO_ID
  // 5. https://music.youtube.com/watch?v=VIDEO_ID
  const patterns = [
    /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extracts optional starting timestamp (e.g. ?t=45, ?t=1m20s, ?start=30) in seconds.
 */
export function extractYouTubeStartTime(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Match format: ?t=1m20s or ?t=2m or ?t=45s
  const minSecMatch = trimmed.match(/[?&](?:t|start)=(?:(\d+)m)?(?:(\d+)s?)?/i);
  if (minSecMatch && (minSecMatch[1] || minSecMatch[2])) {
    const min = minSecMatch[1] ? parseInt(minSecMatch[1], 10) : 0;
    const sec = minSecMatch[2] ? parseInt(minSecMatch[2], 10) : 0;
    const total = min * 60 + sec;
    if (total > 0) return total;
  }

  // Match pure seconds: ?t=45
  const secMatch = trimmed.match(/[?&](?:t|start)=(\d+)/i);
  if (secMatch && secMatch[1]) {
    const s = parseInt(secMatch[1], 10);
    if (!isNaN(s) && s > 0) return s;
  }

  return null;
}

/**
 * Diagnostic message and actionable resolution for YouTube Player API error codes.
 */
export interface IYouTubeErrorInfo {
  code: number;
  title: string;
  message: string;
  actionHint: string;
  isEmbedForbidden: boolean;
}

export function diagnoseYouTubeError(errorCode: number): IYouTubeErrorInfo {
  switch (errorCode) {
    case 101:
    case 150:
      return {
        code: errorCode,
        title: 'Video Bị Giới Hạn Nhúng (Lỗi 101/150)',
        message: 'Chủ sở hữu bản quyền của video này đã tắt quyền phát trên các trang web bên ngoài.',
        actionHint: 'Vui lòng chọn link beat khác (tìm bản "karaoke beat" hoặc "backing track" do các studio chia sẻ mở), hoặc tải lên file beat âm thanh của bạn.',
        isEmbedForbidden: true,
      };
    case 100:
      return {
        code: 100,
        title: 'Không Tìm Thấy Video (Lỗi 100)',
        message: 'Video này đã bị xóa, bị đặt ở chế độ riêng tư, hoặc link không chính xác.',
        actionHint: 'Vui lòng kiểm tra lại link YouTube hoặc chọn một video công khai khác.',
        isEmbedForbidden: false,
      };
    case 2:
      return {
        code: 2,
        title: 'Video ID Không Hợp Lệ (Lỗi 2)',
        message: 'Mã định danh video YouTube không đúng định dạng chuẩn 11 ký tự.',
        actionHint: 'Vui lòng kiểm tra lại URL đã dán.',
        isEmbedForbidden: false,
      };
    case 5:
      return {
        code: 5,
        title: 'Lỗi Trình Phát HTML5 (Lỗi 5)',
        message: 'Trình duyệt không thể khởi chạy trình phát video HTML5 của YouTube.',
        actionHint: 'Vui lòng tải lại trang hoặc kiểm tra kết nối mạng của bạn.',
        isEmbedForbidden: false,
      };
    default:
      return {
        code: errorCode,
        title: `Lỗi YouTube Player (#${errorCode})`,
        message: 'Đã xảy ra sự cố không xác định khi tải video từ YouTube.',
        actionHint: 'Thử làm mới lại trang hoặc kiểm tra lại đường truyền internet.',
        isEmbedForbidden: false,
      };
  }
}

/**
 * Dynamic loader singleton for YouTube IFrame API script.
 */
let ytApiPromise: Promise<void> | null = null;

export function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  // Already loaded and ready
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise<void>((resolve, reject) => {
    // Check if script tag is already in DOM
    const existingScript = document.getElementById('youtube-iframe-api-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        ytApiPromise = null;
        reject(new Error('Không thể tải YouTube IFrame API từ máy chủ YouTube. Vui lòng kiểm tra kết nối mạng.'));
      };
      document.head.appendChild(script);
    }

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousOnReady) {
        try {
          previousOnReady();
        } catch (e) {
          console.warn('Previous onYouTubeIframeAPIReady error:', e);
        }
      }
      resolve();
    };

    // Safety timeout in case callback doesn't fire
    setTimeout(() => {
      if (window.YT && window.YT.Player) {
        resolve();
      } else {
        // If still not ready after 10s
        // We do not reject outright if offline mock is desired, but give a warning
      }
    }, 10000);
  });

  return ytApiPromise;
}
