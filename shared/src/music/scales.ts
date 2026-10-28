import { NoteName, SOLFEGE_NAMES } from './pitch';

export type ScaleCategory = 
  | 'CHURCH_MODES' 
  | 'MINOR_MODES' 
  | 'PENTATONIC_BLUES' 
  | 'SYMMETRIC' 
  | 'VIETNAMESE' 
  | 'WORLD_EXOTIC';

export interface IScaleCore {
  id: string;
  name: string;             // Tonal / standard name
  nameVi: string;           // Tên tiếng Việt chuẩn
  mode: string;             // Chế độ / Tên quốc tế
  category: ScaleCategory;
  categoryVi: string;
  feel: string;             // Cảm xúc tóm tắt
  stepFormula: string;      // Công thức Cung - Nửa Cung (W-H)
  intervalFormula: string;  // Công thức Bậc quãng (Degrees: '1 - 2 - 3 - 4 - 5 - 6 - 7')
  intervals: string[];      // Array of interval codes from root: ['1P', '2M', ...]
  semitones: number[];      // Relative semitone offsets: [0, 2, 4, 5, 7, 9, 11]
  characterNoteVi: string;  // Nốt linh hồn / nốt đặc trưng
  characteristicIntervals: string[]; // Interval codes to highlight on piano (e.g. ['4A'], ['6M'], ['2m'], ['5d'])
  brightnessScore?: number; // -5 to +1 for church modes
  famousSongVi?: string;
  genreVi?: string;
  vocalFriendly: boolean;   // Thích hợp để luyện thanh & xướng âm
  difficultyTier: 1 | 2 | 3 | 4;
}

export const INTERVAL_TO_SEMITONES: Record<string, number> = {
  '1P': 0, '1d': 0,
  '2m': 1, '2M': 2, '2A': 3,
  '3m': 3, '3M': 4,
  '4d': 4, '4P': 5, '4A': 6,
  '5d': 6, '5P': 7, '5A': 8,
  '6m': 8, '6M': 9, '6A': 10,
  '7m': 10, '7M': 11, '7d': 9,
  '8P': 12
};

export const INTERVAL_TO_DEGREE_NAME: Record<string, string> = {
  '1P': '1',
  '2m': 'b2', '2M': '2', '2A': '#2',
  '3m': 'b3', '3M': '3',
  '4d': 'b4', '4P': '4', '4A': '#4',
  '5d': 'b5', '5P': '5', '5A': '#5',
  '6m': 'b6', '6M': '6', '6A': '#6',
  '7d': 'bb7', '7m': 'b7', '7M': '7',
  '8P': '8'
};

export const ALL_SCALE_CORES: IScaleCore[] = [
  // ==========================================
  // NHÓM 1: 7 ĐIỆU THỨC TỰ NHIÊN (QUANG PHỔ SÁNG -> TỐI)
  // ==========================================
  {
    id: 'lydian',
    name: 'lydian',
    nameVi: 'Điệu Thức Lydian (Sáng Nhất)',
    mode: 'Lydian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Kỳ ảo, bay bổng, mở rộng không gian, thiếu trọng lực hút xuống',
    stepFormula: '1 - 1 - 1 - 1/2 - 1 - 1 - 1/2 (W-W-W-H-W-W-H)',
    intervalFormula: '1 - 2 - 3 - #4 - 5 - 6 - 7',
    intervals: ['1P', '2M', '3M', '4A', '5P', '6M', '7M'],
    semitones: [0, 2, 4, 6, 7, 9, 11],
    characterNoteVi: '#4 (Quãng 4 Tăng / Tritone so với chủ âm) — Đưa giai điệu bay bổng thoát ly trọng lực',
    characteristicIntervals: ['4A'],
    brightnessScore: 1,
    famousSongVi: 'The Simpsons Theme, E.T. Flying Theme (John Williams)',
    genreVi: 'Nhạc Phim Viễn Tưởng, Dream Pop, Modern Jazz',
    vocalFriendly: true,
    difficultyTier: 2
  },
  {
    id: 'major',
    name: 'major',
    nameVi: 'Âm Giai Trưởng Tự Nhiên (Ionian / Mẫu Mực)',
    mode: 'Ionian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Tươi sáng, ổn định, khải hoàn, cân bằng hoàn hảo',
    stepFormula: '1 - 1 - 1/2 - 1 - 1 - 1 - 1/2 (W-W-H-W-W-W-H)',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    intervals: ['1P', '2M', '3M', '4P', '5P', '6M', '7M'],
    semitones: [0, 2, 4, 5, 7, 9, 11],
    characterNoteVi: '3 Trưởng & 7 Trưởng — Cốt lõi của điệu thức Trưởng truyền thống',
    characteristicIntervals: ['3M', '7M'],
    brightnessScore: 0,
    famousSongVi: 'Ode to Joy (Beethoven), Let It Be (Beatles)',
    genreVi: 'Pop, Cổ Điển, Thánh Ca, Nhạc Đồng Quê',
    vocalFriendly: true,
    difficultyTier: 1
  },
  {
    id: 'mixolydian',
    name: 'mixolydian',
    nameVi: 'Điệu Thức Mixolydian (Trưởng Bụi Bặm)',
    mode: 'Mixolydian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Phóng khoáng, bụi bặm, nổi loạn, Classic Rock & Bluesy',
    stepFormula: '1 - 1 - 1/2 - 1 - 1 - 1/2 - 1 (W-W-H-W-W-H-W)',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    intervals: ['1P', '2M', '3M', '4P', '5P', '6M', '7m'],
    semitones: [0, 2, 4, 5, 7, 9, 10],
    characterNoteVi: 'b7 (Bậc 7 Thứ trên nền Trưởng) — Xóa bỏ sức ép gò bó của bậc dẫn, tạo chất phong trần',
    characteristicIntervals: ['7m'],
    brightnessScore: -1,
    famousSongVi: 'Sweet Child O Mine (Guns N Roses), Royals (Lorde)',
    genreVi: 'Classic Rock, Blues-Rock, Funk',
    vocalFriendly: true,
    difficultyTier: 1
  },
  {
    id: 'dorian',
    name: 'dorian',
    nameVi: 'Điệu Thức Dorian (Thứ Sáng / Jazz & Funk)',
    mode: 'Dorian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Màu Thứ nhưng không bi lụy; ngầu, trí tuệ, le lói hy vọng',
    stepFormula: '1 - 1/2 - 1 - 1 - 1 - 1/2 - 1 (W-H-W-W-W-H-W)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    intervals: ['1P', '2M', '3m', '4P', '5P', '6M', '7m'],
    semitones: [0, 2, 3, 5, 7, 9, 10],
    characterNoteVi: '6 Trưởng (6M) — Nốt ánh sáng bừng lên xua tan vẻ u sầu bi lụy của điệu Thứ',
    characteristicIntervals: ['6M'],
    brightnessScore: -2,
    famousSongVi: 'Scarborough Fair, Get Lucky (Daft Punk), So What (Miles Davis)',
    genreVi: 'Jazz, Funk, Celtic, Dân Gian Châu Âu',
    vocalFriendly: true,
    difficultyTier: 1
  },
  {
    id: 'minor',
    name: 'minor',
    nameVi: 'Thứ Tự Nhiên (Aeolian / Hoài Niệm Sâu Lắng)',
    mode: 'Aeolian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Trầm buồn, tự sự, hoài niệm, mang tính kể chuyện sâu sắc',
    stepFormula: '1 - 1/2 - 1 - 1 - 1/2 - 1 - 1 (W-H-W-W-H-W-W)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    intervals: ['1P', '2M', '3m', '4P', '5P', '6m', '7m'],
    semitones: [0, 2, 3, 5, 7, 8, 10],
    characterNoteVi: 'b6 (Quãng 6 Thứ) — Tạo chiều sâu thăm thẳm và vẻ u hoài nội tâm đặc trưng',
    characteristicIntervals: ['6m'],
    brightnessScore: -3,
    famousSongVi: 'Losing My Religion (R.E.M.), Hello (Adele)',
    genreVi: 'Ballad, Rock, Pop Trầm Buồn, Nhạc Cổ Điển',
    vocalFriendly: true,
    difficultyTier: 1
  },
  {
    id: 'phrygian',
    name: 'phrygian',
    nameVi: 'Điệu Thức Phrygian (Flamenco & Ma Mị)',
    mode: 'Phrygian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Huyền bí, căng thẳng, Flamenco Tây Ban Nha và Metal hiện đại',
    stepFormula: '1/2 - 1 - 1 - 1 - 1/2 - 1 - 1 (H-W-W-W-H-W-W)',
    intervalFormula: '1 - b2 - b3 - 4 - 5 - b6 - b7',
    intervals: ['1P', '2m', '3m', '4P', '5P', '6m', '7m'],
    semitones: [0, 1, 3, 5, 7, 8, 10],
    characterNoteVi: 'b2 (Bán âm sát ngay trên chủ âm) — Cọ xát nghẹt thở tạo kịch tính mãnh liệt',
    characteristicIntervals: ['2m'],
    brightnessScore: -4,
    famousSongVi: 'White Rabbit (Jefferson Airplane), Nhạc Flamenco',
    genreVi: 'Flamenco, Heavy Metal, Nhạc Ả Rập',
    vocalFriendly: true,
    difficultyTier: 2
  },
  {
    id: 'locrian',
    name: 'locrian',
    nameVi: 'Điệu Thức Locrian (Tối Nhất / Bất Ổn Định)',
    mode: 'Locrian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Bất ổn định cực độ, chông chênh, nghịch tai, kích thích cảnh giác cao độ',
    stepFormula: '1/2 - 1 - 1 - 1/2 - 1 - 1 - 1 (H-W-W-H-W-W-W)',
    intervalFormula: '1 - b2 - b3 - 4 - b5 - b6 - b7',
    intervals: ['1P', '2m', '3m', '4P', '5d', '6m', '7m'],
    semitones: [0, 1, 3, 5, 6, 8, 10],
    characterNoteVi: 'b5 & b2 — Mất quãng 5 Đúng ổn định, biến hợp âm chủ thành hợp âm Giảm',
    characteristicIntervals: ['5d', '2m'],
    brightnessScore: -5,
    famousSongVi: 'Sad But True (Metallica intro), Army of Me (Bjork)',
    genreVi: 'Heavy Metal, Nhạc Phim Giật Gân',
    vocalFriendly: false,
    difficultyTier: 4
  },

  // ==========================================
  // NHÓM 2: HỌ THỨ BIẾN THỂ & PHÁI SINH
  // ==========================================
  {
    id: 'harmonic minor',
    name: 'harmonic minor',
    nameVi: 'Thứ Hòa Âm (Harmonic Minor)',
    mode: 'Harmonic Minor',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Kịch tính, cổ điển châu Âu, lực hút mạnh từ bậc 7 về 1',
    stepFormula: '1 - 1/2 - 1 - 1 - 1/2 - 1.5 - 1/2 (W-H-W-W-H-1.5-H)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
    intervals: ['1P', '2M', '3m', '4P', '5P', '6m', '7M'],
    semitones: [0, 2, 3, 5, 7, 8, 11],
    characterNoteVi: '7 Trưởng (7M) kết hợp b6 — Tạo bước nhảy 1.5 cung huyền bí',
    characteristicIntervals: ['7M'],
    famousSongVi: 'Smooth (Santana), Hava Nagila, Bach Fugues',
    genreVi: 'Cổ Điển Châu Âu, Flamenco, Neo-Classical Metal',
    vocalFriendly: true,
    difficultyTier: 2
  },
  {
    id: 'phrygian dominant',
    name: 'phrygian dominant',
    nameVi: 'Phrygian Dominant (Spanish Gypsy / Bậc V Thứ Hòa Âm)',
    mode: 'Phrygian Dominant',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Âm hưởng Trung Đông, Ai Cập, Flamenco rực lửa',
    stepFormula: '1/2 - 1.5 - 1/2 - 1 - 1/2 - 1 - 1 (H-1.5-H-W-H-W-W)',
    intervalFormula: '1 - b2 - 3 - 4 - 5 - b6 - b7',
    intervals: ['1P', '2m', '3M', '4P', '5P', '6m', '7m'],
    semitones: [0, 1, 4, 5, 7, 8, 10],
    characterNoteVi: 'b2 kết hợp 3 Trưởng — Vừa có hợp âm chủ Trưởng vừa có quãng 2 tăng ma mị',
    characteristicIntervals: ['2m', '3M'],
    famousSongVi: 'Misirlou (Pulp Fiction theme)',
    genreVi: 'Flamenco, Trung Đông / Ai Cập',
    vocalFriendly: true,
    difficultyTier: 2
  },
  {
    id: 'melodic minor',
    name: 'melodic minor',
    nameVi: 'Thứ Giai Điệu (Melodic / Jazz Minor)',
    mode: 'Melodic Minor',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Giao thoa giữa Thứ và Trưởng; trinh thám, hiện đại, quý tộc',
    stepFormula: '1 - 1/2 - 1 - 1 - 1 - 1 - 1/2 (W-H-W-W-W-W-H)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - 6 - 7',
    intervals: ['1P', '2M', '3m', '4P', '5P', '6M', '7M'],
    semitones: [0, 2, 3, 5, 7, 9, 11],
    characterNoteVi: 'b3 ở nửa dưới nhưng 6 và 7 Trưởng ở nửa trên',
    characteristicIntervals: ['3m', '6M', '7M'],
    famousSongVi: 'Yesterday (Beatles), Autumn Leaves (Jazz Solo)',
    genreVi: 'Jazz Hiện Đại, Cổ Điển Phức Điệu, Fusion',
    vocalFriendly: true,
    difficultyTier: 2
  },
  {
    id: 'dorian b2',
    name: 'dorian b2',
    nameVi: 'Dorian b2 (Bậc II Thứ Giai Điệu)',
    mode: 'Dorian b2',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Màu sắc u tối của Phrygian nhưng đột ngột sáng bừng ở bậc 6',
    stepFormula: '1/2 - 1 - 1 - 1 - 1 - 1/2 - 1 (H-W-W-W-W-H-W)',
    intervalFormula: '1 - b2 - b3 - 4 - 5 - 6 - b7',
    intervals: ['1P', '2m', '3m', '4P', '5P', '6M', '7m'],
    semitones: [0, 1, 3, 5, 7, 9, 10],
    characterNoteVi: 'b2 kết hợp 6 Trưởng — Tương phản gay gắt giữa tối và sáng',
    characteristicIntervals: ['2m', '6M'],
    genreVi: 'Modern Jazz, Fusion, Neo-Soul',
    vocalFriendly: false,
    difficultyTier: 3
  },
  {
    id: 'lydian augmented',
    name: 'lydian augmented',
    nameVi: 'Lydian Augmented (Bậc III Thứ Giai Điệu)',
    mode: 'Lydian Augmented',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Lơ lửng ngoài vũ trụ, siêu thực, xóa nhòa điểm tựa trọng lực',
    stepFormula: '1 - 1 - 1 - 1 - 1/2 - 1 - 1/2 (W-W-W-W-H-W-H)',
    intervalFormula: '1 - 2 - 3 - #4 - #5 - 6 - 7',
    intervals: ['1P', '2M', '3M', '4A', '5A', '6M', '7M'],
    semitones: [0, 2, 4, 6, 8, 9, 11],
    characterNoteVi: '#4 và #5 (Quãng 5 Tăng) — Hợp âm chủ mang màu sắc Augmented',
    characteristicIntervals: ['4A', '5A'],
    genreVi: 'Post-Bop Jazz, Impressionism',
    vocalFriendly: false,
    difficultyTier: 4
  },
  {
    id: 'lydian dominant',
    name: 'lydian dominant',
    nameVi: 'Lydian Dominant (Overtone Scale / Bậc IV Thứ Giai Điệu)',
    mode: 'Lydian Dominant',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Trùng khớp chuỗi bồi âm tự nhiên; thông minh, dí dỏm, hiện đại',
    stepFormula: '1 - 1 - 1 - 1/2 - 1 - 1/2 - 1 (W-W-W-H-W-H-W)',
    intervalFormula: '1 - 2 - 3 - #4 - 5 - 6 - b7',
    intervals: ['1P', '2M', '3M', '4A', '5P', '6M', '7m'],
    semitones: [0, 2, 4, 6, 7, 9, 10],
    characterNoteVi: '#4 kết hợp b7 — Âm sắc cộng hưởng hoàn hảo với chuỗi bội âm tự nhiên',
    characteristicIntervals: ['4A', '7m'],
    genreVi: 'Modern Jazz, Nhạc Hoạt Hình',
    vocalFriendly: true,
    difficultyTier: 3
  },
  {
    id: 'mixolydian b6',
    name: 'mixolydian b6',
    nameVi: 'Mixolydian b6 (Hindu Scale / Bậc V Thứ Giai Điệu)',
    mode: 'Mixolydian b6',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Hùng tráng nhưng đượm buồn, sử thi điện ảnh Hollywood',
    stepFormula: '1 - 1 - 1/2 - 1 - 1/2 - 1 - 1 (W-W-H-W-H-W-W)',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - b6 - b7',
    intervals: ['1P', '2M', '3M', '4P', '5P', '6m', '7m'],
    semitones: [0, 2, 4, 5, 7, 8, 10],
    characterNoteVi: '3 Trưởng kết hợp b6 Thứ — Cú sốc chuyển màu giữa rực rỡ và bi tráng',
    characteristicIntervals: ['3M', '6m'],
    genreVi: 'Nhạc Phim Điện Ảnh, Epic Music',
    vocalFriendly: true,
    difficultyTier: 2
  },
  {
    id: 'altered',
    name: 'altered',
    nameVi: 'Altered Scale (Super Locrian / Bậc VII Thứ Giai Điệu)',
    mode: 'Altered',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Đỉnh cao sức căng hòa âm Jazz trước khi giải tỏa về hợp âm Chủ',
    stepFormula: '1/2 - 1 - 1/2 - 1 - 1 - 1 - 1 (H-W-H-W-W-W-W)',
    intervalFormula: '1 - b2 - #2 - 3 - b5 - #5 - b7',
    intervals: ['1P', '2m', '3m', '3M', '5d', '5A', '7m'],
    semitones: [0, 1, 3, 4, 6, 8, 10],
    characterNoteVi: 'Tất cả nốt biến âm (b9, #9, b5, #5) xoay quanh sườn 3 và b7',
    characteristicIntervals: ['2m', '5d', '5A'],
    genreVi: 'Bebop, Post-Bop, Modern Jazz',
    vocalFriendly: false,
    difficultyTier: 4
  },

  // ==========================================
  // NHÓM 3: HỆ NGŨ CUNG & BLUES
  // ==========================================
  {
    id: 'major pentatonic',
    name: 'major pentatonic',
    nameVi: 'Ngũ Cung Trưởng (Major Pentatonic)',
    mode: 'Major Pentatonic',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Dân gian, trong trẻo, êm đềm, thanh bình toàn cầu',
    stepFormula: '1 - 1 - 1.5 - 1 - 1.5 (W-W-1.5-W-1.5)',
    intervalFormula: '1 - 2 - 3 - 5 - 6',
    intervals: ['1P', '2M', '3M', '5P', '6M'],
    semitones: [0, 2, 4, 7, 9],
    characterNoteVi: 'Loại bỏ bậc 4 & 7 — Hoàn toàn không có bất kỳ khoảng cách nửa cung nào',
    characteristicIntervals: ['3M', '6M'],
    famousSongVi: 'Amazing Grace, Bèo Dạt Mây Trôi',
    genreVi: 'Dân Ca Á Đông, Country, Folk, Pop Ballad',
    vocalFriendly: true,
    difficultyTier: 1
  },
  {
    id: 'minor pentatonic',
    name: 'minor pentatonic',
    nameVi: 'Ngũ Cung Thứ (Minor Pentatonic)',
    mode: 'Minor Pentatonic',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Mạnh mẽ, gãy gọn, dễ ghi nhớ nhất trong trí nhớ ngắn hạn',
    stepFormula: '1.5 - 1 - 1 - 1.5 - 1 (1.5-W-W-1.5-W)',
    intervalFormula: '1 - b3 - 4 - 5 - b7',
    intervals: ['1P', '3m', '4P', '5P', '7m'],
    semitones: [0, 3, 5, 7, 10],
    characterNoteVi: 'Khung xương quyền lực: 1 - b3 - 4 - 5 - b7',
    characteristicIntervals: ['3m', '7m'],
    famousSongVi: 'Whole Lotta Love (Led Zeppelin), Back in Black (AC/DC)',
    genreVi: 'Hard Rock, Blues, Heavy Metal',
    vocalFriendly: true,
    difficultyTier: 1
  },
  {
    id: 'minor blues',
    name: 'minor blues',
    nameVi: 'Âm Giai Blues Thứ (Minor Blues)',
    mode: 'Minor Blues',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Hiệu ứng ma sát uốn lượn, khàn đặc, gai góc và giàu cảm xúc',
    stepFormula: '1.5 - 1 - 1/2 - 1/2 - 1.5 - 1 (1.5-W-H-H-1.5-W)',
    intervalFormula: '1 - b3 - 4 - b5 - 5 - b7',
    intervals: ['1P', '3m', '4P', '5d', '5P', '7m'],
    semitones: [0, 3, 5, 6, 7, 10],
    characterNoteVi: 'b5 (Blue Note) — Nốt ma sát nằm giữa 4 và 5 tạo tiếng nấc nghẹn ngào',
    characteristicIntervals: ['5d'],
    famousSongVi: 'The Thrill Is Gone (B.B. King)',
    genreVi: 'Chicago Blues, Delta Blues, Rock & Roll',
    vocalFriendly: true,
    difficultyTier: 2
  },
  {
    id: 'major blues',
    name: 'major blues',
    nameVi: 'Âm Giai Blues Trưởng (Major Blues)',
    mode: 'Major Blues',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Vui tươi, duyên dáng, Soul, Gospel, Country và R&B',
    stepFormula: '1 - 1/2 - 1/2 - 1.5 - 1 - 1.5 (W-H-H-1.5-W-1.5)',
    intervalFormula: '1 - 2 - b3 - 3 - 5 - 6',
    intervals: ['1P', '2M', '3m', '3M', '5P', '6M'],
    semitones: [0, 2, 3, 4, 7, 9],
    characterNoteVi: 'b3 -> 3 (Cú trượt bán âm từ 3 Thứ lên 3 Trưởng tạo nét cười hóm hỉnh)',
    characteristicIntervals: ['3m', '3M'],
    famousSongVi: 'Johnny B. Goode (Chuck Berry), Sir Duke (Stevie Wonder)',
    genreVi: 'Rock & Roll, Soul, Gospel, R&B',
    vocalFriendly: true,
    difficultyTier: 2
  },
  {
    id: 'bebop',
    name: 'bebop',
    nameVi: 'Bebop Dominant Scale',
    mode: 'Bebop Dominant',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Sang trọng, lả lướt, tốc độ cao, jazz swing thượng đỉnh',
    stepFormula: '1 - 1 - 1/2 - 1 - 1 - 1/2 - 1/2 - 1/2',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - 6 - b7 - 7',
    intervals: ['1P', '2M', '3M', '4P', '5P', '6M', '7m', '7M'],
    semitones: [0, 2, 4, 5, 7, 9, 10, 11],
    characterNoteVi: 'Thang 8 nốt — Nốt lướt bán âm 7 Trưởng nằm giữa b7 và 1',
    characteristicIntervals: ['7m', '7M'],
    genreVi: 'Bebop, Jazz Swing, Hard Bop',
    vocalFriendly: false,
    difficultyTier: 3
  },
  {
    id: 'bebop major',
    name: 'bebop major',
    nameVi: 'Bebop Major Scale',
    mode: 'Bebop Major',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Độ mượt đặc trưng của dàn kèn Big Band Jazz thập niên 1940–1950',
    stepFormula: '1 - 1 - 1/2 - 1 - 1/2 - 1/2 - 1 - 1/2',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - #5 - 6 - 7',
    intervals: ['1P', '2M', '3M', '4P', '5P', '5A', '6M', '7M'],
    semitones: [0, 2, 4, 5, 7, 8, 9, 11],
    characterNoteVi: 'Nốt lướt cromat #5 (b6) nằm giữa 5 và 6',
    characteristicIntervals: ['5A'],
    genreVi: 'Big Band, Swing, Broadway',
    vocalFriendly: false,
    difficultyTier: 3
  },
  {
    id: 'bebop minor',
    name: 'bebop minor',
    nameVi: 'Bebop Dorian (Minor Bebop)',
    mode: 'Bebop Dorian',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Xóa ranh giới cứng nhắc giữa Thứ và Trưởng trong solo Jazz tốc độ',
    stepFormula: '1 - 1/2 - 1/2 - 1/2 - 1 - 1 - 1/2 - 1',
    intervalFormula: '1 - 2 - b3 - 3 - 4 - 5 - 6 - b7',
    intervals: ['1P', '2M', '3m', '3M', '4P', '5P', '6M', '7m'],
    semitones: [0, 2, 3, 4, 5, 7, 9, 10],
    characterNoteVi: 'Nốt lướt 3 Trưởng (3M) nằm giữa b3 và 4',
    characteristicIntervals: ['3m', '3M'],
    genreVi: 'Modern Jazz, Hard Bop',
    vocalFriendly: false,
    difficultyTier: 3
  },

  // ==========================================
  // NHÓM 4: ÂM GIAI ĐỐI XỨNG
  // ==========================================
  {
    id: 'whole tone',
    name: 'whole tone',
    nameVi: 'Toàn Cung (Whole Tone / Triệt Tiêu Trọng Lực)',
    mode: 'Whole Tone',
    category: 'SYMMETRIC',
    categoryVi: 'Âm Giai Đối Xứng',
    feel: 'Lơ lửng, không trọng lực, ảo mộng, Debussy',
    stepFormula: '1 - 1 - 1 - 1 - 1 - 1 (6 nốt cách đều nhau đúng 1 cung)',
    intervalFormula: '1 - 2 - 3 - #4 - #5 - b7',
    intervals: ['1P', '2M', '3M', '4A', '5A', '7m'],
    semitones: [0, 2, 4, 6, 8, 10],
    characterNoteVi: 'Hoàn toàn không có nửa cung — Triệt tiêu hoàn toàn chủ âm cố định',
    characteristicIntervals: ['4A', '5A'],
    genreVi: 'Ấn Tượng, Jazz Hiện Đại',
    vocalFriendly: true,
    difficultyTier: 3
  },
  {
    id: 'half-whole diminished',
    name: 'half-whole diminished',
    nameVi: 'Giảm Nửa-Nguyên (Half-Whole Diminished)',
    mode: 'Half-Whole Diminished',
    category: 'SYMMETRIC',
    categoryVi: 'Âm Giai Đối Xứng',
    feel: 'Căng thẳng, đối xứng ma trận, điện ảnh trinh thám noir',
    stepFormula: '1/2 - 1 - 1/2 - 1 - 1/2 - 1 - 1/2 - 1 (8 nốt xen kẽ H-W)',
    intervalFormula: '1 - b2 - #2 - 3 - #4 - 5 - 6 - b7',
    intervals: ['1P', '2m', '3m', '3M', '4A', '5P', '6M', '7m'],
    semitones: [0, 1, 3, 4, 6, 7, 9, 10],
    characterNoteVi: 'Xen kẽ Nửa-Nguyên cung đối xứng',
    characteristicIntervals: ['2m', '4A'],
    genreVi: 'Jazz Nâng Cao, Phim Trinh Thám Noir',
    vocalFriendly: false,
    difficultyTier: 4
  },
  {
    id: 'whole-half diminished',
    name: 'whole-half diminished',
    nameVi: 'Giảm Nguyên-Nửa (Whole-Half Diminished)',
    mode: 'Whole-Half Diminished',
    category: 'SYMMETRIC',
    categoryVi: 'Âm Giai Đối Xứng',
    feel: 'Bí ẩn, hồi hộp như bước đi trong mê cung không lối thoát',
    stepFormula: '1 - 1/2 - 1 - 1/2 - 1 - 1/2 - 1 - 1/2 (8 nốt xen kẽ W-H)',
    intervalFormula: '1 - 2 - b3 - 4 - b5 - b6 - 6 - 7',
    intervals: ['1P', '2M', '3m', '4P', '5d', '6m', '6M', '7M'],
    semitones: [0, 2, 3, 5, 6, 8, 9, 11],
    characterNoteVi: 'Xen kẽ Nguyên-Nửa cung — Khung xương của hợp âm Giảm 7',
    characteristicIntervals: ['5d', '6m'],
    genreVi: 'Nhạc Phim Giật Gân / Kinh Dị, Cổ Điển Kịch Tính',
    vocalFriendly: false,
    difficultyTier: 4
  },
  {
    id: 'augmented',
    name: 'augmented',
    nameVi: 'Âm Giai Tăng (Augmented / Hexatonic)',
    mode: 'Augmented Hexatonic',
    category: 'SYMMETRIC',
    categoryVi: 'Âm Giai Đối Xứng',
    feel: 'Ảo giác thính giác toán học, cấu trúc đa tầng cân xứng',
    stepFormula: '1.5 - 1/2 - 1.5 - 1/2 - 1.5 - 1/2',
    intervalFormula: '1 - b3 - 3 - 5 - #5 - 7',
    intervals: ['1P', '3m', '3M', '5P', '5A', '7M'],
    semitones: [0, 3, 4, 7, 8, 11],
    characterNoteVi: 'Chia quãng 8 thành 3 phần bằng nhau',
    characteristicIntervals: ['3M', '5A'],
    genreVi: 'Cổ Điển Thế Kỷ 19–20, Modern Jazz Theory',
    vocalFriendly: false,
    difficultyTier: 4
  },

  // ==========================================
  // NHÓM 5: NGŨ CUNG VIỆT NAM
  // ==========================================
  {
    id: 'vietnamese-bac',
    name: 'vietnamese-bac',
    nameVi: 'Điệu Bắc (Hơi Bắc / Ngũ Cung Việt Nam)',
    mode: 'Điệu Bắc',
    category: 'VIETNAMESE',
    categoryVi: 'Ngũ Cung Việt Nam',
    feel: 'Trong sáng, rộn ràng, lễ hội, khỏe khoắn đậm đà bản sắc',
    stepFormula: '1 - 1.5 - 1 - 1 - 1.5 (Họ - Xự - Xang - Xê - Cống)',
    intervalFormula: '1 - 2 - 4 - 5 - 6',
    intervals: ['1P', '2M', '4P', '5P', '6M'],
    semitones: [0, 2, 5, 7, 9],
    characterNoteVi: 'Rung nhẹ ở chữ Xang (4) và Cống (6) — Mang khí sắc hồ hởi, tươi sáng',
    characteristicIntervals: ['4P', '6M'],
    famousSongVi: 'Lưu Thủy, Phú Lục, Lý Ngựa Ô',
    genreVi: 'Âm Nhạc Truyền Thống Việt Nam, Dân Ca Quan Họ',
    vocalFriendly: true,
    difficultyTier: 1
  },
  {
    id: 'vietnamese-nam',
    name: 'vietnamese-nam',
    nameVi: 'Điệu Nam (Hơi Xuân / Trữ Tình Man Mác)',
    mode: 'Điệu Nam (Hơi Xuân)',
    category: 'VIETNAMESE',
    categoryVi: 'Ngũ Cung Việt Nam',
    feel: 'Thanh thoát, lâng lâng, man mác, trữ tình sâu lắng',
    stepFormula: '1 - 1.5 - 1 - 1.5 - 1 (Họ - Xự - Xang - Xê - Phan)',
    intervalFormula: '1 - 2 - 4 - 5 - b7',
    intervals: ['1P', '2M', '4P', '5P', '7m'],
    semitones: [0, 2, 5, 7, 10],
    characterNoteVi: 'Nhấn luyến mềm mại ở chữ Xự (2) và Phan (b7) — Tạo nét buồn thanh tao',
    characteristicIntervals: ['2M', '7m'],
    famousSongVi: 'Nam Xuân, Bèo Dạt Mây Trôi',
    genreVi: 'Đờn Ca Tài Tử, Dân Ca Miền Trung & Nam Bộ',
    vocalFriendly: true,
    difficultyTier: 1
  },
  {
    id: 'vietnamese-oan',
    name: 'vietnamese-oan',
    nameVi: 'Điệu Oán (Hơi Oán / Ai Oán Khắc Khoải)',
    mode: 'Điệu Oán',
    category: 'VIETNAMESE',
    categoryVi: 'Ngũ Cung Việt Nam',
    feel: 'Ai oán, nghẹn ngào, khắc khoải đặc trưng của Vọng cổ Nam Bộ',
    stepFormula: '1.5 - 1.5 - 1/2 - 1.5 - 1 (Họ - Xự non - Xang già - Xê - Phan)',
    intervalFormula: '1 - b3 - #4 - 5 - b7',
    intervals: ['1P', '3m', '4A', '5P', '7m'],
    semitones: [0, 3, 6, 7, 10],
    characterNoteVi: 'Nhấn sâu chữ Xang già (#4) và Xự non (b3) — Nốt rung nấc nghẹn ngào',
    characteristicIntervals: ['3m', '4A'],
    famousSongVi: 'Dạ Cổ Hoài Lang (Cao Văn Lầu), Vọng Cổ Nam Bộ',
    genreVi: 'Đờn Ca Tài Tử, Cải Lương Nam Bộ',
    vocalFriendly: true,
    difficultyTier: 2
  },

  // ==========================================
  // NHÓM 6: ÂM GIAI THẾ GIỚI & KỲ ẢO
  // ==========================================
  {
    id: 'double harmonic major',
    name: 'double harmonic major',
    nameVi: 'Double Harmonic Major (Byzantine / Ả Rập)',
    mode: 'Byzantine Major',
    category: 'WORLD_EXOTIC',
    categoryVi: 'Màu Sắc Thế Giới',
    feel: 'Ả Rập, Trung Đông bí ẩn, kịch tính, Misirlou',
    stepFormula: '1/2 - 1.5 - 1/2 - 1 - 1/2 - 1.5 - 1/2 (H-1.5-H-W-H-1.5-H)',
    intervalFormula: '1 - b2 - 3 - 4 - 5 - b6 - 7',
    intervals: ['1P', '2m', '3M', '4P', '5P', '6m', '7M'],
    semitones: [0, 1, 4, 5, 7, 8, 11],
    characterNoteVi: 'Chứa tới 2 quãng 2 Tăng (1.5 cung) ở cả hạ tứ âm và thượng tứ âm',
    characteristicIntervals: ['2m', '3M', '6m', '7M'],
    famousSongVi: 'Misirlou, Nhạc truyền thống Ả Rập',
    genreVi: 'World Music, Trung Đông',
    vocalFriendly: true,
    difficultyTier: 3
  },
  {
    id: 'hungarian minor',
    name: 'hungarian minor',
    nameVi: 'Hungarian Minor (Gypsy Minor / Digan Đông Âu)',
    mode: 'Hungarian Minor',
    category: 'WORLD_EXOTIC',
    categoryVi: 'Màu Sắc Thế Giới',
    feel: 'Đông Âu, Digan du mục, kịch tính lãng mạn cao trào',
    stepFormula: '1 - 1/2 - 1.5 - 1/2 - 1/2 - 1.5 - 1/2',
    intervalFormula: '1 - 2 - b3 - #4 - 5 - b6 - 7',
    intervals: ['1P', '2M', '3m', '4A', '5P', '6m', '7M'],
    semitones: [0, 2, 3, 6, 7, 8, 11],
    characterNoteVi: 'Kết hợp bậc #4 của Lydian với bậc b6 và 7 Trưởng của Thứ Hòa Âm',
    characteristicIntervals: ['4A', '7M'],
    famousSongVi: 'Hungarian Dance No. 5 (Brahms)',
    genreVi: 'Cổ Điển Lãng Mạn, Dân Gian Digan',
    vocalFriendly: true,
    difficultyTier: 3
  },
  {
    id: 'hirajoshi',
    name: 'hirajoshi',
    nameVi: 'Hirajoshi & In-Sen (Ngũ Cung Nhật Bản Zen)',
    mode: 'Hirajoshi',
    category: 'WORLD_EXOTIC',
    categoryVi: 'Màu Sắc Thế Giới',
    feel: 'Trầm mặc, thanh tao, u tịch, kiếm đạo Samurai và vườn thiền Zen',
    stepFormula: '1 - 1/2 - 2 - 1/2 - 2 (W-H-2-H-2)',
    intervalFormula: '1 - 2 - b3 - 5 - b6',
    intervals: ['1P', '2M', '3m', '5P', '6m'],
    semitones: [0, 2, 3, 7, 8],
    characterNoteVi: 'Ngũ cung bán âm — Bước nhảy quãng 3 xen kẽ bán âm hẹp',
    characteristicIntervals: ['3m', '6m'],
    famousSongVi: 'Nhạc đàn tranh Koto, Shakuhachi Zen',
    genreVi: 'Nhạc Truyền Thống Nhật Bản',
    vocalFriendly: true,
    difficultyTier: 2
  }
];

export const SCALE_CATALOG: Record<string, IScaleCore> = ALL_SCALE_CORES.reduce((acc, scale) => {
  acc[scale.id] = scale;
  const dashed = scale.id.replace(/\s+/g, '-');
  if (dashed !== scale.id) {
    acc[dashed] = scale;
  }
  return acc;
}, {} as Record<string, IScaleCore>);

// Convenient common aliases
if (SCALE_CATALOG['natural minor']) {
  SCALE_CATALOG['minor'] = SCALE_CATALOG['natural minor'];
}
if (SCALE_CATALOG['major pentatonic']) {
  SCALE_CATALOG['pentatonic-major'] = SCALE_CATALOG['major pentatonic'];
}
if (SCALE_CATALOG['minor pentatonic']) {
  SCALE_CATALOG['pentatonic-minor'] = SCALE_CATALOG['minor pentatonic'];
}
if (SCALE_CATALOG['minor blues']) {
  SCALE_CATALOG['blues'] = SCALE_CATALOG['minor blues'];
}

/**
 * Curated list of scales strongly recommended for singing practice and vocal warmups.
 */
export const VOCAL_RECOMMENDED_SCALE_IDS = [
  'major',
  'minor',
  'major pentatonic',
  'minor pentatonic',
  'minor blues',
  'major blues',
  'harmonic minor',
  'melodic minor',
  'dorian',
  'mixolydian',
  'lydian',
  'vietnamese-bac',
  'vietnamese-nam',
  'vietnamese-oan'
];
