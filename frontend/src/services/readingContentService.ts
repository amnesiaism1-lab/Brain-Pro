import { IReadingText, IReadingQuestion, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';

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
  { title: 'Leonardo da Vinci', category: 'Danh Nhân Toàn Năng', description: 'Biểu tượng của tư duy liên ngành giữa nghệ thuật và khoa học' },
  { title: 'Cơ học lượng tử', category: 'Vật Lý Tiên Tiến', description: 'Thế giới vi mô của các hạt hạ nguyên tử và hàm sóng xác suất' },
  { title: 'Định lý Pythagoras', category: 'Toán Học Cổ Điển', description: 'Nguyên lý hình học nền tảng gắn liền với văn minh nhân loại' }
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

export const PERIPHERAL_FLASH_WORDS = [
  'NÃO', 'MẮT', 'TRÍ', 'QUANG', 'SÓNG', 'ĐIỆN', 'LỰC', 'HẠT',
  'TỐC', 'ĐỘ', 'TẬP', 'TRUNG', 'LƯỢNG', 'TỬ', 'KÝ', 'ỨC',
  'PHẢN', 'XẠ', 'HỒI', 'TIÊU', 'ĐIỂM', 'TÂM', 'THỊ', 'GIÁC'
];

export const TONAL_VOWEL_GROUPS: Array<{ base: string; tones: string[] }> = [
  { base: 'a', tones: ['a', 'á', 'à', 'ả', 'ã', 'ạ', 'A', 'Á', 'À', 'Ả', 'Ã', 'Ạ'] },
  { base: 'ă', tones: ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ', 'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ'] },
  { base: 'â', tones: ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ', 'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ'] },
  { base: 'e', tones: ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ', 'E', 'É', 'È', 'Ẻ', 'Ẽ', 'Ẹ'] },
  { base: 'ê', tones: ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ', 'Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ'] },
  { base: 'i', tones: ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị', 'I', 'Í', 'Ì', 'Ỉ', 'Ĩ', 'Ị'] },
  { base: 'o', tones: ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ', 'O', 'Ó', 'Ò', 'Ỏ', 'Õ', 'Ọ'] },
  { base: 'ô', tones: ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ', 'Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ'] },
  { base: 'ơ', tones: ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ', 'Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ'] },
  { base: 'u', tones: ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ', 'U', 'Ú', 'Ù', 'Ủ', 'Ũ', 'Ụ'] },
  { base: 'ư', tones: ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự', 'Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự'] },
  { base: 'y', tones: ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ', 'Y', 'Ý', 'Ỳ', 'Ỷ', 'Ỹ', 'Ỵ'] }
];

export const CONFUSABLE_GLYPH_GROUPS: Array<{ name: string; target: string; distractors: string[] }> = [
  { name: 'b-d-p-q', target: 'd', distractors: ['b', 'p', 'q'] },
  { name: 'b-d-p-q (In hoa)', target: 'B', distractors: ['P', 'R', 'D', 'E'] },
  { name: 'đ-d-t-l', target: 'đ', distractors: ['d', 't', 'l', 'i'] },
  { name: 'm-n-u-h-w', target: 'n', distractors: ['m', 'u', 'h', 'w'] },
  { name: 'c-o-e-s', target: 'c', distractors: ['o', 'e', 's', 'a'] },
  { name: 'k-x-y-h', target: 'x', distractors: ['k', 'y', 'h', 'v'] },
  { name: 'O-0-Q-D-C', target: 'O', distractors: ['0', 'Q', 'D', 'C', 'G'] },
  { name: 'S-5-Z-2', target: 'S', distractors: ['5', 'Z', '2', 'E'] },
  { name: 'B-8-3', target: 'B', distractors: ['8', '3', 'P', 'R'] },
  { name: 'I-1-l-T-7', target: 'I', distractors: ['1', 'l', 'T', '7', '|'] },
  { name: 'G-6-C-O', target: 'G', distractors: ['6', 'C', 'O', 'Q'] }
];

const STOP_WORDS = new Set([
  'trong', 'những', 'chúng', 'được', 'người', 'nhưng', 'khi', 'này', 
  'cho', 'với', 'của', 'các', 'một', 'nhiều', 'theo', 'như', 'hoặc', 
  'đến', 'trên', 'dưới', 'cũng', 'không', 'phải', 'đang', 'đã', 'sẽ',
  'lại', 'qua', 'bởi', 'vào', 'ra', 'về', 'tại', 'đó', 'kia', 'ở'
]);

export const ENGLISH_INFINITY_READING_TEXTS: IReadingText[] = [
  {
    id: 'text-inf-neuroplasticity',
    title: 'Neuroplasticity and the Adaptive Mind',
    category: 'Cognitive Science (EN)',
    wordCount: 220,
    difficultyLevel: 8,
    content: 'Neuroplasticity is the remarkable capacity of the human nervous system to undergo structural and functional reorganization in response to experiential demands and environmental learning. For decades, traditional neuroscience adhered to the dogma that the adult human brain was a static, hardwired organ with fixed neural circuitry. However, modern neuroimaging studies have definitively overturned this assumption. When individuals engage in targeted cognitive challenges, such as speed reading, peripheral visual expansion, and working memory recall, synaptic density increases within the prefrontal cortex and hippocampus. Dendritic branching multiplies, myelin sheaths thicken to accelerate action potential conduction velocities, and dormant synaptic pathways become active. This bidirectional adaptability demonstrates that cognitive capabilities are not genetically predetermined ceilings, but dynamic baselines subject to continuous optimization. Deliberate mental training reorganizes neural topography, enhancing cognitive agility and processing speed throughout life.',
    previewExcerpt: 'Neuroplasticity is the remarkable capacity of the human nervous system to undergo structural and functional reorganization...',
    author: 'Cognitive Research Institute',
    questions: [
      {
        id: 'q-inf-1',
        questionOrder: 1,
        questionText: 'What was the traditional dogma regarding the adult human brain?',
        optionA: 'It possessed limitless regenerative powers',
        optionB: 'It was a static, hardwired organ with fixed circuitry',
        optionC: 'It lacked synaptic connections in the cortex',
        optionD: 'It could only learn through auditory stimuli',
        correctOption: 'B',
        explanation: 'For decades, traditional neuroscience adhered to the dogma that the adult human brain was a static, hardwired organ.'
      },
      {
        id: 'q-inf-2',
        questionOrder: 2,
        questionText: 'Which anatomical change accelerates action potential conduction velocity?',
        optionA: 'Thickening of myelin sheaths',
        optionB: 'Reduction of dendritic branching',
        optionC: 'Dormancy of synaptic pathways',
        optionD: 'Contraction of the hippocampus',
        correctOption: 'A',
        explanation: 'Myelin sheaths thicken to accelerate action potential conduction velocities.'
      }
    ]
  },
  {
    id: 'text-inf-quantum-cosmos',
    title: 'Quantum Entanglement and Spacetime Horizons',
    category: 'Quantum Physics (EN)',
    wordCount: 215,
    difficultyLevel: 9,
    content: 'Quantum entanglement represents one of the most profound and enigmatic features of fundamental physics. When two subatomic particles become entangled, their quantum states are intrinsically correlated regardless of the spatial distance separating them. Measuring the spin polarization of particle Alpha instantaneously collapses the quantum wave function of particle Beta, even if separated by billions of light-years across the observable cosmos. Albert Einstein famously questioned this non-local behavior as spooky action at a distance, suspecting hidden variables. Nevertheless, rigorous experimental validations of Bell inequality violations have consistently demonstrated that local realism cannot describe quantum reality. In contemporary astrophysics, theorists propose that quantum entanglement may constitute the fundamental fabric from which spacetime geometry itself emerges.',
    previewExcerpt: 'Quantum entanglement represents one of the most profound and enigmatic features of fundamental physics...',
    author: 'Astrophysical Society',
    questions: [
      {
        id: 'q-inf-3',
        questionOrder: 1,
        questionText: 'How did Albert Einstein famously characterize quantum non-local correlation?',
        optionA: 'The cosmic wave horizon',
        optionB: 'Spooky action at a distance',
        optionC: 'Holographic entanglement',
        optionD: 'Subatomic particle decay',
        correctOption: 'B',
        explanation: 'Albert Einstein famously questioned this non-local behavior as spooky action at a distance.'
      }
    ]
  }
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
      localStorage.setItem(WIKI_CACHE_KEY, JSON.stringify([text, ...filtered].slice(0, 30)));
    } catch (e) {
      console.warn('Cannot cache wiki article', e);
    }
  }

  /**
   * Return all available texts: built-in curated + English infinity + user cached Wikipedia & custom texts
   */
  public getAllTexts(): IReadingText[] {
    const cached = this.getCachedTexts();
    return [...SAMPLE_READING_TEXTS, ...ENGLISH_INFINITY_READING_TEXTS, ...cached];
  }

  /**
   * Add custom text pasted by user
   */
  public createCustomReadingText(title: string, rawContent: string, category = 'Tài Liệu Của Bạn'): IReadingText {
    const cleanText = rawContent.replace(/\s+/g, ' ').trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const newArticle: IReadingText = {
      id: `custom-${Date.now()}`,
      title: title.trim() || 'Tài Liệu Tự Chọn',
      category,
      wordCount,
      difficultyLevel: Math.min(5, Math.max(1, Math.round(wordCount / 80))),
      content: cleanText,
      previewExcerpt: cleanText.slice(0, 140) + '...',
      author: 'Người dùng cung cấp'
    };

    // Auto-generate matching quiz
    newArticle.questions = this.generateQuestionsFromArticle(newArticle);

    this.saveToCache(newArticle);
    return newArticle;
  }

  /**
   * Live search Vietnamese Wikipedia articles
   */
  public async searchWikipediaArticles(query: string): Promise<Array<{ title: string; snippet: string }>> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    try {
      const url = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(trimmed)}&utf8=&format=json&origin=*&srlimit=8`;
      const res = await fetch(url, { headers: { 'User-Agent': 'BrainProReader/2.0' } });
      if (!res.ok) return [];

      const data = await res.json();
      const searchResults = data.query?.search || [];
      return searchResults.map((item: any) => ({
        title: item.title,
        snippet: (item.snippet || '').replace(/<[^>]*>/g, '').trim()
      }));
    } catch (e) {
      console.error('Wikipedia search error:', e);
      return [];
    }
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
   * Generate 3-4 realistic comprehension questions algorithmically for ANY text (Wikipedia / Custom)
   * Solves token limits and API cost completely (0 cost, instant).
   */
  public generateQuestionsFromArticle(article: IReadingText): IReadingQuestion[] {
    const questions: IReadingQuestion[] = [];
    const sentences = article.content
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 25);

    const keywords = this.extractKeywordsFromArticle(article.content, 4, 12, 10);
    const mainKeyword = keywords[0] || article.title;

    // Distractor topics
    const distractorTopics = [
      'Cơ học chất lưu và chuyển động sóng',
      'Lịch sử khảo cổ học văn minh Lưỡng Hà',
      'Cấu trúc gen di truyền và ADN tái tổ hợp',
      'Định luật vạn vật hấp dẫn của Isaac Newton',
      'Kinh tế học vĩ mô và chu kỳ lạm phát',
      'Nghệ thuật hội họa Phục hưng vùng Florence'
    ].filter(d => !d.toLowerCase().includes(article.title.toLowerCase())).slice(0, 3);

    // Q1: Main Topic Question
    const q1Options = [
      { text: article.title, correct: true },
      { text: distractorTopics[0] || 'Lịch sử kiến trúc cổ điển', correct: false },
      { text: distractorTopics[1] || 'Phương pháp tinh chế kim loại quý', correct: false },
      { text: distractorTopics[2] || 'Hệ sinh thái rừng mưa nhiệt đới', correct: false }
    ].sort(() => 0.5 - Math.random());

    const q1CorrectLetter = ['A', 'B', 'C', 'D'][q1Options.findIndex(o => o.correct)] as 'A' | 'B' | 'C' | 'D';

    questions.push({
      id: `gen-q1-${Date.now()}`,
      questionOrder: 1,
      questionText: `Chủ đề trọng tâm hoặc thực thể chính được phân tích xuyên suốt trong bài viết là gì?`,
      optionA: q1Options[0].text,
      optionB: q1Options[1].text,
      optionC: q1Options[2].text,
      optionD: q1Options[3].text,
      correctOption: q1CorrectLetter,
      explanation: `Bài viết tập trung cung cấp tri thức cốt lõi và luận điểm về "${article.title}".`
    });

    // Q2: Fact Verification Question from paragraph 1 or 2
    if (sentences.length >= 2) {
      const factSentence = sentences[Math.min(1, sentences.length - 1)];
      const q2Options = [
        { text: factSentence, correct: true },
        { text: `Vấn đề này chưa từng được cộng đồng khoa học ghi nhận hoặc kiểm chứng.`, correct: false },
        { text: `Thông tin này chỉ áp dụng giới hạn trong môi trường chân không tuyệt đối.`, correct: false },
        { text: `Hiện tượng trên hoàn toàn bị bác bỏ bởi các nghiên cứu thực nghiệm mới nhất.`, correct: false }
      ].sort(() => 0.5 - Math.random());

      const q2CorrectLetter = ['A', 'B', 'C', 'D'][q2Options.findIndex(o => o.correct)] as 'A' | 'B' | 'C' | 'D';

      questions.push({
        id: `gen-q2-${Date.now()}`,
        questionOrder: 2,
        questionText: `Dựa trên nội dung đoạn văn, phát biểu nào sau đây phản ánh chính xác luận điểm của bài viết?`,
        optionA: q2Options[0].text,
        optionB: q2Options[1].text,
        optionC: q2Options[2].text,
        optionD: q2Options[3].text,
        correctOption: q2CorrectLetter,
        explanation: `Đoạn văn bản đã nêu rõ dữ kiện: "${factSentence}".`
      });
    }

    // Q3: Central Terminology Question
    if (keywords.length >= 2) {
      const q3Options = [
        { text: mainKeyword.toUpperCase(), correct: true },
        { text: 'QUANG HỢP LỤC LẠP', correct: false },
        { text: 'CHỨNG KHOÁN PHÁI SINH', correct: false },
        { text: 'NHIỆT ĐỘNG LỰC HỌC', correct: false }
      ].sort(() => 0.5 - Math.random());

      const q3CorrectLetter = ['A', 'B', 'C', 'D'][q3Options.findIndex(o => o.correct)] as 'A' | 'B' | 'C' | 'D';

      questions.push({
        id: `gen-q3-${Date.now()}`,
        questionOrder: 3,
        questionText: `Thuật ngữ hoặc từ khóa tiêu biểu nào liên tục xuất hiện như một khái niệm hạt nhân trong văn bản?`,
        optionA: q3Options[0].text,
        optionB: q3Options[1].text,
        optionC: q3Options[2].text,
        optionD: q3Options[3].text,
        correctOption: q3CorrectLetter,
        explanation: `Từ khóa "${mainKeyword}" là khái niệm trọng tâm xuất hiện nổi bật trong bài.`
      });
    }

    // Q4: Synthesis Question
    const conclusionSentence = sentences[sentences.length - 1] || sentences[0];
    const q4Options = [
      { text: `Làm rõ nguyên lý, tầm quan trọng và bối cảnh nghiên cứu của ${article.title}`, correct: true },
      { text: `Kêu gọi đầu tư thương mại vào các dự án bất động sản quốc tế`, correct: false },
      { text: `Hướng dẫn cài đặt hệ điều hành máy tính văn phòng`, correct: false },
      { text: `Tổng kết các giải thi đấu thể thao trong năm`, correct: false }
    ].sort(() => 0.5 - Math.random());

    const q4CorrectLetter = ['A', 'B', 'C', 'D'][q4Options.findIndex(o => o.correct)] as 'A' | 'B' | 'C' | 'D';

    questions.push({
      id: `gen-q4-${Date.now()}`,
      questionOrder: 4,
      questionText: `Mục đích chính của bài viết này là gì?`,
      optionA: q4Options[0].text,
      optionB: q4Options[1].text,
      optionC: q4Options[2].text,
      optionD: q4Options[3].text,
      correctOption: q4CorrectLetter,
      explanation: `Bài viết đóng vai trò phổ biến tri thức khoa học về: "${conclusionSentence}".`
    });

    return questions;
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
        category: 'Wikipedia Bách Khoa',
        wordCount: finalWordCount,
        difficultyLevel: Math.min(5, Math.max(1, Math.round(finalWordCount / 80))),
        content: excerptWords,
        previewExcerpt: excerptWords.slice(0, 120) + '...',
        author: 'Bách Khoa Toàn Thư Wikipedia (Tiếng Việt)'
      };

      // Automatically attach generated comprehension questions
      newArticle.questions = this.generateQuestionsFromArticle(newArticle);

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
   * Generate dynamic letter challenge for FindLetterGame
   */
  public getRandomLetterChallenge(mode: 'vowel_tones' | 'confusable' | 'all' = 'all') {
    if (mode === 'vowel_tones' || (mode === 'all' && Math.random() < 0.6)) {
      const group = TONAL_VOWEL_GROUPS[Math.floor(Math.random() * TONAL_VOWEL_GROUPS.length)];
      const target = group.tones[Math.floor(Math.random() * group.tones.length)];
      const distractors = group.tones.filter(t => t !== target);
      return {
        type: 'Dấu thanh Tiếng Việt',
        target,
        distractors: distractors.length > 0 ? distractors : ['a', 'á', 'à', 'ả'],
        description: `Tìm ký tự mang dấu thanh: "${target}"`
      };
    } else {
      const conf = CONFUSABLE_GLYPH_GROUPS[Math.floor(Math.random() * CONFUSABLE_GLYPH_GROUPS.length)];
      return {
        type: 'Ký tự dễ nhầm lẫn',
        target: conf.target,
        distractors: conf.distractors,
        description: `Tìm ký tự phân biệt: "${conf.target}"`
      };
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
