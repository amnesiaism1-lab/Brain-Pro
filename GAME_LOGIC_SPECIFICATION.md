# ĐẶC TẢ LOGIC VÀ THUẬT TOÁN 19 BÀI TẬP LUYỆN NÃO & ĐỌC NHANH
## GAME LOGIC & COGNITIVE RELATION ALGORITHMS SPECIFICATION

Tài liệu này đặc tả chi tiết thuật toán sinh câu hỏi, logic xác thực, công thức tính điểm và cơ chế điều chỉnh độ khó tự động (Dynamic Difficulty Adjustment - DDA) theo **12 Cấp Độ** và **12 Quan Hệ Nhận Thức** cho toàn bộ 19 bài tập trong hệ thống **Brain Exercises Pro**.

---

## 1. THUẬT TOÁN THÍCH ỨNG ĐỘ KHÓ ĐỘNG (DYNAMIC DIFFICULTY ADJUSTMENT - DDA)

Hệ thống cung cấp tùy chọn "Tự động Độ khó" (Adaptive Progression):
Khi kích hoạt:
- **Thăng cấp (Level Up)**: Khi người chơi đạt tỷ lệ chính xác $\ge 90\%$ và thời gian hoàn thành nhanh hơn $75\%$ thời gian quy định trong 2 lượt liên tiếp:
  $$\text{NextLevel} = \min(12, \text{CurrentLevel} + 1)$$
- **Hạ cấp (Level Down)**: Khi người chơi đạt tỷ lệ chính xác $< 60\%$ hoặc hết thời gian (timeout) 2 lượt liên tiếp:
  $$\text{NextLevel} = \max(1, \text{CurrentLevel} - 1)$$
- **Công thức tính điểm cơ bản (Base Score Formula)**:
  $$\text{Score} = \left( \text{BasePoints} \times \text{Level} \times \frac{\text{Accuracy}\%}{100} \right) + \max\left(0, \left( \text{TimeLimit} - \text{TimeSpent} \right) \times 10 \times \text{Level}\right)$$

### Cơ chế Thích Ứng Dựa Trên Quan Hệ Nhận Thức (Relation-Aware DDA)
Bên dưới 12 cấp độ bề mặt, hệ thống phân tích tỷ lệ chính xác EMA ($\alpha = 0.08$) của từng quan hệ nhận thức tham gia:
- **Quan hệ chính (Primary Relation) yếu ($\text{EMA} < 0.70$)**: Giữ cấp độ, tăng scaffold (hỗ trợ gợi ý, giảm tốc 10%).
- **Quan hệ chính vững ($\text{EMA} \ge 0.90, \text{Stability} \ge 0.75$)**: Tăng cấp độ hoặc kích hoạt quan hệ phụ (Interference, Inversion, Dual-stream).
- **Chuyển giao kém ($\text{TransferScore} < 0.50$)**: Đề xuất chuỗi bài tập cầu nối (Bridge Workout Chain).

---

## 2. CHI TIẾT THUẬT TOÁN & LOGIC 19 BÀI TẬP

### 1. Đảo ngữ (`anagram`)
- **Mục tiêu nhận thức**: `PART_WHOLE`, `ORDER_SEQUENCE`.
- **Cấp độ (1–12)**: Từ 3 chữ cái (L1) đến 14 chữ cái và cụm từ phức tạp, hỗ trợ các biến thể `PHRASE_ANAGRAM`, `TIMED_CASCADE`, `PARTIAL_REVEAL`, `CROSS_LANGUAGE`.

### 2. Bảng Schulte (`schulte-table`)
- **Mục tiêu nhận thức**: `TARGET_POSITION`, `ORDER_SEQUENCE`, `FOCUS_FIELD`, `INHIBITION`.
- **Cấp độ (1–12)**: Lưới từ 3x3 đến 9x9.
  - L1-L7: Lưới chuẩn mở rộng dần từ 3x3 đến 7x7.
  - L8: Reverse Order (đếm ngược từ N về 1).
  - L9: Gorbov Red-Black (Đỏ 1->25 tăng dần xen kẽ Đen 24->1 giảm dần).
  - L10: Rotating Schulte (Lưới tự xoay định kỳ).
  - L11: Fading Schulte (Số chớp tắt hoặc ẩn hiện).
  - L12: Dual Center (Song tâm ngắm mở rộng khẩu độ).

### 3. Tìm Chữ (`find-letter`)
- **Mục tiêu nhận thức**: `TARGET_DISTRACTOR`, `SIMILARITY_DIFF`, `FOCUS_FIELD`.
- **Thuật toán**: Lọc chữ mục tiêu trong ma trận ký tự gây nhiễu cùng nét (A vs R, B, P; O vs Q, D, C). Lưới tăng từ 4x4 lên 10x10.

### 4. Tìm Số (`find-number`)
- **Mục tiêu nhận thức**: `TARGET_DISTRACTOR`, `ORDER_SEQUENCE`, `RULE_ACTION`.
- **Thuật toán**: 
  - L1-L9: Quét tìm số mục tiêu cố định.
  - L10-L12: `MATH_TARGET` (Tìm số thỏa mãn điều kiện số học: chia hết cho 3, tổng chữ số bằng K, hoặc phương trình $A + B = \text{target}$).

### 5. Chẵn/Lẻ (`even-odd`)
- **Mục tiêu nhận thức**: `RULE_ACTION`, `INHIBITION`.
- **Thuật toán**: Phân loại số chẵn hoặc lẻ. Khi viền đổi sang màu đỏ hoặc có tín hiệu đảo luật (Inverted Rule), người chơi phải chọn ngược lại phản xạ tự nhiên.

### 6. Nhớ Số (`digit-span`)
- **Mục tiêu nhận thức**: `ORDER_SEQUENCE`, `TEMPORAL_PREDICT`, `IDENTITY_MATCH`.
- **Thuật toán**: Chuỗi số từ 3 đến 12 chữ số chớp sáng trong thời gian ngắn. Người chơi nhập lại theo thứ tự xuôi (L1-L4) hoặc thứ tự ngược `reverseMode` (L5-L12).

### 7. Chữ Chạy RSVP (`rsvp-speed-reader`)
- **Mục tiêu nhận thức**: `TEMPORAL_PREDICT`, `PART_WHOLE`, `CONTEXT_MEANING`.
- **Thuật toán**: Trình chiếu từ đơn lẻ tốc độ cao tại vị trí nhận diện tối ưu (ORP), tốc độ từ 200 đến 1200 WPM, loại bỏ thời gian chuyển động mắt lãng phí.

### 8. Tìm Từ Trong Ma Trận (`word-search`)
- **Mục tiêu nhận thức**: `PART_WHOLE`, `TARGET_POSITION`.
- **Thuật toán**: Bảng chữ cái kích thước $R \times C$. Tìm các từ vựng ẩn theo phương ngang, dọc, chéo xuôi và ngược.

### 9. So Sánh Từ (`twin-words`)
- **Mục tiêu nhận thức**: `IDENTITY_MATCH`, `SIMILARITY_DIFF`.
- **Thuật toán**: Hiển thị 2 từ song song trong 1-2 giây. Xác định nhanh chúng là "GIỐNG NHAU" hay "KHÁC NHAU" (sai lệch 1 ký tự hoặc hình thái).

### 10. Tầm Nhìn Ngoại Vi (`peripheral-vision`)
- **Mục tiêu nhận thức**: `FOCUS_FIELD`, `TARGET_POSITION`.
- **Thuật toán**: Khóa mắt vào tâm ngắm ở giữa. Hai ký hiệu chớp sáng ở hai biên đối xứng với góc nhìn dãn rộng dần theo cấp độ.

### 11. Điểm Xanh Cố Định (`green-dot`)
- **Mục tiêu nhận thức**: `FOCUS_FIELD`, `TARGET_DISTRACTOR`.
- **Thuật toán**: Cố định mắt vào điểm tròn xanh lục ở tâm đoạn văn trong 60 giây để kích hoạt vùng tập trung mềm, sau đó trả lời câu hỏi trắc nghiệm kiểm tra độ hấp thu văn bản ngoại vi.

### 12. Chuỗi Từ (`word-chunking`)
- **Mục tiêu nhận thức**: `PART_WHOLE`, `CONTEXT_MEANING`.
- **Thuật toán**: Phân rã văn bản thành các khối cụm từ ngữ nghĩa 2-4 từ. Đóng khung nhấp nháy tuần tự theo nhịp nhãn cầu.

### 13. Đánh Giá Tốc Độ Đọc (`reading-assessment`)
- **Mục tiêu nhận thức**: `CONTEXT_MEANING`, `TEMPORAL_PREDICT`, `ORDER_SEQUENCE`.
- **Thuật toán**: Đọc văn bản hoàn chỉnh, đo thời gian thực, tính Raw WPM kết hợp bài kiểm tra 4 câu hỏi đọc hiểu để xác định Tốc độ đọc hiệu dụng Effective WPM.

### 14. Tăng Tốc Độ Đọc (`reading-pacer`)
- **Mục tiêu nhận thức**: `TEMPORAL_PREDICT`, `FOCUS_FIELD`.
- **Thuật toán**: Định dạng Bionic Text (in đậm âm tiết đầu) kết hợp thanh dẫn hướng chuyển động dẫn dắt nhãn cầu với tốc độ 250 đến 800 WPM.

### 15. Quét Văn Bản (`text-scanning`)
- **Mục tiêu nhận thức**: `TARGET_DISTRACTOR`, `CONTEXT_MEANING`.
- **Thuật toán**: Quét nhanh văn bản tài liệu thực chiến để xác định chính xác từ khóa trả lời câu hỏi trong thời gian ngắn nhất.

### 16. Lật Thẻ Trí Nhớ 3D (`card-flip`)
- **Mục tiêu nhận thức**: `IDENTITY_MATCH`, `SPATIAL_TRANSFORM`, `TARGET_POSITION`.
- **Thuật toán**: Lưới thẻ bài ẩn 3D. Lật các thẻ để ghép cặp biểu tượng tương đồng. Cấp cao bổ sung thẻ đảo vị trí.

### 17. Đấu Màu Nhận Thức (`stroop-clash`)
- **Mục tiêu nhận thức**: `INHIBITION`, `RULE_ACTION`, `IDENTITY_MATCH`.
- **Thuật toán**: Hiệu ứng Stroop kinh điển. Chữ hiển thị tên một màu nhưng được tô bằng màu mực khác. Người chơi phải chọn đúng màu mực thực tế, ức chế phản xạ đọc chữ tự động.

### 18. Nhớ Khối Không Gian (`spatial-memory`)
- **Mục tiêu nhận thức**: `TARGET_POSITION`, `ORDER_SEQUENCE`, `SPATIAL_TRANSFORM`.
- **Thuật toán**: Thử nghiệm Corsi Block Tapping. Các ô trong lưới phát sáng tuần tự theo chuỗi 3 đến 9 bước. Người chơi bấm lại chính xác trình tự không gian.

### 19. Theo Dõi Mắt Nhanh (`saccade-tracker`)
- **Mục tiêu nhận thức**: `FOCUS_FIELD`, `ORDER_SEQUENCE`.
- **Thuật toán**: Mục tiêu nảy và nhảy cóc liên tục trên màn hình. Mắt bám sát mục tiêu và phản xạ nhanh khi mục tiêu chuyển đổi trạng thái đặc biệt.
