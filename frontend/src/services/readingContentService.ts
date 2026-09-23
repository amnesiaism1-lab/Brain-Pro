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
      localStorage.setItem(WIKI_CACHE_KEY, JSON.stringify([text, ...filtered].slice(0, 15)));
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
      // Pick random from curated topics list for guaranteed quality, or random endpoint
      const randTopic = POPULAR_WIKIPEDIA_TOPICS[Math.floor(Math.random() * POPULAR_WIKIPEDIA_TOPICS.length)];
      return await this.fetchWikipediaArticle(randTopic.title);
    } catch {
      return null;
    }
  }
}

export const readingContentService = new ReadingContentService();
