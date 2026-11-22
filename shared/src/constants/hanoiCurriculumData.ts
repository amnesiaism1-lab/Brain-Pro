/**
 * GIÁO TRÌNH 12 CHƯƠNG CHUYÊN SÂU, NGÂN HÀNG 20 CÂU HỎI CHẨN ĐOÁN
 * VÀ 24 THẺ FLASHCARDS ÔN LUYỆN PHẢN XẠ BẢN ĐỒ HÀ NỘI
 * Thiết kế theo nguyên lý Sư phạm Không gian (Spatial Pedagogy):
 * Chunking (Miller) · Dual-Coding (Paivio) · Progressive Disclosure · Active Recall
 */

export type HanoiLearningStageId =
  | 'stage-1-foundation'
  | 'stage-2-macro'
  | 'stage-3-micro'
  | 'stage-4-mastery';

export interface IHanoiLearningStage {
  id: HanoiLearningStageId;
  stageNumber: number;
  title: string;
  subtitle: string;
  goalVi: string;
  colorAccent: 'cyan' | 'amber' | 'violet' | 'emerald';
  chapterNumbers: number[];
}

export const HANOI_LEARNING_STAGES: IHanoiLearningStage[] = [
  {
    id: 'stage-1-foundation',
    stageNumber: 1,
    title: 'Giai Đoạn 1: Nền Tảng Nhận Thức & Khung Thủy Văn',
    subtitle: 'Xây dựng hệ tọa độ gốc, sông hồ biên giới và thứ tự cầu vượt sông',
    goalVi: 'Hiểu cơ chế não bộ ghi nhớ không gian, xoay trục bản đồ 360° và nắm vững Sông Hồng – Hồ Tây – Hồ Gươm cùng chuỗi cầu Thượng lưu → Hạ lưu.',
    colorAccent: 'cyan',
    chapterNumbers: [1, 2, 3]
  },
  {
    id: 'stage-2-macro',
    stageNumber: 2,
    title: 'Giai Đoạn 2: Hình Học Vĩ Mô – Quận Huyện, Vành Đai & Đồng Hồ 12h',
    subtitle: 'Nắm trọn bộ khung xương toàn thành phố chỉ trong 15 phút',
    goalVi: 'Gom cụm 30 quận/huyện/thị xã theo lớp đồng tâm, thuộc chuỗi tên phố của 6 Vành đai (1 → 4) và định vị 12 trục hướng tâm theo mặt đồng hồ.',
    colorAccent: 'amber',
    chapterNumbers: [4, 5, 6]
  },
  {
    id: 'stage-3-micro',
    stageNumber: 3,
    title: 'Giai Đoạn 3: Hình Học Vi Mô – Phố Pháp, Phố Cổ, Ô Phố & Ngõ Ngách',
    subtitle: 'Làm chủ mê cung nội đô, cặp đường 1 chiều và ngữ pháp địa chỉ',
    goalVi: 'Thuộc lòng lưới ô bàn cờ Phố Pháp, quy luật đường 1 chiều đối xứng, 9 khối ô phố (Superblocks) và cách đọc số nhà – ngõ – ngách – cổng phụ.',
    colorAccent: 'violet',
    chapterNumbers: [7, 8, 9]
  },
  {
    id: 'stage-4-mastery',
    stageNumber: 4,
    title: 'Giai Đoạn 4: Thực Chiến Điều Hướng, Hạ Tầng Đa Tầng & Sinh Tồn Không GPS',
    subtitle: 'Tự động hóa phản xạ lập tuyến và phục hồi phương hướng bằng giác quan',
    goalVi: 'Sử dụng Metro/BRT làm la bàn trên cao, tránh tuyệt đối bẫy làn cấm xe máy, đọc hướng nắng mặt trời 21.03°N và lập tuyến tối ưu A → B trong 3 giây.',
    colorAccent: 'emerald',
    chapterNumbers: [10, 11, 12]
  }
];

export interface ITheoryChapter {
  id: string;
  chapterNumber: number;
  stageId: HanoiLearningStageId;
  difficulty: 'Cơ bản' | 'Trung cấp' | 'Chuyên sâu';
  title: string;
  subtitle: string;
  badge: string;
  iconName: string;
  readTimeMin: number;
  recommendedPracticeMode: string;
  recommendedPracticeLabel: string;
  cognitiveMechanism: string;
  keyTakeaways: string[];
  quickCheck: {
    question: string;
    answer: string;
  };
  contentMarkdown: string;
}

export const HANOI_THEORY_CHAPTERS: ITheoryChapter[] = [
  // =========================================================================
  // CHƯƠNG 1
  // =========================================================================
  {
    id: 'chapter-lynch-framework',
    chapterNumber: 1,
    stageId: 'stage-1-foundation',
    difficulty: 'Cơ bản',
    title: 'Khoa Học Bản Đồ Nhận Thức: 5 Thực Thể Kevin Lynch & Nguyên Lý Chunking',
    subtitle: 'Vì sao học vẹt tên phố chắc chắn thất bại, và cách các tài xế kỳ cựu mã hóa Hà Nội vào Hồi hải mã',
    badge: 'Nền Tảng Khoa Học',
    iconName: 'Brain',
    readTimeMin: 7,
    recommendedPracticeMode: 'which_intersection',
    recommendedPracticeLabel: 'Luyện Chế độ C: Nhận diện Nút giao',
    cognitiveMechanism: 'Tế bào vị trí Hồi hải mã (Hippocampal Place Cells) · Tế bào lưới (Entorhinal Grid Cells) · Phân cụm George Miller (Chunking 5±2)',
    keyTakeaways: [
      'Chứng "mù đường" không phải do trí nhớ kém, mà do cố nhớ các đoạn đường rời rạc (Route Memory) thay vì cấu trúc không gian tổng thể (Survey Map).',
      'Mọi đô thị phức tạp đều quy về đúng 5 nhóm thực thể của Kevin Lynch: Edges (Biên), Landmarks (Mốc), Districts (Vùng), Paths (Trục), Nodes (Nút).',
      'Học bản đồ Hà Nội phải đi từ Vĩ mô xuống Vi mô (Lớp Sông Hồ → Lớp Vành Đai → Lớp Trục Đồng Hồ → Lớp Ô Phố → Lớp Ngõ Ngách).'
    ],
    quickCheck: {
      question: 'Trong 5 thành phần của Kevin Lynch, Sông Hồng và tuyến đường sắt Bắc – Nam đóng vai trò là thành phần nào?',
      answer: 'Edges (Ranh giới / Biên phân cách tuyến tính) – vì chúng chia cắt không gian thành hai bờ rõ rệt và chỉ cho phép băng qua tại các cầu hoặc điểm giao cắt cố định.'
    },
    contentMarkdown: `
### 1. Căn bệnh "Nhớ tuyến rời rạc" (Route Fragmentation) tại Hà Nội

Hầu hết người đi đường ở Hà Nội học đường theo kiểu **chuỗi lệnh rẽ vẹt**: *"Ra khỏi ngõ rẽ trái, gặp cây xăng rẽ phải, đi qua quán phở rẽ trái tiếp"*. Các nhà thần kinh học gọi đây là **Trí nhớ lộ trình tuyến tính (Sequential Route Memory)** phụ thuộc vào Nhân đuôi (*Caudate Nucleus*).

Nhược điểm chí mạng của cách học này là **tính giòn gãy**: chỉ cần một ngã tư rào chắn thi công hoặc một biển cấm rẽ giờ cao điểm xuất hiện, toàn bộ chuỗi lệnh sụp đổ ngay lập tức. Ngược lại, nghiên cứu đạt giải Nobel Y sinh học (O'Keefe, Moser & Moser, 2014) cùng nghiên cứu kinh điển trên tài xế taxi London (Maguire et al.) chứng minh người giỏi định hướng sử dụng **Bản đồ khảo sát không gian (Cognitive Survey Map)** lưu trữ tại **Hồi hải mã sau (Posterior Hippocampus)**.

> [!IMPORTANT]
> **Nguyên tắc Thiết kế Học tập số 1 (Top-Down Scaffolding):** Không bao giờ học tên phố nhỏ trước khi dựng xong khung xương lớn. Giống như lắp ghép bản đồ địa lý, bạn phải đặt **khung viền mặt nước** và **lưới trục chính** trước, sau đó mọi con phố nhỏ sẽ tự động có "ngăn kéo" để xếp vào mà không tốn sức nhớ.

---

### 2. Giải phẫu Hà Nội qua Khung 5 Thành Phần Đô Thị của Kevin Lynch (MIT, 1960)

Trong kiệt tác quy hoạch *The Image of the City*, giáo sư Kevin Lynch chỉ ra bộ não con người đọc cấu trúc thành phố qua đúng **5 nguyên tố hình học**:

| Thành phần Kevin Lynch | Bản chất Không gian | Thực thể Điển hình tại Hà Nội | Tác dụng Định vị Thực chiến |
| :--- | :--- | :--- | :--- |
| **1. Edges (Ranh giới / Biên)** | Vách ngăn tự nhiên hoặc hạ tầng không thể băng ngang tùy ý | **Sông Hồng**, Sông Đuống, **Sông Tô Lịch**, Sông Nhuệ, bờ Hồ Tây, Đường sắt Bắc – Nam | Làm "bức tường chặn" xác định bạn đang ở bờ trong hay bờ ngoài, phía Đông hay phía Tây. |
| **2. Landmarks (Điểm mốc)** | Vật thể nổi bật có thể nhận diện từ xa hoặc tại chỗ | **Hồ Gươm (Km0)**, Lăng Bác, **Keangnam 72**, **Lotte Liễu Giai**, Nhà Hát Lớn, Chợ Đồng Xuân | Tạo điểm neo tam giác đạc (Triangulation) khóa phương hướng trong 1 giây. |
| **3. Districts (Phân vùng)** | Khu vực có bản sắc kiến trúc, lịch sử hoặc chức năng riêng | **Phố Cổ** (phố Hàng nhỏ), **Phố Pháp** (ô bàn cờ), **Ba Đình** (quảng trường), **Cầu Giấy – Mỹ Đình** (đại lộ mới) | Chỉ cần nhìn bề rộng vỉa hè, hàng cây và kiểu nhà là cảm nhận ngay mình đang ở quận nào. |
| **4. Paths (Trục dẫn)** | Kênh di chuyển chính kết nối toàn đô thị | **6 Vành đai (1 → 4)**, **12 Trục hướng tâm**, Cầu vượt sông, Tuyến Metro 2A & 3 | Bộ khung đường ống dẫn lưu đưa bạn đi xuyên thành phố nhanh nhất. |
| **5. Nodes (Nút quyết định)** | Giao lộ lớn nơi các trục cắt nhau và đổi tên đường | **Ngã Tư Sở**, **Ô Chợ Dừa**, **Ngã Tư Vọng**, **Mai Dịch**, **Trung Hòa**, **Thanh Xuân**, **Cửa Nam** | Điểm bản lề chuyển trục, nơi tập trung hầm chui và cầu vượt đa tầng. |

---

### 3. Quy trình 5 Lớp Gom Cụm (Spatial Chunking) để học thuộc Hà Nội không quá tải

Theo định luật dung lượng trí nhớ làm việc của George Miller (7 ± 2 phần tử), bộ não sẽ bão hòa nếu nhìn vào bản đồ 1.000 con phố cùng lúc. Hãy bóc tách Hà Nội thành **5 lớp trong suốt chồng lên nhau**:

1. **Lớp 1 – Thủy văn & Cầu:** Đặt Sông Hồng chảy chéo Tây Bắc → Đông Nam, gắn Hồ Tây ở trên Bắc, Hồ Gươm ở tâm, Sông Tô Lịch ôm phía Tây, và khóa 6 cây cầu nội đô.
2. **Lớp 2 – Vòng Đai Đồng Tâm:** Vẽ 4 vòng cung đồng tâm Vành đai 1, 2, 2.5, 3 mở rộng dần về phía Tây và phía Nam (cùng Vành đai 3.5 & 4 ở ngoại vi).
3. **Lớp 3 – Kim Đồng Hồ Hướng Tâm:** Đặt mặt đồng hồ 12 giờ tại Hồ Gươm / Ba Đình và phóng các tia hướng tâm ra cửa ngõ (12h Nội Bài, 3h Hải Phòng, 6h Giải Phóng, 7h Hà Đông, 8h30 Hòa Lạc, 9h30 Nhổn...).
4. **Lớp 4 – Nút Giao & Khối Ô Phố:** Giao điểm giữa Lớp 2 (Vành đai) và Lớp 3 (Hướng tâm) tự động sinh ra các Đại Nút Giao (Ngã Tư Sở, Ngã Tư Vọng, Trung Hòa, Mai Dịch) và chia mặt đất thành các **Ô Phố (Superblocks)**.
5. **Lớp 5 – Vi Mô Ngõ Ngách & Luật Làn:** Giải mã quy tắc 1 chiều, số nhà chẵn/lẻ và cổng phụ bên trong từng ô phố.
`
  },

  // =========================================================================
  // CHƯƠNG 2
  // =========================================================================
  {
    id: 'chapter-dual-frames',
    chapterNumber: 2,
    stageId: 'stage-1-foundation',
    difficulty: 'Cơ bản',
    title: 'Hệ Quy Chiếu Kép Allocentric vs Egocentric & Xoay Trục Tâm Tưởng 360°',
    subtitle: 'Giải quyết triệt để hiện tượng: Xem Google Maps trên tay rất hiểu nhưng ra ngã tư vẫn rẽ nhầm',
    badge: 'Tư Duy Hệ Quy Chiếu',
    iconName: 'Compass',
    readTimeMin: 7,
    recommendedPracticeMode: 'which_intersection',
    recommendedPracticeLabel: 'Luyện xoay góc nhìn tại Nút giao',
    cognitiveMechanism: 'Chuyển đổi phối hợp Thùy đỉnh sau (Posterior Parietal – Egocentric) ↔ Vỏ não sau thể chai (Retrosplenial Cortex) ↔ Hồi hải mã (Allocentric)',
    keyTakeaways: [
      'Allocentric là hệ quy chiếu cố định theo Đông – Tây – Nam – Bắc (nhìn từ vệ tinh); Egocentric là hệ quy chiếu gắn chặt với mũi xe của bạn (Trước – Sau – Trái – Phải).',
      'Khi bạn đi từ Bắc xuống Nam (hướng 180°), tay TRÁI của bạn là hướng ĐÔNG và tay PHẢI của bạn là hướng TÂY – ngược hoàn toàn với tờ bản đồ giấy!',
      'Đường vành đai và bờ sông Hà Nội uốn cong liên tục khiến mũi xe tự xoay góc mà người lái không nhận ra (Ảo giác đường thẳng).'
    ],
    quickCheck: {
      question: 'Bạn đang chạy xe trên đường Giải Phóng từ trung tâm ra Bến xe Giáp Bát (đi thẳng hướng Chính Nam 180°). Muốn rẽ sang phía Đông (Minh Khai / Cầu Vĩnh Tuy) tại Ngã Tư Vọng, bạn phải rẽ tay nào?',
      answer: 'Rẽ TAY TRÁI (vào đường Đại La – Minh Khai). Vì khi mặt quay về hướng Nam, bên trái cơ thể là hướng Đông, bên phải cơ thể là hướng Tây (Trường Chinh).'
    },
    contentMarkdown: `
### 1. Vì sao người thông minh vẫn rẽ ngược chiều khi nhìn bản đồ?

Não người duy trì song song **hai hệ tọa độ không gian hoàn toàn khác nhau**, và "vùng chuyển ngữ" giữa chúng nằm ở **Vỏ não sau thể chai (Retrosplenial Cortex)**:

| Tiêu chí So sánh | Hệ Quy Chiếu Allocentric (Bản Đồ Vệ Tinh) | Hệ Quy Chiếu Egocentric (Góc Nhìn Tay Lái) |
| :--- | :--- | :--- |
| **Điểm gốc tọa độ** | Gốc địa lý khách quan (Hồ Gươm, Sông Hồng, Bắc Cực) | Chính cơ thể và đầu xe của bạn ngay lúc này |
| **Từ vựng định hướng** | Bắc, Nam, Đông, Tây, Song song (∥), Vuông góc (⊥) | Trước mặt, Sau lưng, Rẽ trái, Rẽ phải, Chếch 10 giờ |
| **Tính bất biến** | Không bao giờ thay đổi dù bạn quay đầu đi đâu | Đảo lộn 180° ngay khoảnh khắc bạn quay đầu xe! |

> [!TIP]
> **Mẹo Chuyển Đổi Tức Thì 2 Giây:** Trước khi quyết định rẽ Trái hay Phải, luôn tự hỏi 1 câu ngắn: **"Mũi xe mình đang cắm về hướng nào?"**
> * Mũi xe hướng **BẮC (0°)**: Trái = Tây, Phải = Đông *(Trùng khít bản đồ chuẩn)*.
> * Mũi xe hướng **NAM (180°)**: Trái = Đông, Phải = Tây *(Ngược 180° với bản đồ chuẩn)*.
> * Mũi xe hướng **TÂY (270°)**: Trái = Nam, Phải = Bắc.
> * Mũi xe hướng **ĐÔNG (90°)**: Trái = Bắc, Phải = Nam.

---

### 2. "Ảo giác đường thẳng" do đường cong Hà Nội gây ra

Khác với TP.HCM có nhiều đại lộ kẻ thẳng theo lưới hay Đà Nẵng có bờ biển thẳng làm chuẩn, Hà Nội có **3 chiếc bẫy cong hình học** đánh lừa tiền đình:

1. **Đường Láng – Bưởi – Võ Chí Công:** Khi bạn chạy dọc sông Tô Lịch từ Ngã Tư Sở lên Cầu Giấy, bạn đang đi hướng **Tây Bắc**, sau đó uốn sang **Bắc**, rồi qua Bưởi lại chĩa sang **Đông Bắc**! Nhiều người cứ ngỡ mình đi thẳng một hướng nên mất sạch phương vị.
2. **Đê Sông Hồng (Yên Phụ → Trần Nhật Duật → Trần Khánh Dư → Nguyễn Khoái):** Dòng sông uốn một vòng cung lớn ôm lõi Hoàn Kiếm, chuyển hướng dần từ Đông Nam sang Nam rồi Đông.
3. **Phố Cổ 36 Phố Phường:** Hình thành trên nền làng nghề và đầm lầy cổ nên các ngã tư thường lệch góc 70° hoặc 110° chứ không vuông 90°.

> [!WARNING]
> **Cách khắc phục Ảo giác đường cong:** Đừng tin vào cảm giác cân bằng của cơ thể sau khi đi qua 3 khúc cua. Hãy khóa lại phương hướng bằng **Mốc bất biến Allocentric** (như vị trí dòng chảy Sông Hồng, trụ tàu điện trên cao, hoặc bóng nắng mặt trời). Trong tab **Bản Đồ Tương Tác**, hãy thường xuyên bấm nút **Xoay: 90° / 180° / 270°** để huấn luyện cơ não Mental Rotation!
`
  },

  // =========================================================================
  // CHƯƠNG 3
  // =========================================================================
  {
    id: 'chapter-hydrology-and-bridges',
    chapterNumber: 3,
    stageId: 'stage-1-foundation',
    difficulty: 'Cơ bản',
    title: 'Bộ Khung Thủy Văn & Chuỗi Cầu Sông Hồng – Sông Đuống (Thượng Lưu → Hạ Lưu)',
    subtitle: 'Hà Nội là "Thành phố trong sông" – Nắm 4 dòng sông, cụm hồ lớn và thứ tự chuẩn xác các cầu vượt sông',
    badge: 'Khung Xương Thủy Văn',
    iconName: 'Waves',
    readTimeMin: 9,
    recommendedPracticeMode: 'route_planner_ab',
    recommendedPracticeLabel: 'Luyện Chế độ F: Lập tuyến vượt sông',
    cognitiveMechanism: 'Neo biên giới tự nhiên (Boundary Tethering) & Mã hóa chuỗi thứ tự bất biến (Ordinal Chain Encoding)',
    keyTakeaways: [
      'Sông Hồng chảy theo trục chéo Tây Bắc → Đông Nam, chia Hữu ngạn (nội thành lịch sử) và Tả ngạn (Đông Anh, Long Biên, Gia Lâm).',
      'Thứ tự chuẩn xác 6 cầu nội đô từ Thượng lưu xuống Hạ lưu: Thăng Long (VĐ3) → Nhật Tân (VĐ2) → Long Biên → Chương Dương → Vĩnh Tuy (VĐ2) → Thanh Trì (VĐ3).',
      'Cầu Long Biên cấm ô tô và đi bên LỀ TRÁI; Cầu Thăng Long xe máy chỉ được đi tầng 1 dưới thấp.'
    ],
    quickCheck: {
      question: 'Theo đúng chiều dòng chảy Sông Hồng từ Thượng lưu (Tây Bắc) xuống Hạ lưu (Đông Nam), Cầu Thăng Long hay Cầu Nhật Tân nằm ở phía trên (thượng lưu) trước?',
      answer: 'Cầu Thăng Long nằm ở thượng lưu trước (Bắc Từ Liêm ↔ Hải Bối, vĩ độ ~21.099°N, kinh độ ~105.787°E), sau đó dòng nước mới chảy xuôi sang phía Đông qua Cầu Nhật Tân (Tây Hồ ↔ Vĩnh Ngọc, ~21.092°N, ~105.824°E) rồi tới Long Biên!'
    },
    contentMarkdown: `
### 1. Tứ Đại Hà Lưu: 4 Dòng Sông Định Hình Địa Hình Hà Nội

Tên gọi **Hà Nội** (năm Minh Mạng thứ 12 – 1831) nghĩa đen là *"Thành phố nằm bên trong các dòng sông"*. Để không bao giờ mất phương hướng, hãy đặt 4 dòng sông lên trang giấy trắng trong đầu bạn:

1. **Sông Hồng (Nhị Hà – Biên Đông Bắc):** Chảy chéo từ Tây Bắc (Ba Vì – Sơn Tây – Bắc Từ Liêm) ôm qua phía Bắc Hồ Tây, bẻ xuống phía Đông Hoàn Kiếm – Hai Bà Trưng rồi xuôi Đông Nam về Hoàng Mai – Thanh Trì – Hưng Yên.
   * **Bờ Hữu ngạn (Nam / Tây sông):** Chứa 11/12 quận nội thành (trừ Long Biên).
   * **Bờ Tả ngạn (Bắc / Đông sông):** Đông Anh, Long Biên, Gia Lâm.
2. **Sông Đuống (Thiên Đức Giang – Phân lưu Đông Bắc):** Tách khỏi Sông Hồng tại ngã ba Xuân Canh (ngay hạ lưu Cầu Nhật Tân / Tứ Liên), chảy sang phía Đông qua Cầu Đông Trù và Cầu Đuống về Bắc Ninh. Nó chia Tả ngạn thành 2 nửa: phía Bắc Sông Đuống là **Đông Anh – Yên Viên**, phía Nam Sông Đuống là **Long Biên – Nam Gia Lâm**.
3. **Sông Tô Lịch (Hào nước nội đô):** Chảy từ Bưởi men theo **Đường Láng – Nguyễn Khang** qua Ngã Tư Sở, xuôi theo **Vũ Tông Phan – Kim Giang** xuống Linh Đàm. Là ranh giới tự nhiên tách Đống Đa với Cầu Giấy & Thanh Xuân.
4. **Sông Nhuệ (Biên phía Tây):** Chảy qua Cầu Diễn (Bắc Từ Liêm), Đại Mỗ – Tây Mỗ (Nam Từ Liêm), cắt qua **Cầu Trắng Hà Đông** xuống Thanh Trì – Thường Tín.

---

### 2. Thứ Tự Chuẩn Xác Chuỗi Cầu Sông Hồng (Thượng Lưu → Hạ Lưu)

Một nhầm lẫn rất phổ biến của người mới học bản đồ là đảo lộn vị trí Cầu Thăng Long và Cầu Nhật Tân. Hãy nhìn theo **dòng nước chảy từ Tây Bắc sang Đông Nam**: sông Hồng đi qua Đông Ngạc (**Cầu Thăng Long**) trước, rồi mới chảy ngang qua phía Bắc Hồ Tây (**Cầu Nhật Tân**), sau đó vòng xuống Phố Cổ (**Long Biên → Chương Dương → Vĩnh Tuy → Thanh Trì**).

| Thứ tự Dòng chảy | Tên Cầu | Tuyến Trục / Vành Đai | Kết nối Hữu Ngạn ↔ Tả Ngạn | Quy tắc Sống còn cho Xe máy & Ô tô |
| :--- | :--- | :--- | :--- | :--- |
| *Thượng lưu xa* | *Văn Lang → Hồng Hà (VĐ4) → Thượng Cát (VĐ3.5)* | Trục vùng & VĐ3.5 – VĐ4 | Ba Vì / Đan Phượng / Bắc Từ Liêm ↔ Việt Trì / Mê Linh / Đông Anh | Hệ thống cầu vành đai ngoại vi giải tải xe quá cảnh. |
| **1 (Nội đô)** | **Cầu Thăng Long** | **Vành đai 3** | Bắc Từ Liêm (Phạm Văn Đồng) ↔ Đông Anh (Võ Văn Kiệt) | **Cầu 2 tầng:** Tầng 2 trên cao CHỈ Ô TÔ; xe máy bắt buộc đi tầng 1 dưới thấp! |
| **2 (Nội đô)** | **Cầu Nhật Tân** | **Vành đai 2 / Trục 12h** | Tây Hồ (Võ Chí Công) ↔ Đông Anh (Võ Nguyên Giáp) | Cầu dây văng 5 tháp đi thẳng Nội Bài; xe máy đi làn sát lan can ngoài cùng. |
| *Đang triển khai* | *Cầu Tứ Liên* | Trục Tây Hồ – Cổ Loa | Tây Hồ (Nghi Tàm / Quảng An) ↔ Đông Anh (Đông Hội) | Kết nối thẳng trung tâm Ba Đình – Tây Hồ sang Trung tâm Triển lãm QG. |
| **3 (Nội đô)** | **Cầu Long Biên** | Phố Cổ – Ngọc Thụy | Hoàn Kiếm (Trần Nhật Duật) ↔ Long Biên (Ngọc Thụy) | **CẤM Ô TÔ.** Xe máy, xe đạp đi theo **LỀ BÊN TRÁI** (ngược chiều thông thường)! |
| **4 (Nội đô)** | **Cầu Chương Dương** | **Trục 2h Đông Bắc** | Hoàn Kiếm (Trần Quang Khải) ↔ Long Biên (Nguyễn Văn Cừ) | Ô tô đi làn giữa; xe máy đi 2 làn cánh gà hai bên rìa cầu. |
| *Đang triển khai* | *Cầu Trần Hưng Đạo* | Trục Đông – Tây trung tâm | Cuối Trần Hưng Đạo ↔ Vũ Đức Thận / Cổ Linh (Long Biên) | Chia tải trực tiếp cho Chương Dương & Vĩnh Tuy. |
| **5 (Nội đô)** | **Cầu Vĩnh Tuy** | **Vành đai 2** | Hai Bà Trưng (Minh Khai) ↔ Long Biên (Đàm Quang Trung / Cổ Linh) | 8 làn xe (2 cầu song song), nối thẳng VĐ2 trên cao sang Aeon Mall Long Biên. |
| **6 (Nội đô)** | **Cầu Thanh Trì** | **Vành đai 3** | Hoàng Mai (Pháp Vân / Lĩnh Nam) ↔ Gia Lâm (QL5 / CT.04) | Lưu lượng xe tải nặng cao; xe máy đi làn hỗn hợp có dải phân cách cứng. |
| *Hạ lưu mở rộng* | *Ngọc Hồi (VĐ3.5) → Mễ Sở (VĐ4)* | VĐ3.5 & VĐ4 Nam | Thanh Trì / Thường Tín ↔ Văn Giang (Hưng Yên) | Khép mạch vành đai phía Nam sang Hưng Yên – Bắc Ninh. |

> [!TIP]
> **Khẩu quyết 6 Cầu Nội Đô từ Thượng lưu xuống Hạ lưu:**
> \`"THĂNG – NHẬT – LONG – CHƯƠNG – VĨNH – THANH"\`
> *(Thăng Long → Nhật Tân → Long Biên → Chương Dương → Vĩnh Tuy → Thanh Trì)*.
> Để ý tính đối xứng tuyệt đẹp của quy hoạch: Hai đầu ngoài cùng (**Thăng Long** & **Thanh Trì**) là cặp cầu khóa **Vành đai 3**; lùi vào một nấc (**Nhật Tân** & **Vĩnh Tuy**) là cặp cầu khóa **Vành đai 2**; chính giữa tâm (**Long Biên** & **Chương Dương**) là cặp cầu lịch sử nối **Phố Cổ Hoàn Kiếm**!
`
  },

  // =========================================================================
  // CHƯƠNG 4
  // =========================================================================
  {
    id: 'chapter-30-admin-units',
    chapterNumber: 4,
    stageId: 'stage-2-macro',
    difficulty: 'Cơ bản',
    title: 'Phân Cụm Không Gian 30 Đơn Vị Hành Chính & Mô Hình Đô Thị Đa Cực',
    subtitle: 'Thuộc vị trí toàn bộ 12 Quận, 1 Thị xã và 17 Huyện Hà Nội bằng phương pháp Lớp Vỏ Hành Tây (Onion Layering)',
    badge: 'Địa Lý Hành Chính',
    iconName: 'MapPin',
    readTimeMin: 8,
    recommendedPracticeMode: 'superblock_cell',
    recommendedPracticeLabel: 'Luyện Chế độ D: Phân vùng & Ô phố',
    cognitiveMechanism: 'Phân tầng không gian lồng nhau (Nested Spatial Hierarchy) & Định danh bản sắc vùng (District Identity Tagging)',
    keyTakeaways: [
      'Hà Nội gồm 30 đơn vị hành chính cấp quận/huyện: 12 Quận nội thành, 1 Thị xã (Sơn Tây) và 17 Huyện.',
      '12 Quận nội thành chia làm 3 lớp đồng tâm hoàn hảo (4 + 4 + 4): 4 Quận lõi lịch sử → 4 Quận vành đai chuyển tiếp → 4 Quận cực đô thị mới.',
      '5 Đô thị vệ tinh bao ngoài: Hòa Lạc (Công nghệ), Sơn Tây (Di sản), Sóc Sơn (Sân bay), Xuân Mai (Đại học – Sinh thái), Phú Xuyên (Công nghiệp Nam).'
    ],
    quickCheck: {
      question: 'Trong 12 quận nội thành Hà Nội, duy nhất quận nào nằm toàn bộ ở phía Tả ngạn (bờ Bắc/Đông) Sông Hồng?',
      answer: 'Quận Long Biên (thành lập năm 2003, tách từ huyện Gia Lâm). Cả 11 quận còn lại đều nằm bên bờ Hữu ngạn Sông Hồng!'
    },
    contentMarkdown: `
### 1. Công thức "4 + 4 + 4" để thuộc lòng 12 Quận Nội Thành trong 3 phút

Đừng bao giờ đọc danh sách 12 quận theo thứ tự bảng chữ cái. Hãy xếp chúng theo **3 lớp vỏ đồng tâm từ Hồ Gươm tỏa ra**:

#### Lớp A – Tứ Quận Lõi Lịch Sử (Trong Vành Đai 1 – Vành Đai 2):
1. **Hoàn Kiếm (Đông lõi):** Tâm Km0 Hồ Gươm, 36 Phố Phường, Phố Pháp, Nhà Hát Lớn – nhỏ nhất nhưng sầm uất bậc nhất.
2. **Ba Đình (Tây Bắc lõi):** Lăng Bác, Quảng trường Ba Đình, Quốc hội, Phủ Chủ tịch, các Đại sứ quán, Kim Mã – Liễu Giai.
3. **Đống Đa (Tây Nam lõi):** Văn Miếu, Gò Đống Đa, Ô Chợ Dừa, Chùa Bộc – Thái Hà – Láng Hạ, mật độ dân cư cao nhất.
4. **Hai Bà Trưng (Đông Nam lõi):** Công viên Thống Nhất, Bách – Kinh – Xây, Bệnh viện Bạch Mai / 108, Minh Khai – Times City.

#### Lớp B – 4 Quận Mở Rộng Nội Đô (Vành Đai 2 ↔ Vành Đai 3):
5. **Tây Hồ (Hướng 12h Bắc):** Ôm trọn mặt nước Hồ Tây, trục Võ Chí Công đi Nhật Tân, bán đảo Quảng An.
6. **Cầu Giấy (Hướng 9h Tây):** Trung tâm công nghệ (Duy Tân) và đại học (Xuân Thủy), kẹp giữa sông Tô Lịch và Phạm Hùng.
7. **Thanh Xuân (Hướng 7h30 Tây Nam):** Giao lộ Nguyễn Trãi × Khuất Duy Tiến, Royal City, Trung Hòa – Nhân Chính.
8. **Hoàng Mai (Hướng 6h Nam):** Cửa ngõ Pháp Vân, Bến xe Giáp Bát & Nước Ngầm, Bán đảo Linh Đàm, dẫn lên Cầu Thanh Trì.

#### Lớp C – 4 Quận Cực Đô Thị Mới (Ngoài Vành Đai 3 & Tả Ngạn):
9. **Nam Từ Liêm (Hướng 8h30 Tây):** Trung tâm Hội nghị Quốc gia, Keangnam 72, SVĐ Mỹ Đình, Bến xe Mỹ Đình, Tây Mỗ – Đại Mỗ.
10. **Bắc Từ Liêm (Hướng 10h30 Tây Bắc):** Phạm Văn Đồng, Công viên Hòa Bình, Cầu Thăng Long, Nhổn – Cổ Nhuế.
11. **Hà Đông (Hướng 7h Tây Nam xa):** Trung tâm tỉnh Hà Tây cũ, trục Trần Phú – Quang Trung – Tố Hữu, Làng lụa Vạn Phúc, Bến xe Yên Nghĩa.
12. **Long Biên (Hướng 2h Đông – Tả ngạn Sông Hồng):** Quận duy nhất bên kia Sông Hồng, Nguyễn Văn Cừ, Cổ Linh, Aeon Mall, Vinhomes Riverside.

---

### 2. Bản đồ 1 Thị Xã + 17 Huyện Ngoại Thành theo Hướng La Bàn

| Nhóm Không Gian | Đơn vị Hành chính | Vai trò Quy hoạch & Mốc Nhận Diện |
| :--- | :--- | :--- |
| **5 Huyện Cận Đô (Sát 12 Quận)** | **Đông Anh** (Bắc), **Gia Lâm** (Đông), **Thanh Trì** (Nam), **Hoài Đức** (Tây), **Đan Phượng** (Tây Bắc) | Vành đai phát triển đô thị trực tiếp dọc VĐ3.5 & VĐ4 (Cổ Loa, Ocean Park, Ngọc Hồi, An Khánh, TT Phùng). |
| **Cực Bắc Hàng Không** | **Sóc Sơn**, **Mê Linh** | Sân bay Quốc tế Nội Bài, Đền Gióng, vùng hoa Mê Linh, nối Vĩnh Phúc & Thái Nguyên. |
| **Cực Tây Khoa Học – Xứ Đoài** | **TX. Sơn Tây**, **Thạch Thất**, **Quốc Oai**, **Ba Vì**, **Phúc Thọ** | Đô thị vệ tinh **Hòa Lạc** (Khu CNC + ĐHQG), Thành cổ Sơn Tây, Làng cổ Đường Lâm, Vườn QG Ba Vì. |
| **Cực Tây Nam & Nam** | **Chương Mỹ**, **Thanh Oai**, **Thường Tín**, **Phú Xuyên**, **Ứng Hòa**, **Mỹ Đức** | Đô thị vệ tinh **Xuân Mai** (QL6 × QL21A) và **Phú Xuyên** (QL1A), Chùa Hương (Mỹ Đức), làng nghề Nam Thủ đô. |
`
  },

  // =========================================================================
  // CHƯƠNG 5
  // =========================================================================
  {
    id: 'chapter-rings-and-radials',
    chapterNumber: 5,
    stageId: 'stage-2-macro',
    difficulty: 'Trung cấp',
    title: 'Giải Phẫu Hệ Thống 6 Đường Vành Đai Đồng Tâm (Vành Đai 1 → 4)',
    subtitle: 'Chìa khóa thoát kẹt xe Hà Nội: Nắm chuỗi đổi tên và cầu khép vòng của từng tuyến vành đai',
    badge: 'Xương Sống Đồng Tâm',
    iconName: 'Layers',
    readTimeMin: 9,
    recommendedPracticeMode: 'corridor_chain',
    recommendedPracticeLabel: 'Luyện Chế độ A: Chuỗi Vành đai đổi tên',
    cognitiveMechanism: 'Lập chỉ mục vòng đồng tâm (Concentric Ring Indexing) & Tối ưu lộ trình chu vi (Circumferential Bypass)',
    keyTakeaways: [
      'Hà Nội vận hành theo mô hình Vành đai – Xuyên tâm (Ring-Radial): Vành đai giúp đi ngang giữa các quận mà không phải xuyên qua tâm ùn tắc.',
      'Vành đai 2 khép kín qua cặp cầu Nhật Tân – Vĩnh Tuy; Vành đai 3 khép kín qua cặp cầu Thăng Long – Thanh Trì.',
      'Vành đai 2.5 chia tải nội đô Cầu Giấy – Thanh Xuân – Hoàng Mai; Vành đai 3.5 (Lê Trọng Tấn) và Vành đai 4 định hình đại đô thị phía Tây và liên vùng.'
    ],
    quickCheck: {
      question: 'Bạn đang đi trên đường Trường Chinh (Vành đai 2), khi vượt qua cầu vượt Ngã Tư Sở hướng lên Cầu Giấy thì tên đường dưới mặt đất đổi thành gì?',
      answer: 'Đổi thành Đường Láng (chạy men bờ Đông sông Tô Lịch suốt từ Ngã Tư Sở lên Nút Cầu Giấy – Bưởi).'
    },
    contentMarkdown: `
### 1. Vì sao phải thuộc lòng các Đường Vành Đai trước khi thuộc phố nhỏ?

Trong hình học giao thông đô thị, nếu 2 địa điểm nằm ở 2 hướng khác nhau (ví dụ từ **Hoàng Mai** muốn sang **Cầu Giấy**), đi đâm xuyên qua lõi Đống Đa – Ba Đình sẽ vướng hàng chục đèn đỏ. Ngược lại, nhảy lên **Vành đai 2** hoặc **Vành đai 3** giúp bạn lướt theo đường vòng cung tốc độ cao.

Khó khăn lớn nhất tại Hà Nội là **một đường vành đai liên tục lại mang 6–10 tên phố khác nhau**. Bảng giải phẫu dưới đây nối liền mạch từng đoạn cho bạn:

| Tuyến | Chuỗi Tên Đường Liên Hoàn (Theo Chiều Thuận) | Cầu Vượt Sông Khép Vòng | Quy Định Làn Xe Cần Nhớ |
| :--- | :--- | :--- | :--- |
| **Vành đai 1** | \`Nguyễn Khoái\` → \`Trần Khát Chân\` → \`Đại Cồ Việt\` → *(Hầm Kim Liên)* → \`Xã Đàn\` → \`Ô Chợ Dừa\` → \`Hoàng Cầu\` → \`Voi Phục (La Thành)\` → \`Bưởi\` → \`Yên Phụ – Trần Nhật Duật\` | Không vượt Sông Hồng (ôm đê hữu ngạn) | Xe máy & ô tô đi chung cả mặt đất, cầu vượt Ô Chợ Dừa và hầm Kim Liên. |
| **Vành đai 2** | \`Cầu Vĩnh Tuy\` → \`Minh Khai\` → \`Đại La\` → \`Trường Chinh\` → *(Ngã Tư Sở)* → \`Đường Láng\` → \`Bưởi\` → \`Võ Chí Công\` → \`Cầu Nhật Tân\` → \`Trường Sa – Đông Trù – Lý Sơn\` → \`Nguyễn Văn Linh – Đàm Quang Trung\` | **Cầu Vĩnh Tuy** + **Cầu Nhật Tân** (+ Cầu Đông Trù qua sông Đuống) | Đường trên cao Vĩnh Tuy ↔ Ngã Tư Sở **cấm xe máy 100%**. |
| **Vành đai 2.5** | \`Nguyễn Văn Huyên kéo dài\` → \`Nguyễn Phong Sắc\` → \`Trần Thái Tông\` → \`Trung Kính\` → \`Hoàng Đạo Thúy\` → \`Vũ Trọng Phụng / Đầm Hồng\` → \`Định Công\` → \`Kim Đồng\` *(Hầm Giải Phóng)* → \`Tân Mai – Lĩnh Nam\` | Không vượt Sông Hồng | Đường đô thị mặt đất 2 chiều cho mọi phương tiện. |
| **Vành đai 3** | \`Cầu Thăng Long\` → \`Phạm Văn Đồng\` → *(Mai Dịch)* → \`Phạm Hùng\` → *(Trung Hòa)* → \`Khuất Duy Tiến\` → *(Thanh Xuân)* → \`Nguyễn Xiển\` → \`Nghiêm Xuân Yêm\` → \`Hoàng Liệt (Pháp Vân)\` → \`Cầu Thanh Trì\` → \`QL1A mới (Phù Đổng – Ninh Hiệp)\` | **Cầu Thăng Long** + **Cầu Thanh Trì** (+ Cầu Phù Đổng) | Cao tốc trên cao CT.20 & tầng 2 Cầu Thăng Long **cấm xe máy tuyệt đối**. |
| **Vành đai 3.5** | \`Cầu Thượng Cát\` → \`Đan Phượng\` → \`Lê Trọng Tấn (Hoài Đức – An Khánh)\` → \`Lê Trọng Tấn (Hà Đông – Văn Phú)\` → \`Phúc La – Xa La\` → \`Ngọc Hồi\` → \`Cầu Ngọc Hồi\` | *Cầu Thượng Cát* + *Cầu Ngọc Hồi* | Trục đại lộ mặt đất rộng 6–8 làn kết nối Smart City – Dương Nội – Văn Phú – Xa La. |
| **Vành đai 4** | \`Sóc Sơn (CT Nội Bài – Lào Cai)\` → \`Mê Linh\` → \`Cầu Hồng Hà\` → \`Đan Phượng – Hoài Đức – Yên Nghĩa (Hà Đông) – Thanh Oai – Thường Tín\` → \`Cầu Mễ Sở\` → \`Hưng Yên – Bắc Ninh\` | *Cầu Hồng Hà* + *Cầu Mễ Sở* | Cao tốc 6 làn trên cao tách rời + đường song hành đô thị 2 bên. |

---

### 2. Mẹo Nhận Diện Tức Thì Bạn Đang Đứng Ở Vành Đai Mấy

> [!TIP]
> **Nhìn kết cấu hạ tầng trên đầu và dưới chân để đọc số Vành đai trong 1 giây:**
> * Thấy tên phố gắn với các **Cửa Ô cổ** (*Ô Đống Mác, Ô Cầu Dền, Ô Kim Liên, Ô Chợ Dừa*) → **Vành đai 1**.
> * Thấy **sông Tô Lịch** chảy sát cạnh (Đường Láng) hoặc cầu cạn bê tông trắng tinh nối thẳng **Times City ↔ Royal City** → **Vành đai 2**.
> * Thấy cầu cạn cao tốc khổng lồ đầy xe tải/xe khách liên tỉnh kèm các tòa tháp 40–72 tầng (**BX Mỹ Đình, Keangnam, Big C, Linh Đàm**) → **Vành đai 3**.
> * Thấy trục đường đôi thênh thang cắt qua cổng **Thiên Đường Bảo Sơn / Vinhomes Smart City / ParkCity Hà Đông** → **Vành đai 3.5 (Lê Trọng Tấn)**.
`
  },

  // =========================================================================
  // CHƯƠNG 6
  // =========================================================================
  {
    id: 'chapter-corridors-chains',
    chapterNumber: 6,
    stageId: 'stage-2-macro',
    difficulty: 'Trung cấp',
    title: 'Quy Tắc Mặt Đồng Hồ 12 Giờ & Giải Mã "Một Đường Nhiều Tên"',
    subtitle: 'Nén 60 con phố lớn của Hà Nội thành 12 kim giờ đồng hồ phóng ra từ tâm Hồ Gươm – Ba Đình',
    badge: 'Kỹ Năng Đọc Trục',
    iconName: 'Route',
    readTimeMin: 9,
    recommendedPracticeMode: 'corridor_chain',
    recommendedPracticeLabel: 'Luyện Chế độ A & B: Chuỗi trục & Giao cắt',
    cognitiveMechanism: 'Mã hóa góc cực (Polar Coordinate Clock Mnemonic) & Nén chuỗi tuyến tính (Collinear Compression)',
    keyTakeaways: [
      'Đặt tâm đồng hồ tại Hồ Gươm / Ba Đình: 12h đi Nội Bài, 2h đi Bắc Ninh, 3h đi Hải Phòng, 6h đi Giải Phóng, 7h đi Hà Đông, 8h30 đi Hòa Lạc, 9h30 đi Nhổn/Sơn Tây, 11h đi Cầu Thăng Long.',
      'Hiện tượng "Một đường nhiều tên" xảy ra do mỗi đoạn đường từng được mở rộng qua các thời kỳ lịch sử khác nhau nhưng nằm trên cùng 1 tia thẳng.',
      'Chỉ cần nhớ "Tên Trục + Nút Giao Đổi Tên", bạn giảm được 80% dung lượng bộ nhớ cần dùng.'
    ],
    quickCheck: {
      question: 'Trên trục hướng 8h30 (Hồ Tây đi Đại lộ Thăng Long), khi đi thẳng từ đường Liễu Giai vượt qua ngã tư Kim Mã – Đào Tấn (Lotte Center), tên đường đổi thành gì và tiếp sau cầu vượt Đường Láng đổi thành gì?',
      answer: 'Qua ngã tư Kim Mã đổi thành Nguyễn Chí Thanh; vượt tiếp cầu vượt Đường Láng (VĐ2) đổi thành Trần Duy Hưng; chui qua hầm Trung Hòa (VĐ3) thành Đại lộ Thăng Long!'
    },
    contentMarkdown: `
### 1. Phương Pháp Mặt Đồng Hồ 12 Giờ (The Hanoi 12-Hour Compass)

Bộ não con người phản xạ với mặt đồng hồ nhanh gấp nhiều lần so với số độ góc phương vị (0° – 360°). Hãy tưởng tượng bạn đặt chiếc đồng hồ khổng lồ có tâm tại **Hồ Gươm – Ba Đình**:

\`\`\`
                     [12h] Võ Chí Công → Cầu Nhật Tân → Nội Bài
        [11h] Phạm Văn Đồng ↖        ↑        ↗ [1h] Cầu Đông Trù → QL3 Cổ Loa
              (Cầu Thăng Long)       |          [2h] Chương Dương → Nguyễn Văn Cừ → QL1A Bắc
   [9h30] Kim Mã → Cầu Giấy ←─── [TÂM KM0] ───→ [3h] Vĩnh Tuy → Cổ Linh → Cao tốc 5B Hải Phòng
          → Xuân Thủy → Nhổn   HỒ GƯƠM/BA ĐÌNH
   [8h30] Liễu Giai → NC Thanh ↙     |     ↘ [5h] Nguyễn Khoái → Lĩnh Nam → Thanh Trì
          → Trần Duy Hưng → Hòa Lạc  ↓
        [7h30] Giảng Võ → Láng Hạ  [6h] Lê Duẩn → Giải Phóng → Ngọc Hồi (QL1A Nam)
               → Lê Văn Lương → Tố Hữu
          [7h] Tôn Đức Thắng → Tây Sơn → Nguyễn Trãi → Quang Trung (Hà Đông)
\`\`\`

> [!IMPORTANT]
> **Quy luật Phân bố Hình quạt của Hà Nội:** Hãy để ý góc phần tư từ **6h đến 10h (Nam – Tây Nam – Tây)** tập trung dày đặc nhất với **5 đại trục hướng tâm chạy gần như song song dạng nan quạt** (*Giải Phóng, Nguyễn Trãi, Lê Văn Lương, Trần Duy Hưng, Cầu Giấy*). Đây chính là hướng mở rộng đô thị chủ lực của Thủ đô suốt 30 năm qua!

---

### 2. Bảng Tra Cứu Chuẩn "Một Đường Nhiều Tên" & Nút Giao Đổi Tên

| Kim Giờ | Tên Hành Lang Xuyên Tâm | Chuỗi Đổi Tên Liên Tiếp (Từ Tâm → Ngoại Vi) | Các Nút Giao Làm Mốc Đổi Tên |
| :--- | :--- | :--- | :--- |
| **12h** | **Trục Nội Bài** | \`Bưởi\` ➔ \`Võ Chí Công\` ➔ \`Cầu Nhật Tân\` ➔ \`Võ Nguyên Giáp\` | Nút Bưởi – Hoàng Quốc Việt, Bờ Nam & Bắc Sông Hồng |
| **2h** | **Trục Long Biên – Bắc Ninh** | \`Trần Nhật Duật\` ➔ \`Cầu Chương Dương\` ➔ \`Nguyễn Văn Cừ\` ➔ \`Ngô Gia Tự\` ➔ \`Hà Huy Tập\` | Vòng xuyến Chương Dương, Nút Cầu Chui (QL5), Cầu Đuống |
| **6h** | **Trục Giải Phóng (Nam)** | \`Lê Duẩn\` ➔ \`Giải Phóng\` ➔ \`Ngọc Hồi (QL1A)\` | Ngã 5 Cửa Nam, Hầm Kim Liên (VĐ1), Nút Pháp Vân (VĐ3) |
| **7h** | **Trục Tây Nam – Hà Đông** | \`Tôn Đức Thắng\` ➔ \`Nguyễn Lương Bằng\` ➔ \`Tây Sơn\` ➔ \`Nguyễn Trãi\` ➔ \`Trần Phú\` ➔ \`Quang Trung\` | Ô Chợ Dừa (VĐ1), Gò Đống Đa, Ngã Tư Sở (VĐ2), Nút Thanh Xuân (VĐ3), Cầu Trắng (Sông Nhuệ) |
| **7h30** | **Trục BRT Văn Phòng** | \`Giảng Võ\` ➔ \`Láng Hạ\` ➔ \`Lê Văn Lương\` ➔ \`Tố Hữu\` | Đê La Thành (VĐ1), Cầu Hòa Mục – Đường Láng (VĐ2), Hầm Khuất Duy Tiến (VĐ3) |
| **8h30** | **Trục Hòa Lạc** | \`Văn Cao\` ➔ \`Liễu Giai\` ➔ \`Nguyễn Chí Thanh\` ➔ \`Trần Duy Hưng\` ➔ \`Đại lộ Thăng Long\` | Thụy Khuê, Ngã tư Kim Mã – Đào Tấn, Cầu vượt Láng (VĐ2), Hầm Trung Hòa (VĐ3) |
| **9h30** | **Trục Đại Học – QL32** | \`Nguyễn Thái Học\` ➔ \`Kim Mã\` ➔ \`Cầu Giấy\` ➔ \`Xuân Thủy\` ➔ \`Hồ Tùng Mậu\` ➔ \`Cầu Diễn\` ➔ \`Nhổn\` | Sơn Tây, Voi Phục (VĐ1), Nút Cầu Giấy (VĐ2), Ngã 3 Trần Thái Tông, Mai Dịch (VĐ3), Sông Nhuệ |

---

### 3. Mẹo Nhớ Cặp Song Song Khu Tây Nam (7h – 7h30 – 8h30)

Ba đại lộ hướng Tây Nam chạy kẹp cạnh nhau rất dễ nhầm nếu không biết **các đường ngang nối chúng lại (như bậc thang)**:
* Ở **Vành đai 1**: Nối ngang bởi \`Xã Đàn – Hoàng Cầu – Đê La Thành\`.
* Ở giữa VĐ1 & VĐ2: Nối ngang bởi \`Chùa Bộc – Thái Hà – Huỳnh Thúc Kháng – Nguyễn Chí Thanh\`! *(Một trục ngang vàng cực kỳ lợi hại!)*.
* Ở **Vành đai 2**: Nối ngang bởi \`Đường Láng\`.
* Ở **Vành đai 2.5**: Nối ngang bởi \`Hoàng Đạo Thúy – Hoàng Minh Giám\`.
* Ở **Vành đai 3**: Nối ngang bởi \`Khuất Duy Tiến – Phạm Hùng\`.
`
  },

  // =========================================================================
  // CHƯƠNG 7
  // =========================================================================
  {
    id: 'chapter-french-grid-and-oneway',
    chapterNumber: 7,
    stageId: 'stage-3-micro',
    difficulty: 'Trung cấp',
    title: 'Ô Bàn Cờ Phố Pháp, 36 Phố Phường & Quy Luật Đường Một Chiều Đã Kiểm Chứng',
    subtitle: 'Làm chủ hai cấu trúc lịch sử đối lập quanh Hồ Gươm và thuộc lòng các cặp phố 1 chiều trung tâm',
    badge: 'Hình Học Trung Tâm',
    iconName: 'Grid',
    readTimeMin: 10,
    recommendedPracticeMode: 'oneway_turn_trap',
    recommendedPracticeLabel: 'Luyện Chế độ G: Phá bẫy đường 1 chiều',
    cognitiveMechanism: 'Quan hệ Hình học Trực giao (Orthogonal Grid Topology ∥, ⊥) & Đảo chiều dòng chảy cặp đôi (Paired One-Way Couplets)',
    keyTakeaways: [
      'Lấy Hồ Gươm làm tâm: Phía BẮC là 36 Phố Phường (hình xương cá cổ truyền); Phía NAM là Khu Phố Pháp (ô bàn cờ vuông góc 90°).',
      'Khẩu quyết 1 chiều chuẩn xác 100%: "Phố Huế lên Hồ (Nam → Bắc) – Bà Triệu xuống Đai (Bắc → Nam)"; "Tràng Tiền – Hàng Khay – Tràng Thi đi 1 chiều Đông sang Tây".',
      'Hai Bà Trưng, Lý Thường Kiệt, Trần Hưng Đạo là 3 đại lộ Đông – Tây đi 2 CHIỀU, đóng vai trò lối thoát vàng khi cần quay ngược hướng.'
    ],
    quickCheck: {
      question: 'Bạn đang đứng ở ngã tư Đại Cồ Việt – Bạch Mai và muốn đi xe thẳng lên bờ Hồ Gươm. Bạn được phép đi vào Phố Huế hay Bà Triệu?',
      answer: 'Đi thẳng vào PHỐ HUẾ (nối tiếp lên Hàng Bài → Đinh Tiên Hoàng). Vì Phố Huế quy định 1 chiều từ Nam lên Bắc, còn Bà Triệu là 1 chiều ngược lại từ Bắc xuống Nam!'
    },
    contentMarkdown: `
### 1. Sự Đối Lập Thú Vị Quanh Hồ Gươm: Bắc Phố Cổ vs Nam Phố Pháp

Hồ Hoàn Kiếm giống như chiếc bản lề khép hai thế giới quy hoạch đô thị khác hẳn nhau:

#### A. Phía Bắc Hồ Gươm – Khu 36 Phố Phường ("Kẻ Chợ" Cổ Truyền)
* **Giới hạn tứ giác:** Phía Bắc là \`Hàng Đậu\`, phía Đông là đê \`Trần Nhật Duật\`, phía Nam là \`Hàng Bông – Hàng Gai – Cầu Gỗ\`, phía Tây là đường tàu \`Phùng Hưng\`.
* **Trục xương sống Bắc – Nam duy nhất xuyên tâm:** Từ Quảng trường Đông Kinh Nghĩa Thục (bờ Bắc Hồ Gươm) chạy thẳng lên Bắc lần lượt là: \`Hàng Đào\` → \`Hàng Ngang\` → \`Hàng Đường\` → \`Đồng Xuân\` → chạm \`Hàng Đậu\`.
* **Quy luật tên phố "Hàng" theo cụm phường nghề:**
  * *Đồ kim hoàn, tài chính:* Hàng Bạc, Hà Trung.
  * *Đồ lễ, giấy, trang trí:* Hàng Mã, Lương Văn Can (đồ chơi), Hàng Lược.
  * *Đông y, thuốc Bắc:* Lãn Ông, Thuốc Bắc (sát Hàng Thiếc, Hàng Đồng, Lò Rèn).
  * *Ẩm thực đêm & giao lưu quốc tế:* Tạ Hiện – Lương Ngọc Quyến – Mã Mây – Đào Duy Từ.

#### B. Phía Nam Hồ Gươm – Lưới Ô Bàn Cờ Phố Pháp (Orthogonal Grid)
Được quy hoạch cuối thế kỷ 19 – đầu thế kỷ 20 với các ngã tư vuông góc 90° và vỉa hè rộng rợp bóng cây sấu:
* **4 Trục Đông – Tây song song (∥) từ Bắc xuống Nam:**
  1. \`Tràng Tiền – Hàng Khay – Tràng Thi\` (**1 chiều Đông → Tây** từ Nhà Hát Lớn sang Cửa Nam).
  2. \`Hai Bà Trưng\` (**2 chiều** toàn tuyến chính).
  3. \`Lý Thường Kiệt\` (**2 chiều** toàn tuyến chính).
  4. \`Trần Hưng Đạo\` (**2 chiều** rộng nhất, nối thẳng cửa Ga Hà Nội sang Viện 108).
* **7 Trục Bắc – Nam vuông góc (⊥) xếp từ Đông sang Tây:**
  \`Lê Thánh Tông\` ∥ \`Phan Chu Trinh / Ngô Quyền\` ∥ \`Hàng Bài – Phố Huế\` ∥ \`Bà Triệu\` ∥ \`Quang Trung\` ∥ \`Quán Sứ\` ∥ \`Phan Bội Châu – Lê Duẩn\`.

---

### 2. Bảng Vàng Các Tuyến Một Chiều Trung Tâm Đã Kiểm Chứng Thực Tế

> [!WARNING]
> **Cảnh báo nhầm lẫn kinh điển tại Phố Huế:** Rất nhiều người bị đánh lừa bởi **số nhà Phố Huế**! Số nhà Phố Huế đánh từ số 1 (đầu Hàng Bài – Hàm Long) tăng dần xuống số ~368 (ngã tư Đại Cồ Việt). Tuy nhiên, **chiều phương tiện được phép đi** lại ngược chiều số nhà: **1 chiều từ NAM lên BẮC (từ Đại Cồ Việt đi lên Hàng Bài → Bờ Hồ)**!

| Tuyến / Cặp Phố Trung Tâm | Chiều Lưu Thông Chuẩn Xác | Khẩu Quyết & Cách Đi Ngược Lại |
| :--- | :--- | :--- |
| **Vòng quanh Hồ Gươm** | \`Đinh Tiên Hoàng\` (lên Bắc) → \`Hàng Đào/Lê Thái Tổ\` (xuống Nam) | Chạy **ngược chiều kim đồng hồ** quanh hồ (cuối tuần thành Phố đi bộ từ tối thứ 6 đến đêm Chủ nhật). |
| **Phố Huế → Hàng Bài** | **1 chiều NAM → BẮC** (Đại Cồ Việt → Bờ Hồ) | **"Phố Huế lên Hồ"** – Đón xe từ Bạch Mai / Đại Cồ Việt tiến thẳng vào Đinh Tiên Hoàng. |
| **Bà Triệu** | **1 chiều BẮC → NAM** (Hàng Khay → Đại Cồ Việt) | **"Bà Triệu xuống Đai"** – Đón xe từ Lê Thái Tổ / Hàng Khay thoát thẳng xuống Vành đai 1. |
| **Tràng Tiền – Hàng Khay – Tràng Thi** | **1 chiều ĐÔNG → TÂY** (Nhà Hát Lớn → Cửa Nam) | Muốn đi ngược từ Cửa Nam về Nhà Hát Lớn: rẽ xuống **Hai Bà Trưng**, **Lý Thường Kiệt** hoặc **Trần Hưng Đạo** (đều 2 chiều!). |
| **Nguyễn Thái Học** | **1 chiều TÂY → ĐÔNG** (Kim Mã → Cửa Nam) | Muốn đi ngược từ Cửa Nam lên Lăng Bác / Kim Mã: đi đường **Điện Biên Phủ** hoặc **Trần Phú (Ba Đình)**. |
| **Hàng Đậu vs Quán Thánh** | \`Hàng Đậu\` (Đông → Tây); \`Phan Đình Phùng\` (có đoạn 1 chiều ô tô Tây → Đông) | Chú ý biển cấm ô tô một chiều quanh khu vực Bốt Hàng Đậu – Phùng Hưng. |

---

### 3. Thuật toán "Vòng Chữ P / Chữ U" Khi Lỡ Đi Quá Số Nhà Trên Đường Một Chiều

Nếu bạn cần vào số nhà 120 Bà Triệu nhưng lỡ trớn chạy vọt xuống số 180 Bà Triệu:
1. **Tuyệt đối không quay đầu đi ngược chiều** hoặc dắt xe lùi trên lòng đường.
2. Đi thẳng thêm 50m tới ngã tư vuông góc (⊥) gần nhất (ví dụ \`Tuệ Tĩnh\` hoặc \`Nguyễn Du\`), **rẽ trái** sang phía Đông 1 block (~180m) để chạm **Phố Huế**.
3. **Rẽ trái** lên **Phố Huế** (chiều Nam → Bắc) chạy ngược lên 1–2 ngã tư (ví dụ \`Trần Hưng Đạo\` hoặc \`Lý Thường Kiệt\`).
4. **Rẽ trái** quay lại **Bà Triệu** và tiếp cận đúng số nhà 120 một cách hợp pháp, an toàn tuyệt đối!
`
  },

  // =========================================================================
  // CHƯƠNG 8
  // =========================================================================
  {
    id: 'chapter-superblock-cells',
    chapterNumber: 8,
    stageId: 'stage-3-micro',
    difficulty: 'Trung cấp',
    title: 'Tư Duy Khối Ô Phố (Superblock Cells) & Chiến Thuật Thoát Mê Cung Ngõ',
    subtitle: 'Biến hàng vạn con ngõ ziczac của Hà Nội thành những "hộp kín có 4 cửa thoát hiểm" rõ ràng',
    badge: 'Định Vị Khối Ô',
    iconName: 'Maximize2',
    readTimeMin: 8,
    recommendedPracticeMode: 'superblock_cell',
    recommendedPracticeLabel: 'Luyện Chế độ D: Ô phố & Lối thoát',
    cognitiveMechanism: 'Phân rã đa giác lồi (Convex Polygon Decomposition) & Định hướng hướng biên (Boundary-Directed Escape)',
    keyTakeaways: [
      'Mạng lưới vành đai và trục hướng tâm cắt Hà Nội thành các Khối Ô Phố (Superblocks) rộng khoảng 1–2 km².',
      'Bên trong mỗi Ô Phố có thể uốn lượn như mê cung làng cổ, nhưng BÊN NGOÀI nó luôn bị khóa chặt bởi 3–4 đại lộ lớn.',
      'Khi lạc trong ngõ sâu: Đừng quay lui tìm đường cũ; hãy giữ cố định 1 hướng la bàn để đâm thủng ra bất kỳ cạnh bao nào của Ô Phố!'
    ],
    quickCheck: {
      question: 'Khu đô thị Trung Hòa – Nhân Chính nằm gọn trong 4 cạnh đại lộ nào, và trục xương sống chạy xuyên giữa ô này là phố nào?',
      answer: 'Bao quanh bởi 4 cạnh: Trần Duy Hưng (Tây Bắc), Đường Láng (Đông Bắc), Lê Văn Lương (Đông Nam), Khuất Duy Tiến (Tây Nam). Hai trục xương sống cắt ngang bên trong là Hoàng Đạo Thúy và Hoàng Minh Giám!'
    },
    contentMarkdown: `
### 1. Vì sao Hà Nội có cấu trúc "Ngoài Đại Lộ – Trong Làng Cổ"?

Quá trình đô thị hóa của Hà Nội diễn ra bằng cách mở các đại lộ mới bao quanh những ngôi làng nghìn năm tuổi (*Làng Thành Công, Làng Yên Hòa, Làng Cót, Làng Trung Tự, Làng Đình Thôn, Làng Phú Đô...*). Kết quả tạo nên hình thái **Superblock (Siêu Ô Phố)**:
* **Vỏ ngoài:** Đại lộ 4–8 làn xe thẳng tắp, dễ định hướng.
* **Ruột trong:** Mạng lưới đường làng cổ, hồ đình làng và khu tập thể đan cài phức tạp.

Nếu bạn cố nhớ từng ngách trong ruột làng, bạn sẽ lạc. Nhưng nếu bạn nắm được **4 cạnh khung bao quanh Ô Phố**, bạn không bao giờ có thể lạc quá 5 phút!

---

### 2. Hồ Sơ 8 Siêu Ô Phố Trọng Điểm Phải Nắm Chắc

| Tên Ô Phố (Superblock) | Quận | 4 Cạnh Đại Lộ Bao Quanh (Khung Thép) | Trục Xương Cá Thoát Nhanh Ra Ngoài |
| :--- | :--- | :--- | :--- |
| **1. Ô Thành Công – Giảng Võ** | Ba Đình / Đống Đa | \`Nguyễn Chí Thanh\` – \`Huỳnh Thúc Kháng\` – \`Láng Hạ\` – \`Đường Láng\` | **Nguyên Hồng**, **Vũ Ngọc Phan**, **Trúc Khê**, **Thành Công** |
| **2. Ô Thái Hà – Thái Thịnh** | Đống Đa | \`Láng Hạ\` – \`Thái Hà\` – \`Tây Sơn\` – \`Đường Láng\` | **Thái Thịnh**, **Yên Lãng** (chạy xuyên Đông – Tây), **Đặng Tiến Đông** |
| **3. Ô Trung Hòa – Nhân Chính** | Cầu Giấy / Thanh Xuân | \`Trần Duy Hưng\` – \`Đường Láng\` – \`Lê Văn Lương\` – \`Khuất Duy Tiến\` | **Hoàng Đạo Thúy**, **Hoàng Minh Giám**, **Nguyễn Thị Định**, **Nguyễn Thị Thập** |
| **4. Ô Bách – Kinh – Xây** | Hai Bà Trưng | \`Đại Cồ Việt\` – \`Trần Đại Nghĩa / Bạch Mai\` – \`Đại La\` – \`Giải Phóng\` | **Trần Đại Nghĩa**, **Tạ Quang Bửu**, **Lê Thanh Nghị** |
| **5. Ô Dịch Vọng – Yên Hòa** | Cầu Giấy | \`Xuân Thủy – Cầu Giấy\` – \`Đường Láng (Tô Lịch)\` – \`Dương Đình Nghệ\` – \`Phạm Hùng\` | **Trần Thái Tông – Nguyễn Phong Sắc**, **Trung Kính**, **Thành Thái**, **Duy Tân** |
| **6. Ô Mỹ Đình – Mễ Trì** | Nam Từ Liêm | \`Hồ Tùng Mậu\` – \`Phạm Hùng\` – \`ĐL Thăng Long / Mễ Trì\` – \`Lê Đức Thọ – Lê Quang Đạo\` | **Nguyễn Hoàng**, **Hàm Nghi**, **Trần Hữu Dực**, **Đỗ Đức Dục** |
| **7. Ô Bán Đảo Linh Đàm** | Hoàng Mai | \`Nghiêm Xuân Yêm (VĐ3)\` – \`Giải Phóng – Ngọc Hồi\` – \`Phan Trọng Tuệ\` – \`Kim Giang\` | **Nguyễn Hữu Thọ** (trục độc đạo xuyên bán đảo), **Linh Đường** |
| **8. Ô Bồ Đề – Cổ Linh** | Long Biên | \`Nguyễn Văn Cừ\` – \`Nguyễn Văn Linh\` – \`Cổ Linh\` – \`Đê Long Biên – Xuân Quan\` | **Ngọc Lâm**, **Bồ Đề**, **Hồng Tiến**, **Hoàng Như Tiếp** |

---

### 3. Quy tắc 3 Bước Thoát Khỏi Ngõ Cụt (Alley Escape Protocol)

> [!TIP]
> **Mẹo đọc "Dòng chảy xe máy" trong ngõ sâu Hà Nội:**
> 1. **Nhìn độ rộng và rãnh thoát nước:** Ngõ thông ra đường lớn luôn có mặt nhựa/bê tông mòn bóng hơn và lưu lượng xe chạy liên tục theo hai chiều; ngõ cụt thường tĩnh lặng, có chậu cây hoặc xe dựng sát tường.
> 2. **Đọc biển số nhà gắn tên phố:** Ngay cả khi bạn đứng sâu 800m trong ngõ, tấm biển xanh trên tường nhà dân vẫn ghi rõ: *"Ngách 35/64 Kim Giang"* hoặc *"Tổ 14 Phường Nhân Chính"*. Dòng chữ cuối cùng chính là **cạnh đại lộ** gần bạn nhất!
> 3. **Đi theo hướng giảm dần của cấp phân nhánh:** \`Hẻm (3 gạch: 64/35/12)\` ➔ tìm ra \`Ngách (2 gạch: 64/35)\` ➔ tìm ra \`Ngõ (1 số: Ngõ 64)\` ➔ chạm thẳng mặt phố lớn!
`
  },

  // =========================================================================
  // CHƯƠNG 9
  // =========================================================================
  {
    id: 'chapter-address-and-alleys',
    chapterNumber: 9,
    stageId: 'stage-3-micro',
    difficulty: 'Trung cấp',
    title: 'Ngữ Pháp Địa Chỉ Hà Nội, Quy Tắc Chẵn/Lẻ & Nghệ Thuật Tiếp Cận Cổng Phụ',
    subtitle: 'Nhìn 1 dòng địa chỉ đoán ngay vị trí trên trục, bên trái hay bên phải đường và lối gửi xe tối ưu',
    badge: 'Ngữ Pháp Đường Phố',
    iconName: 'Bike',
    readTimeMin: 8,
    recommendedPracticeMode: 'address_decoder',
    recommendedPracticeLabel: 'Luyện Chế độ E: Giải mã địa chỉ & Cổng',
    cognitiveMechanism: 'Phân tích cú pháp cây phân cấp (Hierarchical Tree Parsing) & Ước lượng khoảng cách tuyến tính (Scalar Estimation)',
    keyTakeaways: [
      'Cú pháp chuẩn đọc từ phải sang trái: Phố W → Ngõ Z (nằm tại số nhà Z mặt phố) → Ngách Z/Y (tại nhà số Y trong ngõ) → Hẻm Z/Y/X → Số nhà.',
      'Quy chuẩn đánh số nhà Hà Nội: Đi theo chiều số nhà tăng dần (thường từ tâm ra ngoại vi), bên TAY TRÁI là SỐ LẺ (1, 3, 5...), bên TAY PHẢI là SỐ CHẴN (2, 4, 6...).',
      'Với bệnh viện, trường đại học lớn và bến xe: biết trước Cổng Phụ giúp tránh dải phân cách cứng phải quay đầu xa 1–2 km.'
    ],
    quickCheck: {
      question: 'Bạn đi trên đường Nguyễn Trãi từ Ngã Tư Sở về phía Hà Đông (chiều số nhà tăng dần). Địa chỉ "Số 72A Nguyễn Trãi (Royal City)" nằm ở bên tay phải hay bên tay trái của bạn?',
      answer: 'Nằm ngay bên TAY PHẢI của bạn! Vì đi theo chiều số nhà tăng dần (từ tâm ra ngoài), bên phải luôn là dãy SỐ CHẴN (72A là số chẵn), bên trái là dãy SỐ LẺ.'
    },
    contentMarkdown: `
### 1. Giải Mã Cây Phân Cấp Địa Chỉ: Phố → Ngõ → Ngách → Hẻm

Địa chỉ Hà Nội thực chất là một **cây tọa độ thư mục (File Path)** cực kỳ logic nếu bạn đọc ngược từ ngoài vào trong. Xét địa chỉ mẫu:
\`Số 8, Hẻm 165/12/4, Ngách 165/12, Ngõ 165 Cầu Giấy\` (hoặc viết tắt: \`Số 8, ngõ 165/12/4 Cầu Giấy\`):

1. **Gốc (\`Đường Cầu Giấy\`):** Tìm trục đường Cầu Giấy.
2. **Cấp 1 (\`Ngõ 165\`):** Vì 165 là **số lẻ**, khi đi từ Kim Mã – Voi Phục ra Xuân Thủy, ngõ này chắc chắn nằm bên **tay trái**, ngay cạnh nhà mặt tiền số 165 Cầu Giấy.
3. **Cấp 2 (\`Ngách 165/12\`):** Đi vào trong Ngõ 165 đến khoảng số nhà 12 (bên tay phải trong ngõ vì 12 là số chẵn) sẽ thấy lối rẽ vào Ngách 12.
4. **Cấp 3 (\`Hẻm 165/12/4\`):** Đi vào Ngách 12 đến nhà số 4 rẽ vào Hẻm 4, tìm căn nhà số 8!

> [!IMPORTANT]
> **Mẹo ước lượng cự ly bằng số nhà:** Trên các đại lộ dài có dải phân cách cứng ở giữa (như *Giải Phóng, Nguyễn Trãi, Đường Láng, Nguyễn Văn Cừ, Lạc Long Quân*), việc biết điểm đến là **số chẵn hay số lẻ** quyết định điểm mở dải phân cách bạn phải rẽ!
> * Số nhà Hà Nội gần như luôn đánh bắt đầu từ **Số 1 & Số 2 ở đầu gần trung tâm (Hồ Gươm / Bờ Sông Hồng)** và lớn dần khi đi ra ngoại thành (ví dụ: Đường Láng đánh số 1 từ Ngã Tư Sở tăng lên hơn 1.200 ở Cầu Giấy – Bưởi!).

---

### 2. Cẩm Nang "Cổng Chính vs Cổng Phụ" Tại Các Đại Địa Điểm Hà Nội

Một bệnh viện hay trường đại học lớn ở Hà Nội thường chiếm trọn một nửa Ô Phố và mở cổng ra 2–3 mặt đường khác nhau. Bảng dưới đây là bí kíp của các tài xế thực chiến:

| Địa điểm Lớn | Cổng Chính (Thường Đông / Hạn Chế Đỗ) | Cổng Phụ / Lối Tiếp Cận Thông Minh Cho Xe Máy |
| :--- | :--- | :--- |
| **Bệnh viện Bạch Mai** | Số 78 **Giải Phóng** (sát gầm cầu vượt Ngã Tư Vọng, cấm dừng đỗ gắt) | **Cổng phố Phương Mai** (rẽ từ Giải Phóng hoặc Lương Định Của vào, gửi xe nhanh). |
| **Bệnh viện Việt Đức** | Số 40 **Tràng Thi** (đường 1 chiều Đông → Tây rất đông) | **Cổng Cấp cứu phố Phủ Doãn** (nối giữa Hàng Bông – Tràng Thi – Ấu Triệu). |
| **BV TW Quân đội 108** | Số 1 **Trần Hưng Đạo** | Cổng cấp cứu & khám bệnh thuận tiện sát vòng xuyến **Trần Khánh Dư – Trần Hưng Đạo**. |
| **ĐH Bách Khoa Hà Nội** | Số 1 **Đại Cồ Việt** & Cổng Parabol **Giải Phóng** | **Cổng Trần Đại Nghĩa** và **Cổng Tạ Quang Bửu** (vào thẳng khu giảng đường & nhà xe). |
| **ĐH Kinh Tế Quốc Dân** | Số 207 **Giải Phóng** (ngược chiều phải vòng dưới gầm cầu Ngã Tư Vọng) | **Cổng phố Trần Đại Nghĩa** (2 chiều thoáng rộng, sát ký túc xá). |
| **Bến xe Mỹ Đình** | Số 20 **Phạm Hùng** (xe khách lớn ra vào liên tục) | Tiếp cận gửi xe máy / đón người cực êm từ mặt sau **phố Nguyễn Hoàng** hoặc **Trần Bình**. |
| **Lotte Mall West Lake** | Số 272 **Võ Chí Công** (làn gom bên phải hướng lên cầu Nhật Tân) | Mặt bên **đường Lạc Long Quân** (ngõ 683 Lạc Long Quân / Phú Thượng) nếu đi từ phía Hồ Tây lên. |
`
  },

  // =========================================================================
  // CHƯƠNG 10
  // =========================================================================
  {
    id: 'chapter-metro-and-grade-separation',
    chapterNumber: 10,
    stageId: 'stage-4-mastery',
    difficulty: 'Chuyên sâu',
    title: 'Đường Sắt Đô Thị (Metro 2A, Metro 3), BRT & Ma Trận Hầm Chui – Đường Trên Cao',
    subtitle: 'Dùng hạ tầng cầu cạn làm mốc dẫn đường tuyệt đối và tránh 100% lỗi đi nhầm vào đường cấm xe máy',
    badge: 'Hạ Tầng Hiện Đại',
    iconName: 'Zap',
    readTimeMin: 9,
    recommendedPracticeMode: 'oneway_turn_trap',
    recommendedPracticeLabel: 'Luyện Chế độ G: Làn đường & Hầm/Cầu',
    cognitiveMechanism: 'Nhận diện hạ tầng tuyến tính trên cao (Elevated Infrastructure Tracking) & Lọc quy tắc phân làn phương tiện (Modal Constraint Filtering)',
    keyTakeaways: [
      'Metro 2A (Cát Linh – Hà Đông) khóa chặt trục Tây Nam (7h); Metro 3 (Nhổn – Cầu Giấy – Ga Hà Nội) khóa chặt trục Tây (9h30); BRT 01 khóa chặt trục Giảng Võ – Lê Văn Lương – Tố Hữu (7h30).',
      'CẤM XE MÁY TUYỆT ĐỐI tại 4 tuyến: Vành đai 2 trên cao, Vành đai 3 trên cao (gồm tầng 2 Cầu Thăng Long), Làn cao tốc giữa Đại lộ Thăng Long, Cao tốc Pháp Vân – Cầu Giẽ & Hà Nội – Hải Phòng (5B).',
      'XE MÁY ĐƯỢC ĐI QUA toàn bộ 6 hầm chui đô thị lớn: Kim Liên, Trung Hòa, Thanh Xuân, Lê Văn Lương, Giải Phóng – Kim Đồng, Mễ Trì.'
    ],
    quickCheck: {
      question: 'Bạn đi xe máy trên đường Trần Duy Hưng qua Hầm chui Trung Hòa để sang Đại lộ Thăng Long đi Chùa Thầy. Bạn có được đi qua hầm Trung Hòa không, và vừa ra khỏi hầm phải xử lý thế nào?',
      answer: 'ĐƯỢC PHÉP đi qua hầm Trung Hòa, NHƯNG ngay khi vừa thoát lên mặt đường phía Tây hầm, bạn BẮT BUỘC phải xi-nhan chuyển sang LÀN ĐƯỜNG GOM BÊN PHẢI – tuyệt đối không chạy thẳng vào làn cao tốc Đại lộ Thăng Long ở giữa!'
    },
    contentMarkdown: `
### 1. Đọc Vị 2 Tuyến Metro & 1 Tuyến BRT Như "La Bàn Bê Tông Khổng Lồ"

Dù trời tối mịt hay không nhìn thấy biển tên phố, hàng trụ bê tông đường sắt đô thị trên đầu bạn là vật chuẩn không bao giờ nói dối:

* **Tuyến Metro 2A (Cát Linh – Hà Đông · Màu Xanh Lá):**
  * **Chuỗi 12 Ga:** \`Cát Linh\` ➔ \`La Thành\` ➔ \`Thái Hà\` ➔ \`Láng\` ➔ \`Thượng Đình\` ➔ \`Vành Đai 3\` ➔ \`Phùng Khoang\` ➔ \`Văn Quán\` ➔ \`Hà Đông\` ➔ \`La Khê\` ➔ \`Văn Khê\` ➔ \`Yên Nghĩa\`.
  * **Mẹo định vị:** Đứng dưới ga \`Thái Hà\` hay \`Láng\` là bạn đang ở Vành đai 1.5 – VĐ2 (Hoàng Cầu – Yên Lãng – Đường Láng); từ ga \`Thượng Đình\` trở đi, tàu chạy thẳng tắp một mạch trên dải phân cách giữa của trục **Nguyễn Trãi – Trần Phú – Quang Trung**!
* **Tuyến Metro số 3 (Nhổn – Ga Hà Nội · Màu Đỏ):**
  * **8 Ga trên cao đang chạy:** \`Nhổn\` ➔ \`Minh Khai\` ➔ \`Phú Diễn\` ➔ \`Cầu Diễn\` ➔ \`Lê Đức Thọ\` ➔ \`Đại học Quốc gia\` ➔ \`Chùa Hà\` ➔ \`Cầu Giấy\`.
  * **4 Ga ngầm vào trung tâm:** \`Kim Mã\` ➔ \`Cát Linh\` *(điểm trung chuyển với Metro 2A)* ➔ \`Văn Miếu\` ➔ \`Ga Hà Nội\`.
* **Tuyến Buýt Nhanh BRT 01 (Kim Mã – Yên Nghĩa):**
  * Chạy dọc nhà chờ giữa tim đường: \`Giảng Võ\` ➔ \`Láng Hạ\` ➔ \`Lê Văn Lương\` ➔ \`Tố Hữu\`. Xe cá nhân tuyệt đối không đi đè vào làn vạch liền BRT để tránh phạt nguội camera!

---

### 2. Ma Trận Phân Làn Sống Còn: Đâu Cho Phép & Đâu Cấm Tuyệt Đối Xe Máy?

Đây là bảng quy tắc quan trọng bậc nhất cho bất kỳ ai điều khiển xe 2 bánh tại Hà Nội:

| Công trình Hạ tầng | Quy định cho Xe Máy | Giải thích & Lưu ý Thực tế |
| :--- | :--- | :--- |
| **Đường trên cao Vành đai 2** *(Vĩnh Tuy ↔ Ngã Tư Sở)* | **CẤM TUYỆT ĐỐI** | Đường dành riêng cho ô tô (80 km/h). Xe máy đi dưới đường Minh Khai – Đại La – Trường Chinh mặt đất. |
| **Đường trên cao Vành đai 3** *(Mai Dịch ↔ Cầu Thanh Trì)* | **CẤM TUYỆT ĐỐI** | Cao tốc đô thị CT.20 chỉ dành cho ô tô. Xe máy đi dưới Phạm Hùng – Khuất Duy Tiến – Nguyễn Xiển. |
| **Cầu Thăng Long** | **Cấm tầng 2 · Đi tầng 1** | Tầng 2 trên cao nối thẳng VĐ3 chỉ cho ô tô; xe máy đi đường dẫn thấp vào hành lang cánh gà tầng 1. |
| **Đại lộ Thăng Long & Võ Nguyên Giáp** | **Cấm làn giữa · Đi đường gom** | Cả hai đại lộ đều có hệ thống **đường gom 2 bên** có dải phân cách cứng tách khỏi làn cao tốc 80–100 km/h ở giữa. |
| **6 Hầm chui nội đô** *(Kim Liên, Trung Hòa, Thanh Xuân, Lê Văn Lương, Kim Đồng)* | **ĐƯỢC PHÉP ĐI** | Xe máy đi qua hầm cực nhanh để né đèn đỏ ngã tư lớn (nhớ bật đèn chiếu gần và giữ đúng làn!). |
| **Các Cầu vượt nhẹ nội đô** *(Ngã Tư Sở, Thái Hà – Chùa Bộc, Láng Hạ, Nguyễn Chí Thanh, Mai Dịch thép)* | **ĐƯỢC PHÉP ĐI** *(trừ giờ/biển đặc biệt)* | Hầu hết cầu vượt dầm thép lắp ghép trong nội đô cho phép xe máy và ô tô con đi chung để thông nút giao. |
`
  },

  // =========================================================================
  // CHƯƠNG 11
  // =========================================================================
  {
    id: 'chapter-sun-and-skyline',
    chapterNumber: 11,
    stageId: 'stage-4-mastery',
    difficulty: 'Chuyên sâu',
    title: 'La Bàn Mặt Trời Vĩ Độ 21.03°N & Tam Giác Đạc Chân Trời (Skyline Triangulation)',
    subtitle: 'Biến ánh nắng trên tay lái và các tòa tháp chọc trời thành hệ thống định vị vệ tinh sinh học',
    badge: 'Định Vị Tự Nhiên',
    iconName: 'Sun',
    readTimeMin: 8,
    recommendedPracticeMode: 'gps_loss_recovery',
    recommendedPracticeLabel: 'Luyện Chế độ I: Đọc manh mối tự nhiên',
    cognitiveMechanism: 'La bàn phương vị mặt trời (Solar Ephemeris Azimuth) & Giao hội góc ngắm tầm xa (Visual Landmark Triangulation)',
    keyTakeaways: [
      'Ở vĩ độ Hà Nội (21.0285°N): Sáng 6h–8h30 nắng chiếu từ hướng Đông / Đông Nam; Trưa 12h mặt trời chếch Nam; Chiều 15h30–17h30 nắng chiếu gắt từ hướng Tây / Tây Nam.',
      'Hướng bóng đổ của xe và cột điện luôn ngược đúng 180° với góc phương vị mặt trời.',
      '4 Cột mốc Skyline tầm xa: Keangnam 72 (Tây – VĐ3), Lotte Liễu Giai (Tây Bắc lõi – Ba Đình), Lotte Mall Tây Hồ (Bắc – Võ Chí Công), TechnoPark (Đông – Gia Lâm).'
    ],
    quickCheck: {
      question: 'Lúc 07h30 sáng, bạn đang chạy xe trên một đại lộ lớn và thấy bóng của mình đổ thẳng dài ra phía trước đầu xe. Bạn đang đi về hướng nào?',
      answer: 'Bạn đang đi về hướng TÂY (ví dụ từ trung tâm đi ra Cầu Giấy hoặc Trần Duy Hưng). Vì 7h30 sáng mặt trời ở phía Đông sau lưng bạn nên mới hắt bóng dài về phía Tây trước đầu xe!'
    },
    contentMarkdown: `
### 1. Bảng Chuẩn Góc Phương Vị Mặt Trời & Bóng Đổ Tại Hà Nội (21.03°N)

Không cần rút điện thoại giữa dòng xe đông đúc, chỉ cần liếc nhìn **hướng nắng rọi vào kính mũ bảo hiểm** hoặc **bóng xe dưới mặt nhựa đường**:

| Khung Giờ | Góc Phương Vị Mặt Trời | Vị Trí Mặt Trời | Hướng Bóng Đổ Của Bạn | Suy Luận Tức Thì Trên Đường Hà Nội |
| :--- | :--- | :--- | :--- | :--- |
| **06:00 – 08:30** | 85° – 110° | **Đông / Đông Nam** | Đổ dài về **Tây / Tây Bắc** | Chói mắt phía trước = đang đi về phía Sông Hồng / Hoàn Kiếm / Long Biên. Nắng sau gáy = đang đi ra Cầu Giấy / Mỹ Đình. |
| **09:00 – 11:00** | 120° – 160° | **Đông Nam** | Đổ xiên về **Tây Bắc** | Đi hướng Nam (Giải Phóng) thấy nắng chếch bên tay trái. |
| **11:30 – 13:00** | 165° – 195° | **Chính Nam** *(đa số các tháng)* | Bóng ngắn sát chân xe (hơi hắt Bắc) | Dựa thêm vào mốc tòa nhà và biển tên trục. |
| **15:30 – 17:30** | 245° – 275° | **Tây / Tây Nam** | Đổ dài về **Đông / Đông Bắc** | **Giờ tan tầm kinh điển:** Nắng quái chiều rọi thẳng mặt = bạn chắc chắn đang đi trên các trục hướng Tây (Xuân Thủy, Trần Duy Hưng, Lê Văn Lương, Nguyễn Trãi)! |

---

### 2. Kỹ Thuật Tam Giác Đạc 4 Đỉnh Tháp Chân Trời (Skyline Triangulation)

Khi đứng trên cầu vượt hoặc đi ở các quận mở rộng, hãy ngước nhìn đường chân trời để khóa tọa độ bằng 4 tòa nhà biểu tượng:

1. **Keangnam Landmark 72 (336m – Đỉnh phẳng khối hộp xanh):**
   * Tọa lạc tại **Phạm Hùng – Mễ Trì (Vành đai 3 phía Tây)**.
   * *Cách đọc:* Nếu bạn đang ở Cầu Giấy mà thấy Keangnam ở hướng 7–8 giờ trước mặt → bạn đang hướng về Mỹ Đình / Đại lộ Thăng Long.
2. **Lotte Center Liễu Giai (267m – Đỉnh xẻ khe chữ V tà áo dài):**
   * Tọa lạc tại **Ngã tư Kim Mã – Liễu Giai – Đào Tấn (Ba Đình)**.
   * *Cách đọc:* Đứng bất kỳ đâu quanh Hồ Tây, Đống Đa, Cầu Giấy thấy khe chữ V của tháp Lotte là biết ngay vị trí bản lề giữa Ba Đình và Cầu Giấy!
3. **Tháp Viettel / Tòa nhà Quốc Hội / EVN Cửa Bắc & Lotte Mall Tây Hồ:**
   * Đánh dấu dải không gian từ Ba Đình mở lên cực Bắc Võ Chí Công – Cầu Nhật Tân.
4. **Cụm 5 Trụ Tháp Hình Thoi Cầu Nhật Tân:**
   * Ban đêm phát sáng rực rỡ trên mặt Sông Hồng – ngọn hải đăng chỉ hướng **Chính Bắc (12h)** cho toàn bộ khu vực Tây Hồ – Bắc Từ Liêm – Đông Anh.
`
  },

  // =========================================================================
  // CHƯƠNG 12
  // =========================================================================
  {
    id: 'chapter-hierarchical-routing-and-recovery',
    chapterNumber: 12,
    stageId: 'stage-4-mastery',
    difficulty: 'Chuyên sâu',
    title: 'Thuật Toán Lập Tuyến Phân Cấp 3 Tầng & Giao Thức Phục Hồi Khi Mất GPS',
    subtitle: 'Tổng hợp toàn bộ 11 chương thành phản xạ lập đường đi trong 3 giây của một chuyên gia bản đồ sống',
    badge: 'Đỉnh Cao Thực Chiến',
    iconName: 'Navigation',
    readTimeMin: 10,
    recommendedPracticeMode: 'route_planner_ab',
    recommendedPracticeLabel: 'Luyện Chế độ F & I: Lập tuyến & Phục hồi GPS',
    cognitiveMechanism: 'Tìm kiếm đồ thị phân cấp A* (Hierarchical A* Pathfinding) & Suy diễn phục hồi trạng thái (Sensory State Recovery)',
    keyTakeaways: [
      'Không bao giờ đi chéo qua nhiều ô ngõ lạ liên tiếp: Luôn áp dụng công thức 3 tầng (Thoát ra cạnh Ô Phố → Lướt trên Vành đai / Trục Đồng Hồ → Rẽ vào phố tiếp cận đúng chiều chẵn/lẻ).',
      'Khi tắc đường giờ cao điểm tại nút giao lớn, chuyển sang trục song song hoặc Vành đai trung gian (như VĐ2.5 thay cho VĐ2/VĐ3).',
      'Khi điện thoại sập nguồn: Bám 1 hướng thoát ra đường lớn → Đọc Mặt nước / Metro / Bóng nắng / Biển tên phường → Đồng bộ lại lên Khung Vành Đai – Đồng Hồ 12h.'
    ],
    quickCheck: {
      question: 'Bạn cần đi xe máy từ Khu tập thể Thành Công (Ba Đình) sang Aeon Mall Long Biên. Hãy lập tuyến phân cấp 3 tầng ít đèn đỏ và thoáng nhất!',
      answer: 'Tầng 1 (Thoát ô): Từ Thành Công ra Láng Hạ hoặc Huỳnh Thúc Kháng → Tầng 2 (Trục chính/Vành đai): Lên Xã Đàn – Đại Cồ Việt – Trần Khát Chân (VĐ1) hoặc Trường Chinh – Minh Khai (VĐ2 mặt đất) → Vượt Cầu Vĩnh Tuy → Tầng 3 (Tiếp cận đích): Đổ xuống Đàm Quang Trung – Cổ Linh là vào ngay cổng Aeon Mall Long Biên!'
    },
    contentMarkdown: `
### 1. Thuật Toán Tư Duy Lập Tuyến Phân Cấp 3 Tầng (3-Tier Mental A*)

Một bộ não đã thành thạo bản đồ nhận thức Hà Nội không bao giờ tính toán từng con hẻm từ đầu đến cuối cùng lúc. Nó giải bài toán đi từ **A đến B** trong đúng **3 giây** qua 3 bước trừu tượng hóa:

\`\`\`
BƯỚC 1: THOÁT Ô XUẤT PHÁT (1–3 phút)
  [Ngõ hiện tại] ──(ngõ thông)──► [Cạnh Ô Phố / Nút Giao gần nhất]
                                           │
BƯỚC 2: LƯỚT TRÊN KHUNG XƯƠNG VĨ MÔ (80% quãng đường)
  Chọn 1 trong 2 phương án:
  • Cùng hướng kim đồng hồ? ──► Chạy thẳng TRỤC HƯỚNG TÂM.
  • Khác hướng kim đồng hồ? ──► Chạy vòng ĐƯỜNG VÀNH ĐAI đến đúng tia giờ của B rồi mới rẽ vào!
                                           │
BƯỚC 3: TIẾP CẬN ĐÍCH THÔNG MINH (2 phút cuối)
  [Nút Giao gần B] ──► [Kiểm tra 1 chiều & Số nhà Chẵn/Lẻ / Cổng phụ] ──► [ĐÍCH B]
\`\`\`

#### 3 Kịch Bản Lập Tuyến Mẫu Kinh Điển:
1. **Tây sang Nam (Bến xe Mỹ Đình ➔ Bệnh viện Bạch Mai):**
   * *Sai lầm:* Đi xuyên Cầu Giấy – Kim Mã – Lê Duẩn (qua 20 đèn đỏ lõi trung tâm).
   * *Chuẩn Chuyên gia:* Bám Vành đai 3 (\`Phạm Hùng\` ➔ \`Khuất Duy Tiến\`) ➔ rẽ trái \`Nguyễn Trãi\` ➔ \`Ngã Tư Sở\` ➔ đi \`Trường Chinh\` (VĐ2 mặt đất) ➔ tới \`Ngã Tư Vọng\` rẽ vào **phố Phương Mai** (cổng sau BV Bạch Mai)!
2. **Tây Bắc sang Đông Bắc (Cầu Giấy ➔ Nguyễn Văn Cừ, Long Biên):**
   * *Chuẩn Chuyên gia:* Từ \`Cầu Giấy\` lên \`Bưởi\` ➔ bám hành lang \`Hoàng Hoa Thám / Phan Đình Phùng\` (hoặc \`Thụy Khuê – Thanh Niên – Yên Phụ\`) ➔ \`Trần Nhật Duật\` ➔ vượt **Cầu Chương Dương** là chạm ngay \`Nguyễn Văn Cừ\`!
3. **Nam sang Sân bay Nội Bài (Linh Đàm / Hoàng Mai ➔ Nội Bài):**
   * *Ô tô:* Lên thẳng VĐ3 trên cao ➔ Cầu Thăng Long ➔ Võ Văn Kiệt (hoặc VĐ2 trên cao ➔ Võ Chí Công ➔ Nhật Tân).
   * *Xe máy:* Chạy dọc \`Đường Láng – Bưởi – Võ Chí Công\` ➔ vượt **Cầu Nhật Tân** ➔ đi làn đường gom **Võ Nguyên Giáp** thẳng tới Nhà ga T1/T2!

---

### 2. Giao Thức 4 Bước Sinh Tồn Khi Sập Nguồn Điện Thoại (Zero-GPS Protocol)

Giả sử bạn bị lạc lúc 17h15 chiều hoặc 21h tối tại một khu phố hoàn toàn xa lạ và điện thoại tắt nguồn:

1. **Bước 1 – Thoát khỏi vùng nhiễu (Exit the Cell):** Giữ nguyên 1 hướng trục ngõ rộng nhất, tuyệt đối không rẽ ziczac liên tục, chạy thẳng 300–500m cho đến khi gặp đường có xe buýt chạy hoặc có dải phân cách.
2. **Bước 2 – Thu thập 2 manh mối độc lập (Dual-Clue Lock):**
   * *Nhìn biển quảng cáo hộ kinh doanh:* Mọi biển hiệu tạp hóa/nhà thuốc đều ghi địa chỉ ở dòng đáy cùng (*"Số 45 Vũ Tông Phan, Khương Đình, Thanh Xuân"*).
   * *Nhìn hạ tầng & tự nhiên:* Có sông nhỏ bên cạnh không (Tô Lịch / Nhuệ)? Có trụ tàu điện trên cao không (Metro 2A hay Metro 3)? Nắng chiều đang ở vai nào?
3. **Bước 3 – Ghim lên Bản Đồ 5 Lớp trong đầu:** *"À, Vũ Tông Phan = bờ Tây sông Tô Lịch, nối giữa Ngã Tư Sở (VĐ2) và Cầu Dậu/Kim Giang (VĐ3)"*.
4. **Bước 4 – Bám Trục Xương Sống về Đích:** Chạy dọc bờ sông lên thẳng **Ngã Tư Sở** – từ nút giao cấp 1 này, mọi ngả đường về nhà bạn đều đã nằm gọn trong lòng bàn tay!
`
  }
];

// ============================================================================
// NGÂN HÀNG 20 CÂU HỎI CHẨN ĐOÁN NHẬN THỨC ĐA CHIỀU (DIAGNOSTIC QUIZ BANK)
// ============================================================================
export type HanoiQuizDomain =
  | 'hydrology_bridges'
  | 'rings_radials'
  | 'french_grid_oneway'
  | 'solar_skyline'
  | 'routing_address';

export interface IHanoiDiagnosticQuestion {
  id: string;
  domain: HanoiQuizDomain;
  domainLabelVi: string;
  difficulty: 'Cơ bản' | 'Trung cấp' | 'Thực chiến';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedChapterNumber: number;
}

export const HANOI_QUIZ_BANK: IHanoiDiagnosticQuestion[] = [
  {
    id: 'hq-01',
    domain: 'hydrology_bridges',
    domainLabelVi: 'Thủy văn & Cầu Sông Hồng',
    difficulty: 'Cơ bản',
    question: 'Theo đúng chiều dòng chảy Sông Hồng từ Thượng lưu (Tây Bắc) xuống Hạ lưu (Đông Nam), thứ tự 6 cây cầu nội đô nào sau đây là CHÍNH XÁC 100%?',
    options: [
      'Cầu Nhật Tân → Cầu Thăng Long → Cầu Long Biên → Cầu Chương Dương → Cầu Vĩnh Tuy → Cầu Thanh Trì',
      'Cầu Thăng Long → Cầu Nhật Tân → Cầu Long Biên → Cầu Chương Dương → Cầu Vĩnh Tuy → Cầu Thanh Trì',
      'Cầu Thăng Long → Cầu Long Biên → Cầu Nhật Tân → Cầu Chương Dương → Cầu Thanh Trì → Cầu Vĩnh Tuy',
      'Cầu Nhật Tân → Cầu Chương Dương → Cầu Long Biên → Cầu Thăng Long → Cầu Vĩnh Tuy → Cầu Thanh Trì'
    ],
    correctIndex: 1,
    explanation: 'Sông Hồng chảy từ Tây Bắc sang Đông Nam: qua Đông Ngạc (Cầu Thăng Long – VĐ3) trước, rồi mới chảy ngang phía Bắc Hồ Tây (Cầu Nhật Tân – VĐ2), sau đó vòng xuống Hoàn Kiếm (Long Biên → Chương Dương), Hai Bà Trưng (Vĩnh Tuy – VĐ2) và Hoàng Mai (Thanh Trì – VĐ3). Khẩu quyết: "Thăng – Nhật – Long – Chương – Vĩnh – Thanh".',
    relatedChapterNumber: 3
  },
  {
    id: 'hq-02',
    domain: 'hydrology_bridges',
    domainLabelVi: 'Thủy văn & Cầu Sông Hồng',
    difficulty: 'Trung cấp',
    question: 'Cây cầu nào ở Hà Nội có quy tắc lưu thông độc nhất vô nhị: CẤM Ô TÔ và các phương tiện xe máy, xe đạp đi theo LỀ BÊN TRÁI?',
    options: [
      'Cầu Chương Dương',
      'Cầu Thăng Long (tầng 1)',
      'Cầu Long Biên',
      'Cầu Đuống'
    ],
    correctIndex: 2,
    explanation: 'Cầu Long Biên (xây năm 1902 thời Pháp) giữ nguyên tổ chức giao thông bên lề trái theo chuẩn đường sắt Pháp xưa và cấm toàn bộ ô tô, chỉ cho phép tàu hỏa, xe máy, xe đạp và người đi bộ.',
    relatedChapterNumber: 3
  },
  {
    id: 'hq-03',
    domain: 'hydrology_bridges',
    domainLabelVi: 'Thủy văn & Cầu Sông Hồng',
    difficulty: 'Trung cấp',
    question: 'Bạn đang chạy xe dọc bờ sông Tô Lịch theo hướng từ Cầu Giấy về Ngã Tư Sở (hướng Đông Nam) và thấy dòng sông nằm ngay bên TAY PHẢI của mình. Bạn đang đi trên đường nào?',
    options: [
      'Đường Láng (thuộc quận Đống Đa)',
      'Đường Nguyễn Khang (thuộc quận Cầu Giấy)',
      'Đường Kim Mã (thuộc quận Ba Đình)',
      'Đường Trường Chinh (thuộc quận Thanh Xuân)'
    ],
    correctIndex: 0,
    explanation: 'Đoạn từ Bưởi/Cầu Giấy xuống Ngã Tư Sở: Đường Láng nằm ở bờ Đông sông Tô Lịch, Nguyễn Khang nằm ở bờ Tây. Khi đi xuôi về Ngã Tư Sở mà sông ở bên tay phải (phía Tây), bạn chắc chắn đang đi trên Đường Láng!',
    relatedChapterNumber: 3
  },
  {
    id: 'hq-04',
    domain: 'hydrology_bridges',
    domainLabelVi: 'Thủy văn & Cầu Sông Hồng',
    difficulty: 'Cơ bản',
    question: 'Trong 12 quận nội thành hiện hành của Hà Nội, duy nhất quận nào nằm toàn bộ ở phía Tả ngạn (bờ Bắc/Đông) Sông Hồng?',
    options: [
      'Quận Tây Hồ',
      'Quận Hoàng Mai',
      'Quận Long Biên',
      'Quận Bắc Từ Liêm'
    ],
    correctIndex: 2,
    explanation: 'Quận Long Biên nằm hoàn toàn bên bờ Tả ngạn Sông Hồng (kết nối với nội đô hữu ngạn qua Cầu Long Biên, Chương Dương, Vĩnh Tuy). Cả 11 quận còn lại đều nằm bên bờ Hữu ngạn.',
    relatedChapterNumber: 4
  },
  {
    id: 'hq-05',
    domain: 'french_grid_oneway',
    domainLabelVi: 'Phố Pháp & Đường 1 Chiều',
    difficulty: 'Cơ bản',
    question: 'Cặp phố một chiều song song kinh điển nối giữa khu vực Hồ Gươm và đường Đại Cồ Việt (Vành đai 1) có chiều lưu thông thực tế như thế nào?',
    options: [
      'Phố Huế đi 1 chiều từ Nam lên Bắc (về Bờ Hồ); Bà Triệu đi 1 chiều từ Bắc xuống Nam (ra Đại Cồ Việt)',
      'Phố Huế đi 1 chiều từ Bắc xuống Nam; Bà Triệu đi 1 chiều từ Nam lên Bắc',
      'Cả Phố Huế và Bà Triệu đều đi 2 chiều đối với xe máy, chỉ 1 chiều ô tô',
      'Phố Huế đi Đông sang Tây; Bà Triệu đi Tây sang Đông'
    ],
    correctIndex: 0,
    explanation: 'Khẩu quyết chuẩn xác: "Phố Huế lên Hồ – Bà Triệu xuống Đai". Phố Huế đi 1 chiều từ Nam lên Bắc (Đại Cồ Việt → Hàng Bài → Đinh Tiên Hoàng, ngược chiều tăng của số nhà); Bà Triệu đi 1 chiều từ Bắc xuống Nam (Hàng Khay → Đại Cồ Việt).',
    relatedChapterNumber: 7
  },
  {
    id: 'hq-06',
    domain: 'french_grid_oneway',
    domainLabelVi: 'Phố Pháp & Đường 1 Chiều',
    difficulty: 'Trung cấp',
    question: 'Trục phố nối liền mạch sát bờ Nam Hồ Gươm "Tràng Tiền – Hàng Khay – Tràng Thi" cho phép lưu thông theo chiều nào?',
    options: [
      'Một chiều xuyên suốt từ TÂY sang ĐÔNG (từ Cửa Nam về Nhà Hát Lớn)',
      'Một chiều xuyên suốt từ ĐÔNG sang TÂY (từ Nhà Hát Lớn qua bờ Nam Hồ Gươm về Ngã 5 Cửa Nam)',
      'Hai chiều toàn tuyến vào các ngày trong tuần',
      'Tràng Tiền 1 chiều Đông, Tràng Thi 1 chiều Tây tỏa ra từ Hàng Khay'
    ],
    correctIndex: 1,
    explanation: 'Toàn trục Tràng Tiền → Hàng Khay → Tràng Thi là đường 1 chiều thống nhất chạy từ ĐÔNG sang TÂY (Nhà Hát Lớn → Ngã 5 Cửa Nam). Muốn đi ngược từ Cửa Nam sang phía Đông phải đi Hai Bà Trưng, Lý Thường Kiệt hoặc Trần Hưng Đạo.',
    relatedChapterNumber: 7
  },
  {
    id: 'hq-07',
    domain: 'french_grid_oneway',
    domainLabelVi: 'Phố Pháp & Đường 1 Chiều',
    difficulty: 'Cơ bản',
    question: 'Trong lưới ô bàn cờ Phố Pháp (quận Hoàn Kiếm), cặp đường nào sau đây có quan hệ VUÔNG GÓC (⊥) tại ngã tư?',
    options: [
      'Trần Hưng Đạo và Lý Thường Kiệt',
      'Hai Bà Trưng và Tràng Thi',
      'Lý Thường Kiệt và Quán Sứ',
      'Bà Triệu và Quang Trung'
    ],
    correctIndex: 2,
    explanation: 'Lý Thường Kiệt là đại lộ chạy trục Đông – Tây, trong khi Quán Sứ chạy trục Bắc – Nam, nên hai phố cắt vuông góc 90° (⊥). Các cặp còn lại đều song song (∥) với nhau.',
    relatedChapterNumber: 7
  },
  {
    id: 'hq-08',
    domain: 'french_grid_oneway',
    domainLabelVi: 'Phố Pháp & Đường 1 Chiều',
    difficulty: 'Trung cấp',
    question: 'Từ bờ Bắc Hồ Gươm (Quảng trường Đông Kinh Nghĩa Thục) đi thẳng tắp một mạch về phía Bắc xuyên tâm khu 36 Phố Phường tới Chợ Đồng Xuân, bạn lần lượt đi qua chuỗi phố nào?',
    options: [
      'Hàng Bông → Hàng Gai → Cầu Gỗ → Trần Nhật Duật',
      'Hàng Đào → Hàng Ngang → Hàng Đường → Đồng Xuân',
      'Hàng Bài → Phố Huế → Bạch Mai → Trương Định',
      'Đinh Tiên Hoàng → Hàng Đậu → Phan Đình Phùng'
    ],
    correctIndex: 1,
    explanation: 'Trục thương mại cổ xuyên tâm Bắc – Nam của khu 36 Phố Phường nối tiếp thẳng tắp: Hàng Đào → Hàng Ngang → Hàng Đường → Đồng Xuân (kết thúc tại phố Hàng Đậu).',
    relatedChapterNumber: 7
  },
  {
    id: 'hq-09',
    domain: 'rings_radials',
    domainLabelVi: 'Vành Đai & Trục Đổi Tên',
    difficulty: 'Cơ bản',
    question: 'Cặp cầu vượt Sông Hồng nào đóng vai trò khép kín hoàn chỉnh vòng tròn VÀNH ĐAI 2 của Hà Nội?',
    options: [
      'Cầu Thăng Long và Cầu Thanh Trì',
      'Cầu Nhật Tân và Cầu Vĩnh Tuy',
      'Cầu Long Biên và Cầu Chương Dương',
      'Cầu Thượng Cát và Cầu Ngọc Hồi'
    ],
    correctIndex: 1,
    explanation: 'Vành đai 2 khép kín qua Cầu Nhật Tân (phía Bắc) và Cầu Vĩnh Tuy (phía Nam). Còn Cầu Thăng Long + Cầu Thanh Trì là cặp cầu khép kín Vành đai 3; Thượng Cát + Ngọc Hồi thuộc Vành đai 3.5.',
    relatedChapterNumber: 5
  },
  {
    id: 'hq-10',
    domain: 'rings_radials',
    domainLabelVi: 'Vành Đai & Trục Đổi Tên',
    difficulty: 'Trung cấp',
    question: 'Bạn đi thẳng một mạch trên trục hướng 8h30 từ bờ Hồ Tây ra Đại lộ Thăng Long. Thứ tự đổi tên đường nào sau đây là ĐÚNG chuẩn từ trong ra ngoài?',
    options: [
      'Văn Cao → Liễu Giai → Nguyễn Chí Thanh → Trần Duy Hưng → Đại lộ Thăng Long',
      'Văn Cao → Kim Mã → Láng Hạ → Lê Văn Lương → Đại lộ Thăng Long',
      'Liễu Giai → Đào Tấn → Cầu Giấy → Xuân Thủy → Đại lộ Thăng Long',
      'Văn Cao → Nguyễn Chí Thanh → Liễu Giai → Khuất Duy Tiến → Đại lộ Thăng Long'
    ],
    correctIndex: 0,
    explanation: 'Chuỗi thẳng tắp (collinear) từ mép Hồ Tây ra Hòa Lạc: Văn Cao → Liễu Giai → (qua ngã tư Kim Mã) → Nguyễn Chí Thanh → (qua cầu vượt Đường Láng) → Trần Duy Hưng → (qua hầm Trung Hòa VĐ3) → Đại lộ Thăng Long.',
    relatedChapterNumber: 6
  },
  {
    id: 'hq-11',
    domain: 'rings_radials',
    domainLabelVi: 'Vành Đai & Trục Đổi Tên',
    difficulty: 'Trung cấp',
    question: 'Trên trục Tây Nam (hướng 7h), ranh giới tự nhiên/nút giao nào đánh dấu điểm đổi tên từ đường Trần Phú (Hà Đông) sang đường Quang Trung (Hà Đông)?',
    options: [
      'Ngã Tư Sở (Vành đai 2)',
      'Nút giao Thanh Xuân – Khuất Duy Tiến (Vành đai 3)',
      'Cầu Trắng Hà Đông (bắc qua sông Nhuệ)',
      'Ngã 3 Ba La'
    ],
    correctIndex: 2,
    explanation: 'Ngã Tư Sở đổi Tây Sơn → Nguyễn Trãi; Nút Thanh Xuân (VĐ3) đổi Nguyễn Trãi → Trần Phú; và Cầu Trắng (vượt sông Nhuệ) chính là mốc đổi Trần Phú → Quang Trung (Hà Đông)!',
    relatedChapterNumber: 6
  },
  {
    id: 'hq-12',
    domain: 'rings_radials',
    domainLabelVi: 'Vành Đai & Trục Đổi Tên',
    difficulty: 'Thực chiến',
    question: 'Trục đường Lê Trọng Tấn kéo dài (đi qua Thiên Đường Bảo Sơn, Vinhomes Smart City, Dương Nội, Văn Phú) thuộc tuyến vành đai chiến lược nào của Hà Nội?',
    options: [
      'Vành đai 2.5',
      'Vành đai 3',
      'Vành đai 3.5',
      'Vành đai 4'
    ],
    correctIndex: 2,
    explanation: 'Đường Lê Trọng Tấn (Hoài Đức – Hà Đông) nối sang Phúc La – Xa La chính là đoạn hiện hữu rõ nét nhất của tuyến Vành đai 3.5 phía Tây, nằm ngoài Vành đai 3 và trong Vành đai 4.',
    relatedChapterNumber: 5
  },
  {
    id: 'hq-13',
    domain: 'rings_radials',
    domainLabelVi: 'Vành Đai & Trục Đổi Tên',
    difficulty: 'Thực chiến',
    question: 'Khi bạn đi dưới gầm các nhà ga đường sắt trên cao của tuyến Metro số 3 (đoạn trên cao đang vận hành), bạn chắc chắn đang ở trên hành lang nào?',
    options: [
      'Hành lang Hoàng Cầu – Thái Hà – Nguyễn Trãi – Quang Trung (Hà Đông)',
      'Hành lang Cầu Giấy – Xuân Thủy – Hồ Tùng Mậu – Cầu Diễn – Nhổn',
      'Hành lang Giảng Võ – Láng Hạ – Lê Văn Lương – Tố Hữu',
      'Hành lang Giải Phóng – Ngọc Hồi'
    ],
    correctIndex: 1,
    explanation: 'Metro số 3 (Nhổn – Ga Hà Nội) có 8 ga trên cao chạy dọc từ Nhổn → Cầu Diễn → Hồ Tùng Mậu → Xuân Thủy → Cầu Giấy. Còn hành lang Nguyễn Trãi – Hà Đông là của tuyến Metro 2A.',
    relatedChapterNumber: 10
  },
  {
    id: 'hq-14',
    domain: 'solar_skyline',
    domainLabelVi: 'La Bàn Mặt Trời & Skyline',
    difficulty: 'Cơ bản',
    question: 'Lúc 16h45 chiều nắng ráo tại Hà Nội, bạn lái xe trên đại lộ mà ánh mặt trời chiếu thẳng chói mắt phía trước. Bạn đang di chuyển theo hướng nào?',
    options: [
      'Hướng Đông (về phía Hồ Gươm, Sông Hồng, Long Biên)',
      'Hướng Tây / Tây Nam (về phía Cầu Giấy, Mỹ Đình, Hòa Lạc hoặc Hà Đông)',
      'Hướng Chính Bắc (về phía Cầu Nhật Tân)',
      'Hướng Chính Nam (về phía Thường Tín)'
    ],
    correctIndex: 1,
    explanation: 'Tại vĩ độ 21.03°N của Hà Nội, buổi chiều 16h–17h30 mặt trời lặn ở hướng Tây / Tây Nam (azimuth ~255°–275°). Nắng chiếu thẳng vào mặt chứng tỏ mũi xe đang hướng về phía Tây / Tây Nam.',
    relatedChapterNumber: 11
  },
  {
    id: 'hq-15',
    domain: 'solar_skyline',
    domainLabelVi: 'La Bàn Mặt Trời & Skyline',
    difficulty: 'Thực chiến',
    question: 'Lúc 17h00 chiều, bạn bước ra khỏi một con ngõ lạ và thấy ánh nắng hoàng hôn vàng rực chiếu thẳng vào BÊN VAI TRÁI của mình. Vậy trước mặt bạn là hướng nào?',
    options: [
      'Hướng Bắc',
      'Hướng Nam',
      'Hướng Đông',
      'Hướng Tây'
    ],
    correctIndex: 0,
    explanation: '17h00 chiều mặt trời ở hướng Tây (270°). Nếu hướng Tây nằm ở bên vai trái của bạn, thì trước mặt bạn cộng thêm 90° theo chiều kim đồng hồ chính là hướng BẮC (0°)!',
    relatedChapterNumber: 11
  },
  {
    id: 'hq-16',
    domain: 'solar_skyline',
    domainLabelVi: 'La Bàn Mặt Trời & Skyline',
    difficulty: 'Trung cấp',
    question: 'Làm thế nào phân biệt nhanh hai tòa tháp chọc trời Keangnam Landmark 72 và Lotte Center Hà Nội từ khoảng cách vài kilomet để định vị quận?',
    options: [
      'Keangnam đỉnh phẳng vuông vức nằm ở Vành đai 3 (Phạm Hùng – Nam Từ Liêm); Lotte có khe chữ V trên đỉnh nằm ở ngã tư Liễu Giai – Đào Tấn (Ba Đình)',
      'Keangnam nằm ở Hồ Tây; Lotte nằm ở Gia Lâm',
      'Keangnam có khe chữ V ở Ba Đình; Lotte đỉnh phẳng ở Hà Đông',
      'Cả hai tòa tháp đều nằm sát nhau trên đường Trần Duy Hưng'
    ],
    correctIndex: 0,
    explanation: 'Keangnam 72 tầng (336m) có khối đỉnh phẳng vuông vức là ngọn hải đăng của trục Phạm Hùng (VĐ3 – Nam Từ Liêm). Lotte 65 tầng (267m) có khe xẻ chữ V biểu tượng tà áo dài nằm tại Liễu Giai – Đào Tấn (Ba Đình).',
    relatedChapterNumber: 11
  },
  {
    id: 'hq-17',
    domain: 'routing_address',
    domainLabelVi: 'Địa Chỉ, Làn Xe & Lập Tuyến',
    difficulty: 'Thực chiến',
    question: 'Người điều khiển XE MÁY tại Hà Nội được phép đi vào công trình hạ tầng nào dưới đây?',
    options: [
      'Đường Vành đai 2 trên cao (đoạn Vĩnh Tuy – Ngã Tư Sở)',
      'Đường Vành đai 3 trên cao (CT.20) và tầng 2 Cầu Thăng Long',
      'Làn cao tốc chính giữa của Đại lộ Thăng Long',
      'Các hầm chui Kim Liên, Trung Hòa, Thanh Xuân và Lê Văn Lương'
    ],
    correctIndex: 3,
    explanation: 'Toàn bộ VĐ2 trên cao, VĐ3 trên cao, tầng 2 Cầu Thăng Long và làn giữa Đại lộ Thăng Long đều CẤM XE MÁY tuyệt đối. Ngược lại, 6 hầm chui đô thị nội đô (Kim Liên, Trung Hòa, Thanh Xuân, Lê Văn Lương, Kim Đồng...) đều cho phép xe máy đi qua!',
    relatedChapterNumber: 10
  },
  {
    id: 'hq-18',
    domain: 'routing_address',
    domainLabelVi: 'Địa Chỉ, Làn Xe & Lập Tuyến',
    difficulty: 'Trung cấp',
    question: 'Khi bạn bị lạc sâu trong mạng lưới ngõ Thành Công – Nguyên Hồng (Ô Thành Công), 4 trục đại lộ bao quanh khối ô phố này để bạn thoát ra là gì?',
    options: [
      'Đường Láng – Nguyễn Chí Thanh – Huỳnh Thúc Kháng – Láng Hạ',
      'Kim Mã – Liễu Giai – Đội Cấn – Hoàng Hoa Thám',
      'Giải Phóng – Đại Cồ Việt – Bạch Mai – Đại La',
      'Phạm Hùng – Mễ Trì – Lê Đức Thọ – Hồ Tùng Mậu'
    ],
    correctIndex: 0,
    explanation: 'Ô Thành Công được khóa gọn trong 4 cạnh: phía Tây là Đường Láng, phía Bắc là Nguyễn Chí Thanh, phía Đông là Huỳnh Thúc Kháng, phía Nam là Láng Hạ.',
    relatedChapterNumber: 8
  },
  {
    id: 'hq-19',
    domain: 'routing_address',
    domainLabelVi: 'Địa Chỉ, Làn Xe & Lập Tuyến',
    difficulty: 'Trung cấp',
    question: 'Khi cần đi xe máy vào khám tại Bệnh viện Bạch Mai vào giờ cao điểm mà mặt đường Giải Phóng trước Ngã Tư Vọng đang ùn tắc kéo dài, cổng phụ thông thoáng nhất nằm trên phố nào?',
    options: [
      'Phố Phủ Doãn',
      'Phố Phương Mai',
      'Phố Nguyễn Hoàng',
      'Phố Tôn Thất Thuyết'
    ],
    correctIndex: 1,
    explanation: 'Bệnh viện Bạch Mai có cổng chính tại 78 Giải Phóng và cổng sau cực kỳ thuận tiện cho xe máy trên phố Phương Mai (thuộc Đống Đa, nối sang Lương Định Của – Phạm Ngọc Thạch). Phủ Doãn là cổng Bệnh viện Việt Đức.',
    relatedChapterNumber: 9
  },
  {
    id: 'hq-20',
    domain: 'routing_address',
    domainLabelVi: 'Địa Chỉ, Làn Xe & Lập Tuyến',
    difficulty: 'Thực chiến',
    question: 'Lộ trình xe máy tối ưu nhất theo nguyên lý phân cấp từ Đại học Bách Khoa (Đại Cồ Việt) đến Cầu Trắng Hà Đông là:',
    options: [
      'Đại Cồ Việt → Xã Đàn (VĐ1) → Ô Chợ Dừa → Nguyễn Lương Bằng – Tây Sơn → Ngã Tư Sở → Nguyễn Trãi → Trần Phú → Cầu Trắng',
      'Đại Cồ Việt → Phố Huế → Hồ Gươm → Kim Mã → Nhổn → Cầu Trắng',
      'Đại Cồ Việt → Cầu Vĩnh Tuy → Long Biên → Cầu Thanh Trì → Cầu Trắng',
      'Đại Cồ Việt → lên đường trên cao Vành đai 2 → Ngã Tư Sở → Nguyễn Trãi'
    ],
    correctIndex: 0,
    explanation: 'Phương án 1 chuẩn phân cấp: bám VĐ1 (Đại Cồ Việt – Xã Đàn) sang Ô Chợ Dừa rồi bắt thẳng vào trục hướng 7h (Tây Sơn – Nguyễn Trãi – Trần Phú) một mạch tới Cầu Trắng. Phương án 4 vi phạm luật vì VĐ2 trên cao cấm xe máy!',
    relatedChapterNumber: 12
  }
];

// ============================================================================
// 24 THẺ GHI NHỚ PHẢN XẠ TỐC ĐỘ CAO (ACTIVE-RECALL FLASHCARDS)
// ============================================================================
export interface IHanoiFlashcard {
  id: string;
  category: 'Cầu & Sông' | 'Vành đai & Trục' | 'Phố Pháp & 1 Chiều' | 'Ô Phố & Cổng Phụ';
  frontPrompt: string;
  frontHint: string;
  backAnswer: string;
  backMnemonic: string;
}

export const HANOI_FLASHCARDS: IHanoiFlashcard[] = [
  {
    id: 'fc-01',
    category: 'Cầu & Sông',
    frontPrompt: 'Đọc tên 6 cây cầu nội đô qua Sông Hồng theo đúng thứ tự Thượng lưu → Hạ lưu!',
    frontHint: 'Bắt đầu từ Bắc Từ Liêm xuống Hoàng Mai',
    backAnswer: '1. Thăng Long (VĐ3) → 2. Nhật Tân (VĐ2) → 3. Long Biên → 4. Chương Dương → 5. Vĩnh Tuy (VĐ2) → 6. Thanh Trì (VĐ3)',
    backMnemonic: 'Khẩu quyết 6 âm tiết: "THĂNG – NHẬT – LONG – CHƯƠNG – VĨNH – THANH".'
  },
  {
    id: 'fc-02',
    category: 'Cầu & Sông',
    frontPrompt: '2 quy tắc giao thông đặc biệt trên Cầu Long Biên là gì?',
    frontHint: 'Loại phương tiện bị cấm & phía lưu thông',
    backAnswer: '1. CẤM TOÀN BỘ Ô TÔ (chỉ cho xe máy, xe đạp, người đi bộ và tàu hỏa).\n2. Đi theo LỀ BÊN TRÁI cầu (ngược với lề phải thông thường).',
    backMnemonic: 'Di sản thiết kế đường sắt Pháp năm 1902.'
  },
  {
    id: 'fc-03',
    category: 'Cầu & Sông',
    frontPrompt: 'Muốn đi từ Long Biên sang Đông Anh hoặc Từ Sơn (Bắc Ninh), bạn phải vượt dòng sông nào và qua những cầu nào?',
    frontHint: 'Phân lưu tách ra từ Sông Hồng ở ngã ba Xuân Canh',
    backAnswer: 'Phải vượt SÔNG ĐUỐNG qua Cầu Đông Trù (Vành đai 2), Cầu Đuống (QL1A cũ) hoặc Cầu Phù Đổng (Vành đai 3).',
    backMnemonic: 'Sông Đuống chia đôi Tả ngạn: Bắc sông là Đông Anh, Nam sông là Long Biên.'
  },
  {
    id: 'fc-04',
    category: 'Cầu & Sông',
    frontPrompt: 'Đứng trên đường Thanh Niên nhìn về hướng Yên Phụ (Đông Bắc): Hồ bên trái và hồ bên phải tên là gì?',
    frontHint: 'Con đường Cổ Ngư xưa ngăn đôi 2 hồ',
    backAnswer: 'Bên TAY TRÁI là HỒ TÂY (~526 ha); bên TAY PHẢI là HỒ TRÚC BẠCH.',
    backMnemonic: 'Hồ Tây nằm phía Tây đường Thanh Niên; Trúc Bạch nằm phía Đông.'
  },
  {
    id: 'fc-05',
    category: 'Vành đai & Trục',
    frontPrompt: 'Đọc chuỗi đổi tên liên hoàn của VÀNH ĐAI 1 từ đê Nguyễn Khoái sang Ô Chợ Dừa – Bưởi!',
    frontHint: 'Đi qua Hầm Kim Liên',
    backAnswer: 'Trần Khát Chân ➔ Đại Cồ Việt ➔ (Hầm Kim Liên) ➔ Xã Đàn ➔ Ô Chợ Dừa ➔ Hoàng Cầu ➔ Voi Phục (La Thành) ➔ Bưởi',
    backMnemonic: 'Vành đai ôm sát các Cửa Ô cổ lịch sử của Thăng Long.'
  },
  {
    id: 'fc-06',
    category: 'Vành đai & Trục',
    frontPrompt: 'Đọc chuỗi đổi tên của VÀNH ĐAI 2 từ Cầu Vĩnh Tuy lên Cầu Nhật Tân!',
    frontHint: 'Đi qua Ngã Tư Vọng và Ngã Tư Sở',
    backAnswer: 'Cầu Vĩnh Tuy ➔ Minh Khai ➔ Đại La ➔ (Ngã Tư Vọng) ➔ Trường Chinh ➔ (Ngã Tư Sở) ➔ Đường Láng ➔ (Cầu Giấy) ➔ Bưởi ➔ Võ Chí Công ➔ Cầu Nhật Tân',
    backMnemonic: 'Đoạn Vĩnh Tuy ↔ Ngã Tư Sở có đường trên cao cấm xe máy; đoạn Láng chạy sát sông Tô Lịch.'
  },
  {
    id: 'fc-07',
    category: 'Vành đai & Trục',
    frontPrompt: 'Đọc chuỗi đổi tên của VÀNH ĐAI 3 từ Cầu Thăng Long xuống Cầu Thanh Trì!',
    frontHint: 'Trục có đường cao tốc trên cao CT.20',
    backAnswer: 'Cầu Thăng Long ➔ Phạm Văn Đồng ➔ (Mai Dịch) ➔ Phạm Hùng ➔ (Trung Hòa) ➔ Khuất Duy Tiến ➔ (Thanh Xuân) ➔ Nguyễn Xiển ➔ Nghiêm Xuân Yêm ➔ Hoàng Liệt (Pháp Vân) ➔ Cầu Thanh Trì',
    backMnemonic: '4 đại nút giao dọc tuyến: Mai Dịch – Trung Hòa – Thanh Xuân – Pháp Vân.'
  },
  {
    id: 'fc-08',
    category: 'Vành đai & Trục',
    frontPrompt: 'Trục hướng 7h (Tây Nam đi Hà Đông) đổi tên qua 6 đoạn đường nào liên tiếp nhau?',
    frontHint: 'Khởi đầu từ Văn Miếu ra tới Ba La',
    backAnswer: 'Tôn Đức Thắng ➔ Nguyễn Lương Bằng ➔ Tây Sơn ➔ (Ngã Tư Sở) ➔ Nguyễn Trãi ➔ (VĐ3) ➔ Trần Phú ➔ (Cầu Trắng) ➔ Quang Trung',
    backMnemonic: 'Có tàu điện trên cao Metro 2A chạy dọc từ Thái Hà/Láng xuống tận Yên Nghĩa.'
  },
  {
    id: 'fc-09',
    category: 'Vành đai & Trục',
    frontPrompt: 'Trục hướng 7h30 (tuyến xe buýt nhanh BRT 01) gồm 4 đoạn phố nối tiếp nào?',
    frontHint: 'Song song giữa trục Nguyễn Trãi và trục Trần Duy Hưng',
    backAnswer: 'Giảng Võ ➔ Láng Hạ ➔ (Cầu Hòa Mục / Đường Láng) ➔ Lê Văn Lương ➔ (Hầm Khuất Duy Tiến) ➔ Tố Hữu',
    backMnemonic: 'Nhận diện bằng dải nhà chờ buýt nhanh BRT nằm chính giữa tim đường.'
  },
  {
    id: 'fc-10',
    category: 'Vành đai & Trục',
    frontPrompt: 'Trục hướng 8h30 (từ Hồ Tây ra Hòa Lạc) gồm 5 đoạn đường nối tiếp nào?',
    frontHint: 'Đi qua tháp Lotte Liễu Giai và Big C Thăng Long',
    backAnswer: 'Văn Cao ➔ Liễu Giai ➔ (Kim Mã) ➔ Nguyễn Chí Thanh ➔ (Đường Láng) ➔ Trần Duy Hưng ➔ (Hầm Trung Hòa) ➔ Đại lộ Thăng Long',
    backMnemonic: 'Ra khỏi hầm Trung Hòa, xe máy bắt buộc phải dạt ngay sang đường gom bên phải!'
  },
  {
    id: 'fc-11',
    category: 'Vành đai & Trục',
    frontPrompt: 'Trục hướng 9h30 (từ Ba Đình đi Sơn Tây – QL32) gồm chuỗi tên phố nào?',
    frontHint: 'Có tuyến Metro số 3 chạy dọc',
    backAnswer: 'Kim Mã ➔ (Voi Phục) ➔ Cầu Giấy ➔ Xuân Thủy ➔ (Mai Dịch) ➔ Hồ Tùng Mậu ➔ Cầu Diễn ➔ Phố Nhổn (QL32)',
    backMnemonic: 'Hành lang vàng của các trường đại học: GTVT – Báo chí – Sư phạm – ĐHQG – Thương mại – Công nghiệp.'
  },
  {
    id: 'fc-12',
    category: 'Vành đai & Trục',
    frontPrompt: 'Trục ngang "bậc thang vàng" nối liền Tây Sơn sang Nguyễn Chí Thanh ở quận Đống Đa gồm 3 phố nào?',
    frontHint: 'Đi qua Học viện Ngân hàng và Rạp chiếu phim Quốc gia',
    backAnswer: 'Chùa Bộc ➔ (Ngã tư Phạm Ngọc Thạch) ➔ Thái Hà ➔ (Ngã tư Láng Hạ) ➔ Huỳnh Thúc Kháng',
    backMnemonic: 'Trục ngang huyết mạch song song giữa Vành đai 1 và Vành đai 2!'
  },
  {
    id: 'fc-13',
    category: 'Phố Pháp & 1 Chiều',
    frontPrompt: 'Khẩu quyết 6 chữ để không bao giờ đi ngược chiều ở cặp Phố Huế – Bà Triệu là gì?',
    frontHint: 'Một đường lên Bờ Hồ, một đường xuống Vành đai 1',
    backAnswer: '"PHỐ HUẾ LÊN HỒ – BÀ TRIỆU XUỐNG ĐAI"\n• Phố Huế: 1 chiều Nam → Bắc (Đại Cồ Việt → Hàng Bài → Bờ Hồ)\n• Bà Triệu: 1 chiều Bắc → Nam (Hàng Khay → Đại Cồ Việt)',
    backMnemonic: 'Cẩn thận: Phố Huế xe chạy NGƯỢC chiều tăng của số nhà!'
  },
  {
    id: 'fc-14',
    category: 'Phố Pháp & 1 Chiều',
    frontPrompt: '4 trục Đông – Tây song song (∥) của khu Phố Pháp xếp theo thứ tự từ Hồ Gươm xuống phía Nam là gì?',
    frontHint: 'Trục đầu tiên 1 chiều, 3 trục sau 2 chiều',
    backAnswer: '1. Tràng Tiền – Hàng Khay – Tràng Thi (1 chiều Đông → Tây)\n2. Hai Bà Trưng (2 chiều)\n3. Lý Thường Kiệt (2 chiều)\n4. Trần Hưng Đạo (2 chiều)',
    backMnemonic: 'Muốn quay ngược từ Cửa Nam sang Nhà Hát Lớn: dùng Hai Bà Trưng, Lý Thường Kiệt hoặc Trần Hưng Đạo!'
  },
  {
    id: 'fc-15',
    category: 'Phố Pháp & 1 Chiều',
    frontPrompt: 'Phố Nguyễn Thái Học quy định đi 1 chiều theo hướng nào, và đường đối lưu ngược lại là đường nào?',
    frontHint: 'Nối giữa Kim Mã và Cửa Nam qua Văn Miếu',
    backAnswer: 'Nguyễn Thái Học đi 1 chiều từ TÂY sang ĐÔNG (Kim Mã → Cửa Nam).\nMuốn đi ngược từ Cửa Nam lên Ba Đình / Kim Mã phải đi ĐIỆN BIÊN PHỦ hoặc TRẦN PHÚ.',
    backMnemonic: 'Nguyễn Thái Học dẫn xe VÀO trung tâm; Điện Biên Phủ / Trần Phú đưa xe RA Ba Đình.'
  },
  {
    id: 'fc-16',
    category: 'Phố Pháp & 1 Chiều',
    frontPrompt: 'Chuỗi 4 phố cổ nối tiếp thẳng tắp từ bờ Bắc Hồ Gươm lên Chợ Đồng Xuân – Hàng Đậu là gì?',
    frontHint: 'Trục thương mại cổ xuyên tâm 36 Phố Phường',
    backAnswer: 'Hàng Đào ➔ Hàng Ngang ➔ Hàng Đường ➔ Đồng Xuân',
    backMnemonic: 'Cuối tuần (tối T6 – CN) trục này trở thành tuyến phố đi bộ chợ đêm sầm uất nhất Hà Nội.'
  },
  {
    id: 'fc-17',
    category: 'Phố Pháp & 1 Chiều',
    frontPrompt: 'Kể tên 4 tuyến đường trên cao / cao tốc tại Hà Nội CẤM XE MÁY TUYỆT ĐỐI!',
    frontHint: 'Tránh bị phạt nặng và nguy hiểm tính mạng',
    backAnswer: '1. Đường trên cao Vành đai 2 (Vĩnh Tuy ↔ Ngã Tư Sở)\n2. Đường trên cao Vành đai 3 (CT.20) & Tầng 2 Cầu Thăng Long\n3. Làn cao tốc giữa Đại lộ Thăng Long (xe máy đi đường gom)\n4. Cao tốc Pháp Vân – Cầu Giẽ & Cao tốc Hà Nội – Hải Phòng (5B)',
    backMnemonic: 'Ngược lại: Xe máy ĐƯỢC ĐI qua tất cả 6 hầm chui nội đô (Kim Liên, Trung Hòa, Thanh Xuân, Lê Văn Lương, Kim Đồng, Mễ Trì)!'
  },
  {
    id: 'fc-18',
    category: 'Ô Phố & Cổng Phụ',
    frontPrompt: 'Đứng tại Ngã Tư Sở từ Tây Sơn nhìn về phía Hà Đông: Đi thẳng, rẽ phải, rẽ trái lần lượt vào đường nào?',
    frontHint: 'Giao điểm Vành đai 2 × Trục Tây Nam',
    backAnswer: '• Đi thẳng: Nguyễn Trãi (đi Thanh Xuân – Hà Đông)\n• Rẽ phải: Đường Láng (dọc sông Tô Lịch lên Cầu Giấy)\n• Rẽ trái: Trường Chinh (ra Ngã Tư Vọng – Giải Phóng – Vĩnh Tuy)',
    backMnemonic: 'Sau lưng bạn là phố Tây Sơn về Ô Chợ Dừa.'
  },
  {
    id: 'fc-19',
    category: 'Ô Phố & Cổng Phụ',
    frontPrompt: 'Nút giao 6–7 nhánh Ô Chợ Dừa là giao điểm chính của những tuyến phố nào?',
    frontHint: 'Vành đai 1 cắt Trục hướng 7h',
    backAnswer: '• Trục Vành đai 1: Xã Đàn ↔ Hoàng Cầu (Ô Chợ Dừa)\n• Trục hướng 7h: Tôn Đức Thắng ↔ Nguyễn Lương Bằng\n• 2 nhánh lịch sử: Khâm Thiên (về Lê Duẩn) & Đê La Thành (lên Giảng Võ)',
    backMnemonic: 'Cầu vượt thép trên đầu nối thẳng Hoàng Cầu sang Xã Đàn.'
  },
  {
    id: 'fc-20',
    category: 'Ô Phố & Cổng Phụ',
    frontPrompt: 'Ô Phố "Bách – Kinh – Xây" (quận Hai Bà Trưng) được bao bởi 4 trục nào và có trục xương cá nào ở giữa?',
    frontHint: 'Tam giác 3 trường đại học lớn',
    backAnswer: '• 4 cạnh bao: Đại Cồ Việt (Bắc) – Giải Phóng (Tây) – Đại La (Nam) – Bạch Mai (Đông)\n• Trục xương sống bên trong: Trần Đại Nghĩa, Tạ Quang Bửu và Lê Thanh Nghị.',
    backMnemonic: 'Đi xe máy gửi vào Bách Khoa hoặc KTQD qua đường Trần Đại Nghĩa thoáng gấp 3 lần đường Giải Phóng!'
  },
  {
    id: 'fc-21',
    category: 'Ô Phố & Cổng Phụ',
    frontPrompt: 'Địa chỉ "Ngõ 165 Cầu Giấy" nằm bên tay trái hay tay phải khi bạn đi từ Kim Mã ra Xuân Thủy?',
    frontHint: 'Áp dụng quy tắc Chẵn / Lẻ chuẩn Hà Nội',
    backAnswer: 'Nằm bên TAY TRÁI! Vì số nhà Cầu Giấy tăng dần từ Voi Phục (Kim Mã) ra Xuân Thủy, và 165 là SỐ LẺ (Trái = Lẻ, Phải = Chẵn).',
    backMnemonic: 'Lẻ Trái – Chẵn Phải (theo chiều tăng số nhà từ tâm ra ngoại vi).'
  },
  {
    id: 'fc-22',
    category: 'Ô Phố & Cổng Phụ',
    frontPrompt: 'Cổng phụ tối ưu cho xe máy khi đến Bệnh viện Bạch Mai và Bệnh viện Việt Đức lần lượt ở phố nào?',
    frontHint: 'Tránh kẹt xe cổng Giải Phóng và cổng Tràng Thi',
    backAnswer: '• Bệnh viện Bạch Mai: Cổng sau phố PHƯƠNG MAI.\n• Bệnh viện Việt Đức: Cổng cấp cứu phố PHỦ DOÃN.',
    backMnemonic: 'Bạch Mai – Phương Mai (cùng vần "Mai"); Việt Đức – Phủ Doãn.'
  },
  {
    id: 'fc-23',
    category: 'Vành đai & Trục',
    frontPrompt: '12 Quận nội thành Hà Nội chia làm 3 lớp "4 + 4 + 4" như thế nào?',
    frontHint: 'Lõi lịch sử → VĐ2-VĐ3 → Ngoài VĐ3 & Tả ngạn',
    backAnswer: '• 4 Lõi: Hoàn Kiếm, Ba Đình, Đống Đa, Hai Bà Trưng\n• 4 Mở rộng (VĐ2–3): Tây Hồ, Cầu Giấy, Thanh Xuân, Hoàng Mai\n• 4 Cực mới: Nam Từ Liêm, Bắc Từ Liêm, Hà Đông, Long Biên (Tả ngạn)',
    backMnemonic: 'Cộng thêm 1 Thị xã Sơn Tây + 17 Huyện = tròn 30 đơn vị hành chính!'
  },
  {
    id: 'fc-24',
    category: 'Cầu & Sông',
    frontPrompt: 'Lúc 16h30 chiều nắng gắt rọi vào bên vai PHẢI của bạn khi đang đi xe. Bạn đang đi về hướng nào?',
    frontHint: '16h30 mặt trời ở hướng Tây (~260°)',
    backAnswer: 'Bạn đang đi về hướng NAM (180°)! Vì mặt trời chiều ở hướng Tây (270°) nằm bên tay phải bạn, nên trước mặt bạn lùi 90° là hướng Nam.',
    backMnemonic: 'Ví dụ thực tế: Đang chạy dọc Phạm Hùng từ Mai Dịch xuống Khuất Duy Tiến hoặc chạy Giải Phóng xuống Giáp Bát.'
  }
];
