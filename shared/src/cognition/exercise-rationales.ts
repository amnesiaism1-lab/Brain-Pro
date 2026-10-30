import { ExerciseSlug } from '../types';

export interface IExerciseCognitiveRationale {
  exerciseSlug: ExerciseSlug;
  coreTheoryVi: string;           // Tên học thuyết / Khung lý thuyết khoa học nền tảng
  neuralMechanismVi: string;      // Cơ chế sinh học thần kinh & Vùng não bộ tham gia
  realWorldValueVi: string;       // Giá trị nhận thức thực tế trong công việc & đời sống
  goldenRuleVi: string;           // Chiến thuật rèn luyện & Quy tắc vàng tối ưu
  targetFunctionsVi: string[];    // Các chức năng nhận thức được tôi luyện
  academicCitationVi?: string;    // Tài liệu học thuật / Nhà khoa học nền tảng
}

export const EXERCISE_COGNITIVE_RATIONALES: Record<ExerciseSlug, IExerciseCognitiveRationale> = {
  // =========================================================================
  // 1. NHÓM BẢN ĐỒ NHẬN THỨC & ĐỊNH VỊ KHÔNG GIAN
  // =========================================================================
  'hanoi-navigation': {
    exerciseSlug: 'hanoi-navigation',
    coreTheoryVi: 'Bản Đồ Nhận Thức Kevin Lynch & Lý Thuyết Hệ Quy Chiếu Kép Allocentric - Egocentric',
    academicCitationVi: 'Kevin Lynch (1960 - The Image of the City); O\'Keefe & Nadel (1978 - The Hippocampus as a Cognitive Map); Burgess (2006)',
    neuralMechanismVi: 'Kích hoạt tế bào địa điểm (Place cells - Hồi hải mã) và tế bào lưới (Grid cells - Vỏ não nội khứu Entorhinal Cortex) để mã hóa không gian. Vỏ não đỉnh sau (Posterior Parietal Cortex) thực hiện phép biến đổi góc nhìn liên tục giữa hệ quy chiếu Egocentric (người quan sát) và Allocentric (bản đồ toàn thể). Ba tầng trạng thái: State (trạng thái động đường/nút), Relations (ràng buộc không gian/phương vị), Dynamics (chuyển trạng thái và khả năng hành động).',
    realWorldValueVi: 'Tái định hướng không gian tức thì khi mất tín hiệu GPS; giải mã cấu trúc đô thị phức tạp bằng 3 vành đai, 8 trục hướng tâm và lưới ô bàn cờ; định vị phương hướng chính xác bằng phương vị mặt trời (vĩ độ 21.03°N) và mốc đường chân trời (Skyline triangulation); né tránh bẫy đường một chiều và tắc đường.',
    goldenRuleVi: 'Tuyệt đối không học vẹt tên đường. Luôn hình dung thành phố dưới dạng đồ thị quan hệ động: 5 yếu tố Lynch (Tuyến, Ranh giới, Khu vực, Nút, Mốc), định vị vị trí người quan sát so với góc nắng mặt trời và mốc cao tầng.',
    targetFunctionsVi: ['Bản đồ Nhận thức Đô thị', 'Xoay Góc nhìn Không gian', 'Định vị Mặt Trời 3D', 'Lập Lộ trình Tối ưu', 'Mô hình Đồ thị Trạng thái']
  },

  // =========================================================================
  // 2. NHÓM CẢM ÂM, THÍNH GIÁC & GIỌNG HÁT
  // =========================================================================
  'vocal-pitch-match': {
    exerciseSlug: 'vocal-pitch-match',
    coreTheoryVi: 'Vòng Lặp Cảm Giác - Vận Động Thính Giác (Auditory-Motor Loop) & Bản Đồ Âm Học Tonotopic',
    academicCitationVi: 'Zatorre, Chen & Penhune (2007 - When the brain plays music); Merzenich et al. (Tonotopic plasticity)',
    neuralMechanismVi: 'Vỏ não thính giác sơ cấp (A1 / Heschl\'s gyrus) đo đạc sai số tần số thời gian thực (Cents deviation), gửi xung phản hồi dọc theo bó cung (Arcuate Fasciculus) đến vùng Broca và Vỏ não vận động thanh quản (Laryngeal Motor Cortex) để hiệu chỉnh sức căng dây thanh đới trong cửa sổ 100-200ms.',
    realWorldValueVi: 'Xóa bỏ tật "điếc cao độ" (Amusia / Tone-deafness); kiểm soát giọng nói ấm áp, chuẩn tông khi thuyết trình, đàm phán; làm chủ xướng âm theo thang âm (Scale singing); cải thiện rõ rệt khả năng phát âm ngoại ngữ có thanh điệu (tiếng Việt, tiếng Trung).',
    goldenRuleVi: 'Thả lỏng cơ hàm, lấy hơi từ cơ hoành và bắt đầu ngân nhẹ nhàng với âm "ah" hoặc "hum". Dõi theo kim đo Cents và đường băng ribbon để nắn nhẹ cao độ thay vì gồng cứng cơ cổ.',
    targetFunctionsVi: ['Phản xạ Cảm giác - Vận động', 'Phân biệt Vi tần số Cents', 'Xướng âm Theo Thang âm', 'Kiểm soát Dây thanh đới', 'Ổn định Cao độ']
  },

  'pitch-recall': {
    exerciseSlug: 'pitch-recall',
    coreTheoryVi: 'Trí Nhớ Làm Việc Âm Nhạc & Mô Hình Vết Tích Âm Học (Echoic Memory Trace)',
    academicCitationVi: 'Baddeley & Hitch (Working Memory Model); Cowan (2001 - The magical number 4 in short-term memory)',
    neuralMechanismVi: 'Hồi thái dương trên (Superior Temporal Gyrus - STG) phối hợp cùng Vỏ não trước trán lưng bên (DLPFC) để mã hóa chuỗi cao độ thành các nấc khoảng cách tương đối (Interval schema) và duy trì trong bộ đệm âm thanh trước khi vết tích phân rã sau 2-4 giây.',
    realWorldValueVi: 'Khả năng ghi nhớ ngữ điệu câu nói, học phát âm ngoại ngữ tốc độ cao; nghe một giai điệu và có thể đánh lại trên phím đàn hoặc hát lại chuẩn xác (Ear-training / Solfège).',
    goldenRuleVi: 'Ghi nhớ đường nét giai điệu tổng thể (Melodic contour: lên, xuống, lượn sóng) kết hợp nốt chủ (Tonic Anchor). Khi ở chế độ đảo ngược (Reverse), kích hoạt thao tác ngược để đẩy não vào ngưỡng dẻo dai thần kinh tối đa.',
    targetFunctionsVi: ['Trí nhớ Âm thanh Ngắn hạn', 'Bản đồ Đường nét Giai điệu', 'Thao tác Nhớ Ngược', 'Nhận thức Bậc Âm giai']
  },

  'interval-identify': {
    exerciseSlug: 'interval-identify',
    coreTheoryVi: 'Tâm Lý Âm Học Về Hòa Âm - Nghịch Tai (Consonance vs. Dissonance) & Khoảng Cách Bán Âm',
    academicCitationVi: 'Hermann von Helmholtz (1863 - On the Sensations of Tone); Carl Stumpf (Tonpsychologie)',
    neuralMechanismVi: 'Nhân ốc tai (Cochlear nucleus) và củ não sinh tư dưới (Inferior Colliculus) phân tích tương quan chu kỳ sóng âm. Quãng đúng (P4, P5, P8) tạo sóng cộng hưởng êm dịu; quãng nghịch (m2, Tritone) kích hoạt phản ứng cảnh giác của hạch hạnh nhân (Amygdala) do hiện tượng cọ xát sóng âm (Roughness).',
    realWorldValueVi: 'Nhận biết khoảng cách cao độ chính xác giữa hai nốt nhạc; phân tích hòa thanh bài hát; cảm nhận sắc thái cảm xúc trong giọng điệu của người đối thoại (căng thẳng hay ấm áp).',
    goldenRuleVi: 'Gắn từng quãng với một bài hát quen thuộc làm neo (Anchor Song, ví dụ P5: "Twinkle Twinkle", m2: nhạc phim "Jaws"). Chú ý cảm giác vật lý của âm thanh: êm ái, bừng sáng hay gai góc.',
    targetFunctionsVi: ['Phân tích Quãng Âm', 'Cảm thụ Hòa âm & Nghịch tai', 'Tương quan Tần số Sóng', 'Trí nhớ Thính giác']
  },

  'chord-identify': {
    exerciseSlug: 'chord-identify',
    coreTheoryVi: 'Hòa Thanh Chức Năng Rameau & Phân Tích Cảnh Quan Thính Giác Gestalt',
    academicCitationVi: 'Jean-Philippe Rameau (Traité de l\'harmonie); Albert Bregman (1990 - Auditory Scene Analysis)',
    neuralMechanismVi: 'Thùy thái dương và vùng Wernicke mở rộng phân rã chồng âm 3-4 nốt thành một "hương vị hòa âm" duy nhất (Harmonic Gestalt: Trưởng - sáng sủa, Thứ - sâu lắng, Giảm - căng thẳng nghẹt thở, Tăng - phiêu diêu ngoài không gian).',
    realWorldValueVi: 'Cảm nhận cấu trúc tầng lớp trong âm nhạc và âm thanh phức hợp; nâng cao năng lực thẩm mỹ, nhận biết biến chuyển cảm xúc tinh tế trong nghệ thuật và giao tiếp.',
    goldenRuleVi: 'Lắng nghe "màu sắc tổng thể" của hợp âm trước khi cố gắng bóc tách từng nốt. Chú ý nốt trầm nhất (Bass note) để xác định thể đảo gốc.',
    targetFunctionsVi: ['Tổng hợp Hòa âm Gestalt', 'Nhận diện Thể đảo Hợp âm', 'Phân tích Chồng âm', 'Cảm thụ Sắc thái Màu âm']
  },

  'rhythm-recall': {
    exerciseSlug: 'rhythm-recall',
    coreTheoryVi: 'Cộng Hưởng Thần Kinh Động Lực (Neural Resonance) & Đồng Bộ Cảm Giác - Vận Động',
    academicCitationVi: 'Large & Snyder (2009 - Pulse and meter as neural resonance); Repp (Sensorimotor synchronization)',
    neuralMechanismVi: 'Hạch nền (Basal Ganglia), Tiểu não (Cerebellum) và Vỏ não tiền vận động (SMA) phối hợp dao động cùng tần số với nhịp phách bên ngoài, tạo thành "đồng hồ nhịp sinh học" nội tại.',
    realWorldValueVi: 'Tăng khả năng căn thời gian (Internal timing), cảm giác nhịp điệu khi vận động, khiêu vũ, chơi thể thao, đọc sách nhịp nhàng và kiểm soát tốc độ phản ứng trong công việc.',
    goldenRuleVi: 'Đếm nhịp thầm hoặc gõ nhẹ đầu ngón tay để biến kích thích thính giác thành phản xạ vận động cơ thể (Embodied cognition).',
    targetFunctionsVi: ['Đồng bộ Cảm giác - Vận động', 'Phân đoạn Nhịp phách', 'Căn thời gian Nội tại', 'Trí nhớ Chuỗi Động lực']
  },

  'timbre-match': {
    exerciseSlug: 'timbre-match',
    coreTheoryVi: 'Phân Tích Phổ Âm Học Fourier & Chuỗi Bồi Âm Tự Nhiên (Harmonic Series)',
    academicCitationVi: 'McAdams & Bregman (Timbre perception); Rife & Vincent (Spectral envelope modeling)',
    neuralMechanismVi: 'Vỏ não thính giác thứ cấp (Secondary Auditory Cortex) phân tích đường bao biên độ (Attack/Decay envelope) và năng lượng phân bố trên các họa ba (Formant filtering), phân biệt nguồn phát âm ngay cả khi có cùng cao độ và âm lượng.',
    realWorldValueVi: 'Phân biệt giọng nói người quen trong môi trường ồn ào (Hiệu ứng Cocktail Party), nhận diện lỗi cơ khí/máy móc qua tiếng ồn, nhạy bén với âm thanh tự nhiên.',
    goldenRuleVi: 'Tập trung vào tiếng khởi đầu (Attack phase) và độ "dày / mỏng / ấm / sáng" của sóng âm thay vì chú ý đến cao độ.',
    targetFunctionsVi: ['Phân tích Dạng sóng', 'Cảm thụ Bồi âm & Họa ba', 'Tách lọc Âm trường', 'Nhận dạng Nguồn âm thanh']
  },

  'sound-localization': {
    exerciseSlug: 'sound-localization',
    coreTheoryVi: 'Lý Thuyết Song Nhĩ Duplex (ITD / ILD) & Hàm Truyền Đầu Người (HRTF)',
    academicCitationVi: 'Lord Rayleigh (1907 - Duplex Theory of sound localization); Blauert (Spatial Hearing)',
    neuralMechanismVi: 'Nhân trám trên giữa (MSO) đo chênh lệch thời gian micro-giây (ITD), nhân trám trên bên (LSO) đo chênh lệch cường độ (ILD), vỏ não đỉnh dựng bản đồ không gian 360° quanh đầu.',
    realWorldValueVi: 'Khả năng phản xạ định vị nguồn hiểm nguy trong không gian thực (tiếng còi xe, tiếng gọi, vật thể rơi), nâng cao nhận thức tình huống (Situational Awareness).',
    goldenRuleVi: 'Nhắm mắt khi lắng nghe qua tai nghe, hình dung hình chiếu không gian 3D xung quanh cơ thể trước khi bấm chọn phương vị.',
    targetFunctionsVi: ['Định vị Song nhĩ ITD/ILD', 'Bản đồ Không gian 360°', 'Nhận thức Tình huống', 'Phản xạ Định hướng Âm thanh']
  },

  'voice-track': {
    exerciseSlug: 'voice-track',
    coreTheoryVi: 'Phân Luồng Cảnh Quan Thính Giác (Auditory Stream Segregation)',
    academicCitationVi: 'Albert Bregman (1990 - Auditory Scene Analysis); Deutsch (Grouping mechanisms in music)',
    neuralMechanismVi: 'Mạng lưới chú ý thính giác chọn lọc (Selective Auditory Attention) kích hoạt hồi thái dương trên và rãnh đỉnh trong (Intraparietal Sulcus) để ức chế các luồng âm thanh nền và theo dõi liên tục giai điệu mục tiêu.',
    realWorldValueVi: 'Khả năng tập trung làm việc trong môi trường ồn ào; lắng nghe và thấu hiểu một cuộc hội thoại cụ thể giữa đám đông náo nhiệt.',
    goldenRuleVi: '"Khóa" sự chú ý vào âm sắc hoặc cao độ của bè mục tiêu ngay từ những nốt đầu tiên và giữ ánh mắt tâm trí tập trung vào luồng đó.',
    targetFunctionsVi: ['Phân luồng Thính giác Đa kênh', 'Chú ý Thính giác Chọn lọc', 'Ức chế Tạp âm Nền', 'Theo dõi Đa luồng']
  },

  // =========================================================================
  // 3. NHÓM THỊ GIÁC NGOẠI VI & VẬN NHÃN
  // =========================================================================
  'schulte-table': {
    exerciseSlug: 'schulte-table',
    coreTheoryVi: 'Trường Nhìn Chú Ý Hữu Dụng (Useful Field of View - UFOV) & Tâm Lý Học Schulte',
    academicCitationVi: 'Walter Schulte (1962); Ball & Owsley (1993 - Visual attention and driving safety); Curcio et al. (1990 - Human Photoreceptor Topography)',
    neuralMechanismVi: 'Kích hoạt mạng lưới tế bào que (chiếm ~95% tế bào cảm quang võng mạc ngoại vi theo Curcio et al., 1990); giải phóng vùng Fovea trung tâm hẹp để mở rộng chú ý thị giác phân tán lên tới 180°. Vỏ não đỉnh (Parietal Cortex) lập bản đồ tọa độ song song mà không cần giật mắt (Saccades).',
    realWorldValueVi: 'Tối ưu hóa nhịp quét và mở rộng biên độ đọc hiểu hướng tới 500-800+ WPM (Keith Rayner, 1998) nhờ giảm số lần dừng mắt (Fixations) từ 6-8 lần/dòng xuống còn 1-2 lần; bao quát tình huống giao thông toàn cảnh khi lái xe tốc độ cao.',
    goldenRuleVi: 'Khóa chặt ánh nhìn vào tâm lưới, tuyệt đối không đảo mắt sang hai bên. Hãy thả lỏng cơ mặt và để não bộ dùng thị giác ngoại vi "bắt trọn" vị trí con số.',
    targetFunctionsVi: ['Mở rộng Trường nhìn Ngoại vi', 'Chú ý Thị giác Phân bổ', 'Giảm Điểm dừng Nhảy mắt', 'Xử lý Song song 180°']
  },

  'peripheral-vision': {
    exerciseSlug: 'peripheral-vision',
    coreTheoryVi: 'Xử Lý Thị Giác Song Song & Lý Thuyết Vùng Parafoveal Preview',
    academicCitationVi: 'Keith Rayner (1998 - Eye movements in reading and information processing); Schotter et al. (2012)',
    neuralMechanismVi: 'Tăng độ nhạy tế bào hạch võng mạc loại M (Magnocellular pathway - chuyên trách bắt chuyển động và trường nhìn rộng ở tần số cao), truyền thẳng qua thể gối ngoài (LGN) về vỏ não thị giác sơ cấp V1.',
    realWorldValueVi: 'Đọc lướt và nắm bắt trọn vẹn cụm từ ở hai mép trang sách; phát hiện chuyển động bất ngờ ở góc khuất khi chơi thể thao hoặc điều khiển phương tiện.',
    goldenRuleVi: 'Giữ ánh mắt neo vào điểm trung tâm màu đỏ. Khi hai ký tự chớp sáng ở hai biên, không liếc mắt mà dùng "lớp nhớ tức thời" (Iconic memory) để nhận diện.',
    targetFunctionsVi: ['Độ nhạy Tế bào Que Võng mạc', 'Nhận diện Ký tự Biên', 'Tốc độ Lưu ảnh Tức thời', 'Khóa Trục Mắt Cố định']
  },

  'green-dot': {
    exerciseSlug: 'green-dot',
    coreTheoryVi: 'Khóa Cố Định Thị Giác (Fixation Stability) & Ức Chế Saccadic Vi Sai',
    academicCitationVi: 'Martinez-Conde, Macknik & Hubel (2004 - The role of fixational eye movements in visual perception)',
    neuralMechanismVi: 'Vùng vận nhãn trán (Frontal Eye Fields - FEF) và củ não sinh tư trên (Superior Colliculus) phát tín hiệu ức chế các xung giật mắt vô thức, đưa tâm trí vào trạng thái sóng não Alpha (8-12 Hz) thư giãn sâu nhưng tỉnh thức cao độ.',
    realWorldValueVi: 'Tăng cường khả năng tập trung sâu (Deep Work), kiểm soát sự xao nhãng, làm dịu căng thẳng thần kinh thị giác sau thời gian dài nhìn màn hình.',
    goldenRuleVi: 'Thả lỏng ánh nhìn nhẹ nhàng vào tâm điểm xanh, hít thở đều, quan sát các dòng chữ xung quanh mờ đi rồi sáng rõ theo từng nhịp thở mà không được chuyển mắt.',
    targetFunctionsVi: ['Ổn định Trục nhìn Cố định', 'Tỉnh thức Sóng não Alpha', 'Ức chế Xao nhãng Nhãn cầu', 'Thư giãn Cơ mắt Sâu']
  },

  'saccade-tracker': {
    exerciseSlug: 'saccade-tracker',
    coreTheoryVi: 'Động Học Chuyển Động Mắt Saccadic & Ức Chế Nhảy Mắt Thừa',
    academicCitationVi: 'Alfred Yarbus (1967 - Eye Movements and Vision); Leigh & Zee (The Neurology of Eye Movements)',
    neuralMechanismVi: 'Tăng tốc độ nhảy mắt chuẩn xác (Ballistic saccades) và giảm thời gian ức chế thị giác khi mắt chuyển động (Saccadic suppression), điều khiển bởi mạng lưới thân não (PPRF) và tiểu não.',
    realWorldValueVi: 'Di chuyển mắt chính xác từ cuối dòng này sang đầu dòng kế tiếp mà không bị nhảy nhầm dòng; quét lướt tài liệu, hợp đồng, báo cáo với tốc độ cực cao.',
    goldenRuleVi: 'Bắt nhịp mắt chính xác theo điểm đích; chuyển mắt dứt khoát thành một cú nhảy đơn nhất thay vì nhiều cú giật nhỏ điều chỉnh (Correction saccades).',
    targetFunctionsVi: ['Động học Nhảy mắt Chuẩn xác', 'Triệt tiêu Nhảy nhầm Dòng', 'Tốc độ Quét lướt Thị giác', 'Phối hợp Vận nhãn Thần kinh']
  },

  // =========================================================================
  // 4. NHÓM ĐỌC NHANH & NHẬN THỨC NGÔN NGỮ
  // =========================================================================
  'rsvp-speed-reader': {
    exerciseSlug: 'rsvp-speed-reader',
    coreTheoryVi: 'Trình Diễn Thị Giác Tuần Tự Nhanh (Rapid Serial Visual Presentation - RSVP)',
    academicCitationVi: 'Mary C. Potter (1976 - Short-term conceptual memory for pictures); Forster (1970)',
    neuralMechanismVi: 'Triệt tiêu hoàn toàn thời gian lãng phí cho việc di chuyển mắt cơ học (Saccadic latency chiếm 70% thời gian đọc thông thường), kích thích trực tiếp vùng Từ hình Thị giác (Visual Word Form Area - VWFA) tại thùy thái dương - chẩm trái.',
    realWorldValueVi: 'Nén thời gian đọc tài liệu nghiên cứu, sách báo gấp 3-5 lần mà vẫn nắm bắt trọn vẹn ý chính; triệt tiêu thói quen đọc thầm thành tiếng (Subvocalization).',
    goldenRuleVi: 'Không cố gắng đọc từng từ trong đầu; hãy tiếp nhận từ ngữ như những hình ảnh trực tiếp và để ý nghĩa tự động nảy sinh trong tâm trí.',
    targetFunctionsVi: ['Triệt tiêu Đọc thầm Nội tâm', 'Tốc độ Đọc Hiểu 800+ WPM', 'Nhận diện Từ hình Trực giác', 'Nén Thời gian Xử lý']
  },

  'word-chunking': {
    exerciseSlug: 'word-chunking',
    coreTheoryVi: 'Lý Thuyết Phân Khối Nhận Thức (Chunking Theory) & Nhận Thức Cụm Ngữ Nghĩa',
    academicCitationVi: 'George A. Miller (1956 - The Magical Number Seven, Plus or Minus Two); Fernand Gobet (2005)',
    neuralMechanismVi: 'Mã hóa ngữ nghĩa bậc cao tại vỏ não trước trán, gom cụm 3-5 từ riêng lẻ thành một "khối ý niệm" duy nhất (Semantic chunk), giảm tải áp lực lên bộ nhớ làm việc.',
    realWorldValueVi: 'Đọc hiểu văn bản theo cụm nghĩa thay vì đọc từng chữ rời rạc; tư duy tổng hợp và nắm bắt cấu trúc luận điểm của tác giả trong chớp mắt.',
    goldenRuleVi: 'Cố định mắt vào khoảng trắng giữa các từ trong khối; nhìn trọn cả cụm từ như một chỉnh thể trọn vẹn.',
    targetFunctionsVi: ['Gom khối Ngữ nghĩa Chunking', 'Mở rộng Bước nhảy Đọc', 'Nắm bắt Cấu trúc Luận điểm', 'Tối ưu Bộ nhớ Làm việc']
  },

  'word-search': {
    exerciseSlug: 'word-search',
    coreTheoryVi: 'Lý Thuyết Tích Hợp Đặc Trưng Thị Giác (Feature Integration Theory)',
    academicCitationVi: 'Anne Treisman & Garry Gelade (1980 - A feature-integration theory of attention)',
    neuralMechanismVi: 'Phối hợp xử lý từ dưới lên (Bottom-up: hình dáng ký tự) và từ trên xuống (Top-down: mục tiêu tìm kiếm từ vựng) tại vỏ não trước trán và thùy đỉnh.',
    realWorldValueVi: 'Khả năng trích xuất thông tin trọng tâm giữa một "rừng" dữ liệu, báo cáo tài chính hoặc mã nguồn lập trình.',
    goldenRuleVi: 'Quét theo đường zig-zag hoặc theo chữ cái đầu tiên hiếm gặp (như Q, X, K, Z) để định vị mỏ neo nhanh nhất.',
    targetFunctionsVi: ['Tìm kiếm Thị giác Không gian', 'Trích xuất Dữ liệu Nhiễu', 'Tích hợp Đặc trưng Ký tự', 'Tập trung Mục tiêu Đơn lập']
  },

  'reading-assessment': {
    exerciseSlug: 'reading-assessment',
    coreTheoryVi: 'Chỉ Số Hiệu Quả Đọc Toàn Diện (Effective Reading Rate: WPM × Comprehension)',
    academicCitationVi: 'Carver (1990 - Reading Rate: A Review of Research and Theory); Just & Carpenter (1980)',
    neuralMechanismVi: 'Đo lường năng lực tích hợp liên tục giữa Tốc độ giải mã từ vựng (Lexical access speed) và Khả năng lập mô hình tình huống văn bản (Situation model building) tại thùy thái dương và trán.',
    realWorldValueVi: 'Đánh giá trung thực năng lực đọc hiểu của bản thân; thiết lập điểm chuẩn (Baseline) khoa học để theo dõi lộ trình phát triển trí tuệ.',
    goldenRuleVi: 'Đọc với tốc độ tự nhiên nhưng tỉnh thức; tập trung vào ý tưởng chính, cấu trúc nguyên nhân - kết quả thay vì bận tâm các chi tiết số liệu phụ.',
    targetFunctionsVi: ['Đo lường Chỉ số Đọc Chuẩn', 'Xây dựng Mô hình Tình huống', 'Tích hợp Tốc độ & Độ hiểu', 'Định vị Năng lực Nhận thức']
  },

  'reading-pacer': {
    exerciseSlug: 'reading-pacer',
    coreTheoryVi: 'Dẫn Nhịp Nhận Thức Thị Giác (Visual Pacing) & Triệt Tiêu Đọc Thụt Lùi (Regressions)',
    academicCitationVi: 'Evelyn Wood (Reading Dynamics); Rayner & Pollatsek (1989 - The Psychology of Reading)',
    neuralMechanismVi: 'Sử dụng tín hiệu dẫn nhịp thị giác (Visual pacer) để đồng bộ hóa tần số quét mắt, ngăn ngừa hiện tượng mắt đọc thụt lùi (Regressions) do nghi ngờ không cần thiết.',
    realWorldValueVi: 'Xây dựng kỷ luật tốc độ đọc ổn định; kiểm soát thời gian đọc sách; ép não bộ nâng ngưỡng chịu tải thông tin lên cấp độ mới.',
    goldenRuleVi: 'Luôn bám sát thanh dẫn nhịp; nếu bỏ lỡ 1 từ, hãy tiếp tục tiến tới mà không dừng lại, não bộ sẽ tự động điền khuyết dựa vào ngữ cảnh (Contextual inference).',
    targetFunctionsVi: ['Dẫn nhịp Thị giác Ổn định', 'Triệt tiêu Mắt Đọc Thụt lùi', 'Dự đoán Ngữ cảnh Điền khuyết', 'Tăng tốc Đọc Chủ động']
  },

  // =========================================================================
  // 5. NHÓM CHÚ Ý TẬP TRUNG & KIỂM SOÁT ỨC CHẾ
  // =========================================================================
  'find-letter': {
    exerciseSlug: 'find-letter',
    coreTheoryVi: 'Chú Ý Tập Trung Chọn Lọc & Ức Chế Tín Hiệu Nhiễu Tương Đồng (Feature Inhibition)',
    academicCitationVi: 'Ulric Neisser (1967 - Cognitive Psychology); Michael Posner (Attentional Networks)',
    neuralMechanismVi: 'Tăng cường ức chế tín hiệu nhiễu tại đồi thị (Thalamic reticular nucleus) và tăng độ phân giải nhận dạng mẫu hình tại vùng chẩm - thái dương bụng.',
    realWorldValueVi: 'Khả năng phát hiện lỗi chính tả, sai lệch số liệu kế toán, rà soát văn bản hợp đồng không tì vết.',
    goldenRuleVi: 'Giữ hình ảnh mẫu ký tự mục tiêu trong bộ nhớ đệm; quét ma trận theo dòng mượt mà và nhấp dứt khoát khi thấy đối tượng khớp nét.',
    targetFunctionsVi: ['Chú ý Chọn lọc Chi tiết', 'Ức chế Ký tự Gây nhiễu', 'Độ phân giải Quét Thị giác', 'Phát hiện Sai lệch Nhỏ']
  },

  'find-number': {
    exerciseSlug: 'find-number',
    coreTheoryVi: 'Tập Trung Thị Giác Không Gian & Nhận Dạng Ký Tự Số Nhanh',
    academicCitationVi: 'Dehaene (1997 - The Number Sense); Posner & Petersen (1990)',
    neuralMechanismVi: 'Kích hoạt Rãnh nội đỉnh (IPS) phụ trách nhận thức số lượng và vùng V4 nhận dạng hình thái số học, giảm thiểu thời gian tìm kiếm mục tiêu trong lưới số hỗn loạn.',
    realWorldValueVi: 'Đọc và đối chiếu hóa đơn, chứng từ, mã giao dịch ngân hàng nhanh chóng, chính xác tuyệt đối trong môi trường áp lực cao.',
    goldenRuleVi: 'Tập trung vào đặc trưng hình học của con số mục tiêu (nét cong tròn như 8, 0, 6 hay nét thẳng góc như 1, 4, 7) để lọc nhanh.',
    targetFunctionsVi: ['Nhận thức Số lượng Tốc độ', 'Lọc Nhiễu Ma trận Số', 'Định vị Không gian Phẳng', 'Phản xạ Chạm Mục tiêu']
  },

  'twin-words': {
    exerciseSlug: 'twin-words',
    coreTheoryVi: 'Hiệu Ứng Lân Cận Chỉnh Thể (Orthographic Neighborhood Effect)',
    academicCitationVi: 'Max Coltheart et al. (1977 - Access to the internal lexicon for full and reduced words)',
    neuralMechanismVi: 'Vùng VWFA và hồi góc (Angular Gyrus) phân tích độ tương đồng chỉnh thể của hai chuỗi ký tự, ngăn ngừa hiện tượng não bộ "đoán mò" dựa trên chữ cái đầu và cuối.',
    realWorldValueVi: 'Tránh nhầm lẫn các từ ngữ gần giống nhau trong giao tiếp, dịch thuật và đọc văn bản pháp lý.',
    goldenRuleVi: 'So sánh song song hai từ; chú ý đặc biệt đến các nguyên âm và phụ âm nằm ở vị trí giữa từ.',
    targetFunctionsVi: ['Phân biệt Từ vựng Cận thị', 'Chính xác Hóa Âm vị', 'Chống Đọc Đoán Mò', 'Kiểm định Song song Chuỗi']
  },

  'text-scanning': {
    exerciseSlug: 'text-scanning',
    coreTheoryVi: 'Chiến Lược Quét Thông Tin Ngữ Nghĩa (Visual Scanning & Lexical Filtering)',
    academicCitationVi: 'Guthrie & Mosenthal (1987 - Technology of text search); Rayner (Eye movements in reading)',
    neuralMechanismVi: 'Vỏ não trán trước kích hoạt bản đồ từ khóa (Keyword template); mắt lướt qua các từ chức năng (hư từ) và dừng lại khi có tín hiệu khớp từ nội dung.',
    realWorldValueVi: 'Tra cứu tài liệu tham khảo, tìm câu trả lời trong kỳ thi trắc nghiệm hoặc tài liệu kỹ thuật trong vài giây.',
    goldenRuleVi: 'Đọc kỹ câu hỏi trước để tạo bộ lọc từ khóa trong tâm trí; quét mắt hình chữ S hoặc chữ Z từ trên xuống dưới.',
    targetFunctionsVi: ['Lọc Thông tin Hướng mục tiêu', 'Quét Đọc Hình chữ S/Z', 'Bắt Từ khóa Trọng tâm', 'Trích xuất Dữ liệu Nhanh']
  },

  'rule-mutation-clash': {
    exerciseSlug: 'rule-mutation-clash',
    coreTheoryVi: 'Linh Hoạt Nhận Thức (Cognitive Flexibility) & Chi Phí Chuyển Đổi Quy Tắc (Task-Switching)',
    academicCitationVi: 'Stephen Monsell (2003 - Task switching); David Grant & Esta Berg (Wisconsin Card Sorting Test)',
    neuralMechanismVi: 'Vỏ não trước trán lưng bên (DLPFC) và vùng Vỏ não đai trước (ACC) theo dõi xung đột quy tắc thời gian thực, ức chế quy tắc cũ (Inhibition) và nạp tức thì quy tắc mới vào bộ nhớ làm việc.',
    realWorldValueVi: 'Khả năng thích ứng nhanh nhạy khi kế hoạch công việc thay đổi đột ngột; ứng biến linh hoạt trong đàm phán và xử lý khủng hoảng.',
    goldenRuleVi: 'Khi có thông báo biến dị quy tắc, lập tức nhắc thầm trong đầu quy tắc mới; không hành động theo thói quen cũ.',
    targetFunctionsVi: ['Linh hoạt Chuyển đổi Nhiệm vụ', 'Ức chế Thói quen Cố hữu', 'Theo dõi Xung đột Nhận thức', 'Thích ứng Biến số Động']
  },

  // =========================================================================
  // 6. NHÓM TRÍ NHỚ LÀM VIỆC & MÔ HÌNH NHẬN THỨC
  // =========================================================================
  'dual-nback': {
    exerciseSlug: 'dual-nback',
    coreTheoryVi: 'Mô Hình Trí Nhớ Làm Việc Baddeley & Nâng Cao Trí Thông Minh Lưu Chất (Fluid IQ)',
    academicCitationVi: 'Susanne M. Jaeggi et al. (2008 - Improving fluid intelligence with training on working memory, PNAS); Baddeley (2000)',
    neuralMechanismVi: 'Đồng thời kích hoạt Bộ phác thảo Thị giác - Không gian (Visuospatial Sketchpad) và Vòng lặp Ngữ âm (Phonological Loop) dưới sự điều phối của Hệ thống Điều hành Trung ương (Central Executive) tại DLPFC và vỏ não đỉnh.',
    realWorldValueVi: 'Mở rộng dung lượng não bộ (Working Memory Capacity), tăng chỉ số IQ lưu chất (Fluid Intelligence), giải quyết đồng thời nhiều luồng thông tin phức tạp mà không bị quá tải.',
    goldenRuleVi: 'Không nhẩm lại toàn bộ lịch sử các bước; chỉ duy trì một "hàng đợi dịch chuyển" (sliding window) gồm N phần tử gần nhất và cập nhật liên tục nốt mới vào hàng đợi.',
    targetFunctionsVi: ['Trí nhớ Làm việc Kép', 'Trí thông minh Lưu chất Gf', 'Điều hành Trung ương Đa kênh', 'Cập nhật Luồng Dữ liệu Liên tục']
  },

  'spatial-memory': {
    exerciseSlug: 'spatial-memory',
    coreTheoryVi: 'Trí Nhớ Không Gian Ngắn Hạn & Khối Corsi (Corsi Block-Tapping Test)',
    academicCitationVi: 'Philip M. Corsi (1972 - Human memory and the medial temporal region of the brain); Brenda Milner (1971)',
    neuralMechanismVi: 'Luồng thị giác lưng (Dorsal "Where" stream) kết nối V1 qua vỏ não đỉnh đến hồi hải mã, mã hóa tọa độ không gian 3D và trật tự thời gian xuất hiện của các khối.',
    realWorldValueVi: 'Khả năng ghi nhớ sơ đồ, bố cục kiến trúc, tư duy hình học không gian và các thao tác thủ công tinh xảo.',
    goldenRuleVi: 'Nối các khối thành một "quỹ đạo chuyển động hình học" (Vector path: hình tam giác, chữ Z, hình xoắn ốc) thay vì nhớ tọa độ rời rạc.',
    targetFunctionsVi: ['Trí nhớ Khối Không gian 3D', 'Bộ phác thảo Thị giác', 'Mã hóa Trật tự Thời gian', 'Tái hiện Quỹ đạo Chuyển động']
  },

  'card-flip': {
    exerciseSlug: 'card-flip',
    coreTheoryVi: 'Trí Nhớ Liên Tưởng Vị Trí (Associative Memory) & Tái Hồi Tưởng Chủ Động (Active Recall)',
    academicCitationVi: 'Tulving (1983 - Elements of Episodic Memory); Squire (Memory and Brain)',
    neuralMechanismVi: 'Hồi hải mã (Hippocampus) thiết lập các liên kết synap bền vững giữa "nội dung thẻ" và "tọa độ ô lưới", kích hoạt quá trình hồi tưởng chủ động (Active Recall).',
    realWorldValueVi: 'Nhớ vị trí tài liệu, hồ sơ, đồ đạc trong nhà và văn phòng; ghi nhớ thông tin nhiều chiều của đối tác và khách hàng.',
    goldenRuleVi: 'Gom nhóm các thẻ theo cặp danh mục hoặc tạo một câu chuyện ngắn kết nối vị trí các thẻ lại với nhau.',
    targetFunctionsVi: ['Trí nhớ Liên tưởng Tọa độ', 'Hồi tưởng Chủ động', 'Lập Bản đồ Thẻ Không gian', 'Cố định Vết tích Synapse']
  },

  'digit-span': {
    exerciseSlug: 'digit-span',
    coreTheoryVi: 'Dung Lượng Nhớ Tức Thời Miller & Thử Nghiệm Chuỗi Số Chuẩn WAIS',
    academicCitationVi: 'George A. Miller (1956); David Wechsler (Wechsler Adult Intelligence Scale - Digit Span)',
    neuralMechanismVi: 'Vòng lặp ngữ âm (Phonological store & Articulatory rehearsal) duy trì chuỗi chữ số trước khi vết tích thần kinh suy giảm sau 2-3 giây.',
    realWorldValueVi: 'Nhớ nhanh số điện thoại, mã OTP ngân hàng, số tài khoản, biển số xe và các thông số kỹ thuật tức thời.',
    goldenRuleVi: 'Gom nhóm (Chunking) các chữ số thành cụm 3 hoặc 4 số (ví dụ: 0912-345-678) để giảm tải số lượng đơn vị nhớ.',
    targetFunctionsVi: ['Dung lượng Bộ nhớ Ngữ âm', 'Duy trì Vết tích Tức thời', 'Gom nhóm Chữ số Chunking', 'Tái hiện Chuỗi Xuôi/Ngược']
  },

  'anagram': {
    exerciseSlug: 'anagram',
    coreTheoryVi: 'Kích Hoạt Lan Tỏa Ngữ Nghĩa & Tái Cấu Trúc Âm Vị Từ Vựng',
    academicCitationVi: 'Allan M. Collins & Elizabeth F. Loftus (1975 - A spreading-activation theory of semantic processing)',
    neuralMechanismVi: 'Vỏ não trán dưới trái (Left IFG) thực hiện tìm kiếm và tái tổ hợp thứ tự âm vị trong bộ từ vựng tinh thần (Mental Lexicon), giải phóng các mẫu hình ký tự bị xáo trộn.',
    realWorldValueVi: 'Độ linh hoạt ngôn ngữ vượt trội, giải quyết vấn đề bằng tư duy đa chiều, khả năng viết lách và diễn đạt ý tưởng trôi chảy.',
    goldenRuleVi: 'Tách riêng các nguyên âm và phụ âm; tìm kiếm các cụm tiền tố/hậu tố quen thuộc để thu hẹp phạm vi đoán từ.',
    targetFunctionsVi: ['Linh hoạt Từ vựng Tinh thần', 'Tái tổ hợp Ký tự Nhanh', 'Kích hoạt Lan tỏa Ngữ nghĩa', 'Giải quyết Vấn đề Bất quy tắc']
  },

  'graph-memory-matrix': {
    exerciseSlug: 'graph-memory-matrix',
    coreTheoryVi: 'Mô Hình Nhận Thức Đồ Thị (Graph Mental Models) & Mã Hóa Quan Hệ Đa Chiều',
    academicCitationVi: 'Johnson-Laird (1983 - Mental Models); Battaglia et al. (Relational inductive biases, deep learning, and graph networks)',
    neuralMechanismVi: 'Mạng lưới mặc định (Default Mode Network) và Mạng lưới Điều hành Trung ương phối hợp lưu giữ các nút thực thể và các cạnh liên kết có hướng trong không gian nhận thức.',
    realWorldValueVi: 'Hiểu sâu sắc sơ đồ tổ chức doanh nghiệp, kiến trúc hệ thống phần mềm, phân tích quan hệ mạng xã hội và chuỗi cung ứng.',
    goldenRuleVi: 'Tập trung vào các nút giao trung tâm (Hub nodes) có nhiều liên kết nhất làm điểm tựa để mở rộng ra các nút lá lân cận.',
    targetFunctionsVi: ['Mã hóa Đồ thị Thực thể', 'Trí nhớ Cấu trúc Mạng', 'Phân tích Nút & Cạnh', 'Tư duy Hệ thống Đa tầng']
  },

  // =========================================================================
  // 7. NHÓM PHẢN XẠ & XỬ LÝ XUNG ĐỘT
  // =========================================================================
  'stroop-clash': {
    exerciseSlug: 'stroop-clash',
    coreTheoryVi: 'Hiệu Ứng Xung Đột Stroop & Ức Chế Phản Ứng Tự Động (Inhibitory Control)',
    academicCitationVi: 'J. Ridley Stroop (1935 - Studies of interference in serial verbal reactions); MacLeod (1991)',
    neuralMechanismVi: 'Vỏ não đai trước (Anterior Cingulate Cortex - ACC) phát hiện xung đột dữ dội giữa quá trình đọc chữ tự động và quá trình nhận diện màu mực, kích hoạt Vỏ não trước trán (DLPFC) để ức chế xung lực bấm sai.',
    realWorldValueVi: 'Khả năng làm chủ cảm xúc và hành vi, không phản ứng bốc đồng trước các cám dỗ hoặc tin tức giả mạo; ra quyết định sáng suốt dưới áp lực cao.',
    goldenRuleVi: 'Hướng sự chú ý vào "sắc tố màu mực" của chữ, làm mờ đi ngữ nghĩa của từ ngữ; hít thở sâu và duy trì sự bình tĩnh trước khi bấm nút.',
    targetFunctionsVi: ['Kiểm soát Ức chế Thùy Trán', 'Giải quyết Xung đột Nhận thức', 'Chống Phản xạ Bốc đồng', 'Tập trung Ý chí Chọn lọc']
  },

  'even-odd': {
    exerciseSlug: 'even-odd',
    coreTheoryVi: 'Thời Gian Phản Ứng Lựa Chọn (Choice Reaction Time) & Định Luật Hick-Hyman',
    academicCitationVi: 'William Edmund Hick (1952); Ray Hyman (1953); Dehaene (1993 - SNARC effect)',
    neuralMechanismVi: 'Rãnh nội đỉnh (Intraparietal Sulcus - IPS) nhận diện thuộc tính chẵn lẻ của con số, gửi tín hiệu đến vỏ não vận động để kích hoạt ngón tay tương ứng trong vài trăm mili-giây.',
    realWorldValueVi: 'Tăng tốc độ phản xạ thể chất và tinh thần, phán đoán nhanh chóng các tình huống nhị phân (Đúng/Sai, Được/Mất) trong công việc và cuộc sống.',
    goldenRuleVi: 'Tập trung vào chữ số hàng đơn vị cuối cùng; đặt sẵn hai ngón tay lên hai phím điều khiển để tối ưu hóa thời gian cơ học.',
    targetFunctionsVi: ['Thời gian Phản xạ Nhị phân', 'Phân loại Số học Cấp tốc', 'Điều phối Cảm giác - Vận động', 'Chống Do dự Quyết định']
  },

  'relational-network': {
    exerciseSlug: 'relational-network',
    coreTheoryVi: 'Tư Duy Suy Luận Quan Hệ Động Học (Relational Reasoning & Analogy)',
    academicCitationVi: 'Graeme S. Halford et al. (1998 - Relational processing in higher cognition); Dedre Gentner (Structure-mapping)',
    neuralMechanismVi: 'Vỏ não trước trán cực trán (Rostrolateral Prefrontal Cortex - RLPFC) điều phối việc so sánh và tích hợp nhiều quan hệ trừu tượng đồng thời (Higher-order relational integration).',
    realWorldValueVi: 'Khả năng tư duy chiến lược, nhìn ra mối liên hệ ngầm giữa các sự kiện kinh tế - xã hội tưởng chừng không liên quan; giải quyết các bài toán chiến lược hóc búa.',
    goldenRuleVi: 'Đặt câu hỏi: "Đối tượng A tác động gì lên B?" và "Điều đó làm thay đổi quan hệ giữa B và C như thế nào?". Suy nghĩ theo hệ thống thay vì nhìn nhận cô lập.',
    targetFunctionsVi: ['Suy luận Quan hệ Cấp cao', 'Tích hợp Đa biến số', 'Tư duy Hệ thống Động', 'Nhận diện Mô thức Ngầm']
  },

  'causal-cascade': {
    exerciseSlug: 'causal-cascade',
    coreTheoryVi: 'Mô Hình Suy Luận Nhân Quả Động (Causal Bayes Nets) & Mô Phỏng Xuôi Dòng',
    academicCitationVi: 'Judea Pearl (2000 - Causality); Steven Sloman (2005 - Causal Models: How People Think About the World)',
    neuralMechanismVi: 'Vỏ não trước trán vùng giữa (mPFC) và tiểu não thực hiện mô phỏng xuôi dòng (Forward mental simulation) để dự đoán chuỗi kết quả domino tiếp theo dựa trên các tác nhân kích hoạt ban đầu.',
    realWorldValueVi: 'Dự báo rủi ro dự án, lường trước hệ quả gián tiếp của các quyết định kinh doanh hoặc chính sách trước khi thi hành.',
    goldenRuleVi: 'Nhận diện mắt xích yếu nhất trong chuỗi; theo dõi điểm kích hoạt (Trigger point) và lần theo đường truyền năng lượng từng bước một.',
    targetFunctionsVi: ['Dự báo Chuỗi Nhân Quả', 'Mô phỏng Xuôi dòng', 'Quản trị Rủi ro Tương lai', 'Phân tích Điểm Kích hoạt Domino']
  }
};

/**
 * Lấy cơ sở khoa học & giá trị nhận thức chuẩn cho bất kỳ bài tập nào
 */
export function getExerciseRationale(slug: ExerciseSlug): IExerciseCognitiveRationale {
  const rationale = EXERCISE_COGNITIVE_RATIONALES[slug];
  if (rationale) return rationale;

  // Fallback an toàn nếu slug mới chưa kịp bổ sung
  return {
    exerciseSlug: slug,
    coreTheoryVi: 'Mô Hình Nhận Thức Ứng Dụng & Tính Dẻo Dai Thần Kinh (Neuroplasticity)',
    academicCitationVi: 'Michael Merzenich (Soft-Wired); Eric Kandel (Principles of Neural Science)',
    neuralMechanismVi: 'Kích thích hình thành các khớp nối thần kinh mới (Synaptogenesis) và tăng cường tốc độ dẫn truyền tín hiệu dọc theo sợi trục thần kinh (Myelination) thông qua các bài tập lặp lại có chủ đích.',
    realWorldValueVi: 'Gia tăng dung lượng trí nhớ làm việc, tốc độ xử lý thông tin và khả năng thích ứng linh hoạt trước những thách thức phức tạp trong học tập và công việc.',
    goldenRuleVi: 'Duy trì luyện tập đều đặn mỗi ngày ở ngưỡng thử thách vừa phải (vùng phát triển gần nhất - ZPD) để kích hoạt tối đa tính dẻo dai não bộ.',
    targetFunctionsVi: ['Tính dẻo dai Não bộ', 'Xử lý Thông tin Tốc độ', 'Thích ứng Nhận thức', 'Tập trung Bền bỉ']
  };
}
