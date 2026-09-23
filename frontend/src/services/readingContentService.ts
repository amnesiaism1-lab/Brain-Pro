import { IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';

export interface CuratedTopic {
  title: string;
  category: string;
  description: string;
}

export const POPULAR_WIKIPEDIA_TOPICS: CuratedTopic[] = [
  { title: 'Hệ thần kinh', category: 'Khoa Học Não Bộ', description: 'Cấu trúc và mạng lưới dẫn truyền xung thần kinh trong cơ thể' },
  { title: 'Trí tuệ nhân tạo', category: 'Công Nghệ Tương Lai', description: 'Khả năng mô phỏng tư duy và học máy của máy tính' },
  { title: 'Kính viễn vọng Không gian James Webb', category: 'Thiên Văn Học', description: 'Mắt thần quan sát những thiên hà đầu tiên của vũ trụ' },
  { title: 'Trí nhớ', category: 'Tâm Lý Nhận Thức', description: 'Cơ chế mã hóa, lưu trữ và gợi lại thông tin của não người' },
  { title: 'Thuyết tương đối', category: 'Vật Lý Hiện Đại', description: 'Không-thời gian và bản chất của trọng lực theo Albert Einstein' },
  { title: 'Tế bào thần kinh', category: 'Sinh Học Thần Kinh', description: 'Cấu tạo nơ-ron và các synap kết nối mạng lưới não bộ' },
  { title: 'Tâm lý học nhận thức', category: 'Khoa Học Hành Vi', description: 'Nghiên cứu về sự chú ý, ngôn ngữ và khả năng giải quyết vấn đề' },
  { title: 'Giấc ngủ', category: 'Y Sinh Học', description: 'Chu kỳ ngủ sâu, sóng não và quá trình tái tạo năng lượng thần kinh' },
  { title: 'Albert Einstein', category: 'Lịch Sử Khoa Học', description: 'Cuộc đời và những tư duy đột phá làm thay đổi vật lý nhân loại' },
  { title: 'Leonardo da Vinci', category: 'Danh Nhân Toàn Năng', description: 'Biểu tượng của tư duy liên ngành giữa nghệ thuật và khoa học' }
];

export const THEMED_VOCABULARY: Record<string, string[]> = {
  'Tất cả': [],
  'Khoa Học Não Bộ': [
    'NƠRON', 'SYNAP', 'THẦN KINH', 'VÕNG MẠC', 'HỒI HẢI MÃ', 
    'VỎ NÃO', 'XUNG ĐỘT', 'PHẢN XẠ', 'THỊ GIÁC', 'NGOẠI VI',
    'TÍNH DẺO', 'TIỂU NÃO', 'DẪN TRUYỀN', 'TRÍ NHỚ', 'TIÊU CỰ'
  ],
  'Công Nghệ & AI': [
    'TRÍ TUỆ', 'HỌC SÂU', 'DỮ LIỆU', 'MẠNG NƠRON', 'ROBOT', 
    'THUẬT TOÁN', 'LẬP TRÌNH', 'LƯỢNG TỬ', 'MÔ HÌNH', 'CHIP XỬ LÝ',
    'TỰ ĐỘNG', 'PHẦN MỀM', 'MÃ HÓA', 'ĐIỆN TOÁN', 'BĂNG THÔNG'
  ],
  'Thiên Văn & Vũ Trụ': [
    'THIÊN HÀ', 'HỐ ĐEN', 'PHOTON', 'QUANG PHỔ', 'HỒNG NGOẠI', 
    'KÍNH VIỄN VỌNG', 'SAO HỎA', 'BIG BANG', 'TRỌNG LỰC', 'HÀNH TINH',
    'NGÔI SAO', 'QUỸ ĐẠO', 'VŨ TRỤ', 'ÁNH SÁNG', 'VẬN TỐC'
  ],
  'Tâm Lý & Tư Duy': [
    'DÒNG CHẢY', 'TRỰC GIÁC', 'TẬP TRUNG', 'KÝ ỨC', 'ĐỊNH KIẾN', 
    'THẤU CẢM', 'CẢM XÚC', 'TƯ DUY', 'NHẬN THỨC', 'SÁNG TẠO',
    'TIỀM THỨC', 'ĐỘNG LỰC', 'Ý CHÍ', 'KIÊN TRÌ', 'THỨC TỈNH'
  ]
};

const STOP_WORDS = new Set([
  'trong', 'những', 'chúng', 'được', 'người', 'nhưng', 'khi', 'này', 
  'cho', 'với', 'của', 'các', 'một', 'nhiều', 'theo', 'như', 'hoặc', 
  'đến', 'trên', 'dưới', 'cũng', 'không', 'phải', 'đang', 'đã', 'sẽ'
]);

const WIKI_CACHE_KEY = 'brain_pro_wiki_texts_cache';

class ReadingContentService {
  private getCachedTexts(): IReadingText[] {
    try {
      const data = localStorage.getItem(WIKI_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToCache(text: IReadingText): void {
    try {
      const existing = this.getCachedTexts();
      const filtered = existing.filter(t => t.id !== text.id);
      localStorage.setItem(WIKI_CACHE_KEY, JSON.stringify([text, ...filtered].slice(0, 20)));
    } catch (e) {
      console.warn('Cannot cache wiki article', e);
    }
  }

  /**
   * Return all available texts: built-in curated + user cached Wikipedia texts
   */
  public getAllTexts(): IReadingText[] {
    const cached = this.getCachedTexts();
    return [...SAMPLE_READING_TEXTS, ...cached];
  }

  /**
   * Extract meaningful keywords from any article content for search games and vocabulary training
   */
  public extractKeywordsFromArticle(content: string, minLen = 4, maxLen = 8, count = 10): string[] {
    const rawWords = content.split(/\s+/);
    const cleaned = rawWords
      .map(w => w.replace(/[.,()—":;?!\n]/g, '').trim())
      .filter(w => {
        const lower = w.toLowerCase();
        return (
          w.length >= minLen &&
          w.length <= maxLen &&
          !STOP_WORDS.has(lower) &&
          !/^\d+$/.test(w)
        );
      });

    // Unique preserving first occurrence
    const unique = Array.from(new Set(cleaned));
    return unique.slice(0, count);
  }

  /**
   * Get themed words for WordSearch, Anagram, TwinWords
   */
  public getVocabularyList(theme?: string): string[] {
    if (theme && THEMED_VOCABULARY[theme] && THEMED_VOCABULARY[theme].length > 0) {
      return THEMED_VOCABULARY[theme];
    }
    // Combined all unique words
    const all = Object.values(THEMED_VOCABULARY).flat();
    return Array.from(new Set(all));
  }

  /**
   * Fetch an article from Vietnamese Wikipedia by title
   */
  public async fetchWikipediaArticle(topic: string): Promise<IReadingText | null> {
    try {
      const url = `https://vi.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&explaintext=1&exintro=1&titles=${encodeURIComponent(topic)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'BrainProReader/2.0' } });
      if (!res.ok) throw new Error('Network error');

      const data = await res.json();
      const pages = data.query?.pages;
      if (!pages) return null;

      const page: any = Object.values(pages)[0];
      if (!page || page.missing || !page.extract) return null;

      const cleanText = page.extract
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const words = cleanText.split(/\s+/).filter(Boolean);
      if (words.length < 50) return null;

      // Extract a coherent reading chunk of 200-350 words if article is too long
      const excerptWords = words.length > 380 ? words.slice(0, 360).join(' ') + '...' : cleanText;
      const finalWordCount = excerptWords.split(/\s+/).filter(Boolean).length;

      const newArticle: IReadingText = {
        id: `wiki-${page.pageid || Date.now()}`,
        title: page.title || topic,
        category: 'Wikipedia Tri Thức',
        wordCount: finalWordCount,
        difficultyLevel: Math.min(5, Math.max(1, Math.round(finalWordCount / 80))),
        content: excerptWords,
        previewExcerpt: excerptWords.slice(0, 120) + '...',
        author: 'Bách Khoa Toàn Thư Wikipedia (Tiếng Việt)'
      };

      this.saveToCache(newArticle);
      return newArticle;
    } catch (error) {
      console.error('Error fetching Wikipedia article:', error);
      return null;
    }
  }

  /**
   * Fetch a random interesting summary from Vietnamese Wikipedia
   */
  public async fetchRandomWikipediaArticle(): Promise<IReadingText | null> {
    try {
      const randTopic = POPULAR_WIKIPEDIA_TOPICS[Math.floor(Math.random() * POPULAR_WIKIPEDIA_TOPICS.length)];
      return await this.fetchWikipediaArticle(randTopic.title);
    } catch {
      return null;
    }
  }

  /**
   * Generate peripheral visual fixation blocks (Top / Bottom) around green dot from any text
   */
  public generateGreenDotSetFromText(article: IReadingText) {
    const sentences = article.content
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 25);

    if (sentences.length >= 4) {
      const mid = Math.floor(sentences.length / 2);
      const linesTop = sentences.slice(Math.max(0, mid - 2), mid).slice(0, 3);
      const linesBottom = sentences.slice(mid, Math.min(sentences.length, mid + 3)).slice(0, 2);

      // Extract a key question
      const sampleQuestion = article.questions?.[0] || {
        questionText: `Đoạn văn bản xung quanh chấm xanh đề cập đến chủ đề chính nào của bài viết "${article.title}"?`,
        optionA: article.title,
        optionB: 'Môn toán học vi phân cổ điển',
        optionC: 'Lịch sử kiến trúc thời Trung cổ',
        optionD: 'Phương pháp đúc kim loại đồng',
        correctOption: 'A'
      };

      return {
        linesTop,
        linesBottom,
        question: sampleQuestion.questionText,
        options: [
          `A. ${sampleQuestion.optionA}`,
          `B. ${sampleQuestion.optionB}`,
          `C. ${sampleQuestion.optionC}`,
          `D. ${sampleQuestion.optionD}`
        ],
        correctIndex: sampleQuestion.correctOption === 'A' ? 0 : sampleQuestion.correctOption === 'B' ? 1 : sampleQuestion.correctOption === 'C' ? 2 : 3
      };
    }

    return null;
  }
}

export const readingContentService = new ReadingContentService();
