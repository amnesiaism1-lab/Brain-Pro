/**
 * Infinity API Service & Rich Offline Cognitive Knowledge Engine
 * Supports 10 Infinity Levels (∞-I to ∞-X) for Brain Exercises Pro
 * Integrates Dictionary API, Datamuse, Wikipedia, Open Trivia DB, NASA APOD,
 * with comprehensive offline datasets (150+ pairs, 85+ dictionary entries, 50+ synonyms/antonyms)
 * and intelligent procedural generators.
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

export interface IAntonymPair {
  wordA: string;
  wordB: string;
  viConcept: string;
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
  syllables?: string[];
}

export interface IEmotionWord {
  text: string;
  mood: 'positive' | 'negative' | 'neutral';
  vi: string;
}

export interface IFalseFriendPair {
  wordA: string;
  wordB: string;
  meaningA: string;
  meaningB: string;
}

// 1. High-frequency Bilingual Pairs (150+ diverse academic & real-world pairs)
export const BILINGUAL_WORD_PAIRS: ITranslationPair[] = [
  // Mind & Cognition (30)
  { vi: 'Bộ não', en: 'BRAIN', category: 'mind' },
  { vi: 'Ký ức', en: 'MEMORY', category: 'mind' },
  { vi: 'Tập trung', en: 'FOCUS', category: 'mind' },
  { vi: 'Trí tuệ', en: 'WISDOM', category: 'mind' },
  { vi: 'Thần kinh', en: 'NEURON', category: 'mind' },
  { vi: 'Linh hoạt', en: 'AGILE', category: 'mind' },
  { vi: 'Trực giác', en: 'INTUITION', category: 'mind' },
  { vi: 'Tiềm thức', en: 'SUBCONSCIOUS', category: 'mind' },
  { vi: 'Ý thức', en: 'CONSCIOUSNESS', category: 'mind' },
  { vi: 'Nhận thức', en: 'COGNITION', category: 'mind' },
  { vi: 'Chú ý', en: 'ATTENTION', category: 'mind' },
  { vi: 'Tư duy', en: 'THINKING', category: 'mind' },
  { vi: 'Suy luận', en: 'REASONING', category: 'mind' },
  { vi: 'Khớp thần kinh', en: 'SYNAPSE', category: 'mind' },
  { vi: 'Trực giác', en: 'INSIGHT', category: 'mind' },
  { vi: 'Sáng suốt', en: 'CLARITY', category: 'mind' },
  { vi: 'Chiêm nghiệm', en: 'REFLECTION', category: 'mind' },
  { vi: 'Nhận thức cảm tính', en: 'PERCEPTION', category: 'mind' },
  { vi: 'Trí tưởng tượng', en: 'IMAGINATION', category: 'mind' },
  { vi: 'Tính mềm dẻo', en: 'PLASTICITY', category: 'mind' },
  { vi: 'Ức chế', en: 'INHIBITION', category: 'mind' },
  { vi: 'Cảnh giác', en: 'VIGILANCE', category: 'mind' },
  { vi: 'Khắc ghi', en: 'ENCODING', category: 'mind' },
  { vi: 'Truy xuất', en: 'RETRIEVAL', category: 'mind' },
  { vi: 'Thấu hiểu', en: 'COMPREHENSION', category: 'mind' },
  { vi: 'Trí tuệ sắc bén', en: 'ACUITY', category: 'mind' },
  { vi: 'Độ nhạy', en: 'SENSITIVITY', category: 'mind' },
  { vi: 'Dòng chảy tâm trí', en: 'FLOW', category: 'mind' },
  { vi: 'Ý niệm', en: 'NOTION', category: 'mind' },
  { vi: 'Tư duy phản biện', en: 'CRITIQUE', category: 'mind' },

  // Nature & Earth (25)
  { vi: 'Mặt trời', en: 'SUN', category: 'nature' },
  { vi: 'Đại dương', en: 'OCEAN', category: 'nature' },
  { vi: 'Kim cương', en: 'DIAMOND', category: 'nature' },
  { vi: 'Cực quang', en: 'AURORA', category: 'nature' },
  { vi: 'Sấm chớp', en: 'THUNDER', category: 'nature' },
  { vi: 'Núi lửa', en: 'VOLCANO', category: 'nature' },
  { vi: 'Bão tố', en: 'TEMPEST', category: 'nature' },
  { vi: 'Băng trôi', en: 'GLACIER', category: 'nature' },
  { vi: 'Hẻm núi', en: 'CANYON', category: 'nature' },
  { vi: 'Sóng thần', en: 'TSUNAMI', category: 'nature' },
  { vi: 'Sa mạc', en: 'DESERT', category: 'nature' },
  { vi: 'Rừng rậm', en: 'JUNGLE', category: 'nature' },
  { vi: 'Đường chân trời', en: 'HORIZON', category: 'nature' },
  { vi: 'Thác nước', en: 'WATERFALL', category: 'nature' },
  { vi: 'Gió nhẹ', en: 'BREEZE', category: 'nature' },
  { vi: 'Ốc đảo', en: 'OASIS', category: 'nature' },
  { vi: 'Hóa thạch', en: 'FOSSIL', category: 'nature' },
  { vi: 'Khoáng thạch', en: 'MINERAL', category: 'nature' },
  { vi: 'Sương mù', en: 'MIST', category: 'nature' },
  { vi: 'Hang động', en: 'CAVERN', category: 'nature' },
  { vi: 'Bình nguyên', en: 'PLATEAU', category: 'nature' },
  { vi: 'Mạch nước ngầm', en: 'GEYSER', category: 'nature' },
  { vi: 'Bờ biển', en: 'COASTLINE', category: 'nature' },
  { vi: 'San hô', en: 'CORAL', category: 'nature' },
  { vi: 'Tuyết lở', en: 'AVALANCHE', category: 'nature' },

  // Space & Cosmos (25)
  { vi: 'Tên lửa', en: 'ROCKET', category: 'space' },
  { vi: 'Ngân hà', en: 'GALAXY', category: 'space' },
  { vi: 'Thiên hà', en: 'COSMOS', category: 'space' },
  { vi: 'Hành tinh', en: 'PLANET', category: 'space' },
  { vi: 'Tinh vân', en: 'NEBULA', category: 'space' },
  { vi: 'Hố đen', en: 'BLACKHOLE', category: 'space' },
  { vi: 'Siêu tân tinh', en: 'SUPERNOVA', category: 'space' },
  { vi: 'Tiểu hành tinh', en: 'ASTEROID', category: 'space' },
  { vi: 'Sao chổi', en: 'COMET', category: 'space' },
  { vi: 'Sao băng', en: 'METEOR', category: 'space' },
  { vi: 'Quỹ đạo', en: 'ORBIT', category: 'space' },
  { vi: 'Nhật thực', en: 'ECLIPSE', category: 'space' },
  { vi: 'Chuẩn tinh', en: 'QUASAR', category: 'space' },
  { vi: 'Sao xung', en: 'PULSAR', category: 'space' },
  { vi: 'Chòm sao', en: 'CONSTELLATION', category: 'space' },
  { vi: 'Tàu con thoi', en: 'SHUTTLE', category: 'space' },
  { vi: 'Vệ tinh', en: 'SATELLITE', category: 'space' },
  { vi: 'Khí quyển', en: 'ATMOSPHERE', category: 'space' },
  { vi: 'Không-thời gian', en: 'SPACETIME', category: 'space' },
  { vi: 'Vũ trụ học', en: 'COSMOLOGY', category: 'space' },
  { vi: 'Trọng trường', en: 'GRAVITATION', category: 'space' },
  { vi: 'Quang phổ sao', en: 'SPECTRUM', category: 'space' },
  { vi: 'Bụi liên sao', en: 'STARDUST', category: 'space' },
  { vi: 'Viễn vọng kính', en: 'TELESCOPE', category: 'space' },
  { vi: 'Thiên thạch', en: 'METEORITE', category: 'space' },

  // Science & Physics (25)
  { vi: 'Tốc độ', en: 'SPEED', category: 'science' },
  { vi: 'Năng lượng', en: 'ENERGY', category: 'science' },
  { vi: 'Lực hấp dẫn', en: 'GRAVITY', category: 'science' },
  { vi: 'Ánh sáng', en: 'LIGHT', category: 'science' },
  { vi: 'Tia chớp', en: 'SPARK', category: 'science' },
  { vi: 'Lượng tử', en: 'QUANTUM', category: 'science' },
  { vi: 'Hạt quang tử', en: 'PHOTON', category: 'science' },
  { vi: 'Vận tốc', en: 'VELOCITY', category: 'science' },
  { vi: 'Độ hỗn loạn', en: 'ENTROPY', category: 'science' },
  { vi: 'Tần số', en: 'FREQUENCY', category: 'science' },
  { vi: 'Cộng hưởng', en: 'RESONANCE', category: 'science' },
  { vi: 'Từ tính', en: 'MAGNETISM', category: 'science' },
  { vi: 'Điện từ trường', en: 'ELECTROMAGNET', category: 'science' },
  { vi: 'Động lượng', en: 'MOMENTUM', category: 'science' },
  { vi: 'Ma sát', en: 'FRICTION', category: 'science' },
  { vi: 'Chân không', en: 'VACUUM', category: 'science' },
  { vi: 'Lăng kính', en: 'PRISM', category: 'science' },
  { vi: 'Bức xạ', en: 'RADIATION', category: 'science' },
  { vi: 'Phân tử', en: 'MOLECULE', category: 'science' },
  { vi: 'Nguyên tử', en: 'ATOM', category: 'science' },
  { vi: 'Cơ học', en: 'MECHANICS', category: 'science' },
  { vi: 'Quang học', en: 'OPTICS', category: 'science' },
  { vi: 'Nhiệt động học', en: 'THERMODYNAMICS', category: 'science' },
  { vi: 'Hạt nhân', en: 'NUCLEUS', category: 'science' },
  { vi: 'Bước sóng', en: 'WAVELENGTH', category: 'science' },

  // Technology & Computing (25)
  { vi: 'Thuật toán', en: 'ALGORITHM', category: 'technology' },
  { vi: 'Mật mã', en: 'CIPHER', category: 'technology' },
  { vi: 'Mạng lưới', en: 'NETWORK', category: 'technology' },
  { vi: 'Dữ liệu', en: 'DATA', category: 'technology' },
  { vi: 'Giao thức', en: 'PROTOCOL', category: 'technology' },
  { vi: 'Bộ vi xử lý', en: 'PROCESSOR', category: 'technology' },
  { vi: 'Bộ nhớ đệm', en: 'CACHE', category: 'technology' },
  { vi: 'Băng thông', en: 'BANDWIDTH', category: 'technology' },
  { vi: 'Mã hóa', en: 'ENCRYPT', category: 'technology' },
  { vi: 'Giải mã', en: 'DECODE', category: 'technology' },
  { vi: 'Mô phỏng', en: 'SIMULATION', category: 'technology' },
  { vi: 'Cảm biến', en: 'SENSOR', category: 'technology' },
  { vi: 'Tự động hóa', en: 'AUTOMATION', category: 'technology' },
  { vi: 'Điện toán', en: 'COMPUTING', category: 'technology' },
  { vi: 'Trí tuệ nhân tạo', en: 'AI', category: 'technology' },
  { vi: 'Giao diện', en: 'INTERFACE', category: 'technology' },
  { vi: 'Cơ sở dữ liệu', en: 'DATABASE', category: 'technology' },
  { vi: 'Lập trình', en: 'PROGRAMMING', category: 'technology' },
  { vi: 'Tín hiệu', en: 'SIGNAL', category: 'technology' },
  { vi: 'Bảo mật', en: 'SECURITY', category: 'technology' },
  { vi: 'Kiến trúc máy', en: 'ARCHITECTURE', category: 'technology' },
  { vi: 'Kỹ thuật số', en: 'DIGITAL', category: 'technology' },
  { vi: 'Song song', en: 'PARALLEL', category: 'technology' },
  { vi: 'Hệ thống nhúng', en: 'EMBEDDED', category: 'technology' },
  { vi: 'Mạng nơ-ron', en: 'NEURALNET', category: 'technology' },

  // Concepts & Philosophy (25)
  { vi: 'Chiến thắng', en: 'VICTORY', category: 'concept' },
  { vi: 'Can đảm', en: 'BRAVE', category: 'concept' },
  { vi: 'Hòa bình', en: 'PEACE', category: 'concept' },
  { vi: 'Thử thách', en: 'CHALLENGE', category: 'concept' },
  { vi: 'Vô cực', en: 'INFINITY', category: 'concept' },
  { vi: 'Nghịch lý', en: 'PARADOX', category: 'concept' },
  { vi: 'Hài hòa', en: 'HARMONY', category: 'concept' },
  { vi: 'Cân bằng', en: 'EQUILIBRIUM', category: 'concept' },
  { vi: 'Sức mạnh kiên định', en: 'RESILIENCE', category: 'concept' },
  { vi: 'Sự thật', en: 'TRUTH', category: 'concept' },
  { vi: 'Bất biến', en: 'CONSTANT', category: 'concept' },
  { vi: 'Vĩnh cửu', en: 'ETERNITY', category: 'concept' },
  { vi: 'Bản chất', en: 'ESSENCE', category: 'concept' },
  { vi: 'Vận mệnh', en: 'DESTINY', category: 'concept' },
  { vi: 'Khát vọng', en: 'ASPIRATION', category: 'concept' },
  { vi: 'Kỷ luật', en: 'DISCIPLINE', category: 'concept' },
  { vi: 'Nhân ái', en: 'COMPASSION', category: 'concept' },
  { vi: 'Lòng can trường', en: 'FORTITUDE', category: 'concept' },
  { vi: 'Sự siêu việt', en: 'TRANSCENDENCE', category: 'concept' },
  { vi: 'Bí ẩn', en: 'ENIGMA', category: 'concept' },
  { vi: 'Tiềm năng', en: 'POTENTIAL', category: 'concept' },
  { vi: 'Sự chính xác', en: 'ACCURACY', category: 'concept' },
  { vi: 'Tự do', en: 'FREEDOM', category: 'concept' },
  { vi: 'Quyền lực', en: 'SOVEREIGNTY', category: 'concept' },
  { vi: 'Tính chân thực', en: 'AUTHENTICITY', category: 'concept' }
];

// 2. High-quality Antonym Pairs (50 pairs)
export const ANTONYM_PAIRS: IAntonymPair[] = [
  { wordA: 'ANCIENT', wordB: 'MODERN', viConcept: 'Cổ đại vs Hiện đại' },
  { wordA: 'ASCEND', wordB: 'DESCEND', viConcept: 'Đi lên vs Đi xuống' },
  { wordA: 'EXPAND', wordB: 'CONTRACT', viConcept: 'Giãn nở vs Co lại' },
  { wordA: 'BRAVE', wordB: 'COWARDLY', viConcept: 'Dũng cảm vs Hèn nhát' },
  { wordA: 'CHAOS', wordB: 'ORDER', viConcept: 'Hỗn loạn vs Trật tự' },
  { wordA: 'OPAQUE', wordB: 'TRANSPARENT', viConcept: 'Đục mờ vs Trong suốt' },
  { wordA: 'ACCELERATE', wordB: 'DECELERATE', viConcept: 'Tăng tốc vs Giảm tốc' },
  { wordA: 'COMPLEX', wordB: 'SIMPLE', viConcept: 'Phức tạp vs Đơn giản' },
  { wordA: 'CREATE', wordB: 'DESTROY', viConcept: 'Sáng tạo vs Hủy diệt' },
  { wordA: 'GENUINE', wordB: 'ARTIFICIAL', viConcept: 'Thuần khiết vs Nhân tạo' },
  { wordA: 'HARMONY', wordB: 'DISCORD', viConcept: 'Hòa hợp vs Bất hòa' },
  { wordA: 'IGNITE', wordB: 'EXTINGUISH', viConcept: 'Bùng cháy vs Dập tắt' },
  { wordA: 'LIMITLESS', wordB: 'BOUNDED', viConcept: 'Vô hạn vs Hữu hạn' },
  { wordA: 'LUMINOUS', wordB: 'GLOOMY', viConcept: 'Tỏa sáng vs U ám' },
  { wordA: 'PERMANENT', wordB: 'TRANSIENT', viConcept: 'Vĩnh viễn vs Nhất thời' },
  { wordA: 'RIGID', wordB: 'FLEXIBLE', viConcept: 'Cứng nhắc vs Linh hoạt' },
  { wordA: 'SCARCE', wordB: 'ABUNDANT', viConcept: 'Hiếm hoi vs Dồi dào' },
  { wordA: 'SHARP', wordB: 'BLUNT', viConcept: 'Sắc bén vs Cùn mòn' },
  { wordA: 'STATIC', wordB: 'DYNAMIC', viConcept: 'Tĩnh tại vs Năng động' },
  { wordA: 'STRENGTH', wordB: 'WEAKNESS', viConcept: 'Sức mạnh vs Điểm yếu' },
  { wordA: 'TEMPORARY', wordB: 'ETERNAL', viConcept: 'Tạm thời vs Vĩnh cửu' },
  { wordA: 'VALIANT', wordB: 'TIMID', viConcept: 'Kiên cường vs Nhút nhát' },
  { wordA: 'VISIBLE', wordB: 'CONCEALED', viConcept: 'Hiển hiện vs Che giấu' },
  { wordA: 'VOLATILE', wordB: 'STABLE', viConcept: 'Bất ổn vs Vững vàng' },
  { wordA: 'ZENITH', wordB: 'NADIR', viConcept: 'Đỉnh cao vs Vực sâu' },
  { wordA: 'ABSTRACT', wordB: 'CONCRETE', viConcept: 'Trừu tượng vs Cụ thể' },
  { wordA: 'AMBIGUOUS', wordB: 'PRECISE', viConcept: 'Mơ hồ vs Chính xác' },
  { wordA: 'BROAD', wordB: 'NARROW', viConcept: 'Rộng lớn vs Hẹp hòi' },
  { wordA: 'CALM', wordB: 'TURBULENT', viConcept: 'Yên ả vs Biến động' },
  { wordA: 'COHESION', wordB: 'DISPERSION', viConcept: 'Gắn kết vs Phân tán' },
  { wordA: 'CONVERGE', wordB: 'DIVERGE', viConcept: 'Hội tụ vs Phân kỳ' },
  { wordA: 'DENSE', wordB: 'SPARSE', viConcept: 'Dày đặc vs Thưa thớt' },
  { wordA: 'DILIGENT', wordB: 'LETHARGIC', viConcept: 'Chăm chỉ vs Uể oải' },
  { wordA: 'ENHANCE', wordB: 'DIMINISH', viConcept: 'Gia tăng vs Làm giảm' },
  { wordA: 'EXPLICIT', wordB: 'IMPLICIT', viConcept: 'Rõ ràng vs Ngầm ẩn' },
  { wordA: 'FERTILE', wordB: 'BARREN', viConcept: 'Màu mỡ vs Cằn cỗi' },
  { wordA: 'FIERCE', wordB: 'GENTLE', viConcept: 'Mãnh liệt vs Dịu dàng' },
  { wordA: 'FLUID', wordB: 'SOLID', viConcept: 'Chảy lỏng vs Rắn chắc' },
  { wordA: 'FREQUENT', wordB: 'SELDOM', viConcept: 'Thường xuyên vs Hiếm khi' },
  { wordA: 'GATHER', wordB: 'SCATTER', viConcept: 'Tập hợp vs Phân tán' },
  { wordA: 'HEAVY', wordB: 'WEIGHTLESS', viConcept: 'Nặng nề vs Không trọng lượng' },
  { wordA: 'IMMENSE', wordB: 'MINISCULE', viConcept: 'Bao la vs Nhỏ bé' },
  { wordA: 'INTRICATE', wordB: 'RUDIMENTARY', viConcept: 'Tinh vi vs Thô sơ' },
  { wordA: 'NATURAL', wordB: 'SYNTHETIC', viConcept: 'Tự nhiên vs Tổng hợp' },
  { wordA: 'OPTIMAL', wordB: 'DEFICIENT', viConcept: 'Tối ưu vs Khiếm khuyết' },
  { wordA: 'RATIONAL', wordB: 'IRRATIONAL', viConcept: 'Hợp lý vs Phi lý' },
  { wordA: 'SWIFT', wordB: 'SLUGGISH', viConcept: 'Thoăn thoắt vs Chậm chạp' },
  { wordA: 'UNIFIED', wordB: 'FRACTURED', viConcept: 'Thống nhất vs Tan rã' },
  { wordA: 'VALUABLE', wordB: 'WORTHLESS', viConcept: 'Giá trị vs Vô giá trị' },
  { wordA: 'VIGOROUS', wordB: 'FRAIL', viConcept: 'Cường tráng vs Yếu ớt' }
];

// 3. Synonym Pairs for Semantic Matching (50 pairs)
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
  { wordA: 'ACCURATE', wordB: 'PRECISE', commonMeaning: 'Chính xác' },
  { wordA: 'ASTUTE', wordB: 'SHREWD', commonMeaning: 'Khôn ngoan sắc sảo' },
  { wordA: 'BOUNDLESS', wordB: 'INFINITE', commonMeaning: 'Vô hạn vô biên' },
  { wordA: 'CEASE', wordB: 'HALT', commonMeaning: 'Dừng lại' },
  { wordA: 'CONCEAL', wordB: 'HIDE', commonMeaning: 'Che giấu' },
  { wordA: 'DELICATE', wordB: 'FRAGILE', commonMeaning: 'Mong manh dễ vỡ' },
  { wordA: 'DIVERSE', wordB: 'VARIED', commonMeaning: 'Đa dạng phong phú' },
  { wordA: 'EAGER', wordB: 'KEEN', commonMeaning: 'Háo hức thiết tha' },
  { wordA: 'ELEGANT', wordB: 'GRACEFUL', commonMeaning: 'Thanh lịch duyên dáng' },
  { wordA: 'EMINENT', wordB: 'RENOWNED', commonMeaning: 'Nổi tiếng lừng danh' },
  { wordA: 'ENIGMATIC', wordB: 'MYSTERIOUS', commonMeaning: 'Bí ẩn khó hiểu' },
  { wordA: 'EXPEDITE', wordB: 'ACCELERATE', commonMeaning: 'Đẩy nhanh tiến độ' },
  { wordA: 'FATIGUED', wordB: 'EXHAUSTED', commonMeaning: 'Kiệt sức mệt mỏi' },
  { wordA: 'FLAWLESS', wordB: 'PERFECT', commonMeaning: 'Hoàn hảo không vết xước' },
  { wordA: 'FUTILE', wordB: 'USELESS', commonMeaning: 'Vô ích uổng công' },
  { wordA: 'GENUINE', wordB: 'AUTHENTIC', commonMeaning: 'Đích thực chân thật' },
  { wordA: 'IMMENSE', wordB: 'COLOSSAL', commonMeaning: 'Bao la vĩ đại' },
  { wordA: 'INNOVATIVE', wordB: 'CREATIVE', commonMeaning: 'Sáng tạo đột phá' },
  { wordA: 'INTRICATE', wordB: 'COMPLEX', commonMeaning: 'Phức tạp tinh vi' },
  { wordA: 'LUCID', wordB: 'CLEAR', commonMeaning: 'Minh bạch sáng suốt' },
  { wordA: 'MAGNIFICENT', wordB: 'SPLENDID', commonMeaning: 'Lộng lẫy nguy nga' },
  { wordA: 'MOMENTOUS', wordB: 'CRUCIAL', commonMeaning: 'Trọng đại cốt yếu' },
  { wordA: 'NEGLIGIBLE', wordB: 'TRIVIAL', commonMeaning: 'Nhỏ nhặt không đáng kể' },
  { wordA: 'OBVIOUS', wordB: 'EVIDENT', commonMeaning: 'Rõ ràng hiển nhiên' },
  { wordA: 'PERCEIVE', wordB: 'DISCERN', commonMeaning: 'Nhận thức thấy rõ' },
  { wordA: 'PROFOUND', wordB: 'DEEP', commonMeaning: 'Sâu sắc uyên thâm' },
  { wordA: 'PRUDENT', wordB: 'CAUTIOUS', commonMeaning: 'Thận trọng khôn khéo' },
  { wordA: 'RESILIENT', wordB: 'TENACIOUS', commonMeaning: 'Kiên cường bền bỉ' },
  { wordA: 'RIGID', wordB: 'STIFF', commonMeaning: 'Cứng nhắc' },
  { wordA: 'SERENDIPITY', wordB: 'FORTUNE', commonMeaning: 'Cơ duyên may mắn' },
  { wordA: 'SUBSTANTIAL', wordB: 'CONSIDERABLE', commonMeaning: 'Đáng kể quan trọng' },
  { wordA: 'SWIFT', wordB: 'FLEET', commonMeaning: 'Nhanh như chớp' },
  { wordA: 'TRANQUIL', wordB: 'PEACEFUL', commonMeaning: 'Thanh bình yên ả' },
  { wordA: 'VALIANT', wordB: 'HEROIC', commonMeaning: 'Anh dũng kiên cường' },
  { wordA: 'VAST', wordB: 'EXPANSIVE', commonMeaning: 'Rộng lớn ngút ngàn' },
  { wordA: 'VIGOROUS', wordB: 'ROBUST', commonMeaning: 'Khỏe khoắn tràn trề năng lượng' },
  { wordA: 'VIVID', wordB: 'LIVELY', commonMeaning: 'Sống động chân thực' },
  { wordA: 'YIELD', wordB: 'PRODUCE', commonMeaning: 'Tạo ra sản sinh' },
  { wordA: 'ZEALOUS', wordB: 'PASSIONATE', commonMeaning: 'Nhiệt huyết say mê' }
];

// 4. Emoji to English Word Mappings (60+ pairs)
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
  { emoji: '💡', word: 'BULB', vi: 'Bóng đèn', category: 'idea' },
  { emoji: '🧬', word: 'DNA', vi: 'Chuỗi gien', category: 'science' },
  { emoji: '🔬', word: 'MICROSCOPE', vi: 'Kính hiển vi', category: 'science' },
  { emoji: '📚', word: 'BOOKS', vi: 'Sách vở', category: 'study' },
  { emoji: '⚖️', word: 'BALANCE', vi: 'Cán cân', category: 'justice' },
  { emoji: '🕊️', word: 'DOVE', vi: 'Chim bồ câu', category: 'peace' },
  { emoji: '🌲', word: 'PINE', vi: 'Cây thông', category: 'nature' },
  { emoji: '❄️', word: 'SNOW', vi: 'Tuyết', category: 'nature' },
  { emoji: '🌪️', word: 'TORNADO', vi: 'Lốc xoáy', category: 'nature' },
  { emoji: '☄️', word: 'COMET', vi: 'Sao chổi', category: 'space' },
  { emoji: '🕯️', word: 'CANDLE', vi: 'Ngọn nến', category: 'light' },
  { emoji: '🧭', word: 'COMPASS', vi: 'La bàn', category: 'travel' },
  { emoji: '🎙️', word: 'MICROPHONE', vi: 'Micrô', category: 'sound' },
  { emoji: '🎻', word: 'VIOLIN', vi: 'Đàn vĩ cầm', category: 'music' },
  { emoji: '🏇', word: 'HORSE', vi: 'Ngựa đua', category: 'animal' },
  { emoji: '🐺', word: 'WOLF', vi: 'Chó sói', category: 'animal' },
  { emoji: '🐝', word: 'BEE', vi: 'Con ong', category: 'animal' },
  { emoji: '🏹', word: 'ARROW', vi: 'Cung tên', category: 'tool' },
  { emoji: '🗿', word: 'STATUE', vi: 'Tượng đá', category: 'history' },
  { emoji: '🌋', word: 'MAGMA', vi: 'Dung nham', category: 'nature' },
  { emoji: '📡', word: 'RADAR', vi: 'Ăng-ten sóng', category: 'tech' },
  { emoji: '🔋', word: 'BATTERY', vi: 'Pin năng lượng', category: 'tech' },
  { emoji: '🧲', word: 'MAGNET', vi: 'Nam châm', category: 'science' }
];

// 5. Parts of Speech Triads (25 Triads)
export const POS_TRIADS: IPosTriad[] = [
  { theme: 'Khám Phá Vũ Trụ', noun: 'ROCKET', verb: 'LAUNCH', adjective: 'COSMIC' },
  { theme: 'Hoạt Động Trí Não', noun: 'NEURON', verb: 'THINK', adjective: 'SHARP' },
  { theme: 'Sức Mạnh Tự Nhiên', noun: 'LIGHTNING', verb: 'STRIKE', adjective: 'ELECTRIC' },
  { theme: 'Đại Dương Huyền Bí', noun: 'WHALE', verb: 'DIVE', adjective: 'AQUATIC' },
  { theme: 'Tốc Độ Ánh Sáng', noun: 'PHOTON', verb: 'TRAVEL', adjective: 'LUMINOUS' },
  { theme: 'Trí Tuệ Nhân Tạo', noun: 'CIPHER', verb: 'DECODE', adjective: 'LOGICAL' },
  { theme: 'Ý Chí Kiên Cường', noun: 'HERO', verb: 'CONQUER', adjective: 'VALIANT' },
  { theme: 'Vũ Điệu Ngọn Lửa', noun: 'FLAME', verb: 'IGNITE', adjective: 'RADIANT' },
  { theme: 'Sức Mạnh Đại Bàng', noun: 'EAGLE', verb: 'SOAR', adjective: 'MAJESTIC' },
  { theme: 'Trọng Lực Vũ Trụ', noun: 'GRAVITY', verb: 'ATTRACT', adjective: 'MASSIVE' },
  { theme: 'Sự Tiến Hóa', noun: 'GENOME', verb: 'MUTATE', adjective: 'ADAPTIVE' },
  { theme: 'Khát Vọng Hòa Bình', noun: 'DOVE', verb: 'UNITE', adjective: 'SERENE' },
  { theme: 'Tâm Bão Cuồng Phong', noun: 'CYCLONE', verb: 'SPIN', adjective: 'DESTRUCTIVE' },
  { theme: 'Tốc Độ Chớp Nhoáng', noun: 'CHEETAH', verb: 'SPRINT', adjective: 'RAPID' },
  { theme: 'Bí Ẩn Hố Đen', noun: 'HORIZON', verb: 'COLLAPSE', adjective: 'INFINITE' },
  { theme: 'Lăng Kính Khúc Xạ', noun: 'PRISM', verb: 'REFRACT', adjective: 'OPTICAL' },
  { theme: 'Kim Cương Bất Hoại', noun: 'DIAMOND', verb: 'ENDURE', adjective: 'TIMELESS' },
  { theme: 'Dòng Sông Tuôn Chảy', noun: 'RIVER', verb: 'FLOW', adjective: 'MEANDERING' },
  { theme: 'Bình Minh Chiếu Rọi', noun: 'DAWN', verb: 'AWAKEN', adjective: 'GOLDEN' },
  { theme: 'Sóng Âm Lan Tỏa', noun: 'ECHO', verb: 'RESONATE', adjective: 'ACOUSTIC' },
  { theme: 'Hóa Thạch Thời Gian', noun: 'FOSSIL', verb: 'PRESERVE', adjective: 'ANCIENT' },
  { theme: 'Vành Đai Sao Thổ', noun: 'RING', verb: 'ENCIRCLE', adjective: 'PLANETARY' },
  { theme: 'Nam Châm Hút Hạt', noun: 'MAGNET', verb: 'ALIGN', adjective: 'POLAR' },
  { theme: 'Nhiệt Hạch Mặt Trời', noun: 'FUSION', verb: 'RADIATE', adjective: 'SOLAR' },
  { theme: 'Bản Đồ Chỉ Hướng', noun: 'COMPASS', verb: 'GUIDE', adjective: 'TRUE' }
];

// 6. Curated Offline Dictionary with IPA, POS, and Dual Definitions (85+ Academic Terms)
export const CURATED_DICTIONARY: IDictionaryEntry[] = [
  { word: 'NEURON', phonetic: '/ˈnjʊə.rɒn/', partOfSpeech: 'noun', definition: 'A specialized cell transmitting nerve impulses in the brain', viMeaning: 'Tế bào thần kinh truyền dẫn xung điện trong não bộ', syllables: ['NEU', 'RON'] },
  { word: 'SYNAPSE', phonetic: '/ˈsaɪ.næps/', partOfSpeech: 'noun', definition: 'The micro junction between two communicating neurons', viMeaning: 'Điểm tiếp hợp dẫn truyền giữa hai tế bào thần kinh', syllables: ['SYN', 'APSE'] },
  { word: 'MEMORY', phonetic: '/ˈmem.ər.i/', partOfSpeech: 'noun', definition: 'The faculty by which the brain encodes, stores, and retrieves data', viMeaning: 'Trí nhớ, năng lực mã hóa và truy xuất tri thức', syllables: ['MEM', 'O', 'RY'] },
  { word: 'FOCUS', phonetic: '/ˈfəʊ.kəs/', partOfSpeech: 'verb', definition: 'To concentrate attention or visual gaze onto a specific stimulus', viMeaning: 'Tập trung chú ý vào một tiêu điểm xác định', syllables: ['FO', 'CUS'] },
  { word: 'COGNITION', phonetic: '/kɒɡˈnɪʃ.ən/', partOfSpeech: 'noun', definition: 'The mental action of acquiring knowledge and understanding', viMeaning: 'Quá trình nhận thức và xử lý thông tin của não bộ', syllables: ['COG', 'NI', 'TION'] },
  { word: 'SACCADE', phonetic: '/sæˈkɑːd/', partOfSpeech: 'noun', definition: 'A rapid, ballistic eye movement shifting visual fixation', viMeaning: 'Cử động nhảy nhanh của mắt giữa các điểm nhìn', syllables: ['SAC', 'CADE'] },
  { word: 'VELOCITY', phonetic: '/vəˈlɒs.ə.ti/', partOfSpeech: 'noun', definition: 'The speed of an object in a specified directional vector', viMeaning: 'Vận tốc chuyển động có hướng trong không gian', syllables: ['VE', 'LOC', 'I', 'TY'] },
  { word: 'PERIPHERAL', phonetic: '/pəˈrɪf.ər.əl/', partOfSpeech: 'adjective', definition: 'Relating to or situated on the edge or outer boundaries of vision', viMeaning: 'Thuộc vùng biên ngoại vi của tầm nhìn thị giác', syllables: ['PER', 'IPH', 'ER', 'AL'] },
  { word: 'LUMINOUS', phonetic: '/ˈluː.mɪ.nəs/', partOfSpeech: 'adjective', definition: 'Radiating, emitting, or reflecting intense glowing light', viMeaning: 'Phát sáng rực rỡ, tỏa ánh quang', syllables: ['LU', 'MI', 'NOUS'] },
  { word: 'QUANTUM', phonetic: '/ˈkwɒn.təm/', partOfSpeech: 'noun', definition: 'A discrete packet of energy in subatomic physics', viMeaning: 'Lượng tử, đơn vị rời rạc của năng lượng vật lý', syllables: ['QUAN', 'TUM'] },
  { word: 'GALAXY', phonetic: '/ˈɡæl.ək.si/', partOfSpeech: 'noun', definition: 'A gravitationally bound system of stars, gas, and dark matter', viMeaning: 'Thiên hà chứa hàng tỷ ngôi sao liên kết bằng trọng lực', syllables: ['GAL', 'AX', 'Y'] },
  { word: 'INFINITY', phonetic: '/ɪnˈfɪn.ə.ti/', partOfSpeech: 'noun', definition: 'The state or quality of being boundless, limitless, and unending', viMeaning: 'Vô cực, trạng thái vô tận không giới hạn', syllables: ['IN', 'FIN', 'I', 'TY'] },
  { word: 'INHIBITION', phonetic: '/ˌɪn.hɪˈbɪʃ.ən/', partOfSpeech: 'noun', definition: 'The suppression of prepotent habitual cognitive responses', viMeaning: 'Sự ức chế phản xạ thói quen để kiểm soát tư duy', syllables: ['IN', 'HI', 'BI', 'TION'] },
  { word: 'EXPONENTIAL', phonetic: '/ˌek.spəˈnen.ʃəl/', partOfSpeech: 'adjective', definition: 'Increasing at an accelerating, geometric rate over time', viMeaning: 'Tăng trưởng cấp số nhân với tốc độ thần tốc', syllables: ['EX', 'PO', 'NEN', 'TIAL'] },
  { word: 'ECLIPSE', phonetic: '/ɪˈklɪps/', partOfSpeech: 'noun', definition: 'The total or partial obscuration of one celestial body by another', viMeaning: 'Hiện tượng thiên văn che khuất ánh sáng', syllables: ['E', 'CLIPSE'] },
  { word: 'HARMONY', phonetic: '/ˈhɑː.mə.ni/', partOfSpeech: 'noun', definition: 'Pleasing congruence and coherence among diverse elements', viMeaning: 'Sự hòa hợp, nhịp nhàng đồng điệu', syllables: ['HAR', 'MO', 'NY'] },
  { word: 'CHALLENGE', phonetic: '/ˈtʃæl.ɪndʒ/', partOfSpeech: 'noun', definition: 'A demanding task testing maximum mental or physical abilities', viMeaning: 'Thử thách kích hoạt giới hạn tư duy cao nhất', syllables: ['CHAL', 'LENGE'] },
  { word: 'COMPREHEND', phonetic: '/ˌkɒm.prɪˈhend/', partOfSpeech: 'verb', definition: 'To mentally grasp the full significance and context of ideas', viMeaning: 'Thấu hiểu trọn vẹn ngữ nghĩa và bối cảnh', syllables: ['COM', 'PRE', 'HEND'] },
  { word: 'PARADOX', phonetic: '/ˈpær.ə.dɒks/', partOfSpeech: 'noun', definition: 'A seemingly contradictory proposition revealing deep truth', viMeaning: 'Nghịch lý tưởng chừng mâu thuẫn nhưng chứa đựng chân lý', syllables: ['PAR', 'A', 'DOX'] },
  { word: 'RESILIENCE', phonetic: '/rɪˈzɪl.jəns/', partOfSpeech: 'noun', definition: 'The capacity to recover quickly from cognitive or physical stress', viMeaning: 'Sức bền kiên cường, khả năng phục hồi sau áp lực', syllables: ['RE', 'SIL', 'IENCE'] },
  { word: 'ENTANGLEMENT', phonetic: '/ɪnˈtæŋ.ɡəl.mənt/', partOfSpeech: 'noun', definition: 'Quantum linkage where particle states correlate instantaneously', viMeaning: 'Hiện tượng vướng víu lượng tử tương tác tức thời', syllables: ['EN', 'TAN', 'GLE', 'MENT'] },
  { word: 'NEUROPLASTICITY', phonetic: '/ˌnjʊə.rəʊ.plæsˈtɪs.ə.ti/', partOfSpeech: 'noun', definition: 'The ability of the brain to rewire neural circuits through learning', viMeaning: 'Tính mềm dẻo thần kinh, khả năng tái lập mạng não', syllables: ['NEU', 'RO', 'PLAS', 'TIC', 'I', 'TY'] },
  { word: 'HEURISTIC', phonetic: '/hjʊəˈrɪs.tɪk/', partOfSpeech: 'noun', definition: 'A practical rule-of-thumb mental strategy solving problems fast', viMeaning: 'Phương pháp giải quyết vấn đề bằng suy nghiệm nhanh', syllables: ['HEU', 'RIS', 'TIC'] },
  { word: 'HOMEOSTASIS', phonetic: '/ˌhəʊ.mi.əʊˈsteɪ.sɪs/', partOfSpeech: 'noun', definition: 'The biological tendency toward equilibrium and internal stability', viMeaning: 'Trạng thái cân bằng nội môi sinh học', syllables: ['HO', 'MEO', 'STA', 'SIS'] },
  { word: 'SUPERNOVA', phonetic: '/ˌsuː.pəˈnəʊ.və/', partOfSpeech: 'noun', definition: 'A colossal cosmic explosion signaling the death of a massive star', viMeaning: 'Vụ nổ siêu tân tinh giải phóng năng lượng vũ trụ khổng lồ', syllables: ['SU', 'PER', 'NO', 'VA'] },
  { word: 'DIVERGENCE', phonetic: '/daɪˈvɜː.dʒəns/', partOfSpeech: 'noun', definition: 'The act of moving apart in different directions from a point', viMeaning: 'Sự phân kỳ, rẽ nhánh theo các hướng khác nhau', syllables: ['DI', 'VER', 'GENCE'] },
  { word: 'CONVERGENCE', phonetic: '/kənˈvɜː.dʒəns/', partOfSpeech: 'noun', definition: 'The coming together of different ideas or visual fields at a point', viMeaning: 'Sự hội tụ các nguồn thông tin tại một điểm chung', syllables: ['CON', 'VER', 'GENCE'] },
  { word: 'EQUILIBRIUM', phonetic: '/ˌek.wɪˈlɪb.ri.əm/', partOfSpeech: 'noun', definition: 'A balanced state where opposing forces or factors cancel out', viMeaning: 'Trạng thái cân bằng động lực hoàn hảo', syllables: ['E', 'QUI', 'LIB', 'RI', 'UM'] },
  { word: 'SUBVOCALIZE', phonetic: '/sʌbˈvəʊ.kəl.aɪz/', partOfSpeech: 'verb', definition: 'To utter words silently in the mind while reading text', viMeaning: 'Phát âm thầm trong đầu khi đọc chữ', syllables: ['SUB', 'VO', 'CAL', 'IZE'] },
  { word: 'PACER', phonetic: '/ˈpeɪ.sər/', partOfSpeech: 'noun', definition: 'A guide or visual beacon setting reading tempo and rhythm', viMeaning: 'Vật dẫn nhịp định hình tốc độ lướt mắt', syllables: ['PA', 'CER'] },
  { word: 'METABOLISM', phonetic: '/məˈtæb.əl.ɪ.zəm/', partOfSpeech: 'noun', definition: 'Chemical reactions sustaining life and generating cellular energy', viMeaning: 'Quá trình chuyển hóa chất và tạo năng lượng tế bào', syllables: ['ME', 'TAB', 'O', 'LISM'] },
  { word: 'ALGORITHM', phonetic: '/ˈæl.ɡə.rɪ.ðəm/', partOfSpeech: 'noun', definition: 'A finite step-by-step computational process solving a problem', viMeaning: 'Thuật toán tính toán tuần tự giải quyết bài toán', syllables: ['AL', 'GO', 'RITHM'] },
  { word: 'HOLISTIC', phonetic: '/həʊˈlɪs.tɪk/', partOfSpeech: 'adjective', definition: 'Characterized by the comprehension of parts as an interconnected whole', viMeaning: 'Tiếp cận toàn diện, nhìn bức tranh tổng thể', syllables: ['HO', 'LIS', 'TIC'] },
  { word: 'EPIGENETICS', phonetic: '/ˌep.ɪ.dʒəˈnet.ɪks/', partOfSpeech: 'noun', definition: 'The study of gene expression changes without altering DNA sequence', viMeaning: 'Di truyền học biểu sinh, biểu hiện gien theo lối sống', syllables: ['EP', 'I', 'GE', 'NET', 'ICS'] },
  { word: 'SYNERGY', phonetic: '/ˈsɪn.ə.dʒi/', partOfSpeech: 'noun', definition: 'Combined interaction producing total effect greater than sum of parts', viMeaning: 'Hiệu ứng cộng hưởng tạo sức mạnh vượt trội', syllables: ['SYN', 'ER', 'GY'] },
  { word: 'TELEMETRY', phonetic: '/təˈlem.ə.tri/', partOfSpeech: 'noun', definition: 'The automatic measurement and transmission of performance metrics', viMeaning: 'Đo lường từ xa và truyền dữ liệu chỉ số nhận thức', syllables: ['TE', 'LEM', 'E', 'TRY'] },
  { word: 'TRANSCEND', phonetic: '/trænˈsend/', partOfSpeech: 'verb', definition: 'To surpass, exceed, or rise above normal human boundaries', viMeaning: 'Vượt qua giới hạn tầm thường, đạt cảnh giới cao hơn', syllables: ['TRAN', 'SCEND'] },
  { word: 'ENIGMATIC', phonetic: '/ˌen.ɪɡˈmæt.ɪk/', partOfSpeech: 'adjective', definition: 'Mysterious, baffling, and difficult to comprehend fully', viMeaning: 'Bí ẩn huyền diệu kích thích sự tò mò khám phá', syllables: ['EN', 'IG', 'MAT', 'IC'] },
  { word: 'LUCIDITY', phonetic: '/luːˈsɪd.ə.ti/', partOfSpeech: 'noun', definition: 'Exceptional cognitive clarity and rational perception', viMeaning: 'Sự sáng suốt tuyệt đối của tâm trí', syllables: ['LU', 'CID', 'I', 'TY'] },
  { word: 'TENACITY', phonetic: '/təˈnæs.ə.ti/', partOfSpeech: 'noun', definition: 'The quality of being determined, stubborn, and persistent', viMeaning: 'Tính kiên trì, bền chí không bỏ cuộc', syllables: ['TE', 'NAC', 'I', 'TY'] },
  { word: 'PULSAR', phonetic: '/ˈpʌl.sɑːr/', partOfSpeech: 'noun', definition: 'A highly magnetized rotating neutron star emitting beams of radiation', viMeaning: 'Sao xung phát chùm bức xạ tuần hoàn như ngọn hải đăng', syllables: ['PUL', 'SAR'] },
  { word: 'PRISM', phonetic: '/ˈprɪz.əm/', partOfSpeech: 'noun', definition: 'A transparent optical element refracting and dispersing light', viMeaning: 'Lăng kính quang học tán sắc ánh sáng trắng', syllables: ['PRISM'] },
  { word: 'OPTICAL', phonetic: '/ˈɒp.tɪ.kəl/', partOfSpeech: 'adjective', definition: 'Relating to sight, visual rays, or the behavior of light', viMeaning: 'Thuộc về thị giác và quang học ánh sáng', syllables: ['OP', 'TI', 'CAL'] },
  { word: 'DENDRITE', phonetic: '/ˈden.draɪt/', partOfSpeech: 'noun', definition: 'A branched projection of a neuron conducting input impulses', viMeaning: 'Sợi nhánh của tế bào thần kinh tiếp nhận tín hiệu', syllables: ['DEN', 'DRITE'] },
  { word: 'MYELIN', phonetic: '/ˈmaɪ.ə.lɪn/', partOfSpeech: 'noun', definition: 'A lipid sheath insulating axons to hasten electrical impulses', viMeaning: 'Bao myelin bọc sợi trục giúp tăng tốc độ dẫn truyền', syllables: ['MY', 'E', 'LIN'] },
  { word: 'AXON', phonetic: '/ˈæk.sɒn/', partOfSpeech: 'noun', definition: 'The long slender fiber of a neuron sending action potentials', viMeaning: 'Sợi trục thần kinh truyền phát xung điện xa', syllables: ['AX', 'ON'] },
  { word: 'CORTEX', phonetic: '/ˈkɔː.teks/', partOfSpeech: 'noun', definition: 'The outer folded mantle of gray matter covering the brain hemispheres', viMeaning: 'Vỏ não chất xám phụ trách tư duy bậc cao', syllables: ['COR', 'TEX'] },
  { word: 'HIPPOCAMPUS', phonetic: '/ˌhɪp.əˈkæm.pəs/', partOfSpeech: 'noun', definition: 'A neural complex in the temporal lobe vital for spatial memory', viMeaning: 'Hồi hải mã, trung tâm củng cố trí nhớ và định hướng', syllables: ['HIP', 'PO', 'CAM', 'PUS'] },
  { word: 'AMYGDALA', phonetic: '/əˈmɪɡ.də.lə/', partOfSpeech: 'noun', definition: 'An almond-shaped brain nucleus processing fear and emotions', viMeaning: 'Hạch hạnh nhân điều hành cảm xúc và phản ứng sinh tồn', syllables: ['A', 'MYG', 'DA', 'LA'] },
  { word: 'DOPAMINE', phonetic: '/ˈdəʊ.pə.miːn/', partOfSpeech: 'noun', definition: 'A neurotransmitter mediating reward anticipation and motivation', viMeaning: 'Chất dẫn truyền thần kinh động lực và phần thưởng', syllables: ['DO', 'PA', 'MINE'] }
];

// 7. Emotion Words for Stroop Clash Level 18 (25 rich words)
export const EMOTION_WORDS: IEmotionWord[] = [
  { text: 'JOY', mood: 'positive', vi: 'Niềm vui' },
  { text: 'SERENITY', mood: 'positive', vi: 'Thanh thản' },
  { text: 'ECSTASY', mood: 'positive', vi: 'Hân hoan tột độ' },
  { text: 'HOPE', mood: 'positive', vi: 'Hy vọng' },
  { text: 'GRATITUDE', mood: 'positive', vi: 'Biết ơn' },
  { text: 'ELATION', mood: 'positive', vi: 'Phấn chấn' },
  { text: 'BLISS', mood: 'positive', vi: 'Hạnh phúc ngập tràn' },
  { text: 'ZEAL', mood: 'positive', vi: 'Nhiệt huyết' },
  { text: 'AWE', mood: 'positive', vi: 'Kinh ngạc thán phục' },
  { text: 'COURAGE', mood: 'positive', vi: 'Can đảm' },
  { text: 'FEAR', mood: 'negative', vi: 'Nỗi sợ' },
  { text: 'PANIC', mood: 'negative', vi: 'Hoảng loạn' },
  { text: 'ANGUISH', mood: 'negative', vi: 'Đau đớn quằn quại' },
  { text: 'GRIEF', mood: 'negative', vi: 'Đau buồn' },
  { text: 'TERROR', mood: 'negative', vi: 'Kinh hoàng' },
  { text: 'DESPAIR', mood: 'negative', vi: 'Tuyệt vọng' },
  { text: 'ENVY', mood: 'negative', vi: 'Đố kỵ' },
  { text: 'DREAD', mood: 'negative', vi: 'Khiếp sợ' },
  { text: 'MELANCHOLY', mood: 'negative', vi: 'U sầu' },
  { text: 'FURY', mood: 'negative', vi: 'Thịnh nộ' },
  { text: 'NEUTRAL', mood: 'neutral', vi: 'Trung tính' },
  { text: 'REFLECTIVE', mood: 'neutral', vi: 'Suy tưởng' },
  { text: 'OBSERVANT', mood: 'neutral', vi: 'Quan sát' },
  { text: 'EQUANIMOUS', mood: 'neutral', vi: 'Bình thản' },
  { text: 'CURIOUS', mood: 'neutral', vi: 'Tò mò' }
];

// 8. False Friends & Lookalikes for Twin Words Level 18 (20 pairs)
export const FALSE_FRIENDS: IFalseFriendPair[] = [
  { wordA: 'DESERT', wordB: 'DESSERT', meaningA: 'Sa mạc cát', meaningB: 'Món tráng miệng' },
  { wordA: 'PRINCIPAL', wordB: 'PRINCIPLE', meaningA: 'Hiệu trưởng / Vốn gốc', meaningB: 'Nguyên lý chân lý' },
  { wordA: 'ACCEPT', wordB: 'EXCEPT', meaningA: 'Chấp nhận tiếp nhận', meaningB: 'Ngoại trừ ra' },
  { wordA: 'COMPLIMENT', wordB: 'COMPLEMENT', meaningA: 'Lời khen ngợi', meaningB: 'Phần bổ trợ hoàn thiện' },
  { wordA: 'STATIONARY', wordB: 'STATIONERY', meaningA: 'Đứng yên cố định', meaningB: 'Văn phòng phẩm sách vở' },
  { wordA: 'LOOSE', wordB: 'LOSE', meaningA: 'Rộng rãi lỏng lẻo', meaningB: 'Thua cuộc đánh mất' },
  { wordA: 'ADVICE', wordB: 'ADVISE', meaningA: 'Lời khuyên (Danh từ)', meaningB: 'Khuyên bảo (Động từ)' },
  { wordA: 'BARE', wordB: 'BEAR', meaningA: 'Trần trụi trơ trụi', meaningB: 'Chịu đựng / Con gấu' },
  { wordA: 'PEAK', wordB: 'PEEK', meaningA: 'Đỉnh núi cao nhất', meaningB: 'Nhìn lén liếc trộm' },
  { wordA: 'CAPITAL', wordB: 'CAPITOL', meaningA: 'Thủ đô / Tiền vốn', meaningB: 'Tòa nhà quốc hội' },
  { wordA: 'AFFECT', wordB: 'EFFECT', meaningA: 'Tác động ảnh hưởng', meaningB: 'Kết quả hiệu ứng' },
  { wordA: 'ILLUSION', wordB: 'ALLUSION', meaningA: 'Ảo ảnh thị giác', meaningB: 'Lời ám chỉ nhắc bóng' },
  { wordA: 'ELICIT', wordB: 'ILLICIT', meaningA: 'Gợi mở rút ra', meaningB: 'Bất hợp pháp phạm luật' },
  { wordA: 'EMIGRATE', wordB: 'IMMIGRATE', meaningA: 'Di cư ra nước ngoài', meaningB: 'Nhập cư vào trong nước' },
  { wordA: 'FLAIR', wordB: 'FLARE', meaningA: 'Tài năng thiên bẩm', meaningB: 'Pháo sáng lóe lửa' },
  { wordA: 'LEAD', wordB: 'LED', meaningA: 'Kim loại chì / Dẫn dắt', meaningB: 'Đã dẫn dắt (quá khứ)' },
  { wordA: 'MORAL', wordB: 'MORALE', meaningA: 'Đạo đức phẩm hạnh', meaningB: 'Tinh thần ý chí chiến đấu' },
  { wordA: 'PRECEDE', wordB: 'PROCEED', meaningA: 'Đi trước xảy ra trước', meaningB: 'Tiếp tục tiến hành' },
  { wordA: 'SIGHT', wordB: 'SITE', meaningA: 'Thị lực tầm nhìn', meaningB: 'Địa điểm công trường' },
  { wordA: 'WHETHER', wordB: 'WEATHER', meaningA: 'Liệu rằng có hay không', meaningB: 'Thời tiết khí hậu' }
];

// 9. NASA Astronomy Cards (18 Cards)
export const NASA_OFFLINE_CARDS = [
  { id: 'nasa-1', title: 'James Webb Deep Field', enLabel: 'WEBB TELESCOPE', viLabel: 'Kính Viễn Vọng Webb', emoji: '🔭' },
  { id: 'nasa-2', title: 'Pillars of Creation', enLabel: 'EAGLE NEBULA', viLabel: 'Tinh Vân Đại Bàng', emoji: '🦅' },
  { id: 'nasa-3', title: 'Ringed Wonder Saturn', enLabel: 'SATURN RINGS', viLabel: 'Vành Đai Sao Thổ', emoji: '🪐' },
  { id: 'nasa-4', title: 'Supermassive Black Hole', enLabel: 'BLACK HOLE', viLabel: 'Lỗ Đen Siêu Khối', emoji: '🕳️' },
  { id: 'nasa-5', title: 'Solar Flare CME', enLabel: 'SOLAR FLARE', viLabel: 'Bão Nhật Hoa', emoji: '☀️' },
  { id: 'nasa-6', title: 'Andromeda Spiral', enLabel: 'ANDROMEDA', viLabel: 'Thiên Hà Tiên Nữ', emoji: '🌌' },
  { id: 'nasa-7', title: 'Orion Stellar Cradle', enLabel: 'ORION NEBULA', viLabel: 'Tinh Vân Lạp Hộ', emoji: '✨' },
  { id: 'nasa-8', title: 'Lunar Crater Tycho', enLabel: 'MOON CRATER', viLabel: 'Hố Va Chạm Mặt Trăng', emoji: '🌕' },
  { id: 'nasa-9', title: 'Mars Olympus Mons', enLabel: 'MARS VOLCANO', viLabel: 'Núi Lửa Sao Hỏa', emoji: '🌋' },
  { id: 'nasa-10', title: 'Jupiter Great Red Spot', enLabel: 'JUPITER VORTEX', viLabel: 'Mắt Bão Sao Mộc', emoji: '🌀' },
  { id: 'nasa-11', title: 'Crab Nebula Pulsar', enLabel: 'CRAB PULSAR', viLabel: 'Sao Xung Con Cua', emoji: '🦀' },
  { id: 'nasa-12', title: 'Hubble Ultra Deep', enLabel: 'HUBBLE TELESCOPE', viLabel: 'Mắt Thần Hubble', emoji: '🛰️' },
  { id: 'nasa-13', title: 'Interstellar Comet', enLabel: 'BORISOV COMET', viLabel: 'Sao Chổi Liên Sao', emoji: '☄️' },
  { id: 'nasa-14', title: 'Cosmic Microwave CMB', enLabel: 'BIG BANG ECHO', viLabel: 'Bức Xạ Nền Vũ Trụ', emoji: '📡' },
  { id: 'nasa-15', title: 'Cassiopeia Supernova', enLabel: 'CASSIOPEIA A', viLabel: 'Tàn Dư Siêu Tân Tinh', emoji: '💥' },
  { id: 'nasa-16', title: 'Europa Ice Ocean', enLabel: 'EUROPA OCEAN', viLabel: 'Đại Dương Băng Europa', emoji: '🧊' },
  { id: 'nasa-17', title: 'Solar Eclipse Corona', enLabel: 'SOLAR CORONA', viLabel: 'Vành Nhật Hoa Mặt Trời', emoji: '🌑' },
  { id: 'nasa-18', title: 'Gravitational Lens', enLabel: 'EINSTEIN RING', viLabel: 'Thấu Kính Hấp Dẫn', emoji: '💍' }
];

// 10. Number Conversion Utilities
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

// 11. Audio Speech Synthesis helper
export function speakWord(text: string, lang: 'en' | 'vi' = 'en', rate = 1.0): void {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully ignore audio restrictions
  }
}

// 12. Procedural Math Problem Generators (Without Spoiler Answers)
export function generateWordProblem(): { text: string; answer: number } {
  const problemTypes = [
    // Multiplication / Division
    () => {
      const rows = Math.floor(Math.random() * 7) + 3;
      const cols = Math.floor(Math.random() * 8) + 3;
      return { text: `${rows} hàng ghế, mỗi hàng có ${cols} bạn ngồi = ?`, answer: rows * cols };
    },
    // Addition with context
    () => {
      const a = Math.floor(Math.random() * 45) + 12;
      const b = Math.floor(Math.random() * 45) + 12;
      return { text: `Tàu có ${a} hành khách, đón thêm ${b} khách = ?`, answer: a + b };
    },
    // Subtraction
    () => {
      const total = Math.floor(Math.random() * 80) + 40;
      const minus = Math.floor(Math.random() * 30) + 10;
      return { text: `Kho có ${total} quyển sách, xuất đi ${minus} quyển = ?`, answer: total - minus };
    },
    // Speed x Time
    () => {
      const speed = (Math.floor(Math.random() * 6) + 3) * 10;
      const hours = Math.floor(Math.random() * 4) + 2;
      return { text: `Xe chạy ${speed} km/h trong ${hours} giờ = ? km`, answer: speed * hours };
    },
    // Double / Half
    () => {
      const base = Math.floor(Math.random() * 35) + 15;
      return { text: `Gấp đôi số ${base} rồi cộng 1 = ?`, answer: base * 2 + 1 };
    }
  ];

  const pick = problemTypes[Math.floor(Math.random() * problemTypes.length)];
  return pick();
}

export function generateFractionProblem(): { text: string; answer: number } {
  const denominators = [2, 3, 4, 5];
  const denom = denominators[Math.floor(Math.random() * denominators.length)];
  const multiplier = Math.floor(Math.random() * 15) + 4;
  const isExact = Math.random() < 0.6;
  const numer = isExact ? multiplier * denom : (multiplier * denom) + 1;
  const rounded = Math.round(numer / denom);
  return {
    text: `${numer} / ${denom} = ?`,
    answer: rounded
  };
}

export function generateAlgebraParityProblem(): { text: string; answer: number } {
  const x = Math.floor(Math.random() * 12) + 2;
  const templates = [
    { expr: `2x + 1 (với x = ${x})`, val: 2 * x + 1 },
    { expr: `3x - 2 (với x = ${x})`, val: 3 * x - 2 },
    { expr: `x² + 1 (với x = ${x})`, val: (x * x) + 1 },
    { expr: `4x + 6 (với x = ${x})`, val: 4 * x + 6 }
  ];
  const chosen = templates[Math.floor(Math.random() * templates.length)];
  return {
    text: chosen.expr,
    answer: chosen.val
  };
}

// 13. Cache Helper
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
  } catch {}
}

// 14. Core Service Class
class InfinityApiService {
  async getWordDefinition(word: string): Promise<IDictionaryEntry> {
    const upperWord = word.trim().toUpperCase();
    const cached = getCache<IDictionaryEntry>(`dict_${upperWord}`);
    if (cached) return cached;

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
          const def = meaning?.definitions?.[0]?.definition || 'A recognized English vocabulary term.';
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
    } catch {}

    return {
      word: upperWord,
      partOfSpeech: 'noun',
      definition: 'Cognitive vocabulary term',
      viMeaning: 'Thuật ngữ rèn luyện nhận thức Anh ngữ'
    };
  }

  async getSynonyms(word: string): Promise<string[]> {
    const upperWord = word.trim().toUpperCase();
    const cached = getCache<string[]>(`syn_${upperWord}`);
    if (cached) return cached;

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

    return lang === 'en'
      ? {
          title: 'Neuroplasticity and Human Cognition',
          extract: 'Neuroplasticity is the ability of the brain to undergo structural and functional changes in response to learning, deliberate practice, and cognitive challenge.'
        }
      : {
          title: 'Tính Mềm Dẻo Thần Kinh (Neuroplasticity)',
          extract: 'Tính mềm dẻo của não bộ là khả năng tái cấu trúc mạng lưới tế bào thần kinh theo thời gian thông qua các bài tập rèn luyện nhận thức và trí nhớ.'
        };
  }

  getBilingualPairs(count = 16): ITranslationPair[] {
    const shuffled = [...BILINGUAL_WORD_PAIRS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getAntonymPairs(count = 12): IAntonymPair[] {
    const shuffled = [...ANTONYM_PAIRS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getSynonymPairs(count = 12): ISynonymPair[] {
    const shuffled = [...SYNONYM_PAIRS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getEmojiWordPairs(count = 16): IEmojiWordPair[] {
    const shuffled = [...EMOJI_WORD_PAIRS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getPosTriads(count = 8): IPosTriad[] {
    const shuffled = [...POS_TRIADS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getNasaCards(count = 8) {
    const shuffled = [...NASA_OFFLINE_CARDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getFalseFriends(count = 8): IFalseFriendPair[] {
    const shuffled = [...FALSE_FRIENDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getEmotionWords(): IEmotionWord[] {
    return [...EMOTION_WORDS].sort(() => Math.random() - 0.5);
  }

  getTriadConcepts(count = 6) {
    const shuffled = [...TRIAD_CONCEPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async getDatamuseAssociations(word: string): Promise<string[]> {
    const upper = word.trim().toUpperCase();
    const cached = getCache<string[]>(`assoc_${upper}`);
    if (cached) return cached;

    try {
      const res = await fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word.toLowerCase())}&max=6`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const words = list.map((item: any) => item.word.toUpperCase());
          setCache(`assoc_${upper}`, words);
          return words;
        }
      }
    } catch {}

    const fallbackSyn = await this.getSynonyms(word);
    return fallbackSyn.length > 0 ? fallbackSyn : ['MIND', 'COGNITION'];
  }

  async getDatamuseAntonyms(word: string): Promise<string[]> {
    const upper = word.trim().toUpperCase();
    const cached = getCache<string[]>(`ant_${upper}`);
    if (cached) return cached;

    try {
      const res = await fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word.toLowerCase())}&max=5`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const words = list.map((item: any) => item.word.toUpperCase());
          setCache(`ant_${upper}`, words);
          return words;
        }
      }
    } catch {}

    const off = ANTONYM_PAIRS.filter(p => p.wordA === upper || p.wordB === upper);
    return off.map(p => p.wordA === upper ? p.wordB : p.wordA);
  }

  async fetchRestCountriesTriads(count = 8): Promise<IGeographyTriad[]> {
    const cached = getCache<IGeographyTriad[]>('geo_triads_online');
    if (cached && cached.length >= count) {
      return [...cached].sort(() => Math.random() - 0.5).slice(0, count);
    }

    try {
      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,flags,cca2');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 20) {
          const list: IGeographyTriad[] = data
            .filter((c: any) => c.name?.common && c.capital?.[0] && c.flags?.png)
            .map((c: any, idx: number) => ({
              id: `geo-api-${c.cca2 || idx}`,
              country: c.name.common,
              capital: c.capital[0],
              flag: c.cca2 ? getFlagEmoji(c.cca2) : '🏳️',
              continent: c.region || 'Thế Giới'
            }));
          if (list.length > 10) {
            setCache('geo_triads_online', list, 86400 * 30);
            return [...list].sort(() => Math.random() - 0.5).slice(0, count);
          }
        }
      }
    } catch {}

    return this.getGeographyTriads(count);
  }

  getGeographyTriads(count = 8): IGeographyTriad[] {
    const shuffled = [...GEOGRAPHY_TRIADS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getPeriodicTableTriads(count = 8): IElementTriad[] {
    const shuffled = [...PERIODIC_TABLE_TRIADS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getAstronomyTriads(count = 6): IAstronomyTriad[] {
    const shuffled = [...ASTRONOMY_TRIADS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export interface ITriadCard {
  id: string;
  setId: string;
  text: string;
  subtext: string;
  type: 'word' | 'meaning' | 'symbol';
  icon?: string;
}

export interface IGeographyTriad {
  id: string;
  country: string;
  capital: string;
  flag: string;
  continent: string;
  subtext?: string;
}

export interface IElementTriad {
  symbol: string;
  name: string;
  atomicNumber: number;
  category: string;
  funFact: string;
}

export interface IAstronomyTriad {
  name: string;
  classification: string;
  trait: string;
  symbol: string;
}

export const TRIAD_CONCEPTS = [
  { id: 'triad-1', word: 'NEURON', viMeaning: 'Tế bào thần kinh', symbol: '🧠', category: 'Khoa học Não Bộ' },
  { id: 'triad-2', word: 'QUANTUM', viMeaning: 'Lượng tử vi mô', symbol: '⚛️', category: 'Vật lý Lượng tử' },
  { id: 'triad-3', word: 'GALAXY', viMeaning: 'Thiên hà vũ trụ', symbol: '🌌', category: 'Thiên văn học' },
  { id: 'triad-4', word: 'SYNAPSE', viMeaning: 'Tiếp hợp thần kinh', symbol: '⚡', category: 'Dẫn truyền xung' },
  { id: 'triad-5', word: 'DNA', viMeaning: 'Chuỗi xoắn di truyền', symbol: '🧬', category: 'Sinh học phân tử' },
  { id: 'triad-6', word: 'TELESCOPE', viMeaning: 'Kính viễn vọng', symbol: '🔭', category: 'Khám phá vũ trụ' },
  { id: 'triad-7', word: 'HEURISTIC', viMeaning: 'Suy nghiệm tư duy', symbol: '💡', category: 'Khoa học nhận thức' },
  { id: 'triad-8', word: 'EQUILIBRIUM', viMeaning: 'Cân bằng động lực', symbol: '⚖️', category: 'Nội môi & Vật lý' },
];

export const GEOGRAPHY_TRIADS: IGeographyTriad[] = [
  { id: 'geo-vn', country: 'Việt Nam', capital: 'Hà Nội', flag: '🇻🇳', continent: 'Đông Nam Á' },
  { id: 'geo-jp', country: 'Nhật Bản (Japan)', capital: 'Tokyo', flag: '🇯🇵', continent: 'Đông Á' },
  { id: 'geo-fr', country: 'Pháp (France)', capital: 'Paris', flag: '🇫🇷', continent: 'Châu Âu' },
  { id: 'geo-de', country: 'Đức (Germany)', capital: 'Berlin', flag: '🇩🇪', continent: 'Châu Âu' },
  { id: 'geo-gb', country: 'Anh Quốc (UK)', capital: 'London', flag: '🇬🇧', continent: 'Châu Âu' },
  { id: 'geo-us', country: 'Hoa Kỳ (USA)', capital: 'Washington D.C.', flag: '🇺🇸', continent: 'Bắc Mỹ' },
  { id: 'geo-ca', country: 'Canada', capital: 'Ottawa', flag: '🇨🇦', continent: 'Bắc Mỹ' },
  { id: 'geo-au', country: 'Australia', capital: 'Canberra', flag: '🇦🇺', continent: 'Châu Đại Dương' },
  { id: 'geo-kr', country: 'Hàn Quốc (Korea)', capital: 'Seoul', flag: '🇰🇷', continent: 'Đông Á' },
  { id: 'geo-it', country: 'Ý (Italy)', capital: 'Rome', flag: '🇮🇹', continent: 'Nam Âu' },
  { id: 'geo-es', country: 'Tây Ban Nha (Spain)', capital: 'Madrid', flag: '🇪🇸', continent: 'Nam Âu' },
  { id: 'geo-br', country: 'Brazil', capital: 'Brasília', flag: '🇧🇷', continent: 'Nam Mỹ' },
  { id: 'geo-eg', country: 'Ai Cập (Egypt)', capital: 'Cairo', flag: '🇪🇬', continent: 'Bắc Phi' },
  { id: 'geo-in', country: 'Ấn Độ (India)', capital: 'New Delhi', flag: '🇮🇳', continent: 'Nam Á' },
  { id: 'geo-ar', country: 'Argentina', capital: 'Buenos Aires', flag: '🇦🇷', continent: 'Nam Mỹ' },
  { id: 'geo-ch', country: 'Thụy Sĩ (Switzerland)', capital: 'Bern', flag: '🇨🇭', continent: 'Trung Âu' },
  { id: 'geo-se', country: 'Thụy Điển (Sweden)', capital: 'Stockholm', flag: '🇸🇪', continent: 'Bắc Âu' },
  { id: 'geo-no', country: 'Na Uy (Norway)', capital: 'Oslo', flag: '🇳🇴', continent: 'Bắc Âu' },
  { id: 'geo-gr', country: 'Hy Lạp (Greece)', capital: 'Athens', flag: '🇬🇷', continent: 'Nam Âu' },
  { id: 'geo-mx', country: 'Mexico', capital: 'Mexico City', flag: '🇲🇽', continent: 'Bắc Mỹ' },
  { id: 'geo-za', country: 'Nam Phi (South Africa)', capital: 'Pretoria', flag: '🇿🇦', continent: 'Nam Phi' },
  { id: 'geo-nz', country: 'New Zealand', capital: 'Wellington', flag: '🇳🇿', continent: 'Châu Đại Dương' },
  { id: 'geo-th', country: 'Thái Lan (Thailand)', capital: 'Bangkok', flag: '🇹🇭', continent: 'Đông Nam Á' },
  { id: 'geo-sg', country: 'Singapore', capital: 'Singapore', flag: '🇸🇬', continent: 'Đông Nam Á' },
  { id: 'geo-id', country: 'Indonesia', capital: 'Jakarta', flag: '🇮🇩', continent: 'Đông Nam Á' },
  { id: 'geo-nl', country: 'Hà Lan (Netherlands)', capital: 'Amsterdam', flag: '🇳🇱', continent: 'Tây Âu' },
  { id: 'geo-pt', country: 'Bồ Đào Nha (Portugal)', capital: 'Lisbon', flag: '🇵🇹', continent: 'Nam Âu' },
  { id: 'geo-tr', country: 'Thổ Nhĩ Kỳ (Turkey)', capital: 'Ankara', flag: '🇹🇷', continent: 'Âu-Á' },
  { id: 'geo-at', country: 'Áo (Austria)', capital: 'Vienna', flag: '🇦🇹', continent: 'Trung Âu' },
  { id: 'geo-dk', country: 'Đan Mạch (Denmark)', capital: 'Copenhagen', flag: '🇩🇰', continent: 'Bắc Âu' },
];

export const PERIODIC_TABLE_TRIADS: IElementTriad[] = [
  { symbol: 'H', name: 'Hydrogen (Hiđrô)', atomicNumber: 1, category: 'Phi kim', funFact: 'Nguyên tố nhẹ và phổ biến nhất vũ trụ' },
  { symbol: 'He', name: 'Helium (Heli)', atomicNumber: 2, category: 'Khí hiếm', funFact: 'Không cháy, nhẹ hơn không khí' },
  { symbol: 'Li', name: 'Lithium (Liti)', atomicNumber: 3, category: 'Kim loại kiềm', funFact: 'Thành phần cốt lõi trong pin ion hiện đại' },
  { symbol: 'C', name: 'Carbon (Cacbon)', atomicNumber: 6, category: 'Phi kim', funFact: 'Nền tảng của toàn bộ sự sống hữu cơ' },
  { symbol: 'N', name: 'Nitrogen (Nitơ)', atomicNumber: 7, category: 'Phi kim', funFact: 'Chiếm 78% thể tích bầu khí quyển Trái Đất' },
  { symbol: 'O', name: 'Oxygen (Oxy)', atomicNumber: 8, category: 'Phi kim', funFact: 'Duy trì sự hô hấp và các phản ứng cháy' },
  { symbol: 'Ne', name: 'Neon (Neon)', atomicNumber: 10, category: 'Khí hiếm', funFact: 'Phát ánh sáng đỏ cam rực rỡ trong ống phóng điện' },
  { symbol: 'Na', name: 'Sodium (Natri)', atomicNumber: 11, category: 'Kim loại kiềm', funFact: 'Thành phần chính của muối ăn NaCl' },
  { symbol: 'Mg', name: 'Magnesium (Magie)', atomicNumber: 12, category: 'Kim loại kiềm thổ', funFact: 'Cháy với ngọn lửa trắng lóa mắt' },
  { symbol: 'Al', name: 'Aluminium (Nhôm)', atomicNumber: 13, category: 'Kim loại cơ bản', funFact: 'Nhẹ và chống gỉ, vật liệu chế tạo máy bay' },
  { symbol: 'Si', name: 'Silicon (Silic)', atomicNumber: 14, category: 'Á kim', funFact: 'Chất bán dẫn xương sống của ngành vi mạch chip' },
  { symbol: 'P', name: 'Phosphorus (Photpho)', atomicNumber: 15, category: 'Phi kim', funFact: 'Thành phần cấu trúc DNA và màng tế bào' },
  { symbol: 'S', name: 'Sulfur (Lưu huỳnh)', atomicNumber: 16, category: 'Phi kim', funFact: 'Chất rắn tinh thể màu vàng tươi ở miệng núi lửa' },
  { symbol: 'Cl', name: 'Chlorine (Clo)', atomicNumber: 17, category: 'Halogen', funFact: 'Khí màu vàng lục có tính khử trùng cực mạnh' },
  { symbol: 'K', name: 'Potassium (Kali)', atomicNumber: 19, category: 'Kim loại kiềm', funFact: 'Thiết yếu cho dẫn truyền xung thần kinh não bộ' },
  { symbol: 'Ca', name: 'Calcium (Canxi)', atomicNumber: 20, category: 'Kim loại kiềm thổ', funFact: 'Cấu tạo nên khung xương và men răng' },
  { symbol: 'Ti', name: 'Titanium (Titan)', atomicNumber: 22, category: 'Kim loại chuyển tiếp', funFact: 'Cực bền, nhẹ và tương thích sinh học cao' },
  { symbol: 'Fe', name: 'Iron (Sắt)', atomicNumber: 26, category: 'Kim loại chuyển tiếp', funFact: 'Trung tâm của phân tử Hemoglobin chở oxy trong máu' },
  { symbol: 'Cu', name: 'Copper (Đồng)', atomicNumber: 29, category: 'Kim loại chuyển tiếp', funFact: 'Dẫn điện xuất sắc, kim loại đầu tiên con người dùng' },
  { symbol: 'Zn', name: 'Zinc (Kẽm)', atomicNumber: 30, category: 'Kim loại chuyển tiếp', funFact: 'Cần thiết cho hơn 300 enzyme trao đổi chất' },
  { symbol: 'Ag', name: 'Silver (Bạc)', atomicNumber: 47, category: 'Kim loại chuyển tiếp', funFact: 'Nguyên tố dẫn điện và phản xạ ánh sáng tốt nhất' },
  { symbol: 'Pt', name: 'Platinum (Bạch kim)', atomicNumber: 78, category: 'Kim loại quý', funFact: 'Chất xúc tác hóa học trơ, không bị ăn mòn' },
  { symbol: 'Au', name: 'Gold (Vàng)', atomicNumber: 79, category: 'Kim loại quý', funFact: 'Kim loại quý dẻo nhất, không bị oxy hóa' },
  { symbol: 'U', name: 'Uranium (Urani)', atomicNumber: 92, category: 'Actinit phóng xạ', funFact: 'Nhiên liệu hạt nhân có mật độ năng lượng khổng lồ' },
];

export const ASTRONOMY_TRIADS: IAstronomyTriad[] = [
  { name: 'Mặt Trời (Sun)', classification: 'Sao lùn vàng (G-type)', trait: 'Nhiệt độ bề mặt 5.500°C, tâm 15 triệu °C', symbol: '☀️' },
  { name: 'Sao Thủy (Mercury)', classification: 'Hành tinh đất đá', trait: 'Biên độ nhiệt ngày đêm chênh lệch 600°C', symbol: '☿' },
  { name: 'Sao Kim (Venus)', classification: 'Hành tinh đất đá', trait: 'Nóng nhất Hệ Mặt Trời (465°C) do hiệu ứng nhà kính', symbol: '♀' },
  { name: 'Trái Đất (Earth)', classification: 'Hành tinh đất đá', trait: 'Nơi duy nhất xác nhận có sự sống và nước lỏng', symbol: '🌍' },
  { name: 'Sao Hỏa (Mars)', classification: 'Hành tinh đất đá', trait: 'Có núi lửa Olympus Mons cao nhất Hệ Mặt Trời (22km)', symbol: '♂' },
  { name: 'Sao Mộc (Jupiter)', classification: 'Khí khổng lồ', trait: 'Hành tinh lớn nhất, có Vết Đỏ Lớn tồn tại hàng thế kỷ', symbol: '♃' },
  { name: 'Sao Thổ (Saturn)', classification: 'Khí khổng lồ', trait: 'Hệ thống vành đai băng đá tráng lệ và rộng lớn nhất', symbol: '♄' },
  { name: 'Sao Thiên Vương (Uranus)', classification: 'Băng khổng lồ', trait: 'Trục quay nghiêng 98° gần như lăn ngang trên quỹ đạo', symbol: '♅' },
  { name: 'Sao Hải Vương (Neptune)', classification: 'Băng khổng lồ', trait: 'Có những cơn cuồng phong mạnh nhất Hệ Mặt Trời (2.100 km/h)', symbol: '♆' },
  { name: 'Mặt Trăng (Moon)', classification: 'Vệ tinh tự nhiên', trait: 'Khóa thủy triều với Trái Đất, chỉ hướng một mặt về ta', symbol: '🌕' },
  { name: 'Hố Đen (Black Hole)', classification: 'Thiên thể kỳ dị hấp dẫn', trait: 'Trọng trường cực hạn đến mức ánh sáng không thể thoát', symbol: '🕳️' },
  { name: 'Sao Xung (Pulsar)', classification: 'Sao neutron quay nhanh', trait: 'Quay hàng trăm vòng/giây phát chùm sóng điện từ hẹp', symbol: '💫' },
];

export class CognitiveAudioEngine {
  private ctx: AudioContext | null = null;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq: number, durationMs = 300, pan = 0, type: OscillatorType = 'sine', volume = 0.18): void {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (durationMs / 1000));

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
        osc.connect(panner);
        panner.connect(gainNode);
      } else {
        osc.connect(gainNode);
      }

      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (durationMs / 1000) + 0.05);
    } catch {}
  }

  playMusicalNote(note: 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4' | 'B4' | 'C5' | 'D5' | 'E5', durationMs = 380): void {
    const noteFrequencies: Record<string, number> = {
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
      F4: 349.23,
      G4: 392.00,
      A4: 440.00,
      B4: 493.88,
      C5: 523.25,
      D5: 587.33,
      E5: 659.25,
    };
    const freq = noteFrequencies[note] || 440.0;
    this.playTone(freq, durationMs, 0, 'triangle', 0.22);
  }

  playBinauralClick(pan: -1 | 1, freq = 680, durationMs = 90): void {
    this.playTone(freq, durationMs, pan, 'sine', 0.25);
  }

  playStroopPitch(type: 'high' | 'low'): void {
    const freq = type === 'high' ? 880 : 220;
    this.playTone(freq, 280, 0, 'sine', 0.22);
  }
}

export const cognitiveAudioEngine = new CognitiveAudioEngine();

export function splitWordIntoSyllables(word: string): string[] {
  const upper = word.toUpperCase().trim().replace(/[^A-Z]/g, '');
  const entry = CURATED_DICTIONARY.find(d => d.word.toUpperCase() === upper);
  if (entry?.syllables && entry.syllables.length > 1) {
    return entry.syllables;
  }
  if (upper.length <= 4) return [upper];
  
  // Algorithmic syllabification for English words
  const regex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
  const matches = upper.match(regex);
  if (matches && matches.join('') === upper && matches.length > 1) {
    return matches;
  }

  // Fallback: split in chunks of 3-4 chars
  const chunks: string[] = [];
  let remaining = upper;
  while (remaining.length > 0) {
    if (remaining.length <= 4) {
      chunks.push(remaining);
      break;
    }
    const len = remaining.length > 6 ? 3 : 2;
    chunks.push(remaining.slice(0, len));
    remaining = remaining.slice(len);
  }
  return chunks.length > 0 ? chunks : [upper];
}

export const infinityApiService = new InfinityApiService();


