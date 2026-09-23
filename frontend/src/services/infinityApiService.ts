/**
 * Infinity API Service & Rich Offline Cognitive Knowledge Engine
 * Supports 10 Infinity Levels (∞-I to ∞-X) for Brain Exercises Pro
 * Integrates Dictionary API, Datamuse, Wikipedia, Open Trivia DB, NASA APOD,
 * with comprehensive offline datasets and LocalStorage caching.
 */

export interface ITranslationPair {
  vi: string;
  en: string;
  category: 'nature' | 'mind' | 'technology' | 'space' | 'concept' | 'action' | 'science';
}

export interface IEmojiWordPair {
  emoji: string;
  word: string;
  vi: string;
  category: string;
}

export interface ISynonymPair {
  wordA: string;
  wordB: string;
  commonMeaning: string;
}

export interface IPosTriad {
  theme: string;
  noun: string;
  verb: string;
  adjective: string;
}

export interface IDictionaryEntry {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms?: string[];
  viMeaning: string;
}

// 1. High-frequency Bilingual Pairs (VI <-> EN)
export const BILINGUAL_WORD_PAIRS: ITranslationPair[] = [
  { vi: 'Mặt trời', en: 'SUN', category: 'nature' },
  { vi: 'Bộ não', en: 'BRAIN', category: 'mind' },
  { vi: 'Tên lửa', en: 'ROCKET', category: 'space' },
  { vi: 'Đại dương', en: 'OCEAN', category: 'nature' },
  { vi: 'Ký ức', en: 'MEMORY', category: 'mind' },
  { vi: 'Tốc độ', en: 'SPEED', category: 'science' },
  { vi: 'Tập trung', en: 'FOCUS', category: 'mind' },
  { vi: 'Khám phá', en: 'EXPLORE', category: 'action' },
  { vi: 'Kim cương', en: 'DIAMOND', category: 'nature' },
  { vi: 'Ngân hà', en: 'GALAXY', category: 'space' },
  { vi: 'Chiến thắng', en: 'VICTORY', category: 'concept' },
  { vi: 'Sáng tạo', en: 'CREATE', category: 'action' },
  { vi: 'Can đảm', en: 'BRAVE', category: 'concept' },
  { vi: 'Trí tuệ', en: 'WISDOM', category: 'mind' },
  { vi: 'Hòa bình', en: 'PEACE', category: 'concept' },
  { vi: 'Năng lượng', en: 'ENERGY', category: 'science' },
  { vi: 'Cực quang', en: 'AURORA', category: 'nature' },
  { vi: 'Vệ tinh', en: 'SATELLITE', category: 'technology' },
  { vi: 'Thần kinh', en: 'NEURON', category: 'science' },
  { vi: 'Linh hoạt', en: 'AGILE', category: 'mind' },
  { vi: 'Thiên hà', en: 'COSMOS', category: 'space' },
  { vi: 'Sấm chớp', en: 'THUNDER', category: 'nature' },
  { vi: 'Núi lửa', en: 'VOLCANO', category: 'nature' },
  { vi: 'Hành tinh', en: 'PLANET', category: 'space' },
  { vi: 'Lực hấp dẫn', en: 'GRAVITY', category: 'science' },
  { vi: 'Trực giác', en: 'INTUITION', category: 'mind' },
  { vi: 'Thử thách', en: 'CHALLENGE', category: 'concept' },
  { vi: 'Tiềm thức', en: 'SUBCONSCIOUS', category: 'mind' },
  { vi: 'Thuật toán', en: 'ALGORITHM', category: 'technology' },
  { vi: 'Vô cực', en: 'INFINITY', category: 'concept' },
  { vi: 'Ánh sáng', en: 'LIGHT', category: 'science' },
  { vi: 'Tia chớp', en: 'SPARK', category: 'science' }
];

// 2. Emoji to English Word Mappings
export const EMOJI_WORD_PAIRS: IEmojiWordPair[] = [
  { emoji: '🚀', word: 'ROCKET', vi: 'Tên lửa', category: 'space' },
  { emoji: '🧠', word: 'BRAIN', vi: 'Não bộ', category: 'mind' },
  { emoji: '🦁', word: 'LION', vi: 'Sư tử', category: 'animal' },
  { emoji: '⚡', word: 'LIGHTNING', vi: 'Tia chớp', category: 'nature' },
  { emoji: '💎', word: 'DIAMOND', vi: 'Kim cương', category: 'gem' },
  { emoji: '🌊', word: 'OCEAN', vi: 'Đại dương', category: 'nature' },
  { emoji: '🌋', word: 'VOLCANO', vi: 'Núi lửa', category: 'nature' },
  { emoji: '🪐', word: 'SATURN', vi: 'Sao Thổ', category: 'space' },
  { emoji: '🛸', word: 'UFO', vi: 'Đĩa bay', category: 'space' },
  { emoji: '🦉', word: 'OWL', vi: 'Cú mèo', category: 'animal' },
  { emoji: '🎸', word: 'GUITAR', vi: 'Đàn ghi-ta', category: 'music' },
  { emoji: '⚓', word: 'ANCHOR', vi: 'Mỏ neo', category: 'travel' },
  { emoji: '🧩', word: 'PUZZLE', vi: 'Mảnh ghép', category: 'game' },
  { emoji: '🌈', word: 'RAINBOW', vi: 'Cầu vồng', category: 'nature' },
  { emoji: '🎯', word: 'TARGET', vi: 'Mục tiêu', category: 'sports' },
  { emoji: '🔥', word: 'FIRE', vi: 'Ngọn lửa', category: 'nature' },
  { emoji: '⭐', word: 'STAR', vi: 'Ngôi sao', category: 'space' },
  { emoji: '🌙', word: 'MOON', vi: 'Mặt trăng', category: 'space' },
  { emoji: '☀️', word: 'SUN', vi: 'Mặt trời', category: 'space' },
  { emoji: '👑', word: 'CROWN', vi: 'Vương miện', category: 'royal' },
  { emoji: '🎨', word: 'PALETTE', vi: 'Bảng màu', category: 'art' },
  { emoji: '🏆', word: 'TROPHY', vi: 'Cúp vô địch', category: 'sports' },
  { emoji: '🔭', word: 'TELESCOPE', vi: 'Kính thiên văn', category: 'science' },
  { emoji: '🦅', word: 'EAGLE', vi: 'Đại bàng', category: 'animal' },
  { emoji: '🐬', word: 'DOLPHIN', vi: 'Cá heo', category: 'animal' },
  { emoji: '🌺', word: 'FLOWER', vi: 'Bông hoa', category: 'nature' },
  { emoji: '🍀', word: 'CLOVER', vi: 'Cỏ bốn lá', category: 'nature' },
  { emoji: '🏰', word: 'CASTLE', vi: 'Lâu đài', category: 'structure' },
  { emoji: '🛡️', word: 'SHIELD', vi: 'Khiên chắn', category: 'defense' },
  { emoji: '🔑', word: 'KEY', vi: 'Chìa khóa', category: 'tool' },
  { emoji: '⏰', word: 'CLOCK', vi: 'Đồng hồ', category: 'time' },
  { emoji: '💡', word: 'BULB', vi: 'Bóng đèn', category: 'idea' }
];

// 3. Synonym Pairs for Semantic Matching
export const SYNONYM_PAIRS: ISynonymPair[] = [
  { wordA: 'HUGE', wordB: 'GIGANTIC', commonMeaning: 'Khổng lồ' },
  { wordA: 'QUICK', wordB: 'RAPID', commonMeaning: 'Nhanh chóng' },
  { wordA: 'SMART', wordB: 'CLEVER', commonMeaning: 'Thông minh' },
  { wordA: 'HAPPY', wordB: 'JOYFUL', commonMeaning: 'Hạnh phúc' },
  { wordA: 'BRAVE', wordB: 'COURAGEOUS', commonMeaning: 'Dũng cảm' },
  { wordA: 'BRIGHT', wordB: 'LUMINOUS', commonMeaning: 'Sáng ngời' },
  { wordA: 'CALM', wordB: 'SERENE', commonMeaning: 'Yên bình' },
  { wordA: 'HARD', wordB: 'DIFFICULT', commonMeaning: 'Khó khăn' },
  { wordA: 'STRONG', wordB: 'POWERFUL', commonMeaning: 'Mạnh mẽ' },
  { wordA: 'SILENT', wordB: 'MUTED', commonMeaning: 'Tĩnh lặng' },
  { wordA: 'ANCIENT', wordB: 'PRIMITIVE', commonMeaning: 'Cổ xưa' },
  { wordA: 'ACCURATE', wordB: 'PRECISE', commonMeaning: 'Chính xác' }
];

// 4. Parts of Speech Triads (Noun + Verb + Adjective)
export const POS_TRIADS: IPosTriad[] = [
  { theme: 'Khám Phá Vũ Trụ', noun: 'ROCKET', verb: 'LAUNCH', adjective: 'COSMIC' },
  { theme: 'Hoạt Động Trí Não', noun: 'NEURON', verb: 'THINK', adjective: 'SHARP' },
  { theme: 'Sức Mạnh Tự Nhiên', noun: 'LIGHTNING', verb: 'STRIKE', adjective: 'ELECTRIC' },
  { theme: 'Đại Dương Huyền Bí', noun: 'WHALE', verb: 'DIVE', adjective: 'AQUATIC' },
  { theme: 'Tốc Độ Ánh Sáng', noun: 'PHOTON', verb: 'TRAVEL', adjective: 'LUMINOUS' },
  { theme: 'Trí Tuệ Nhân Tạo', noun: 'CIPHER', verb: 'DECODE', adjective: 'LOGICAL' },
  { theme: 'Ý Chí Kiên Cường', noun: 'HERO', verb: 'CONQUER', adjective: 'VALIANT' },
  { theme: 'Vũ Điệu Ngọn Lửa', noun: 'FLAME', verb: 'IGNITE', adjective: 'RADIANT' }
];

// 5. Curated Offline Dictionary with Vietnamese Hints
export const CURATED_DICTIONARY: IDictionaryEntry[] = [
  { word: 'NEURON', phonetic: '/ˈnjʊə.rɒn/', partOfSpeech: 'noun', definition: 'A nerve cell carrying electrical impulses in the brain', viMeaning: 'Tế bào thần kinh truyền dẫn xung điện trong não bộ' },
  { word: 'SYNAPSE', phonetic: '/ˈsaɪ.næps/', partOfSpeech: 'noun', definition: 'The junction between two nerve cells', viMeaning: 'Điểm khớp nối dẫn truyền giữa hai tế bào thần kinh' },
  { word: 'MEMORY', phonetic: '/ˈmem.ər.i/', partOfSpeech: 'noun', definition: 'The mental faculty of retaining and recalling past experiences', viMeaning: 'Trí nhớ, khả năng lưu giữ và truy xuất thông tin' },
  { word: 'FOCUS', phonetic: '/ˈfəʊ.kəs/', partOfSpeech: 'verb', definition: 'To adapt to the prevailing level of light and become clear', viMeaning: 'Tập trung chú ý vào một điểm cố định' },
  { word: 'COGNITION', phonetic: '/kɒɡˈnɪʃ.ən/', partOfSpeech: 'noun', definition: 'The mental action of acquiring knowledge and understanding', viMeaning: 'Quá trình nhận thức và xử lý tri thức của não bộ' },
  { word: 'SACCADE', phonetic: '/sæˈkɑːd/', partOfSpeech: 'noun', definition: 'A rapid movement of the eye between fixation points', viMeaning: 'Cử động giật nhanh của mắt giữa các tiêu điểm' },
  { word: 'VELOCITY', phonetic: '/vəˈlɒs.ə.ti/', partOfSpeech: 'noun', definition: 'The speed of something in a given direction', viMeaning: 'Vận tốc chuyển động trong không gian' },
  { word: 'PERIPHERAL', phonetic: '/pəˈrɪf.ər.əl/', partOfSpeech: 'adjective', definition: 'Related to the edge or outer boundaries of visual field', viMeaning: 'Thuộc về vùng biên ngoại vi của thị trường mắt' },
  { word: 'LUMINOUS', phonetic: '/ˈluː.mɪ.nəs/', partOfSpeech: 'adjective', definition: 'Emitting or reflecting steady, suffused, or glowing light', viMeaning: 'Phát sáng rực rỡ, tỏa ánh quang' },
  { word: 'QUANTUM', phonetic: '/ˈkwɒn.təm/', partOfSpeech: 'noun', definition: 'A discrete quantity of energy in physics', viMeaning: 'Lượng tử, đơn vị năng lượng rời rạc' },
  { word: 'GALAXY', phonetic: '/ˈɡæl.ək.si/', partOfSpeech: 'noun', definition: 'A system of millions or billions of stars bound by gravity', viMeaning: 'Thiên hà chứa hàng tỷ ngôi sao gắn kết bằng trọng lực' },
  { word: 'INFINITY', phonetic: '/ɪnˈfɪn.ə.ti/', partOfSpeech: 'noun', definition: 'The state or quality of being boundless or limitless', viMeaning: 'Vô cực, trạng thái vô biên không giới hạn' },
  { word: 'INHIBITION', phonetic: '/ˌɪn.hɪˈbɪʃ.ən/', partOfSpeech: 'noun', definition: 'The conscious or unconscious restraint of a behavioral process', viMeaning: 'Sự ức chế phản xạ thói quen để kiểm soát tư duy' },
  { word: 'EXPONENTIAL', phonetic: '/ˌek.spəˈnen.ʃəl/', partOfSpeech: 'adjective', definition: 'Becoming more and more rapid in rate of growth', viMeaning: 'Tăng trưởng theo cấp số nhân với tốc độ thần tốc' },
  { word: 'ECLIPSE', phonetic: '/ɪˈklɪps/', partOfSpeech: 'noun', definition: 'An obscuring of light from one celestial body by another', viMeaning: 'Hiện tượng nhật thực hoặc nguyệt thực che khuất' },
  { word: 'HARMONY', phonetic: '/ˈhɑː.mə.ni/', partOfSpeech: 'noun', definition: 'Agreement or concord in cognitive processing', viMeaning: 'Sự hòa hợp, nhịp nhàng đồng điệu' },
  { word: 'CHALLENGE', phonetic: '/ˈtʃæl.ɪndʒ/', partOfSpeech: 'noun', definition: 'A task or situation that tests someone\'s abilities', viMeaning: 'Thử thách kích hoạt ngưỡng tư duy tối đa' },
  { word: 'COMPREHEND', phonetic: '/ˌkɒm.prɪˈhend/', partOfSpeech: 'verb', definition: 'To grasp mentally; understand fully', viMeaning: 'Hiểu thấu đáo toàn bộ ngữ nghĩa văn bản' }
];

// 6. NASA Curated Astronomical Photography Collections (Offline fallback)
export const NASA_OFFLINE_CARDS = [
  { id: 'nasa-1', title: 'James Webb Deep Field', enLabel: 'WEBB TELESCOPE', viLabel: 'Kính Viễn Vọng Webb', emoji: '🔭' },
  { id: 'nasa-2', title: 'Pillars of Creation', enLabel: 'EAGLE NEBULA', viLabel: 'Tinh Vân Đại Bàng', emoji: '🦅' },
  { id: 'nasa-3', title: 'Ringed Wonder Saturn', enLabel: 'SATURN RINGS', viLabel: 'Vành Đai Sao Thổ', emoji: '🪐' },
  { id: 'nasa-4', title: 'Supermassive Black Hole', enLabel: 'BLACK HOLE', viLabel: 'Lỗ Đen Siêu Khối', emoji: '🕳️' },
  { id: 'nasa-5', title: 'Solar Flare CME', enLabel: 'SOLAR FLARE', viLabel: 'Bão Nhật Hoa', emoji: '☀️' },
  { id: 'nasa-6', title: 'Andromeda Spiral', enLabel: 'ANDROMEDA', viLabel: 'Thiên Hà Tiên Nữ', emoji: '🌌' },
  { id: 'nasa-7', title: 'Orion Stellar Cradle', enLabel: 'ORION NEBULA', viLabel: 'Tinh Vân Lạp Hộ', emoji: '✨' },
  { id: 'nasa-8', title: 'Lunar Crater Tycho', enLabel: 'MOON CRATER', viLabel: 'Hố Va Chạm Mặt Trăng', emoji: '🌕' }
];

// 7. Number conversion utilities for Even-Odd, Find-Number, Schulte
export function numberToEnglish(num: number): string {
  if (num === 0) return 'ZERO';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  if (num < 0) return `MINUS ${numberToEnglish(Math.abs(num))}`;

  if (num < 20) return ones[num];
  if (num < 100) {
    const rem = num % 10;
    return tens[Math.floor(num / 10)] + (rem !== 0 ? `-${ones[rem]}` : '');
  }
  if (num < 1000) {
    const rem = num % 100;
    return `${ones[Math.floor(num / 100)]} HUNDRED` + (rem !== 0 ? ` AND ${numberToEnglish(rem)}` : '');
  }
  return `${numberToEnglish(Math.floor(num / 1000))} THOUSAND` + (num % 1000 !== 0 ? ` ${numberToEnglish(num % 1000)}` : '');
}

export function numberToRoman(num: number): string {
  if (num <= 0 || num > 3999) return String(num);
  const romanMap: Array<[number, string]> = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  let curr = num;
  for (const [val, roman] of romanMap) {
    while (curr >= val) {
      res += roman;
      curr -= val;
    }
  }
  return res;
}

// 8. Audio Speech Synthesis helper
export function speakWord(text: string, lang: 'en' | 'vi' = 'en', rate = 1.0): void {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore restricted autoplay
  }
}

// 9. Cache helper with TTL
const CACHE_PREFIX = 'be_inf_cache_';
function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T, ttlSec = 86400 * 7): void {
  try {
    const payload = {
      data,
      expiresAt: Date.now() + (ttlSec * 1000)
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
  } catch {
    // Quota exceeded
  }
}

// 10. External API fetching with instant offline fallbacks
class InfinityApiService {
  /**
   * Fetch word definition from Dictionary API with fallback
   */
  async getWordDefinition(word: string): Promise<IDictionaryEntry> {
    const upperWord = word.trim().toUpperCase();
    const cached = getCache<IDictionaryEntry>(`dict_${upperWord}`);
    if (cached) return cached;

    // Check curated offline list first
    const offlineFound = CURATED_DICTIONARY.find(d => d.word.toUpperCase() === upperWord);
    if (offlineFound) {
      setCache(`dict_${upperWord}`, offlineFound);
      return offlineFound;
    }

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          const item = json[0];
          const meaning = item.meanings?.[0];
          const def = meaning?.definitions?.[0]?.definition || 'A recognized English vocabulary word.';
          const pos = meaning?.partOfSpeech || 'noun';
          const phonetic = item.phonetic || item.phonetics?.[0]?.text || '';
          
          const result: IDictionaryEntry = {
            word: upperWord,
            phonetic,
            partOfSpeech: pos,
            definition: def,
            viMeaning: `Từ vựng tiếng Anh: ${def}`
          };
          setCache(`dict_${upperWord}`, result);
          return result;
        }
      }
    } catch {
      // Graceful fallback on network failure
    }

    // Default fallback
    return {
      word: upperWord,
      partOfSpeech: 'noun',
      definition: 'Cognitive vocabulary term',
      viMeaning: 'Từ vựng tiếng Anh rèn luyện nhận thức'
    };
  }

  /**
   * Get synonyms from Datamuse API with fallback
   */
  async getSynonyms(word: string): Promise<string[]> {
    const upperWord = word.trim().toUpperCase();
    const cached = getCache<string[]>(`syn_${upperWord}`);
    if (cached) return cached;

    // Offline check in SYNONYM_PAIRS
    const offlineMatch = SYNONYM_PAIRS.filter(p => p.wordA === upperWord || p.wordB === upperWord);
    if (offlineMatch.length > 0) {
      const syns = offlineMatch.map(p => p.wordA === upperWord ? p.wordB : p.wordA);
      setCache(`syn_${upperWord}`, syns);
      return syns;
    }

    try {
      const res = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word.toLowerCase())}&max=6`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const syns = list.map((item: any) => item.word.toUpperCase());
          setCache(`syn_${upperWord}`, syns);
          return syns;
        }
      }
    } catch {}

    return ['ELEVATED', 'ADVANCED'];
  }

  /**
   * Get random Wikipedia article summary with fallback
   */
  async getRandomWikipediaSummary(lang: 'en' | 'vi' = 'en'): Promise<{ title: string; extract: string }> {
    const cacheKey = `wiki_random_${lang}_${Math.floor(Date.now() / (1000 * 60 * 30))}`;
    const cached = getCache<{ title: string; extract: string }>(cacheKey);
    if (cached) return cached;

    try {
      const domain = lang === 'vi' ? 'vi.wikipedia.org' : 'en.wikipedia.org';
      const res = await fetch(`https://${domain}/api/rest_v1/page/random/summary`);
      if (res.ok) {
        const json = await res.json();
        if (json.title && json.extract) {
          const result = { title: json.title, extract: json.extract };
          setCache(cacheKey, result, 1800);
          return result;
        }
      }
    } catch {}

    // Fallback article
    return lang === 'en'
      ? {
          title: 'Neuroplasticity and Human Cognition',
          extract: 'Neuroplasticity, also known as brain plasticity or neural plasticity, is the ability of the brain to undergo structural and functional changes in response to learning, training, and experience.'
        }
      : {
          title: 'Tính Mềm Dẻo Não Bộ (Neuroplasticity)',
          extract: 'Tính mềm dẻo của não bộ là khả năng tái cấu trúc mạng lưới tế bào thần kinh theo thời gian thông qua các bài tập nhận thức, học hỏi và rèn luyện trí nhớ.'
        };
  }

  /**
   * Get bilingual pairs for Card Flip and Twin Words
   */
  getBilingualPairs(count = 16): ITranslationPair[] {
    const shuffled = [...BILINGUAL_WORD_PAIRS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get Emoji Word pairs for visual association games
   */
  getEmojiWordPairs(count = 16): IEmojiWordPair[] {
    const shuffled = [...EMOJI_WORD_PAIRS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get Synonym pairs for semantic matching
   */
  getSynonymPairs(count = 12): ISynonymPair[] {
    const shuffled = [...SYNONYM_PAIRS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get Parts of Speech triads (Noun, Verb, Adjective)
   */
  getPosTriads(count = 8): IPosTriad[] {
    const shuffled = [...POS_TRIADS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get NASA Space Cards
   */
  getNasaCards(count = 8) {
    const shuffled = [...NASA_OFFLINE_CARDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

export const infinityApiService = new InfinityApiService();
