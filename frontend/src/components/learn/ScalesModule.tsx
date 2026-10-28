import React, { useState, useMemo } from 'react';
import { Note, Chord } from 'tonal';
import { auditoryEngine } from '../../services/auditoryEngine';
import { useAppStore } from '../../store/useAppStore';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { 
  Play, 
  Volume2, 
  Music, 
  Sparkles, 
  Layers, 
  Sun, 
  Moon, 
  Compass, 
  Zap, 
  BookOpen, 
  CheckCircle2, 
  Disc3,
  Sliders,
  Info,
  ArrowRight,
  Brain,
  Trophy,
  XCircle,
  GitCompare,
  Radio,
  Workflow,
  HelpCircle,
  Grid
} from 'lucide-react';

import { ScaleCategory } from '@brain-exercises/shared';
export type { ScaleCategory };

export interface IScaleDefinition {
  id: string;
  name: string;             // Tonal / standard name
  nameVi: string;           // Tên tiếng Việt chuẩn
  mode: string;             // Chế độ / Tên quốc tế
  category: ScaleCategory;
  categoryVi: string;
  feel: string;             // Cảm xúc tóm tắt
  stepFormula: string;      // Công thức Cung - Nửa Cung (W-H)
  intervalFormula: string;  // Công thức Bậc quãng (Degrees: '1 - 2 - 3 - 4 - 5 - 6 - 7')
  intervals: string[];      // Array of intervals from root: ['1P', '2M', ...]
  characterNoteVi: string;  // Nốt linh hồn / nốt đặc trưng
  characteristicIntervals: string[]; // Interval codes to highlight on piano (e.g. ['4A'], ['6M'], ['2m'], ['5d'])
  brightnessScore?: number; // -5 to +1 for church modes
  famousSongVi: string;     // Bản nhạc ví dụ kinh điển
  genreVi: string;          // Thể loại âm nhạc tiêu biểu
  descriptionVi: string;    // Lý giải chuyên sâu chi tiết
  tetrachords: {
    lower: string;          // e.g. 'Major (1 - 2 - 3 - 4)'
    upper: string;          // e.g. 'Minor (5 - 6 - b7 - 8)'
  };
  modalVamp: {
    label: string;          // 'im7 <-> IV7 (Cm7 <-> F7)'
    chord1Intervals: string[];
    chord2Intervals: string[];
    bassIntervals: [string, string];
  };
}

export const COMPREHENSIVE_SCALES: IScaleDefinition[] = [
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
    characterNoteVi: '#4 (Quãng 4 Tăng / Tritone so với chủ âm) — Đưa giai điệu bay bổng thoát ly trọng lực',
    characteristicIntervals: ['4A'],
    brightnessScore: 1,
    famousSongVi: 'The Simpsons Theme, E.T. Flying Theme (John Williams), Flying in a Blue Dream (Joe Satriani)',
    genreVi: 'Nhạc Phim Viễn Tưởng, Dream Pop, Modern Jazz, Progressive Rock',
    descriptionVi: 'Điệu thức sáng nhất và rực rỡ nhất trong 7 điệu thức tự nhiên. Bậc 4 được nâng lên nửa cung (#4) tạo quãng Tritone với chủ âm, giải phóng giai điệu khỏi sức hút rơi xuống của bậc 4 truyền thống.',
    tetrachords: {
      lower: 'Lydian Tetrachord (1 - 2 - 3 - #4)',
      upper: 'Major Tetrachord (5 - 6 - 7 - 8)'
    },
    modalVamp: {
      label: 'Imaj7 <-> II/I (VD: Cmaj7 <-> D/C)',
      chord1Intervals: ['1P', '3M', '5P', '7M'],
      chord2Intervals: ['2M', '4A', '6M'],
      bassIntervals: ['1P', '1P']
    }
  },
  {
    id: 'major',
    name: 'major',
    nameVi: 'Trưởng Tự Nhiên (Ionian / Chuẩn Cân Bằng)',
    mode: 'Ionian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Trong sáng, hoàn mỹ, cân bằng, ổn định tuyệt đối',
    stepFormula: '1 - 1 - 1/2 - 1 - 1 - 1 - 1/2 (W-W-H-W-W-W-H)',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    intervals: ['1P', '2M', '3M', '4P', '5P', '6M', '7M'],
    characterNoteVi: '4 & 7 (Cặp nốt bán âm dẫn hướng hút mạnh về bậc 3 và bậc chủ âm 1)',
    characteristicIntervals: ['4P', '7M'],
    brightnessScore: 0,
    famousSongVi: 'Ode to Joy (Beethoven), Let It Be (Beatles), Happy Birthday',
    genreVi: 'Pop, Cổ Điển, Nhạc Thiếu Nhi, Thánh Ca',
    descriptionVi: 'Điệu thức nền tảng mốc chuẩn của hệ thống âm nhạc phương Tây. Tạo cảm giác cân bằng, tươi vui, viên mãn và ổn định vững vàng nhất nhờ hai lực hút bán âm 4->3 và 7->1.',
    tetrachords: {
      lower: 'Major Tetrachord (1 - 2 - 3 - 4)',
      upper: 'Major Tetrachord (5 - 6 - 7 - 8)'
    },
    modalVamp: {
      label: 'I <-> IV <-> V7 (VD: C <-> F <-> G7)',
      chord1Intervals: ['1P', '3M', '5P', '7M'],
      chord2Intervals: ['4P', '6M', '1P'],
      bassIntervals: ['1P', '4P']
    }
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
    characterNoteVi: 'b7 (Bậc 7 Thứ trên nền Trưởng) — Xóa bỏ sức ép gò bó của bậc dẫn, tạo chất phong trần',
    characteristicIntervals: ['7m'],
    brightnessScore: -1,
    famousSongVi: 'Sweet Child O Mine (Guns N Roses), Royals (Lorde), Clocks (Coldplay)',
    genreVi: 'Classic Rock, Blues-Rock, Funk, Country, Bluegrass',
    descriptionVi: 'Là âm giai Trưởng nhưng bậc 7 bị giáng xuống nửa cung (b7). Sự vắng mặt của nốt cảm âm gắt gao giúp giai điệu tự do, ngang tàng và giàu chất groove.',
    tetrachords: {
      lower: 'Major Tetrachord (1 - 2 - 3 - 4)',
      upper: 'Minor Tetrachord (5 - 6 - b7 - 8)'
    },
    modalVamp: {
      label: 'I7 <-> bVII <-> IV (VD: C7 <-> Bb <-> F)',
      chord1Intervals: ['1P', '3M', '5P', '7m'],
      chord2Intervals: ['7m', '2M', '4P'],
      bassIntervals: ['1P', '7m']
    }
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
    characterNoteVi: '6 Trưởng (6M) — Nốt ánh sáng bừng lên xua tan vẻ u sầu bi lụy của điệu Thứ',
    characteristicIntervals: ['6M'],
    brightnessScore: -2,
    famousSongVi: 'Scarborough Fair, Oye Como Va (Santana), Get Lucky (Daft Punk), So What (Miles Davis)',
    genreVi: 'Jazz, Funk, Celtic, Dân Gian Châu Âu, Neo-Soul',
    descriptionVi: 'Một điệu Thứ nhưng có bậc 6 Trưởng (6M). Nhờ đó, điệu thức mang phong thái lãng tử, cổ kính, u buồn nhưng tràn đầy hy vọng và cực kỳ bắt tai khi chơi các hợp âm 7 mở rộng.',
    tetrachords: {
      lower: 'Minor Tetrachord (1 - 2 - b3 - 4)',
      upper: 'Minor Tetrachord (5 - 6 - b7 - 8)'
    },
    modalVamp: {
      label: 'im7 <-> IV7 (VD: Cm7 <-> F7)',
      chord1Intervals: ['1P', '3m', '5P', '7m'],
      chord2Intervals: ['4P', '6M', '1P', '3m'],
      bassIntervals: ['1P', '4P']
    }
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
    characterNoteVi: 'b6 (Quãng 6 Thứ) — Tạo chiều sâu thăm thẳm và vẻ u hoài nội tâm đặc trưng',
    characteristicIntervals: ['6m'],
    brightnessScore: -3,
    famousSongVi: 'Losing My Religion (R.E.M.), Hello (Adele), Stairway to Heaven (Led Zeppelin)',
    genreVi: 'Ballad, Rock, Pop Trầm Buồn, Nhạc Cổ Điển',
    descriptionVi: 'Điệu Thứ tự nhiên song song với điệu Trưởng. Thể hiện nỗi buồn thuần khiết, sự hoài niệm sâu lắng và nỗi niềm nội tâm trắc ẩn không màu mè.',
    tetrachords: {
      lower: 'Minor Tetrachord (1 - 2 - b3 - 4)',
      upper: 'Phrygian Tetrachord (5 - b6 - b7 - 8)'
    },
    modalVamp: {
      label: 'im <-> bVI <-> bVII (VD: Cm <-> Ab <-> Bb)',
      chord1Intervals: ['1P', '3m', '5P', '7m'],
      chord2Intervals: ['6m', '1P', '3m'],
      bassIntervals: ['1P', '6m']
    }
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
    characterNoteVi: 'b2 (Bán âm sát ngay trên chủ âm) — Cọ xát nghẹt thở tạo kịch tính mãnh liệt',
    characteristicIntervals: ['2m'],
    brightnessScore: -4,
    famousSongVi: 'White Rabbit (Jefferson Airplane), Symphony of Destruction (Megadeth), Nhạc Flamenco',
    genreVi: 'Flamenco, Heavy Metal, Nhạc Ả Rập, Nhạc Phim Kinh Dị',
    descriptionVi: 'Bước nửa cung cọ xát ngay giữa nốt chủ âm và bậc 2 (b2) tạo ra áp lực kịch tính, hồi hộp, ma mị và mang đậm âm hưởng xứ sở đấu bò.',
    tetrachords: {
      lower: 'Phrygian Tetrachord (1 - b2 - b3 - 4)',
      upper: 'Phrygian Tetrachord (5 - b6 - b7 - 8)'
    },
    modalVamp: {
      label: 'im <-> bII (VD: Cm <-> Db)',
      chord1Intervals: ['1P', '3m', '5P', '7m'],
      chord2Intervals: ['2m', '4P', '6m'],
      bassIntervals: ['1P', '2m']
    }
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
    characterNoteVi: 'b5 & b2 — Mất quãng 5 Đúng ổn định, biến hợp âm chủ thành hợp âm Giảm (Diminished)',
    characteristicIntervals: ['5d', '2m'],
    brightnessScore: -5,
    famousSongVi: 'Sad But True (Metallica intro), Army of Me (Bjork), YYZ intro (Rush)',
    genreVi: 'Heavy Metal, Doom Metal, Nhạc Phim Giật Gân / Kinh Dị',
    descriptionVi: 'Điệu thức tối tăm nhất và bất ổn nhất. Do không có quãng 5 Đúng nâng đỡ, âm thanh luôn ở trạng thái co rút, nghẹt thở và chênh vênh tuyệt đối.',
    tetrachords: {
      lower: 'Phrygian Tetrachord (1 - b2 - b3 - 4)',
      upper: 'Locrian Tetrachord (b5 - b6 - b7 - 8)'
    },
    modalVamp: {
      label: 'im7b5 <-> bIImaj7 (VD: Cm7b5 <-> Dbmaj7)',
      chord1Intervals: ['1P', '3m', '5d', '7m'],
      chord2Intervals: ['2m', '4P', '6m', '1P'],
      bassIntervals: ['1P', '2m']
    }
  },

  // ==========================================
  // NHÓM 2: HỌ THỨ BIẾN THỂ & ĐIỆU THỨC PHÁI SINH (8 ÂM GIAI)
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
    characterNoteVi: '7 Trưởng (7M) kết hợp b6 — Tạo bước nhảy 1.5 cung (3 bán âm) huyền bí',
    characteristicIntervals: ['7M'],
    famousSongVi: 'Smooth (Santana), Hava Nagila, Yngwie Malmsteen Solos, Bach Fugues',
    genreVi: 'Cổ Điển Châu Âu, Flamenco, Neo-Classical Metal',
    descriptionVi: 'Nâng bậc 7 lên nửa cung để tạo nốt dẫn hút mãnh liệt về chủ âm. Khoảng cách 1.5 cung giữa bậc b6 và 7 tạo nên giai điệu huyền bí như truyện cổ tích xứ Ba Tư.',
    tetrachords: {
      lower: 'Minor Tetrachord (1 - 2 - b3 - 4)',
      upper: 'Harmonic Tetrachord (5 - b6 - 7 - 8)'
    },
    modalVamp: {
      label: 'im(maj7) <-> V7b9 (VD: Cm(maj7) <-> G7b9)',
      chord1Intervals: ['1P', '3m', '5P', '7M'],
      chord2Intervals: ['5P', '7M', '2M', '4P'],
      bassIntervals: ['1P', '5P']
    }
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
    characterNoteVi: 'b2 kết hợp 3 Trưởng — Vừa có hợp âm chủ Trưởng vừa có quãng 2 tăng ma mị',
    characteristicIntervals: ['2m', '3M'],
    famousSongVi: 'Misirlou (Pulp Fiction theme), Hava Nagila (trọng tâm V), Symphony X',
    genreVi: 'Flamenco, Trung Đông / Ai Cập, Progressive Metal',
    descriptionVi: 'Bậc V phái sinh từ Thứ Hòa Âm. Nốt bậc 3 Trưởng nằm ngay sau bước nửa cung b2 tạo nên nét rực lửa, kiêu hãnh và đậm đặc chất huyền thoại phương Đông.',
    tetrachords: {
      lower: 'Harmonic Major Tetrachord (1 - b2 - 3 - 4)',
      upper: 'Phrygian Tetrachord (5 - b6 - b7 - 8)'
    },
    modalVamp: {
      label: 'I7 <-> bII (VD: C7 <-> Db)',
      chord1Intervals: ['1P', '3M', '5P', '7m'],
      chord2Intervals: ['2m', '4P', '6m'],
      bassIntervals: ['1P', '2m']
    }
  },
  {
    id: 'melodic minor',
    name: 'melodic minor',
    nameVi: 'Thứ Giai Điệu (Melodic / Jazz Minor)',
    mode: 'Melodic Minor',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Giao thoa giữa Thứ và Trưởng; màu sắc trinh thám, hiện đại, quý tộc',
    stepFormula: '1 - 1/2 - 1 - 1 - 1 - 1 - 1/2 (W-H-W-W-W-W-H)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - 6 - 7',
    intervals: ['1P', '2M', '3m', '4P', '5P', '6M', '7M'],
    characterNoteVi: 'b3 ở nửa dưới nhưng 6 và 7 Trưởng ở nửa trên — Xóa bỏ bước nhảy 1.5 cung',
    characteristicIntervals: ['3m', '6M', '7M'],
    famousSongVi: 'Yesterday (Beatles), Autumn Leaves (Jazz Solo), Bach Cello Suites',
    genreVi: 'Jazz Hiện Đại, Cổ Điển Phức Điệu, Fusion',
    descriptionVi: 'Giải pháp tinh tế của Bach: nâng cả bậc 6 và 7 để giai điệu đi lên mượt mà không vấp. Nửa dưới mang màu Thứ, nửa trên mang vẻ rạng rỡ của Trưởng.',
    tetrachords: {
      lower: 'Minor Tetrachord (1 - 2 - b3 - 4)',
      upper: 'Major Tetrachord (5 - 6 - 7 - 8)'
    },
    modalVamp: {
      label: 'im(maj7) <-> im6 (VD: Cm(maj7) <-> Cm6)',
      chord1Intervals: ['1P', '3m', '5P', '7M'],
      chord2Intervals: ['1P', '3m', '5P', '6M'],
      bassIntervals: ['1P', '1P']
    }
  },
  {
    id: 'dorian b2',
    name: 'dorian b2',
    nameVi: 'Dorian b2 (Phrygian #6 / Bậc II Thứ Giai Điệu)',
    mode: 'Dorian b2',
    category: 'MINOR_MODES',
    categoryVi: 'Họ Thứ & Phái Sinh',
    feel: 'Màu sắc u tối của Phrygian nhưng đột ngột sáng bừng ở bậc 6',
    stepFormula: '1/2 - 1 - 1 - 1 - 1 - 1/2 - 1 (H-W-W-W-W-H-W)',
    intervalFormula: '1 - b2 - b3 - 4 - 5 - 6 - b7',
    intervals: ['1P', '2m', '3m', '4P', '5P', '6M', '7m'],
    characterNoteVi: 'b2 kết hợp 6 Trưởng — Tương phản gay gắt giữa tối và sáng',
    characteristicIntervals: ['2m', '6M'],
    famousSongVi: 'Footprints (Wayne Shorter), Jazz Modal Improvisations',
    genreVi: 'Modern Jazz, Fusion, Neo-Soul',
    descriptionVi: 'Bậc II của Thứ Giai Điệu. Được các nhạc sĩ Jazz hiện đại yêu thích nhờ khả năng đặt nốt 6 Trưởng sáng lạn lên trên hợp âm treo lơ lửng sus4(b9).',
    tetrachords: {
      lower: 'Phrygian Tetrachord (1 - b2 - b3 - 4)',
      upper: 'Minor Tetrachord (5 - 6 - b7 - 8)'
    },
    modalVamp: {
      label: 'Isus4(b9) <-> im7 (VD: Csus4(b9) <-> Cm7)',
      chord1Intervals: ['1P', '2m', '4P', '5P'],
      chord2Intervals: ['1P', '3m', '5P', '7m'],
      bassIntervals: ['1P', '1P']
    }
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
    characterNoteVi: '#4 và #5 (Quãng 5 Tăng) — Hợp âm chủ mang màu sắc Augmented mơ màng',
    characteristicIntervals: ['4A', '5A'],
    famousSongVi: 'Nardis (Bill Evans solo), Herbie Hancock compositions',
    genreVi: 'Post-Bop Jazz, Impressionism, Avant-Garde',
    descriptionVi: 'Bậc III của Thứ Giai Điệu. Cả bậc 4 và 5 đều thăng lên, tạo cảm giác vô trọng lực, đưa người nghe vào một không gian trừu tượng huyền ảo.',
    tetrachords: {
      lower: 'Lydian Tetrachord (1 - 2 - 3 - #4)',
      upper: 'Augmented Tetrachord (#5 - 6 - 7 - 8)'
    },
    modalVamp: {
      label: 'Imaj7(#5) (VD: Cmaj7(#5))',
      chord1Intervals: ['1P', '3M', '5A', '7M'],
      chord2Intervals: ['2M', '4A', '6M', '1P'],
      bassIntervals: ['1P', '2M']
    }
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
    characterNoteVi: '#4 kết hợp b7 — Âm sắc cộng hưởng hoàn hảo với chuỗi bội âm tự nhiên 4–11',
    characteristicIntervals: ['4A', '7m'],
    famousSongVi: 'The Simpsons Theme, Take the A Train intro, Béla Bartók String Quartets',
    genreVi: 'Modern Jazz, Nhạc Hoạt Hình, Cổ Điển Thế Kỷ 20',
    descriptionVi: 'Còn gọi là Âm giai Bội âm (Acoustic Scale). Nốt #4 kết hợp b7 trùng khít với các phân âm tự nhiên phát ra khi một sợi dây đàn rung lên trong vật lý âm học.',
    tetrachords: {
      lower: 'Lydian Tetrachord (1 - 2 - 3 - #4)',
      upper: 'Minor Tetrachord (5 - 6 - b7 - 8)'
    },
    modalVamp: {
      label: 'I7(#11) <-> bVII (VD: C7(#11) <-> Bb)',
      chord1Intervals: ['1P', '3M', '5P', '7m'],
      chord2Intervals: ['7m', '2M', '4A'],
      bassIntervals: ['1P', '7m']
    }
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
    characterNoteVi: '3 Trưởng kết hợp b6 Thứ — Cú sốc chuyển màu giữa rực rỡ và bi tráng',
    characteristicIntervals: ['3M', '6m'],
    famousSongVi: 'Star Wars Force Theme (John Williams), Hans Zimmer Gladiator',
    genreVi: 'Nhạc Phim Điện Ảnh (Film Score), Epic Music, Nhạc Ấn Độ',
    descriptionVi: 'Bậc V của Thứ Giai Điệu. Nửa dưới mang màu Trưởng hào sảng nhưng nửa trên lại rơi vào nỗi buồn u uất của b6, tạo nên âm hưởng sử thi tráng lệ.',
    tetrachords: {
      lower: 'Major Tetrachord (1 - 2 - 3 - 4)',
      upper: 'Phrygian Tetrachord (5 - b6 - b7 - 8)'
    },
    modalVamp: {
      label: 'I7 <-> ivm/I (VD: C7 <-> Fm/C)',
      chord1Intervals: ['1P', '3M', '5P', '7m'],
      chord2Intervals: ['4P', '6m', '1P'],
      bassIntervals: ['1P', '1P']
    }
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
    characterNoteVi: 'Tất cả nốt biến âm (b9, #9, b5, #5) xoay quanh sườn 3 và b7',
    characteristicIntervals: ['2m', '5d', '5A'],
    famousSongVi: 'All the Things You Are, Giant Steps substitutions, Charlie Parker solos',
    genreVi: 'Bebop, Post-Bop, Modern Jazz Harmony',
    descriptionVi: 'Bậc VII của Thứ Giai Điệu. Mọi nốt mở rộng đều bị biến âm tối đa (b9, #9, b5, #5) nhằm tạo ra sức căng nghẹt thở tột cùng trước khi hút về đích.',
    tetrachords: {
      lower: 'Altered Tetrachord (1 - b2 - #2 - 3)',
      upper: 'Locrian Tetrachord (b5 - #5 - b7 - 8)'
    },
    modalVamp: {
      label: 'I7alt -> ivm (VD: C7alt -> Fm)',
      chord1Intervals: ['1P', '3M', '7m', '2m'],
      chord2Intervals: ['4P', '6m', '1P'],
      bassIntervals: ['1P', '4P']
    }
  },

  // ==========================================
  // NHÓM 3: HỆ NGŨ CUNG, BLUES & BEBOP (7 ÂM GIAI)
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
    characterNoteVi: 'Loại bỏ bậc 4 & 7 — Hoàn toàn không có bất kỳ khoảng cách nửa cung nào',
    characteristicIntervals: ['3M', '6M'],
    famousSongVi: 'Amazing Grace, My Girl (Temptations), Bèo Dạt Mây Trôi',
    genreVi: 'Dân Ca Á Đông, Country, Folk, Pop Ballad',
    descriptionVi: 'Thang 5 âm không chứa bán âm. Mọi nốt khi vang lên cùng nhau đều thuận tai, không thể có nốt phô, gợi mở khung cảnh đồng quê thanh bình bát ngát.',
    tetrachords: {
      lower: 'Trichord (1 - 2 - 3)',
      upper: 'Trichord (5 - 6 - 8)'
    },
    modalVamp: {
      label: 'I <-> IV (VD: C <-> F)',
      chord1Intervals: ['1P', '3M', '5P'],
      chord2Intervals: ['4P', '6M', '1P'],
      bassIntervals: ['1P', '4P']
    }
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
    characterNoteVi: 'Khung xương quyền lực: 1 - b3 - 4 - 5 - b7',
    characteristicIntervals: ['3m', '7m'],
    famousSongVi: 'Whole Lotta Love (Led Zeppelin), Back in Black (AC/DC), Voodoo Child (Hendrix)',
    genreVi: 'Hard Rock, Blues, Heavy Metal, Funk Solo',
    descriptionVi: 'Khung xương của mọi bản solo guitar rock vĩ đại nhất lịch sử. Đơn giản, trực diện, gai góc và đầy uy lực khi solo trên nền nhạc sôi động.',
    tetrachords: {
      lower: 'Minor Pentatonic lower (1 - b3 - 4)',
      upper: 'Minor Pentatonic upper (5 - b7 - 8)'
    },
    modalVamp: {
      label: 'im7 <-> ivm7 (VD: Cm7 <-> Fm7)',
      chord1Intervals: ['1P', '3m', '5P', '7m'],
      chord2Intervals: ['4P', '6m', '1P', '3m'],
      bassIntervals: ['1P', '4P']
    }
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
    characterNoteVi: 'b5 (Blue Note) — Nốt ma sát nằm giữa 4 và 5 tạo tiếng nấc nghẹn ngào',
    characteristicIntervals: ['5d'],
    famousSongVi: 'The Thrill Is Gone (B.B. King), Sunshine of Your Love (Cream), Roadhouse Blues',
    genreVi: 'Chicago Blues, Delta Blues, Rock & Roll, Soul',
    descriptionVi: 'Bổ sung nốt Quãng 5 Giảm (b5) vào Ngũ Cung Thứ. Nốt b5 này tạo nên âm hưởng khàn đặc, ai oán và thổn thức đặc trưng không thể nhầm lẫn của âm nhạc da màu.',
    tetrachords: {
      lower: 'Blues lower (1 - b3 - 4 - b5)',
      upper: 'Blues upper (5 - b7 - 8)'
    },
    modalVamp: {
      label: 'I7 <-> IV7 (VD: C7 <-> F7)',
      chord1Intervals: ['1P', '3M', '5P', '7m'],
      chord2Intervals: ['4P', '6M', '1P', '3m'],
      bassIntervals: ['1P', '4P']
    }
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
    characterNoteVi: 'b3 -> 3 (Cú trượt bán âm từ 3 Thứ lên 3 Trưởng tạo nét cười hóm hỉnh)',
    characteristicIntervals: ['3m', '3M'],
    famousSongVi: 'Johnny B. Goode (Chuck Berry), Sweet Home Chicago, Sir Duke (Stevie Wonder)',
    genreVi: 'Rock & Roll, Soul, Gospel, R&B, Country Blues',
    descriptionVi: 'Ngũ cung Trưởng bổ sung nốt cromat b3. Khi lướt nhanh từ b3 lên 3 Trưởng, giai điệu bật lên nét duyên dáng, tươi cười và giàu sức sống.',
    tetrachords: {
      lower: 'Gospel Tetrachord (1 - 2 - b3 - 3)',
      upper: 'Major Trichord (5 - 6 - 8)'
    },
    modalVamp: {
      label: 'I <-> I6 (VD: C <-> C6)',
      chord1Intervals: ['1P', '3M', '5P'],
      chord2Intervals: ['1P', '3M', '6M'],
      bassIntervals: ['1P', '1P']
    }
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
    characterNoteVi: 'Thang 8 nốt — Nốt lướt bán âm 7 Trưởng nằm giữa b7 và 1',
    characteristicIntervals: ['7m', '7M'],
    famousSongVi: 'Donna Lee (Charlie Parker), Scrapple from the Apple, Nows the Time',
    genreVi: 'Bebop, Jazz Swing, Hard Bop',
    descriptionVi: 'Phát kiến thiên tài của Charlie Parker. Thêm nốt thứ 8 giúp các nốt của hợp âm luôn rơi đúng vào phách mạnh (1, 3, 5, 7) khi chạy chuỗi nốt tốc độ cao.',
    tetrachords: {
      lower: 'Major Tetrachord (1 - 2 - 3 - 4)',
      upper: 'Bebop Tetrachord (5 - 6 - b7 - 7 - 8)'
    },
    modalVamp: {
      label: 'I7 <-> ii7 (VD: C7 <-> Dm7)',
      chord1Intervals: ['1P', '3M', '5P', '7m'],
      chord2Intervals: ['2M', '4P', '6M', '1P'],
      bassIntervals: ['1P', '2M']
    }
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
    characterNoteVi: 'Nốt lướt cromat #5 (b6) nằm giữa 5 và 6',
    characteristicIntervals: ['5A'],
    famousSongVi: 'Take the A Train, In the Mood, Glenn Miller Big Band',
    genreVi: 'Big Band, Swing, Broadway',
    descriptionVi: 'Thêm một nốt bán âm chuyển tiếp giữa bậc 5 và 6 của thang âm Trưởng, đảm bảo câu chạy nốt móc đơn luôn đối xứng nhịp nhàng tuyệt đối.',
    tetrachords: {
      lower: 'Major Tetrachord (1 - 2 - 3 - 4)',
      upper: 'Bebop Major Tetrachord (5 - #5 - 6 - 7 - 8)'
    },
    modalVamp: {
      label: 'I6 <-> V7 (VD: C6 <-> G7)',
      chord1Intervals: ['1P', '3M', '5P', '6M'],
      chord2Intervals: ['5P', '7M', '2M', '4P'],
      bassIntervals: ['1P', '5P']
    }
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
    characterNoteVi: 'Nốt lướt 3 Trưởng (3M) nằm giữa b3 và 4',
    characteristicIntervals: ['3m', '3M'],
    famousSongVi: 'Impressions (John Coltrane), So What solos, Wes Montgomery',
    genreVi: 'Modern Jazz, Hard Bop, Fusion Guitar',
    descriptionVi: 'Cài thêm nốt 3 Trưởng vào giữa b3 và 4 của Dorian, giúp tay solo trượt mượt mà qua các ô nhịp mà không làm mất đi trọng âm hòa thanh cốt lõi.',
    tetrachords: {
      lower: 'Bebop Dorian Tetrachord (1 - 2 - b3 - 3 - 4)',
      upper: 'Minor Tetrachord (5 - 6 - b7 - 8)'
    },
    modalVamp: {
      label: 'im7 <-> IV7 (VD: Cm7 <-> F7)',
      chord1Intervals: ['1P', '3m', '5P', '7m'],
      chord2Intervals: ['4P', '6M', '1P', '3m'],
      bassIntervals: ['1P', '4P']
    }
  },

  // ==========================================
  // NHÓM 4: ÂM GIAI ĐỐI XỨNG (SYMMETRIC SCALES - 4 ÂM GIAI)
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
    characterNoteVi: 'Hoàn toàn không có nửa cung — Triệt tiêu hoàn toàn chủ âm cố định',
    characteristicIntervals: ['4A', '5A'],
    famousSongVi: 'Voiles (Claude Debussy), You Are the Sunshine of My Life intro',
    genreVi: 'Ấn Tượng (Impressionism), Jazz Hiện Đại, Nhạc Phim Ảo Mộng',
    descriptionVi: 'Âm giai không có tâm điểm hòa âm, tạo cảm giác bềnh bồng, lơ lửng, không trọng lực như đang lạc vào một giấc mơ siêu thực trong làn sương khói.',
    tetrachords: {
      lower: 'Whole Tone (1 - 2 - 3 - #4)',
      upper: 'Whole Tone (#4 - #5 - b7 - 8)'
    },
    modalVamp: {
      label: 'Caug <-> Daug',
      chord1Intervals: ['1P', '3M', '5A'],
      chord2Intervals: ['2M', '4A', '7m'],
      bassIntervals: ['1P', '2M']
    }
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
    characterNoteVi: 'Xen kẽ Nửa-Nguyên cung đối xứng — Chứa các hợp âm Dominant 7b9/#9',
    characteristicIntervals: ['2m', '4A'],
    famousSongVi: 'A Night in Tunisia, Giant Steps substitutions, The Rite of Spring (Stravinsky)',
    genreVi: 'Jazz Nâng Cao, Phim Trinh Thám Noir, Cổ Điển Hiện Đại',
    descriptionVi: 'Chỉ có đúng 3 thế bấm đối xứng trên đàn. Là vũ khí thượng thặng của các bậc thầy nhạc Jazz khi solo vượt qua các hợp âm biến dị át 7 (V7alt).',
    tetrachords: {
      lower: 'Diminished Tetrachord (1 - b2 - #2 - 3)',
      upper: 'Diminished Tetrachord (#4 - 5 - 6 - b7)'
    },
    modalVamp: {
      label: 'C7(b9,#9) <-> Eb7(b9)',
      chord1Intervals: ['1P', '3M', '7m', '2m'],
      chord2Intervals: ['3m', '5P', '2m'],
      bassIntervals: ['1P', '3m']
    }
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
    characterNoteVi: 'Xen kẽ Nguyên-Nửa cung — Khung xương của hợp âm Giảm 7 (dim7)',
    characteristicIntervals: ['5d', '6m'],
    famousSongVi: 'Đêm trên Núi Trọc (Mussorgsky), Psycho shower scene chords (Bernard Herrmann)',
    genreVi: 'Nhạc Phim Giật Gân / Kinh Dị, Cổ Điển Kịch Tính',
    descriptionVi: 'Dùng riêng cho hợp âm Giảm 7 (dim7). Âm thanh ma quái, xoắn vặn và căng thẳng cao độ, kích hoạt hệ thần kinh báo động cảnh giác.',
    tetrachords: {
      lower: 'Diminished Tetrachord (1 - 2 - b3 - 4)',
      upper: 'Diminished Tetrachord (b5 - b6 - 6 - 7)'
    },
    modalVamp: {
      label: 'Cdim7 <-> Ebdim7',
      chord1Intervals: ['1P', '3m', '5d', '6M'],
      chord2Intervals: ['3m', '5d', '6M', '1P'],
      bassIntervals: ['1P', '3m']
    }
  },
  {
    id: 'augmented',
    name: 'augmented',
    nameVi: 'Âm Giai Tăng (Augmented / Hexatonic)',
    mode: 'Augmented Hexatonic',
    category: 'SYMMETRIC',
    categoryVi: 'Âm Giai Đối Xứng',
    feel: 'Ảo giác thính giác toán học, cấu trúc đa tầng cân xứng',
    stepFormula: '1.5 - 1/2 - 1.5 - 1/2 - 1.5 - 1/2 (6 nốt xen kẽ 1.5 - 0.5)',
    intervalFormula: '1 - b3 - 3 - 5 - #5 - 7',
    intervals: ['1P', '3m', '3M', '5P', '5A', '7M'],
    characterNoteVi: 'Chia quãng 8 thành 3 phần bằng nhau — Ghép từ 2 hợp âm Tăng lệch nhau nửa cung',
    characteristicIntervals: ['3M', '5A'],
    famousSongVi: 'Liszt Faust Symphony, Coltrane Augmented Patterns',
    genreVi: 'Cổ Điển Thế Kỷ 19–20, Modern Jazz Theory',
    descriptionVi: 'Chia quãng 8 thành 3 trục đối xứng cân bằng (quãng 3 Trưởng). Cấu trúc toán học đặc biệt này tạo ra ảo giác thính giác đa chiều và tính bất biến khi chuyển giọng.',
    tetrachords: {
      lower: 'Hexatonic lower (1 - b3 - 3)',
      upper: 'Hexatonic upper (5 - #5 - 7)'
    },
    modalVamp: {
      label: 'Caug <-> Baug',
      chord1Intervals: ['1P', '3M', '5A'],
      chord2Intervals: ['7M', '3m', '5P'],
      bassIntervals: ['1P', '7M']
    }
  },

  // ==========================================
  // NHÓM 5: HỆ THỐNG ĐIỆU THỨC NGŨ CUNG VIỆT NAM (3 ÂM GIAI)
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
    characterNoteVi: 'Rung nhẹ ở chữ Xang (4) và Cống (6) — Mang khí sắc hồ hởi, tươi sáng',
    characteristicIntervals: ['4P', '6M'],
    famousSongVi: 'Lưu Thủy, Phú Lục, Lý Ngựa Ô, Dân ca Quan Họ Bắc Ninh',
    genreVi: 'Âm Nhạc Truyền Thống Việt Nam, Dân Ca Các Vùng Miền',
    descriptionVi: 'Là hệ thang âm ngũ cung tươi vui nhất của Việt Nam. Điệu Bắc mang phong thái đàng hoàng, ngay thẳng, trong sáng và rộn rã không khí ngày hội làng quê.',
    tetrachords: {
      lower: 'Họ - Xự - Xang (1 - 2 - 4)',
      upper: 'Xê - Cống - Liu (5 - 6 - 8)'
    },
    modalVamp: {
      label: 'C(add9) <-> F(add9)',
      chord1Intervals: ['1P', '2M', '5P'],
      chord2Intervals: ['4P', '6M', '1P'],
      bassIntervals: ['1P', '4P']
    }
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
    characterNoteVi: 'Nhấn luyến mềm mại ở chữ Xự (2) và Phan (b7) — Tạo nét buồn thanh tao',
    characteristicIntervals: ['2M', '7m'],
    famousSongVi: 'Nam Xuân, Bèo Dạt Mây Trôi, Dân ca Trữ Tình Nam Bộ',
    genreVi: 'Đờn Ca Tài Tử, Dân Ca Miền Trung & Nam Bộ',
    descriptionVi: 'Điệu Nam có tính chất trữ tình, man mác, u buồn nhưng không ai oán tuyệt vọng. Chữ Xang và chữ Phan tạo nên không gian thanh thoát, dạt dào cảm xúc bâng khuâng.',
    tetrachords: {
      lower: 'Họ - Xự - Xang (1 - 2 - 4)',
      upper: 'Xê - Phan - Liu (5 - b7 - 8)'
    },
    modalVamp: {
      label: 'Csus4 <-> Bb/C',
      chord1Intervals: ['1P', '4P', '5P'],
      chord2Intervals: ['7m', '2M', '4P'],
      bassIntervals: ['1P', '1P']
    }
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
    characterNoteVi: 'Nhấn sâu chữ Xang già (#4) và Xự non (b3) — Nốt rung nấc nghẹn ngào',
    characteristicIntervals: ['3m', '4A'],
    famousSongVi: 'Dạ Cổ Hoài Lang (Cao Văn Lầu), Vọng Cổ Nam Bộ, Văn Thiên Tường',
    genreVi: 'Đờn Ca Tài Tử, Cải Lương Nam Bộ',
    descriptionVi: 'Đỉnh cao của sự biểu đạt cảm xúc bi thương trong âm nhạc dân tộc. Bằng kỹ thuật nhấn ngón rung sâu trên nốt Xang và Xự, người nghệ sĩ tái hiện nỗi nghẹn ngào khắc khoải xé lòng.',
    tetrachords: {
      lower: 'Họ - Xự non - Xang già (1 - b3 - #4)',
      upper: 'Xê - Phan - Liu (5 - b7 - 8)'
    },
    modalVamp: {
      label: 'Cm(#11) <-> Gm/C',
      chord1Intervals: ['1P', '3m', '4A', '5P'],
      chord2Intervals: ['5P', '7m', '2M'],
      bassIntervals: ['1P', '1P']
    }
  },

  // ==========================================
  // NHÓM 6: ÂM GIAI THẾ GIỚI & KỲ ẢO (3 ÂM GIAI)
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
    characterNoteVi: 'Chứa tới 2 quãng 2 Tăng (1.5 cung) ở cả hạ tứ âm (b2->3) và thượng tứ âm (b6->7)',
    characteristicIntervals: ['2m', '3M', '6m', '7M'],
    famousSongVi: 'Misirlou (Pulp Fiction Theme / Dick Dale), Nhạc truyền thống Hy Lạp & Ả Rập',
    genreVi: 'Surf Rock, World Music, Trung Đông, Cổ Điển',
    descriptionVi: 'Âm giai đặc biệt có cấu trúc đối xứng hoàn mỹ với 2 bước nhảy 1.5 cung. Âm thanh mang đậm màu sắc sa mạc, kiêu hãnh và bí ẩn vô tận.',
    tetrachords: {
      lower: 'Double Harmonic lower (1 - b2 - 3 - 4)',
      upper: 'Double Harmonic upper (5 - b6 - 7 - 8)'
    },
    modalVamp: {
      label: 'C <-> Db (I <-> bII)',
      chord1Intervals: ['1P', '3M', '5P'],
      chord2Intervals: ['2m', '4P', '6m'],
      bassIntervals: ['1P', '2m']
    }
  },
  {
    id: 'hungarian minor',
    name: 'hungarian minor',
    nameVi: 'Hungarian Minor (Gypsy Minor / Digan Đông Âu)',
    mode: 'Hungarian Minor',
    category: 'WORLD_EXOTIC',
    categoryVi: 'Màu Sắc Thế Giới',
    feel: 'Đông Âu, Digan du mục, kịch tính lãng mạn cao trào',
    stepFormula: '1 - 1/2 - 1.5 - 1/2 - 1/2 - 1.5 - 1/2 (W-H-1.5-H-H-1.5-H)',
    intervalFormula: '1 - 2 - b3 - #4 - 5 - b6 - 7',
    intervals: ['1P', '2M', '3m', '4A', '5P', '6m', '7M'],
    characterNoteVi: 'Kết hợp bậc #4 của Lydian với bậc b6 và 7 Trưởng của Thứ Hòa Âm',
    characteristicIntervals: ['4A', '7M'],
    famousSongVi: 'Hungarian Dance No. 5 (Brahms), Hungarian Rhapsody (Liszt)',
    genreVi: 'Cổ Điển Lãng Mạn, Dân Gian Digan Đông Âu, Violin Virtuoso',
    descriptionVi: 'Là thang âm biểu tượng của các nghệ sĩ vĩ cầm du mục Digan. Hai quãng 2 Tăng tạo nên độ tương phản cảm xúc mãnh liệt giữa u uất bi thương và cao trào bùng nổ.',
    tetrachords: {
      lower: 'Hungarian lower (1 - 2 - b3 - #4)',
      upper: 'Harmonic upper (5 - b6 - 7 - 8)'
    },
    modalVamp: {
      label: 'Cm(#11) <-> G7b9',
      chord1Intervals: ['1P', '3m', '4A', '5P'],
      chord2Intervals: ['5P', '7M', '2M', '4P'],
      bassIntervals: ['1P', '5P']
    }
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
    characterNoteVi: 'Ngũ cung bán âm (Hemitonic) — Bước nhảy quãng 3 xen kẽ bán âm hẹp',
    characteristicIntervals: ['3m', '6m'],
    famousSongVi: 'Nhạc đàn tranh Koto truyền thống, Shakuhachi Zen, Tokyo Drift theme',
    genreVi: 'Truyền Thống Nhật Bản, Nhạc Thiền Zen, Phim Hoạt Hình Anime',
    descriptionVi: 'Thang âm cổ truyền của đàn Koto và sáo Shakuhachi Nhật Bản. Mang không khí trầm mặc, thanh tao, u tịch và sâu thẳm như vườn thiền Zen và tranh thủy mặc.',
    tetrachords: {
      lower: 'Koto lower (1 - 2 - b3)',
      upper: 'Koto upper (5 - b6 - 8)'
    },
    modalVamp: {
      label: 'Cm(b6) <-> Dm/C',
      chord1Intervals: ['1P', '3m', '5P', '6m'],
      chord2Intervals: ['2M', '4P', '6m'],
      bassIntervals: ['1P', '1P']
    }
  }
];

export const ROOT_NOTES_ALL = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ScalesModule: React.FC = () => {
  const { setSelectedExerciseSlug, setActiveTab, markTheoryModuleMastered, masteredTheoryModules } = useAppStore();
  
  const [selectedScaleId, setSelectedScaleId] = useState<string>('major');
  const [root, setRoot] = useState<string>('C');
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPlayingVamp, setIsPlayingVamp] = useState<boolean>(false);
  const [isComparingParallel, setIsComparingParallel] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(260);
  const [categoryFilter, setCategoryFilter] = useState<ScaleCategory | 'ALL'>('ALL');

  // Mini-Quiz State (2 Modes: Oddball & Mood Spotter)
  const [quizMode, setQuizMode] = useState<'oddball' | 'mood'>('oddball');
  const [quizStep, setQuizStep] = useState<number>(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [isPlayingQuizAudio, setIsPlayingQuizAudio] = useState<boolean>(false);

  const isMastered = masteredTheoryModules.includes('scales');

  const currentInfo = useMemo(() => {
    return COMPREHENSIVE_SCALES.find(s => s.id === selectedScaleId) || COMPREHENSIVE_SCALES[0];
  }, [selectedScaleId]);

  // Compute notes accurately using interval transposition from root
  const { scaleNotes, octaveTonic, fullRunSequence, arpeggioSequence, characteristicNotes } = useMemo(() => {
    const rawNotes = currentInfo.intervals.map(interval => {
      return Note.transpose(`${root}4`, interval);
    });

    const octTonic = Note.transpose(`${root}4`, '8P');
    const asc = [...rawNotes, octTonic];
    const desc = [...rawNotes].reverse();
    const fullRun = [...asc, ...desc];

    // Compute characteristic notes for glowing amber highlights
    const charNotes = currentInfo.characteristicIntervals.map(interval => {
      return Note.transpose(`${root}4`, interval);
    });

    // Compute arpeggio sequence
    const arp: string[] = [];
    if (rawNotes.length >= 7) {
      arp.push(rawNotes[0], rawNotes[2], rawNotes[4], rawNotes[6], octTonic, rawNotes[6], rawNotes[4], rawNotes[2], rawNotes[0]);
    } else if (rawNotes.length === 5) {
      arp.push(rawNotes[0], rawNotes[1], rawNotes[2], rawNotes[3], octTonic, rawNotes[3], rawNotes[2], rawNotes[1], rawNotes[0]);
    } else {
      arp.push(rawNotes[0], rawNotes[2] || rawNotes[1], rawNotes[4] || rawNotes[3], octTonic);
    }

    return {
      scaleNotes: rawNotes,
      octaveTonic: octTonic,
      fullRunSequence: fullRun,
      arpeggioSequence: arp,
      characteristicNotes: charNotes
    };
  }, [root, currentInfo]);

  // Diatonic Chords Harmonization (when scale has 7 notes)
  const diatonicChords = useMemo(() => {
    if (scaleNotes.length !== 7) return [];
    const degreeRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    return scaleNotes.map((rootNote, idx) => {
      const c1 = rootNote;
      const c3 = scaleNotes[(idx + 2) % 7];
      const c5 = scaleNotes[(idx + 4) % 7];
      const c7 = scaleNotes[(idx + 6) % 7];
      const notes = [c1, c3, c5, c7];
      const detected = Chord.detect(notes);
      const chordName = detected[0] || `${rootNote.replace(/\d/, '')}7`;
      return {
        degree: degreeRoman[idx],
        rootNote,
        chordName,
        notes
      };
    });
  }, [scaleNotes]);

  // Sequence playback helper with animated active keys
  const playSequence = async (sequence: string[], speedMs = playbackSpeedMs) => {
    if (isPlaying || isPlayingVamp || isComparingParallel) return;
    setIsPlaying(true);
    try {
      await auditoryEngine.resumeAudioContext();
      for (let i = 0; i < sequence.length; i++) {
        const note = sequence[i];
        setActiveNotes([note]);
        auditoryEngine.playNote(note, 0.45, { volume: 0.5, waveform: 'triangle' });
        await new Promise(r => setTimeout(r, speedMs));
      }
    } finally {
      setActiveNotes([]);
      setIsPlaying(false);
    }
  };

  const handlePlayScaleRun = () => {
    playSequence(fullRunSequence, playbackSpeedMs);
  };

  const handlePlayArpeggio = () => {
    playSequence(arpeggioSequence, Math.round(playbackSpeedMs * 1.15));
  };

  // Play tonic chord pad
  const handlePlayTonicChord = async () => {
    if (isPlaying || isPlayingVamp || isComparingParallel) return;
    setIsPlaying(true);
    try {
      await auditoryEngine.resumeAudioContext();
      const chordNotes = [scaleNotes[0], scaleNotes[2] || scaleNotes[1], scaleNotes[4] || scaleNotes[3]];
      if (scaleNotes.length >= 7 && scaleNotes[6]) chordNotes.push(scaleNotes[6]);

      chordNotes.forEach(n => {
        auditoryEngine.playNote(n, 1.6, { volume: 0.35, waveform: 'triangle' });
      });

      setActiveNotes(chordNotes);
      await new Promise(r => setTimeout(r, 1600));
    } finally {
      setActiveNotes([]);
      setIsPlaying(false);
    }
  };

  // Play Modal Vamp (Characteristic 2-chord loop with bass drone)
  const handlePlayModalVamp = async () => {
    if (isPlaying || isPlayingVamp || isComparingParallel) return;
    setIsPlayingVamp(true);
    try {
      await auditoryEngine.resumeAudioContext();
      const chord1Notes = currentInfo.modalVamp.chord1Intervals.map(i => Note.transpose(`${root}4`, i));
      const chord2Notes = currentInfo.modalVamp.chord2Intervals.map(i => Note.transpose(`${root}4`, i));
      const bass1 = Note.transpose(`${root}3`, currentInfo.modalVamp.bassIntervals[0]);
      const bass2 = Note.transpose(`${root}3`, currentInfo.modalVamp.bassIntervals[1]);

      for (let cycle = 0; cycle < 2; cycle++) {
        // Chord 1
        setActiveNotes([...chord1Notes, bass1]);
        auditoryEngine.playNote(bass1, 1.25, { volume: 0.65, waveform: 'sawtooth' });
        chord1Notes.forEach(n => auditoryEngine.playNote(n, 1.25, { volume: 0.3, waveform: 'triangle' }));
        await new Promise(r => setTimeout(r, 1250));

        // Chord 2
        setActiveNotes([...chord2Notes, bass2]);
        auditoryEngine.playNote(bass2, 1.25, { volume: 0.65, waveform: 'sawtooth' });
        chord2Notes.forEach(n => auditoryEngine.playNote(n, 1.25, { volume: 0.3, waveform: 'triangle' }));
        await new Promise(r => setTimeout(r, 1250));
      }

      // Resolution to Chord 1
      setActiveNotes([...chord1Notes, bass1]);
      auditoryEngine.playNote(bass1, 1.6, { volume: 0.7, waveform: 'sawtooth' });
      chord1Notes.forEach(n => auditoryEngine.playNote(n, 1.6, { volume: 0.35, waveform: 'triangle' }));
      await new Promise(r => setTimeout(r, 1600));
    } finally {
      setActiveNotes([]);
      setIsPlayingVamp(false);
    }
  };

  // Parallel Mode Comparison (Plays reference Major or Minor on same root, then plays current mode)
  const handleParallelCompare = async () => {
    if (isPlaying || isPlayingVamp || isComparingParallel) return;
    setIsComparingParallel(true);
    try {
      await auditoryEngine.resumeAudioContext();
      const isMinorFamily = currentInfo.intervals.includes('3m');
      const refId = isMinorFamily ? 'minor' : 'major';
      const refScale = COMPREHENSIVE_SCALES.find(s => s.id === refId) || COMPREHENSIVE_SCALES[0];
      const refNotes = refScale.intervals.map(i => Note.transpose(`${root}4`, i));
      const refOctTonic = Note.transpose(`${root}4`, '8P');
      const refSequence = [...refNotes, refOctTonic];

      // 1. Play Reference Scale
      for (const n of refSequence) {
        setActiveNotes([n]);
        auditoryEngine.playNote(n, 0.35, { volume: 0.45 });
        await new Promise(r => setTimeout(r, 220));
      }
      setActiveNotes([]);
      await new Promise(r => setTimeout(r, 600));

      // 2. Play Current Mode
      for (const n of fullRunSequence) {
        setActiveNotes([n]);
        auditoryEngine.playNote(n, 0.35, { volume: 0.5 });
        await new Promise(r => setTimeout(r, 220));
      }
    } finally {
      setActiveNotes([]);
      setIsComparingParallel(false);
    }
  };

  // Play single note
  const handlePlaySingleNote = (note: string) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.playNote(note, 0.55, { volume: 0.5 });
    setActiveNotes([note]);
    setTimeout(() => setActiveNotes([]), 500);
  };

  // Play Diatonic Chord
  const handlePlayDiatonicChord = (notes: string[]) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    notes.forEach(n => auditoryEngine.playNote(n, 1.2, { volume: 0.35, waveform: 'triangle' }));
    setActiveNotes(notes);
    setTimeout(() => setActiveNotes([]), 1200);
  };

  // Filter scales
  const filteredScales = useMemo(() => {
    if (categoryFilter === 'ALL') return COMPREHENSIVE_SCALES;
    return COMPREHENSIVE_SCALES.filter(s => s.category === categoryFilter);
  }, [categoryFilter]);

  // Quiz Questions Data (Oddball vs Mood Spotter)
  const ODDBALL_QUESTIONS = [
    {
      id: 1,
      title: 'Câu 1: Điệu C Trưởng (C Major: C - D - E - F - G - A - B)',
      contextNotes: ['C4', 'E4', 'G4', 'B4', 'C5'],
      intruderNote: 'F#4',
      options: [
        { id: 'opt-d', label: 'D4 (Rê - Bậc 2 chuẩn)', isCorrect: false },
        { id: 'opt-fsharp', label: 'F#4 (Fa thăng - Tritone ngoại điệu)', isCorrect: true },
        { id: 'opt-g', label: 'G4 (Sol - Bậc 5 chuẩn)', isCorrect: false },
        { id: 'opt-a', label: 'A4 (La - Bậc 6 chuẩn)', isCorrect: false }
      ],
      explanation: 'Chính xác! Trong C Major chỉ có F tự nhiên (4P). F#4 là nốt tăng nửa cung tạo thành Tritone ngoại điệu.'
    },
    {
      id: 2,
      title: 'Câu 2: Điệu D Dorian (D - E - F - G - A - B - C)',
      contextNotes: ['D4', 'F4', 'A4', 'B4', 'D5'],
      intruderNote: 'Bb4',
      options: [
        { id: 'opt-e', label: 'E4 (Mi - Bậc 2)', isCorrect: false },
        { id: 'opt-g', label: 'G4 (Sol - Bậc 4)', isCorrect: false },
        { id: 'opt-bflat', label: 'Bb4 (Si giáng - Khiến nó biến thành Thứ thường)', isCorrect: true },
        { id: 'opt-c', label: 'C5 (Đô - Bậc 7)', isCorrect: false }
      ],
      explanation: 'Chính xác! Điệu Dorian có Bậc 6 Trưởng (nốt B tự nhiên). Nốt Bb4 là Bậc 6 giáng của Thứ tự nhiên, phá vỡ điệu Dorian!'
    },
    {
      id: 3,
      title: 'Câu 3: Điệu F Lydian (F - G - A - B - C - D - E)',
      contextNotes: ['F4', 'A4', 'C5', 'E5'],
      intruderNote: 'B4',
      options: [
        { id: 'opt-b', label: 'B4 (Si tự nhiên - Nốt Bậc #4 linh hồn Lydian)', isCorrect: true },
        { id: 'opt-bb', label: 'Bb4 (Si giáng - Khiến nó thành Major thông thường)', isCorrect: false },
        { id: 'opt-g', label: 'G4 (Sol - Bậc 2)', isCorrect: false },
        { id: 'opt-d', label: 'D5 (Rê - Bậc 6)', isCorrect: false }
      ],
      explanation: 'Xuất sắc! F Major thông thường có nốt Bb. Lydian nâng bậc 4 lên thành B tự nhiên (#4 / Tritone) tạo nét bay bổng siêu thực.'
    }
  ];

  const MOOD_QUESTIONS = [
    {
      id: 1,
      title: 'Câu 1: Nhận Diện Khí Sắc Bay Bổng Siêu Thực',
      contextNotes: ['C4', 'E4', 'G4', 'F#4'],
      intruderNote: 'F#4',
      options: [
        { id: 'opt-lydian', label: 'Lydian Mode (Nốt #4 bay bổng, không trọng lực)', isCorrect: true },
        { id: 'opt-ionian', label: 'Ionian (Trưởng Chuẩn thông thường)', isCorrect: false },
        { id: 'opt-phrygian', label: 'Phrygian (Flamenco u tối)', isCorrect: false },
        { id: 'opt-locrian', label: 'Locrian (Nghịch tai bất ổn)', isCorrect: false }
      ],
      explanation: 'Chính xác! Bậc #4 (F# trên nền C) là dấu hiệu không thể nhầm lẫn của Lydian, đưa giai điệu bay lượn ngoài không gian.'
    },
    {
      id: 2,
      title: 'Câu 2: Nhận Diện Màu Thứ Sáng / Funk & Jazz',
      contextNotes: ['C4', 'Eb4', 'G4', 'A4'],
      intruderNote: 'A4',
      options: [
        { id: 'opt-aeolian', label: 'Aeolian (Thứ Tự Nhiên - Bậc b6)', isCorrect: false },
        { id: 'opt-dorian', label: 'Dorian Mode (Thứ nhưng có Bậc 6 Trưởng sáng bừng)', isCorrect: true },
        { id: 'opt-major', label: 'Major Pentatonic (Ngũ Cung Trưởng)', isCorrect: false },
        { id: 'opt-locrian', label: 'Locrian (Bất ổn định)', isCorrect: false }
      ],
      explanation: 'Xuất sắc! Hợp âm mang màu Thứ (Eb) nhưng có nốt A tự nhiên (6M) sáng bừng lên chính là đặc sản của Dorian.'
    },
    {
      id: 3,
      title: 'Câu 3: Nhận Diện Sắc Thái Flamenco / Trung Đông Rực Lửa',
      contextNotes: ['C4', 'Db4', 'E4', 'G4'],
      intruderNote: 'Db4',
      options: [
        { id: 'opt-phrygian-dom', label: 'Phrygian Dominant (Bậc b2 kết hợp 3 Trưởng)', isCorrect: true },
        { id: 'opt-mixolydian', label: 'Mixolydian (Classic Rock)', isCorrect: false },
        { id: 'opt-lydian', label: 'Lydian (Viễn tưởng)', isCorrect: false },
        { id: 'opt-blues', label: 'Blues Scale (Blue Note b5)', isCorrect: false }
      ],
      explanation: 'Chính xác! Bước nửa cung b2 kết hợp bậc 3 Trưởng tạo nên âm hưởng Flamenco và kịch tính Ai Cập của Phrygian Dominant.'
    }
  ];

  const currentQuestions = quizMode === 'oddball' ? ODDBALL_QUESTIONS : MOOD_QUESTIONS;

  const handlePlayQuizAudio = async () => {
    if (isPlayingQuizAudio) return;
    setIsPlayingQuizAudio(true);
    try {
      await auditoryEngine.resumeAudioContext();
      const q = currentQuestions[quizStep];
      for (const n of q.contextNotes) {
        auditoryEngine.playNote(n, 0.45, { volume: 0.5 });
        await new Promise(r => setTimeout(r, 300));
      }
      await new Promise(r => setTimeout(r, 200));
      auditoryEngine.playNote(q.intruderNote, 0.65, { volume: 0.65, waveform: 'sawtooth' });
    } finally {
      setIsPlayingQuizAudio(false);
    }
  };

  const handleSelectQuizOption = (opt: { id: string; label: string; isCorrect: boolean }) => {
    if (quizSelectedOption) return;
    setQuizSelectedOption(opt.id);
    if (opt.isCorrect) {
      auditoryEngine.playFeedback(true);
      setQuizScore(prev => prev + 1);
    } else {
      auditoryEngine.playFeedback(false);
    }

    setTimeout(() => {
      if (quizStep < 2) {
        setQuizStep(prev => prev + 1);
        setQuizSelectedOption(null);
      } else {
        setQuizFinished(true);
        if (quizScore + (opt.isCorrect ? 1 : 0) >= 2) {
          markTheoryModuleMastered('scales');
        }
      }
    }, 1600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Theory Foundation */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-md">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Chương 4: Âm Giai & Điệu Thức (Scales & Modes Pro)</span>
              <span className="text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
                32 Âm Giai Học Viện
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Khám phá quang phổ độ sáng, nốt đặc trưng, khối tứ âm và nền hòa âm định hình của 32 âm giai thế giới
            </p>
          </div>
        </div>

        {/* 4 COGNITIVE MECHANISMS (MODAL BRIGHTNESS SPECTRUM) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>Quang Phổ Độ Sáng 7 Điệu Thức Giáo Hội (The Modal Brightness Spectrum)</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Quy luật: Mỗi bước đi xuống Tối chỉ hạ thấp đúng 1 nốt nửa cung
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-1">
            {[
              { id: 'lydian', name: 'Lydian', score: '+1', diff: '#4 (Sáng nhất)', color: 'text-amber-300 bg-amber-400/20 border-amber-400/40' },
              { id: 'major', name: 'Ionian', score: '0', diff: 'Trưởng Chuẩn', color: 'text-emerald-300 bg-emerald-400/20 border-emerald-400/40' },
              { id: 'mixolydian', name: 'Mixolydian', score: '-1', diff: 'Hạ b7', color: 'text-cyan-300 bg-cyan-400/20 border-cyan-400/40' },
              { id: 'dorian', name: 'Dorian', score: '-2', diff: 'Hạ b3 (Thứ sáng)', color: 'text-blue-300 bg-blue-400/20 border-blue-400/40' },
              { id: 'minor', name: 'Aeolian', score: '-3', diff: 'Hạ b6 (Thứ chuẩn)', color: 'text-indigo-300 bg-indigo-400/20 border-indigo-400/40' },
              { id: 'phrygian', name: 'Phrygian', score: '-4', diff: 'Hạ b2 (Flamenco)', color: 'text-purple-300 bg-purple-400/20 border-purple-400/40' },
              { id: 'locrian', name: 'Locrian', score: '-5', diff: 'Hạ b5 (Tối nhất)', color: 'text-rose-300 bg-rose-400/20 border-rose-400/40' },
            ].map(m => {
              const isSelected = selectedScaleId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedScaleId(m.id)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${m.color} ${
                    isSelected ? 'ring-2 ring-white scale-102 shadow-md' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{m.name}</span>
                    <span className="font-mono text-[10px]">{m.score}</span>
                  </div>
                  <div className="text-[10px] opacity-90 truncate font-mono mt-0.5">
                    {m.diff}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Scale Player & Piano Visualizer */}
      <div className="p-5 sm:p-7 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>Phòng Thí Nghiệm Điệu Thức Trực Quan (Scale Studio)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nốt đặc trưng (Color Note) phát sáng màu Vàng Hổ Phách trên phím đàn để tai nhận biết ngay tức thì
            </p>
          </div>

          {/* 12 Roots Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Chủ âm:</span>
            {ROOT_NOTES_ALL.map(n => (
              <button
                key={n}
                onClick={() => setRoot(n)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  root === n 
                    ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/40 scale-105' 
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Current Scale Details Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3.5 py-1 rounded-xl bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-black text-lg font-mono tracking-tight shadow-sm">
                {root} {currentInfo.nameVi}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {currentInfo.mode}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                {currentInfo.categoryVi}
              </span>
            </div>

            <p className="text-xs text-amber-300 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentInfo.feel}</span>
            </p>

            {/* Note Pills in scale with Characteristic Color Highlight */}
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-slate-500 font-sans">Các nốt trong âm giai:</span>
              {scaleNotes.map((n, idx) => {
                const isChar = characteristicNotes.some(cn => Note.midi(cn) === Note.midi(n));
                return (
                  <button
                    key={`${n}-${idx}`}
                    onClick={() => handlePlaySingleNote(n)}
                    title={isChar ? `Nốt đặc trưng: ${n}` : `Bấm để nghe nốt ${n}`}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border ${
                      isChar
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400 ring-1 ring-amber-400 shadow-sm'
                        : 'bg-slate-800/90 hover:bg-emerald-500/20 text-cyan-300 hover:text-emerald-300 border-slate-700'
                    }`}
                  >
                    {n.replace(/\d/, '')} {isChar && '★'}
                  </button>
                );
              })}
              <span className="text-slate-600 font-bold">⟶</span>
              <button
                onClick={() => handlePlaySingleNote(octaveTonic)}
                title={`Bát độ trên: ${octaveTonic}`}
                className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-black cursor-pointer"
              >
                {octaveTonic.replace(/\d/, '')} (8ve)
              </button>
            </div>
          </div>

          {/* Sound Controls Bar with Modal Vamp & Parallel Compare */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 flex-wrap">
            {/* Play Scale Run */}
            <button
              type="button"
              onClick={handlePlayScaleRun}
              disabled={isPlaying || isPlayingVamp || isComparingParallel}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPlaying ? 'Đang phát thang âm...' : 'Phát Thang Âm'}</span>
            </button>

            {/* Play Modal Vamp (Cặp Hợp Âm Nền) */}
            <button
              type="button"
              onClick={handlePlayModalVamp}
              disabled={isPlaying || isPlayingVamp || isComparingParallel}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 ${
                isPlayingVamp 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
              }`}
              title="Phát cặp hợp âm nền đặc trưng để neo điệu thức trong não bộ"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>{isPlayingVamp ? 'Đang phát Vamp...' : 'Modal Vamp (Hợp Âm Nền)'}</span>
            </button>

            {/* Parallel Mode Compare */}
            <button
              type="button"
              onClick={handleParallelCompare}
              disabled={isPlaying || isPlayingVamp || isComparingParallel}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 ${
                isComparingParallel
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
              }`}
              title="Nghe đối chiếu nốt khác biệt giữa Mode này và Trưởng/Thứ Chuẩn"
            >
              <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isComparingParallel ? 'Đang đối chiếu A/B...' : 'So Sánh Song Song'}</span>
            </button>

            {/* Play Arpeggio */}
            <button
              type="button"
              onClick={handlePlayArpeggio}
              disabled={isPlaying || isPlayingVamp || isComparingParallel}
              className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Rải hợp âm 1-3-5-7-8"
            >
              <Disc3 className="w-3.5 h-3.5 text-purple-400" />
              <span>Rải Arp</span>
            </button>
          </div>
        </div>

        {/* Speed Adjustment Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tốc độ phát:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Chậm (Học)', ms: 400 },
              { label: 'Vừa (Chuẩn)', ms: 260 },
              { label: 'Nhanh (Thạo)', ms: 160 }
            ].map(spd => (
              <button
                key={spd.ms}
                onClick={() => setPlaybackSpeedMs(spd.ms)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  playbackSpeedMs === spd.ms 
                    ? 'bg-cyan-500 text-slate-950 font-black' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Piano Keyboard Component with Glowing Characteristic Color Notes */}
        <div className="flex flex-col items-center justify-center pt-1 space-y-2">
          <PianoKeyboard
            octaveRange={[4, 5]}
            selectedNotes={scaleNotes}
            activeNotes={activeNotes}
            highlightNotes={characteristicNotes}
            enableMidiHighlight={true}
          />
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
              <span>Nốt trong âm giai</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 ring-2 ring-amber-300 inline-block" />
              <span className="text-amber-300 font-bold">Nốt đặc trưng (Color Note)</span>
            </span>
          </div>
        </div>

        {/* DIATONIC CHORDS HARMONIZATION (Bản Đồ 7 Hợp Âm Diatonic) */}
        {diatonicChords.length === 7 && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                <span>Bản Đồ 7 Hợp Âm Diatonic Bậc (Diatonic 7th Chords Harmonization)</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Bấm vào thẻ để nghe hợp âm 4 nốt sinh ra trên bậc đó
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {diatonicChords.map(chord => (
                <button
                  key={chord.degree}
                  onClick={() => handlePlayDiatonicChord(chord.notes)}
                  className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-left transition-all cursor-pointer group active:scale-95"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 font-bold">
                      {chord.degree}
                    </span>
                    <Volume2 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                  <div className="text-xs font-black text-white group-hover:text-emerald-300 font-mono truncate">
                    {chord.chordName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                    {chord.notes.map(n => n.replace(/\d/, '')).join('-')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TETRACHORD CHUNKING & SCALE DEGREE BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Lower Tetrachord */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
              🧱 Hạ Tứ Âm (Lower Tetrachord / 4 Nốt Đầu)
            </span>
            <p className="text-xs font-bold text-white font-mono">
              {currentInfo.tetrachords.lower}
            </p>
            <p className="text-[11px] text-slate-400">
              Các nốt: <strong className="text-emerald-300 font-mono">{scaleNotes.slice(0, 4).map(n => n.replace(/\d/, '')).join(' - ')}</strong>
            </p>
          </div>

          {/* Upper Tetrachord */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
              🧱 Thượng Tứ Âm (Upper Tetrachord / 4 Nốt Cuối)
            </span>
            <p className="text-xs font-bold text-white font-mono">
              {currentInfo.tetrachords.upper}
            </p>
            <p className="text-[11px] text-slate-400">
              Các nốt: <strong className="text-cyan-300 font-mono">{scaleNotes.slice(Math.max(0, scaleNotes.length - 4)).map(n => n.replace(/\d/, '')).join(' - ')}</strong>
            </p>
          </div>
        </div>

        {/* Detailed Scientific Profile Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs leading-relaxed text-slate-300">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Hồ Sơ Khoa Học: {currentInfo.nameVi} ({root})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-1">📐 Công Thức Cung (Step Pattern):</span>
              <span className="font-mono text-emerald-300 font-bold">{currentInfo.stepFormula}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-1">🎯 Công Thức Bậc Quãng (Degrees):</span>
              <span className="font-mono text-cyan-300 font-bold">{currentInfo.intervalFormula}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-1">✨ Nốt Linh Hồn / Nốt Đặc Trưng:</span>
              <span className="text-amber-300 font-bold">{currentInfo.characterNoteVi}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-1">🎶 Cặp Hợp Âm Nền (Modal Vamp):</span>
              <span className="text-white font-mono font-bold">{currentInfo.modalVamp.label}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 md:col-span-2">
              <span className="text-slate-400 block font-semibold mb-1">🎧 Bài Hát Ví Dụ Kinh Điển:</span>
              <span className="text-white font-medium">{currentInfo.famousSongVi}</span>
            </div>
          </div>

          <p className="pt-1 text-slate-300">
            {currentInfo.descriptionVi}
          </p>
        </div>
      </div>

      {/* 3. Comprehensive 32 Scales Encyclopedia */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-emerald-500" />
              <span>Cẩm Nang 32 Âm Giai & Điệu Thức Toàn Diện</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Từ 7 Điệu thức Giáo hội, 8 Họ Thứ biến thể, 7 Ngũ cung & Blues đến 4 Âm giai Đối xứng, 3 Điệu thức Việt Nam và 3 Âm giai Kỳ ảo thế giới
            </p>
          </div>

          {/* 6 Category Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'Tất cả (32)' },
              { id: 'CHURCH_MODES', label: '🏛️ Điệu Thức Tự Nhiên (7)' },
              { id: 'MINOR_MODES', label: '🎻 Họ Thứ & Phái Sinh (8)' },
              { id: 'PENTATONIC_BLUES', label: '🎸 Ngũ Cung & Blues (7)' },
              { id: 'SYMMETRIC', label: '🌀 Âm Giai Đối Xứng (4)' },
              { id: 'VIETNAMESE', label: '🌾 Ngũ Cung Việt Nam (3)' },
              { id: 'WORLD_EXOTIC', label: '🌌 Âm Giai Thế Giới (3)' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 32 Scale Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredScales.map((scale) => {
            const isSelected = selectedScaleId === scale.id;
            return (
              <button
                key={scale.id}
                onClick={() => {
                  setSelectedScaleId(scale.id);
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                className={`p-4 sm:p-5 rounded-2xl text-left border-2 transition-all cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white shadow-lg ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {scale.nameVi}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    {scale.mode}
                  </span>
                </div>

                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1.5 flex items-center gap-1">
                  <span>💡</span>
                  <span>{scale.feel}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Bậc Quãng:</span>
                    <strong className="text-cyan-600 dark:text-cyan-300 truncate block">{scale.intervalFormula}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Nốt Đặc Trưng:</span>
                    <strong className="text-amber-600 dark:text-amber-400 truncate block">{scale.characterNoteVi}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                  <span className="truncate max-w-[280px]">🎵 {scale.famousSongVi}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                    {isSelected ? 'Đang chọn ✓' : 'Chọn để nghe ➔'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. DUAL-MODE MINI-QUIZ: LÀM CHỦ ĐIỆU THỨC & KHÍ SẮC (ODDBALL VS MOOD SPOTTER) */}
      <div className="p-6 bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-emerald-900/10 border-2 border-indigo-500/30 rounded-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Thử Thách: Làm Chủ Điệu Thức & Khí Sắc</span>
                {isMastered && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã Làm Chủ
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Chọn chế độ kiểm tra: Bắt nốt lạc điệu (Oddball) hoặc Đoán khí sắc điệu thức qua nốt đặc trưng!
              </p>
            </div>
          </div>

          {/* Quiz Mode Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setQuizMode('oddball');
                setQuizStep(0);
                setQuizScore(0);
                setQuizSelectedOption(null);
                setQuizFinished(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                quizMode === 'oddball'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Bắt Nốt Lạc Điệu (Oddball)
            </button>
            <button
              onClick={() => {
                setQuizMode('mood');
                setQuizStep(0);
                setQuizScore(0);
                setQuizSelectedOption(null);
                setQuizFinished(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                quizMode === 'mood'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Đoán Khí Sắc (Mood Spotter)
            </button>
          </div>
        </div>

        {/* Quiz Progress & Score */}
        <div className="flex items-center justify-between text-xs font-mono font-bold px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          <span>Tiến độ: Câu {Math.min(3, quizStep + 1)} / 3</span>
          <span className="text-emerald-500">· Điểm: {quizScore}/3</span>
        </div>

        {/* Quiz Body */}
        {!quizFinished ? (
          (() => {
            const currentQ = currentQuestions[quizStep];
            return (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {currentQ.title}
                    </span>
                    <button
                      onClick={handlePlayQuizAudio}
                      disabled={isPlayingQuizAudio}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingQuizAudio ? 'Đang phát âm thanh...' : 'Nghe chuỗi nốt mẫu'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {quizMode === 'oddball' 
                      ? 'Lắng nghe và chọn nốt nào là nốt ngoại điệu xâm nhập không thuộc điệu thức:'
                      : 'Lắng nghe giai điệu và chọn xem câu nhạc mang khí sắc bản sắc của điệu thức nào:'
                    }
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {currentQ.options.map(opt => {
                      const isSelected = quizSelectedOption === opt.id;
                      let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
                      if (quizSelectedOption) {
                        if (opt.isCorrect) btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                        else if (isSelected) btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={quizSelectedOption !== null}
                          onClick={() => handleSelectQuizOption(opt)}
                          className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between cursor-pointer active:scale-98 ${btnStyle}`}
                        >
                          <span>{opt.label}</span>
                          {quizSelectedOption && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />}
                          {quizSelectedOption && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>

                  {quizSelectedOption && (
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 animate-fadeIn">
                      {currentQ.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {quizScore >= 2 ? '🎉 Xuất sắc! Bạn đã làm chủ kiến thức Âm Giai & Khí Sắc' : 'Hãy thử lại để đạt chuẩn làm chủ nhé!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Bạn đạt kết quả <strong>{quizScore}/3 câu đúng</strong>. Huy hiệu làm chủ chương 4 đã được cập nhật vào tiến độ học viện.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setQuizStep(0);
                  setQuizScore(0);
                  setQuizSelectedOption(null);
                  setQuizFinished(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Làm lại thử thách
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Practice CTA Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Sẵn sàng thử thách thính giác với Âm Giai & Điệu Thức?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Luyện tập phân biệt các chuỗi nốt trong bài tập thực chiến hoặc rèn luyện ngữ cảnh âm giai trong Pitch Recall.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setSelectedExerciseSlug('pitch-recall');
              setActiveTab('exercises');
            }}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Brain className="w-4 h-4" />
            <span>Luyện Tập: Nhớ Cao Độ & Điệu Thức</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
