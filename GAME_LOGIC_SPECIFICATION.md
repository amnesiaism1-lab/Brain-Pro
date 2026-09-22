# ĐẶC TẢ LOGIC VÀ THUẬT TOÁN 15 BÀI TẬP LUYỆN NÃO & ĐỌC NHANH
## GAME LOGIC & COGNITIVE ALGORITHMS SPECIFICATION

Tài liệu này đặc tả chi tiết thuật toán sinh câu hỏi, logic xác thực, công thức tính điểm và cơ chế điều chỉnh độ khó tự động (Dynamic Difficulty Adjustment - DDA) cho toàn bộ 15 bài tập trong hệ thống **Brain Exercises Pro**.

---

## 1. THUẬT TOÁN THÍCH ỨNG ĐỘ KHÓ ĐỘNG (DYNAMIC DIFFICULTY ADJUSTMENT - DDA)

Hệ thống cung cấp tùy chọn "Tự động Độ khó" (Toggle hiển thị ở màn hình chi tiết bài tập - Ảnh 4). 
Khi kích hoạt:
- **Thăng cấp (Level Up)**: Khi người chơi đạt tỷ lệ chính xác $\ge 90\%$ và thời gian hoàn thành nhanh hơn $75\%$ thời gian quy định trong 2 lượt liên tiếp:
  $$\text{NextLevel} = \min(8, \text{CurrentLevel} + 1)$$
- **Hạ cấp (Level Down)**: Khi người chơi đạt tỷ lệ chính xác $< 60\%$ hoặc hết thời gian (timeout) 2 lượt liên tiếp:
  $$\text{NextLevel} = \max(1, \text{CurrentLevel} - 1)$$
- **Công thức tính điểm cơ bản (Base Score Formula)**:
  $$\text{Score} = \left( \text{BasePoints} \times \text{Level} \times \frac{\text{Accuracy}\%}{100} \right) + \max\left(0, \left( \text{TimeLimit} - \text{TimeSpent} \right) \times 10 \times \text{Level}\right)$$

---

## 2. CHI TIẾT THUẬT TOÁN & LOGIC 15 BÀI TẬP

### 1. Đảo ngữ (Anagram)
- **Mục tiêu nhận thức**: Verbal Working Memory, Phonological & Orthographic Processing.
- **Thuật toán sinh câu hỏi**:
  - Chọn một từ $W$ có độ dài $L$ từ kho từ vựng tiếng Việt/Anh dựa trên Level:
    - Level 1-2: 3-4 ký tự (ví dụ: `HỌC`, `SÁCH`, `BẠN`).
    - Level 3-5: 5-7 ký tự (ví dụ: `TRÍ TUỆ`, `TẬP TRUNG`, `THÔNG MINH`).
    - Level 6-8: 8-12 ký tự hoặc cụm từ học thuật.
  - Xáo trộn ký tự bằng thuật toán Fisher-Yates sao cho chuỗi xáo trộn $S \neq W$.
- **Tương tác**: Người chơi nhấp hoặc kéo thả các ô chữ cái vào khung đáp án. Nút "Gợi ý" sẽ tự động điền ký tự đầu tiên nếu bật.
- **Thời gian**: 30s - 90s tùy cấp độ.

---

### 2. Bảng Schulte (Schulte Table)
- **Mục tiêu nhận thức**: Peripheral Vision Span, Saccade Reduction, Sustained Attention.
- **Thuật toán sinh ma trận**:
  - Sinh ma trận $N \times N$:
    - Level 1-2: $3 \times 3$ (Số từ 1 đến 9).
    - Level 3-5: $5 \times 5$ (Số từ 1 đến 25) - Chuẩn khoa học Schulte.
    - Level 6-7: $6 \times 6$ (Số từ 1 đến 36).
    - Level 8: $7 \times 7$ (Số từ 1 đến 49) hoặc Bảng Đỏ-Đen Gorbov-Schulte (Đỏ tăng dần, Đen giảm dần luân phiên).
  - Hoán vị ngẫu nhiên vị trí các số trong ma trận.
- **Quy tắc**: Mắt người chơi bắt buộc nhìn vào tâm chấm tròn ở giữa lưới, không đảo mắt xung quanh. Nhấp lần lượt từ số $1$ đến số $N$. Nhấp sai sẽ rung nhẹ (shake) và trừ 2 giây.

---

### 3. Tìm chữ (Find Letter)
- **Mục tiêu nhận thức**: Visual Discrimination & Selective Attention.
- **Thuật toán**:
  - Chọn 1 chữ cái mục tiêu (Target Letter, ví dụ `A`).
  - Chọn tập hợp các ký tự gây nhiễu (Distractor Letters) có đường nét tương đồng (ví dụ: đối với `A` thì dùng `R, B, P, 4`; đối với `O` thì dùng `Q, D, C, 0`).
  - Phân bổ $K$ chữ cái mục tiêu ngẫu nhiên vào lưới kích thước $R \times C$.
- **Điều kiện thắng**: Tìm đủ $K$ ký tự mục tiêu trước khi hết giờ.

---

### 4. Tìm Số (Find Number)
- **Mục tiêu nhận thức**: Numerical Scanning & Focus.
- **Thuật toán**:
  - Hiển thị số mục tiêu trên đỉnh màn hình (ví dụ: số `9` trong ảnh mẫu số 1, hoặc số 2 chữ số như `47`).
  - Tạo bảng số ngẫu nhiên. Người chơi quét nhanh và nhấp vào số mục tiêu.
  - Tự động đổi số mục tiêu mới khi người chơi nhấp đúng.

---

### 5. Chẵn/Lẻ (Even/Odd Reflex)
- **Mục tiêu nhận thức**: Inhibitory Control & Reaction Speed.
- **Thuật toán**:
  - Một số nguyên ngẫu nhiên $X \in [1, 999]$ xuất hiện ở giữa màn hình.
  - Có 2 nút bấm to bản: `CHẴN` và `LẺ`.
  - Giới hạn thời gian phản hồi: $T_{\text{max}} = 1500\text{ms} - (\text{Level} \times 120\text{ms})$.
  - Cấp độ nâng cao (Level 6-8): Nếu số có nền viền đỏ (Inverted rule), người chơi phải chọn ngược lại (Số chẵn thì bấm Lẻ, số lẻ thì bấm Chẵn).

---

### 6. Nhớ Số (Digit Span Memory)
- **Mục tiêu nhận thức**: Short-Term Working Memory & Sequencer.
- **Thuật toán**:
  - Độ dài chuỗi số: $N = 3 + \text{Level}$.
  - Hiển thị chuỗi số (ví dụ: `4 3 2 8 9` như trong ảnh mẫu) trong thời gian chớp:
    $$T_{\text{flash}} = 400\text{ms} + (N \times 150\text{ms})$$
  - Sau thời gian chớp, màn hình chuyển sang trạng thái ẩn `? ? ?` và hiện bàn phím số (Numpad).
  - Người chơi nhập lại đúng thứ tự xuôi (Forward Span) hoặc thứ tự ngược (Reverse Span ở Level cao).

---

### 7. Chữ Chạy (RSVP - Rapid Serial Visual Presentation)
- **Mục tiêu nhận thức**: Speed Reading, Elimination of Subvocalization.
- **Thuật toán**:
  - Lấy một đoạn văn chuẩn. Tách thành danh sách từ vựng $W_1, W_2, \dots, W_m$.
  - Xác định điểm nhận diện tối ưu (ORP - Optimal Recognition Point):
    $$\text{ORP Index} = \begin{cases} 0 & \text{nếu độ dài } \le 2 \\ 1 & \text{nếu độ dài } \in [3, 5] \\ 2 & \text{nếu độ dài } \in [6, 9] \\ 3 & \text{nếu độ dài } \ge 10 \end{cases}$$
  - Ký tự tại vị trí ORP được hiển thị bằng màu đỏ tương phản và cố định tại tâm trục mắt.
  - Thời gian hiển thị mỗi từ:
    $$\Delta t = \frac{60000}{\text{WPM}}\text{ ms}$$
  - Hỗ trợ dừng, tạm dừng, tua lại và điều chỉnh WPM từ 150 đến 1200.

---

### 8. Tìm Từ (Word Search)
- **Mục tiêu nhận thức**: Multi-directional Lexical Search.
- **Thuật toán (Đúng theo Ảnh mẫu số 4)**:
  - Bảng ma trận $R \times C$ (ví dụ: $12 \times 20$ như trên ảnh).
  - Chọn $M$ từ vựng (ví dụ: 3 từ như trên ảnh).
  - Đặt các từ mục tiêu vào bảng theo các hướng: Ngang (Trái-Phải), Dọc (Trên-Dưới), Chéo. Ở Level cao, cho phép từ lộn ngược (Phải-Trái, Dưới-Trên).
  - Điền các ô trống còn lại bằng các chữ cái ngẫu nhiên.
  - Chế độ Gợi ý (Hints): Làm nổi bật mờ vị trí chữ cái đầu tiên của các từ mục tiêu.

---

### 9. Từ Sinh đôi (Twin Words)
- **Mục tiêu nhận thức**: Rapid Lexical Comparison & Morphological Accuracy.
- **Thuật toán**:
  - Sinh 2 từ vựng song song:
    - Tỷ lệ $50\%$ là cặp từ giống hệt: `MAMA - MAMA`, `META - META`.
    - Tỷ lệ $50\%$ là cặp từ khác biệt 1 ký tự: `MAMA - MOP`, `META - BETA`.
  - Người chơi bấm 1 trong 2 nút: `GIỐNG NHAU` hoặc `KHÁC NHAU` trong 1-2 giây.

---

### 10. Tầm Nhìn (Peripheral Vision Angle)
- **Mục tiêu nhận thức**: Horizontal & Vertical Peripheral Expansion.
- **Thuật toán**:
  - Tâm ngắm hồng tâm (Crosshair) cố định ở giữa màn hình.
  - 2 ký tự xuất hiện đối xứng 2 bên tâm với khoảng cách góc nhìn $D$:
    $$D = 100\text{px} + (\text{Level} \times 40\text{px})$$
  - Hai ký tự chỉ chớp sáng trong 400ms rồi biến mất.
  - Người chơi phải giữ mắt nhìn vào tâm và chọn đúng 2 ký tự vừa xuất hiện ở vùng ngoại vi.

---

### 11. Điểm xanh (Green Dot Technique)
- **Mục tiêu nhận thức**: Soft Focus Reading & Macular Field Activation.
- **Thuật toán**:
  - Một chấm tròn màu xanh lục phát sáng nhẹ (Emerald Green Dot `#10B981`) đặt ở chính giữa khối văn bản.
  - Người chơi giữ nguyên mắt tại chấm xanh trong 60 giây và cố gắng nhận biết toàn bộ nội dung của 3-6 dòng văn bản xung quanh.
  - Sau khi kết thúc, hiển thị câu hỏi trắc nghiệm kiểm tra xem người chơi đã nắm bắt được ý chính nào trong vùng nhìn ngoại vi.

---

### 12. Chuỗi từ (Word Chunking)
- **Mục tiêu nhận thức**: Fixation Chunking & Wide Eye Span.
- **Thuật toán**:
  - Thay vì đọc từng từ đơn lẻ, văn bản được phân rã thành các cụm (Chunk) từ 2 đến 4 từ có liên kết ngữ pháp (Phrasal grouping).
  - Từng cụm từ hiển thị đóng khung nổi bật lần lượt từ trái sang phải, từ trên xuống dưới theo nhịp máy đếm nhịp (Metronome). Giúp mắt làm quen với việc nhảy nhãn cầu theo từng khối ý nghĩa lớn.

---

### 13. Đánh giá tốc độ đọc (Reading Speed Assessment)
- **Mục tiêu nhận thức**: Benchmark WPM & Comprehension Ratio.
- **Quy trình chuẩn hóa**:
  1. Người chơi chọn bài đọc (Kho bài đọc chuẩn từ 250 đến 1000 từ).
  2. Bấm "Bắt đầu đọc" -> Bộ đếm thời gian miligiây khởi động.
  3. Người chơi đọc với tốc độ hiểu tự nhiên, sau đó bấm "Tôi đã đọc xong".
  4. Hệ thống ghi nhận thời gian đọc $T_{\text{sec}}$ và tính:
     $$\text{Raw WPM} = \frac{\text{WordCount}}{T_{\text{sec}}} \times 60$$
  5. Chuyển sang màn hình trắc nghiệm 4 câu hỏi đọc hiểu.
  6. Điểm đọc hiểu:
     $$\text{Comprehension\%} = \frac{\text{Số câu đúng}}{4} \times 100$$
  7. Tốc độ đọc hiệu dụng:
     $$\text{Effective WPM} = \text{Raw WPM} \times \frac{\text{Comprehension\%}}{100}$$

---

### 14. Tăng tốc độ đọc (Reading Pacer / Bionic Reading)
- **Mục tiêu nhận thức**: Guided Pacing & Saccade Training.
- **Thuật toán**:
  - Áp dụng thuật toán Bionic Text: Làm in đậm 30-50% chữ cái đầu tiên của từng từ để tăng tốc độ nhận dạng mẫu hình não bộ.
  - Thanh dẫn hướng (Highlight Pacer bar) lướt êm ái trên từng dòng với tốc độ có thể tùy chỉnh từ 200 WPM đến 800 WPM, thúc đẩy mắt phải đuổi theo nhịp điệu.

---

### 15. Tìm trong văn bản (Text Scanning / Skimming)
- **Mục tiêu nhận thức**: Rapid Information Extraction.
- **Thuật toán**:
  - Hiển thị câu hỏi mục tiêu (ví dụ: "Tìm năm diễn ra sự kiện X", hoặc "Tìm tên thủ đô của nước Y").
  - Người chơi quét mắt nhanh trên đoạn văn 300 từ và nhấp trực tiếp vào từ vựng trả lời đúng câu hỏi đó trong thời gian ngắn nhất.
