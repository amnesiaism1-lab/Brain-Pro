import React, { useState, useMemo } from 'react';
import { Scale, Note } from 'tonal';
import { auditoryEngine } from '../../services/auditoryEngine';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { 
  Play, 
  Volume2, 
  Music, 
  Sparkles, 
  Radio, 
  Layers, 
  Sun, 
  Moon, 
  Compass, 
  Zap, 
  Flame, 
  BookOpen, 
  CheckCircle2, 
  Disc3,
  Sliders,
  RotateCcw,
  Info
} from 'lucide-react';

export type ScaleCategory = 'CHURCH_MODES' | 'MINOR_VARIANTS' | 'PENTATONIC_BLUES' | 'EXOTIC';

export interface IScaleDefinition {
  id: string;
  name: string;             // Tonal scale name
  nameVi: string;           // Tên tiếng Việt chuẩn
  mode: string;             // Tên chế độ quốc tế
  category: ScaleCategory;
  categoryVi: string;
  feel: string;             // Cảm xúc tóm tắt
  stepFormula: string;      // Công thức Cung - Nửa Cung (W-H)
  intervalFormula: string;  // Công thức Bậc quãng (Degrees)
  characterNoteVi: string;  // Nốt linh hồn / nốt đặc trưng
  famousSongVi: string;     // Bản nhạc ví dụ kinh điển
  genreVi: string;          // Thể loại âm nhạc tiêu biểu
  descriptionVi: string;    // Lý giải chuyên sâu chi tiết
}

export const COMPREHENSIVE_SCALES: IScaleDefinition[] = [
  // 1. Church Modes (7 Điệu thức Giáo Hội Cổ Điển)
  {
    id: 'major',
    name: 'major',
    nameVi: 'Trưởng Tự Nhiên (Ionian)',
    mode: 'Ionian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Tươi sáng, hoàn mỹ, kinh điển, tràn đầy hy vọng',
    stepFormula: '1 - 1 - 1/2 - 1 - 1 - 1 - 1/2 (W-W-H-W-W-W-H)',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    characterNoteVi: 'Bậc 3 Trưởng (3M) & Bậc 7 Trưởng (7M - Cảm âm hút mạnh về chủ âm)',
    famousSongVi: 'Ode to Joy (Beethoven), Let It Be (Beatles), Happy Birthday',
    genreVi: 'Pop, Cổ Điển, Nhạc Thiếu Nhi, Thánh Ca',
    descriptionVi: 'Điệu thức nền tảng của hệ thống âm nhạc phương Tây. Tạo cảm giác cân bằng, tươi vui, viên mãn và ổn định vững vàng nhất.'
  },
  {
    id: 'dorian',
    name: 'dorian',
    nameVi: 'Dorian Mode',
    mode: 'Dorian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Màu sắc Trung Cổ, Jazz/Funk, u sầu nhưng le lói hy vọng',
    stepFormula: '1 - 1/2 - 1 - 1 - 1 - 1/2 - 1 (W-H-W-W-W-H-W)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    characterNoteVi: 'Bậc 6 Trưởng (6M) - Nốt ánh sáng xua tan vẻ u tối của điệu Thứ',
    famousSongVi: 'Scarborough Fair, Get Lucky (Daft Punk), Oye Como Va (Santana), Mad World',
    genreVi: 'Jazz, Funk, Celtic, Dân gian Châu Âu, Neo-Soul',
    descriptionVi: 'Là một điệu Thứ nhưng có bậc 6 được nâng lên thành Trưởng. Điều này xóa tan cảm giác bi lụy u ám, tạo nên phong thái cổ kính, lãng tử và giàu nhịp điệu khiêu vũ.'
  },
  {
    id: 'phrygian',
    name: 'phrygian',
    nameVi: 'Phrygian Mode',
    mode: 'Phrygian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Flamenco Tây Ban Nha, căng thẳng, ma mị, huyền bí',
    stepFormula: '1/2 - 1 - 1 - 1 - 1/2 - 1 - 1 (H-W-W-W-H-W-W)',
    intervalFormula: '1 - b2 - b3 - 4 - 5 - b6 - b7',
    characterNoteVi: 'Bậc 2 Giáng (b2) - Bước nửa cung ngay đầu thang âm tạo cảm giác nghẹt thở',
    famousSongVi: 'White Rabbit (Jefferson Airplane), Nhạc Flamenco Tây Ban Nha, Symphony of Destruction (Megadeth)',
    genreVi: 'Flamenco, Heavy Metal, Nhạc Ả Rập / Trung Đông, Nhạc Phim Kinh Dị',
    descriptionVi: 'Mang âm hưởng xứ sở đấu bò và sa mạc Trung Đông. Bước nửa cung cọ xát ngay giữa nốt chủ âm và bậc 2 tạo ra áp lực kịch tính, hồi hộp và ma mị khôn lường.'
  },
  {
    id: 'lydian',
    name: 'lydian',
    nameVi: 'Lydian Mode',
    mode: 'Lydian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Phim điện ảnh, khoa học viễn tưởng, huyền ảo bay bổng',
    stepFormula: '1 - 1 - 1 - 1/2 - 1 - 1 - 1/2 (W-W-W-H-W-W-H)',
    intervalFormula: '1 - 2 - 3 - #4 - 5 - 6 - 7',
    characterNoteVi: 'Bậc 4 Tăng (#4 / Tritone) - Đưa giai điệu bay bổng thoát ly trọng lực',
    famousSongVi: 'The Simpsons Theme, E.T. Flying Theme (John Williams), Back to the Future',
    genreVi: 'Nhạc Phim Viễn Tưởng, Dream Pop, Jazz Hiện Đại, Progressive Rock',
    descriptionVi: 'Điệu thức sáng nhất và rực rỡ nhất trong 7 điệu thức. Nốt bậc 4 bị thăng lên tạo thành quãng Tritone so với chủ âm, mang đến cảm giác như đang bay lượn giữa các vì sao.'
  },
  {
    id: 'mixolydian',
    name: 'mixolydian',
    nameVi: 'Mixolydian Mode',
    mode: 'Mixolydian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Classic Rock, Bluesy, tươi sáng nhưng phóng khoáng, nổi loạn',
    stepFormula: '1 - 1 - 1/2 - 1 - 1 - 1/2 - 1 (W-W-H-W-W-H-W)',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    characterNoteVi: 'Bậc 7 Giáng (b7) - Xóa bỏ tính gò bó cổ điển, mang chất bụi bặm đường phố',
    famousSongVi: 'Sweet Child O Mine (Guns N Roses), Norwegian Wood (Beatles), Royals (Lorde)',
    genreVi: 'Classic Rock, Blues, Funk, Country, Bluegrass',
    descriptionVi: 'Là âm giai Trưởng nhưng bậc 7 bị giáng xuống nửa cung. Khiến cho hợp âm chủ không có cảm âm hút về khắt khe, tạo ra phong thái tự do, ngang tàng và phong trần.'
  },
  {
    id: 'minor',
    name: 'minor',
    nameVi: 'Thứ Tự Nhiên (Aeolian)',
    mode: 'Aeolian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'U buồn, tự nhiên, sâu lắng, mộc mạc',
    stepFormula: '1 - 1/2 - 1 - 1 - 1/2 - 1 - 1 (W-H-W-W-H-W-W)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    characterNoteVi: 'Bậc 3 Giáng (b3) & Bậc 6 Giáng (b6) - Bản sắc u sầu nội tâm',
    famousSongVi: 'Losing My Religion (R.E.M.), Hello (Adele), Stairway to Heaven (Led Zeppelin)',
    genreVi: 'Ballad, Rock, Pop Trầm Buồn, Nhạc Cổ Điển',
    descriptionVi: 'Điệu Thứ tự nhiên song song với điệu Trưởng. Thể hiện nỗi buồn mộc mạc, sự hoài niệm sâu lắng và nỗi niềm nội tâm trắc ẩn không màu mè.'
  },
  {
    id: 'locrian',
    name: 'locrian',
    nameVi: 'Locrian Mode',
    mode: 'Locrian',
    category: 'CHURCH_MODES',
    categoryVi: 'Điệu Thức Giáo Hội',
    feel: 'Tối tăm, bất an, nghẹt thở, không lối thoát',
    stepFormula: '1/2 - 1 - 1 - 1/2 - 1 - 1 - 1 (H-W-W-H-W-W-W)',
    intervalFormula: '1 - b2 - b3 - 4 - b5 - b6 - b7',
    characterNoteVi: 'Bậc 5 Giảm (b5) - Làm hợp âm chủ trở thành Hợp âm Giảm (Diminished)',
    famousSongVi: 'Dust to Dust (John Kirkpatrick), Sad But True (Metallica intro), Painkiller solo',
    genreVi: 'Heavy Metal, Doom Metal, Nhạc Phim Giật Gân',
    descriptionVi: 'Điệu thức tối tăm nhất và bất ổn nhất. Do không có quãng 5 Đúng nâng đỡ, âm thanh luôn ở trạng thái co rút, nghẹt thở và chênh vênh tuyệt đối.'
  },

  // 2. Minor Variants (Bộ Ba Điệu Thứ Kinh Điển)
  {
    id: 'harmonic minor',
    name: 'harmonic minor',
    nameVi: 'Thứ Hòa Âm (Harmonic Minor)',
    mode: 'Harmonic',
    category: 'MINOR_VARIANTS',
    categoryVi: 'Điệu Thứ Kinh Điển',
    feel: 'Ả Rập, Trung Đông bí ẩn, kịch tính, lôi cuốn',
    stepFormula: '1 - 1/2 - 1 - 1 - 1/2 - 1.5 - 1/2 (W-H-W-W-H-1.5-H)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
    characterNoteVi: 'Bậc 7 Trưởng (7M) tạo bước nhảy 1.5 cung ma mị so với Bậc b6',
    famousSongVi: 'Smooth (Santana), Hava Nagila, Bão Đêm (Microwave), Yngwie Malmsteen Solos',
    genreVi: 'Nhạc Cổ Điển Châu Âu, Trung Đông, Flamenco, Neo-Classical Metal',
    descriptionVi: 'Thăng bậc 7 lên nửa cung để tạo nốt dẫn hút mãnh liệt về chủ âm. Khoảng cách 1.5 cung giữa bậc 6 và 7 tạo nên giai điệu huyền bí, quyến rũ như truyện Nghìn Lẻ Một Đêm.'
  },
  {
    id: 'melodic minor',
    name: 'melodic minor',
    nameVi: 'Thứ Giai Điệu (Melodic Minor / Jazz Minor)',
    mode: 'Melodic',
    category: 'MINOR_VARIANTS',
    categoryVi: 'Điệu Thứ Kinh Điển',
    feel: 'Quý tộc, mượt mà, jazz hiện đại, bác học',
    stepFormula: '1 - 1/2 - 1 - 1 - 1 - 1 - 1/2 (W-H-W-W-W-W-H)',
    intervalFormula: '1 - 2 - b3 - 4 - 5 - 6 - 7',
    characterNoteVi: 'Nâng cả Bậc 6 & 7 lên Trưởng khi đi lên, xóa bỏ bước nhảy 1.5 cung',
    famousSongVi: 'Yesterday (Beatles - câu mở đầu), Autumn Leaves (Jazz Solo), Bach Cello Suites',
    genreVi: 'Jazz Nâng Cao, Nhạc Cổ Điển Phức Điệu, Fusion',
    descriptionVi: 'Giải pháp tinh tế của Bach và các bậc thầy cổ điển: nâng cả bậc 6 và 7 để giai điệu đi lên mượt mà không bị vấp. Nửa dưới mang màu Thứ, nửa trên mang màu Trưởng.'
  },

  // 3. Pentatonic & Blues (Ngũ Cung & Blues)
  {
    id: 'major pentatonic',
    name: 'major pentatonic',
    nameVi: 'Ngũ Cung Trưởng',
    mode: 'Pentatonic',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Dân ca Á Đông, trong trẻo, êm đềm, thanh bình',
    stepFormula: '1 - 1 - 1.5 - 1 - 1.5',
    intervalFormula: '1 - 2 - 3 - 5 - 6',
    characterNoteVi: 'Lược bỏ Bậc 4 & 7 - Không có bất kỳ khoảng cách nửa cung cọ xát nào',
    famousSongVi: 'Amazing Grace, Bèo Dạt Mây Trôi (Dân ca Việt Nam), My Girl',
    genreVi: 'Dân Ca Á Đông, Country (Đồng Quê), Nhạc Dân Gian Mộc Mạc',
    descriptionVi: 'Thang 5 âm không có bán âm. Mọi nốt khi vang lên cùng nhau đều thuận tai, không thể có nốt phô, gợi mở khung cảnh đồng quê thanh bình bát ngát.'
  },
  {
    id: 'minor pentatonic',
    name: 'minor pentatonic',
    nameVi: 'Ngũ Cung Thứ',
    mode: 'Pentatonic',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Blues, Rock solo kinh điển, mạnh mẽ, bụi bặm',
    stepFormula: '1.5 - 1 - 1 - 1.5 - 1',
    intervalFormula: '1 - b3 - 4 - 5 - b7',
    characterNoteVi: 'Lược bỏ Bậc 2 & 6 - Bộ khung quyền lực của mọi tay guitar solo',
    famousSongVi: 'Whole Lotta Love (Led Zeppelin), Back in Black (AC/DC), Voodoo Child',
    genreVi: 'Hard Rock, Blues, Heavy Metal, Funk Solo',
    descriptionVi: 'Khung xương của mọi bản độc tấu guitar Rock vĩ đại nhất lịch sử. Đơn giản, trực diện, gai góc và đầy uy lực khi solo trên nền nhạc sôi động.'
  },
  {
    id: 'blues',
    name: 'blues',
    nameVi: 'Âm Giai Blues (với Blue Note)',
    mode: 'Blues',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Màu sắc Blues nồng nàn, u uất, nức nở gai góc',
    stepFormula: '1.5 - 1 - 1/2 - 1/2 - 1.5 - 1',
    intervalFormula: '1 - b3 - 4 - b5 - 5 - b7',
    characterNoteVi: 'Nốt Blue Note (Bậc b5) - Nốt linh hồn tạo tiếng nấc nghẹn ngào',
    famousSongVi: 'The Thrill Is Gone (B.B. King), Sunshine of Your Love (Cream), Roadhouse Blues',
    genreVi: 'Chicago Blues, Delta Blues, Rock & Roll, Soul',
    descriptionVi: 'Bổ sung nốt Quãng 5 Giảm (b5) vào Ngũ Cung Thứ. Nốt b5 này tạo nên âm hưởng khàn đặc, ai oán và thổn thức đặc trưng không thể nhầm lẫn của âm nhạc da màu.'
  },
  {
    id: 'bebop',
    name: 'bebop',
    nameVi: 'Bebop Dominant Scale',
    mode: 'Bebop',
    category: 'PENTATONIC_BLUES',
    categoryVi: 'Ngũ Cung & Blues',
    feel: 'Sang trọng, lả lướt, tốc độ cao, jazz thượng đỉnh',
    stepFormula: '1 - 1 - 1/2 - 1 - 1 - 1/2 - 1/2 - 1/2',
    intervalFormula: '1 - 2 - 3 - 4 - 5 - 6 - b7 - 7',
    characterNoteVi: 'Thang 8 âm - Thêm nốt cromat giữa Bậc b7 và Bậc 7',
    famousSongVi: 'Donna Lee (Charlie Parker), Scrapple from the Apple, Nows the Time',
    genreVi: 'Bebop, Jazz Swing, Hard Bop',
    descriptionVi: 'Phát kiến thiên tài của Charlie Parker. Thêm nốt thứ 8 giúp các nốt của hợp âm luôn rơi đúng vào phách mạnh (1, 3, 5, 7) khi chạy chuỗi nốt tốc độ cao.'
  },

  // 4. Exotic & Symmetrical (Màu sắc đặc biệt & Đối xứng)
  {
    id: 'whole tone',
    name: 'whole tone',
    nameVi: 'Toàn Cung (Whole Tone)',
    mode: 'Whole Tone',
    category: 'EXOTIC',
    categoryVi: 'Màu Sắc Đặc Biệt',
    feel: 'Lơ lửng, không trọng lực, ảo mộng, Debussy',
    stepFormula: '1 - 1 - 1 - 1 - 1 - 1 (6 nốt cách đều nhau đúng 1 cung)',
    intervalFormula: '1 - 2 - 3 - #4 - #5 - #6',
    characterNoteVi: 'Hoàn toàn không có nửa cung, không có chủ âm cố định',
    famousSongVi: 'Voiles (Claude Debussy), You Are the Sunshine of My Life (Stevie Wonder intro)',
    genreVi: 'Trường phái Ấn tượng (Impressionism), Jazz Hiện Đại, Nhạc Phim Mơ Mộng',
    descriptionVi: 'Âm giai không có tâm điểm hòa âm, tạo cảm giác bềnh bồng, lơ lửng, không trọng lực như đang lạc vào một giấc mơ siêu thực trong làn sương khói.'
  },
  {
    id: 'diminished',
    name: 'diminished',
    nameVi: 'Âm Giai Giảm (Half-Whole Diminished)',
    mode: 'Diminished',
    category: 'EXOTIC',
    categoryVi: 'Màu Sắc Đặc Biệt',
    feel: 'Căng thẳng, đối xứng, điện ảnh trinh thám noir',
    stepFormula: '1/2 - 1 - 1/2 - 1 - 1/2 - 1 - 1/2 - 1 (8 nốt xen kẽ H-W)',
    intervalFormula: '1 - b2 - b3 - 3 - #4 - 5 - 6 - b7',
    characterNoteVi: 'Cấu trúc đối xứng chứa 2 hợp âm Diminished 7 lồng vào nhau',
    famousSongVi: 'Đêm trên Núi Trọc (Mussorgsky), Giant Steps substitutions (John Coltrane)',
    genreVi: 'Jazz Nâng Cao, Nhạc Phim Trinh Thám Noir, Cổ Điển Hiện Đại',
    descriptionVi: 'Âm thanh xoắn vặn và căng thẳng cao độ. Là vũ khí thượng thặng của các bậc thầy nhạc Jazz khi solo vượt qua các hợp âm biến dị át 7 (V7alt).'
  },
  {
    id: 'hirajoshi',
    name: 'hirajoshi',
    nameVi: 'Hirajoshi (Ngũ Cung Nhật Bản)',
    mode: 'Hirajoshi',
    category: 'EXOTIC',
    categoryVi: 'Màu Sắc Đặc Biệt',
    feel: 'Trầm mặc, thanh tao, u tịch, kiếm đạo Samurai',
    stepFormula: '1 - 1/2 - 2 - 1/2 - 2',
    intervalFormula: '1 - 2 - b3 - 5 - b6',
    characterNoteVi: 'Quãng nửa cung xen kẽ bước nhảy 2 cung của đàn tranh Koto',
    famousSongVi: 'Nhạc đàn tranh Koto truyền thống, Tokyo Drift theme, Nhạc phim Ghibli',
    genreVi: 'Nhạc Truyền Thống Nhật Bản, Dân Gian Á Đông, Nhạc Thiền Đạo Zen',
    descriptionVi: 'Thang âm cổ truyền của đàn Koto Nhật Bản. Mang không khí trầm mặc, thanh tao, u tịch và sâu thẳm như vườn thiền Zen và tranh thủy mặc.'
  }
];

export const ROOT_NOTES_ALL = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ScalesModule: React.FC = () => {
  const [selectedScaleId, setSelectedScaleId] = useState<string>('major');
  const [root, setRoot] = useState<string>('C');
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(260); // 260ms normal
  const [categoryFilter, setCategoryFilter] = useState<ScaleCategory | 'ALL'>('ALL');

  const currentInfo = useMemo(() => {
    return COMPREHENSIVE_SCALES.find(s => s.id === selectedScaleId) || COMPREHENSIVE_SCALES[0];
  }, [selectedScaleId]);

  // Compute notes of scale from Tonal accurately
  const { scaleNotes, octaveTonic, fullRunSequence, arpeggioSequence } = useMemo(() => {
    const scaleData = Scale.get(`${root}4 ${currentInfo.name}`);
    const notesRaw = scaleData.notes.map(n => {
      // Ensure octave format (4 or 5)
      return n.includes('4') || n.includes('5') ? n : `${n}4`;
    });

    const octTonic = Note.transpose(`${root}4`, '8P');

    // Ascending run: notes + octave tonic
    const asc = [...notesRaw, octTonic];
    // Descending run: reverse notes (excluding peak to avoid duplicate)
    const desc = [...notesRaw].reverse();

    const fullRun = [...asc, ...desc];

    // Compute arpeggio (degrees 1, 3, 5, 7, 8)
    const arp: string[] = [];
    if (notesRaw.length >= 7) {
      arp.push(notesRaw[0], notesRaw[2], notesRaw[4], notesRaw[6], octTonic, notesRaw[6], notesRaw[4], notesRaw[2], notesRaw[0]);
    } else if (notesRaw.length === 5) {
      // Pentatonic: 1, 2, 3, 4, 8
      arp.push(notesRaw[0], notesRaw[1], notesRaw[2], notesRaw[3], octTonic, notesRaw[3], notesRaw[2], notesRaw[1], notesRaw[0]);
    } else {
      arp.push(notesRaw[0], notesRaw[2] || notesRaw[1], notesRaw[4] || notesRaw[3], octTonic);
    }

    return {
      scaleNotes: notesRaw,
      octaveTonic: octTonic,
      fullRunSequence: fullRun,
      arpeggioSequence: arp
    };
  }, [root, currentInfo]);

  // Play a sequence of notes with glowing piano synchronization
  const playSequence = async (sequence: string[], speedMs = playbackSpeedMs) => {
    if (isPlaying) return;
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

  // Play full scale run up and down
  const handlePlayScaleRun = () => {
    playSequence(fullRunSequence, playbackSpeedMs);
  };

  // Play arpeggio
  const handlePlayArpeggio = () => {
    playSequence(arpeggioSequence, Math.round(playbackSpeedMs * 1.15));
  };

  // Play tonic chord pad (all notes sounding together)
  const handlePlayTonicChord = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await auditoryEngine.resumeAudioContext();
      const chordNotes = [scaleNotes[0], scaleNotes[2] || scaleNotes[1], scaleNotes[4] || scaleNotes[3]];
      if (scaleNotes.length >= 7 && scaleNotes[6]) chordNotes.push(scaleNotes[6]);

      // Sound all notes concurrently
      chordNotes.forEach(n => {
        auditoryEngine.playNote(n, 1.6, { volume: 0.35, waveform: 'triangle' });
      });

      // Highlight all chord keys simultaneously on piano
      setActiveNotes(chordNotes);
      await new Promise(r => setTimeout(r, 1600));
    } finally {
      setActiveNotes([]);
      setIsPlaying(false);
    }
  };

  // Play individual note on click
  const handlePlaySingleNote = (note: string) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.playNote(note, 0.55, { volume: 0.5 });
    setActiveNotes([note]);
    setTimeout(() => setActiveNotes([]), 500);
  };

  // Filter scales by category
  const filteredScales = useMemo(() => {
    if (categoryFilter === 'ALL') return COMPREHENSIVE_SCALES;
    return COMPREHENSIVE_SCALES.filter(s => s.category === categoryFilter);
  }, [categoryFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Theory Foundation */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-md">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Khái Niệm 4: Âm Giai & Điệu Thức (Scales & Modes)</span>
              <span className="text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
                Ear Academy Pro
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Chuỗi các nốt nhạc sắp xếp theo quy luật cung và nửa cung, định hình linh hồn và phong cách âm nhạc
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
          <p>
            <strong>Âm giai (Scale)</strong> là một tập hợp các cao độ được sắp xếp theo thứ tự tăng dần hoặc giảm dần. Nếu hợp âm là "khối màu" thì âm giai chính là "bảng màu" đầy đủ để người nghệ sĩ dệt nên giai điệu. Mọi ca khúc vĩ đại trên thế giới đều bắt nguồn từ một âm giai cụ thể.
          </p>

          {/* Sơ đồ Phổ Ánh Sáng Điệu Thức (The Brightness Spectrum) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-cyan-500/20 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Quy Luật Phổ Ánh Sáng 7 Điệu Thức (The Brightness Spectrum of Modes)
            </h4>
            <p className="text-xs text-slate-400">
              Điệu thức được xếp hạng từ <strong>Sáng nhất (nhiều dấu thăng / âm cao nâng lên)</strong> đến <strong>Tối nhất (nhiều dấu giáng / âm u uất)</strong>:
            </p>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-[11px] font-mono font-bold pt-1">
              <span className="px-2 py-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                <Sun className="w-3 h-3" /> Lydian (#4)
              </span>
              <span className="text-slate-500">➔</span>
              <span className="px-2 py-1 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                Ionian (Trưởng Chuẩn)
              </span>
              <span className="text-slate-500">➔</span>
              <span className="px-2 py-1 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                Mixolydian (b7)
              </span>
              <span className="text-slate-500">➔</span>
              <span className="px-2 py-1 rounded bg-blue-400/20 text-blue-300 border border-blue-400/40">
                Dorian (b3, b7)
              </span>
              <span className="text-slate-500">➔</span>
              <span className="px-2 py-1 rounded bg-indigo-400/20 text-indigo-300 border border-indigo-400/40">
                Aeolian (Thứ Chuẩn)
              </span>
              <span className="text-slate-500">➔</span>
              <span className="px-2 py-1 rounded bg-purple-400/20 text-purple-300 border border-purple-400/40">
                Phrygian (b2, b3, b6, b7)
              </span>
              <span className="text-slate-500">➔</span>
              <span className="px-2 py-1 rounded bg-rose-400/20 text-rose-300 border border-rose-400/40 flex items-center gap-1">
                <Moon className="w-3 h-3" /> Locrian (Tối nhất: b5)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Scale Player & Piano Visualizer */}
      <div className="p-5 sm:p-7 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Khám Phá Điệu Thức Trực Quan Trên Piano
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chọn nốt gốc và loại âm giai để phím đàn tự động sáng đèn và nghe chạy thang âm chuẩn
            </p>
          </div>

          {/* Full 12 Chromatic Roots Selector */}
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
                {currentInfo.mode} Mode
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                {currentInfo.genreVi}
              </span>
            </div>

            <p className="text-xs text-amber-300 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentInfo.feel}</span>
            </p>

            {/* Note Pills in scale */}
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-slate-500 font-sans">Các nốt trong âm giai:</span>
              {scaleNotes.map((n, idx) => (
                <button
                  key={`${n}-${idx}`}
                  onClick={() => handlePlaySingleNote(n)}
                  title={`Bấm để nghe nốt ${n}`}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-emerald-500/20 text-cyan-300 hover:text-emerald-300 border border-slate-700 font-bold transition-all cursor-pointer"
                >
                  {n.replace(/\d/, '')}
                </button>
              ))}
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

          {/* Sound Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Play Scale Run */}
            <button
              type="button"
              onClick={handlePlayScaleRun}
              disabled={isPlaying}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPlaying ? (
                <>
                  <Volume2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang phát thang âm...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Phát Âm Giai Lên & Xuống</span>
                </>
              )}
            </button>

            {/* Play Arpeggio */}
            <button
              type="button"
              onClick={handlePlayArpeggio}
              disabled={isPlaying}
              className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Phát hợp âm rải 1-3-5-7-8"
            >
              <Disc3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rải Arpeggio</span>
            </button>

            {/* Play Tonic Chord Pad */}
            <button
              type="button"
              onClick={handlePlayTonicChord}
              disabled={isPlaying}
              className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Phát hợp âm chủ để nghe màu sắc điệu thức"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Hợp Âm Chủ</span>
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

        {/* Piano Keyboard Component with Enharmonic Match */}
        <div className="flex justify-center pt-1">
          <PianoKeyboard
            octaveRange={[4, 5]}
            selectedNotes={scaleNotes}
            activeNotes={activeNotes}
            enableMidiHighlight={true}
          />
        </div>

        {/* Scale Degree Breakdown Inspector */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Bóc Tách Từng Bậc Âm (Scale Degrees Breakdown)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {scaleNotes.map((note, index) => {
              const degNames = ['I (Chủ âm)', 'II (Thượng chủ)', 'III (Trung âm)', 'IV (Hạ át âm)', 'V (Át âm)', 'VI (Thượng trung)', 'VII (Dẫn âm / Cảm)'];
              const intervalCodes = currentInfo.intervalFormula.split(' - ')[index] || `${index + 1}`;
              const noteLetter = note.replace(/\d/, '');
              const freq = Note.freq(note) || 440;

              return (
                <button
                  key={`${note}-${index}`}
                  onClick={() => handlePlaySingleNote(note)}
                  className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-400 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white group-hover:text-emerald-300 font-mono">
                      {noteLetter}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 font-bold">
                      {intervalCodes}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium truncate">
                    {degNames[index] || `Bậc ${index + 1}`}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    {Math.round(freq)} Hz
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Scientific Profile Card for Selected Scale */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs leading-relaxed text-slate-300">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
            <Info className="w-4 h-4 text-cyan-400" />
            Hồ Sơ Khoa Học: {currentInfo.nameVi} ({root})
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
              <span className="text-slate-400 block font-semibold mb-1">🎧 Bài Hát Ví Dụ Kinh Điển:</span>
              <span className="text-white font-medium">{currentInfo.famousSongVi}</span>
            </div>
          </div>

          <p className="pt-1 text-slate-300">
            {currentInfo.descriptionVi}
          </p>
        </div>
      </div>

      {/* 3. Comprehensive Scales & Modes Encyclopedia */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎼 Cẩm Nang 16 Âm Giai & Điệu Thức Toàn Diện</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Khám phá đầy đủ từ 7 Điệu thức Giáo hội, Bộ ba Điệu thứ Cổ điển đến Ngũ cung và Âm giai Màu sắc Đặc biệt
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'Tất cả (16)' },
              { id: 'CHURCH_MODES', label: '🏛️ Điệu Thức Giáo Hội' },
              { id: 'MINOR_VARIANTS', label: '🎻 Điệu Thứ Cổ Điển' },
              { id: 'PENTATONIC_BLUES', label: '🎸 Ngũ Cung & Blues' },
              { id: 'EXOTIC', label: '🌌 Màu Sắc Đặc Biệt' }
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

        {/* Scale Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredScales.map((scale) => {
            const isSelected = selectedScaleId === scale.id;
            return (
              <button
                key={scale.id}
                onClick={() => setSelectedScaleId(scale.id)}
                className={`p-4 sm:p-5 rounded-2xl text-left border-2 transition-all cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white shadow-lg ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 text-slate-800 dark:text-slate-200'
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
                    <strong className="text-cyan-600 dark:text-cyan-300">{scale.intervalFormula}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Nốt Linh Hồn:</span>
                    <strong className="text-amber-600 dark:text-amber-400 truncate block">{scale.characterNoteVi}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                  <span className="truncate max-w-[280px]">🎵 Ví dụ: {scale.famousSongVi}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                    {isSelected ? 'Đang chọn ✓' : 'Chọn để nghe ➔'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
