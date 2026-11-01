# Brain Pro — Báo cáo đầy đủ các chỗ nên sửa: họ bài Tìm chữ

Ngày test: 01/11/2026, ba phiên test khách liên tiếp trên desktop.
Trang web: https://brain-pro-psi.vercel.app/
Phạm vi: Tìm chữ (Find Letter), Tìm Số (Find Number), Tìm Từ (Word Search),
Tìm trong văn bản (Text Scanning), cộng routine 10 phút vì chặng 2 của nó là Tìm chữ.

Bản này là bản nháp lưu local, chưa sửa code, chưa tải lên Drive.
Mọi con số đều là số liệu phiên test khách, không phải tài khoản thật của người dùng.

## 0. Cách test và mốc dữ liệu

- Chỉ dùng chế độ khách. Không đăng nhập Google thật, không nhập mật khẩu hay
  thông tin cá nhân, không mua gì, không tải file cá nhân lên. Các nút và banner
  đăng nhập hiện suốt phiên nhưng không được bấm.
- Dữ liệu khách cũ không xóa được, nên mỗi phiên chỉ đo được mức thay đổi so với
  mốc đầu phiên, không phải tổng của một phiên sạch:
  - Phiên 1: Cấp 9, 6.862 XP, chuỗi 4 ngày, Tìm chữ Cấp 7/12, lịch sử sai có 1 mục
    Schulte cũ → cuối phiên Cấp 11, 10.562 XP.
  - Phiên 2: Cấp 11, 10.562 XP → cuối phiên Cấp 16, 23.520 XP.
  - Phiên 3: Cấp 16, 23.520 XP, chuỗi 4 ngày, lịch sử sai vẫn 1 mục → cuối phiên
    Cấp 21, 40.346 XP.
- Điểm màn kết quả, điểm modal phân tích, điểm lịch sử và XP trang chủ là bốn
  thang số khác nhau trong sản phẩm hiện tại. Báo cáo này đối chiếu chúng với nhau
  thay vì cộng dồn chúng lại.

## 1. Hai đính chính quan trọng so với các báo cáo trước

### 1.1. Tìm Từ hoàn thành được bằng cách bấm, không phải bằng cách kéo

Hai báo cáo trước kết luận Tìm Từ không thể hoàn thành, vì đã thử kéo, bấm hai
đầu mút, bấm từng chữ ở cấp 3 và cấp 4 mà tiến độ vẫn 0/3. Phiên 3 chứng minh
kết luận đó sai ở phương pháp, không phải ở mọi cách chơi:

- Cấp 1: bấm từng chữ theo thứ tự của TỰ TIN rồi ĐAM MÊ thì xong bàn, modal
  phân tích 100%, sau đó bàn mới bắt đầu, không có màn kết quả.
- Cấp 2: bấm hai đầu mút rồi bấm chữ giữa vẫn không xác nhận, nhưng bấm đúp
  chữ cuối thì xác nhận. Bấm ngược SÁCH từ H về S cũng xác nhận được.
- Cấp 3: bấm LOGIC, ĐAM MÊ, rồi dùng gợi ý để bấm ĐỌC thì xong bàn.
- Cấp 4: bấm HỌC theo thứ tự thì xác nhận 1/3, tức cấp từng thất bại trước đây
  nay xác nhận được bằng cách bấm.

Vì vậy lỗi thật của Tìm Từ không phải “không thể hoàn thành”, mà là:

- Kéo không có tác dụng gì (kéo chậm, kéo nhanh, bấm thẻ mục tiêu rồi kéo đều
  thất bại), trong khi hướng dẫn nói “nhấp/kéo để khoanh chọn”.
- Game không hề nói người chơi phải bấm, và quy tắc xác nhận thì mờ: có lúc cần
  bấm lại chữ ở đầu mút mới xác nhận, có lúc bấm ngược vẫn xác nhận.
- Việc cấp 4 trước đây thất bại bằng cách bấm mà nay lại thành công thì chưa xác
  định được là do khác phương pháp, khác trạng thái bàn hay lỗi đã được sửa.

### 1.2. Routine 10 phút đi được tới cuối

Chặng Tìm chữ 2/5 có màn kết quả và nút chuyển chặng ngay từ bàn đầu tiên, và
cả 5 chặng đều chơi được tới cuối: Schulte, Tìm chữ, Đảo ngữ, Tầm Nhìn, Chữ Chạy,
kết thúc bằng nút hoàn tất lộ trình về trang chủ kèm pháo giấy. Quan sát “chặng
vô hạn” trước đây phù hợp với việc bấm “Luyện lại” liên tục thay vì bấm nút
chuyển chặng, nhưng cơ chế này chưa được chứng minh. Phần còn thiếu của routine
chỉ là không có màn tổng kết routine riêng, và chặng Tìm chữ khi chơi lại thì
lặp bàn không có đếm bàn (xem F-14).

### 1.3. Cấu trúc phiên chuẩn của Tìm chữ khác với tưởng tượng ban đầu

Ở chế độ chuẩn, xong một bàn 100% thì chỉ hiện modal “Phân Tích Nhận Thức Lượt
Chơi” (độ chính xác, thời gian mili giây, nút “Đã hiểu, tiếp tục rèn luyện”),
rồi bàn mới tự bắt đầu. Không có màn kết quả và không có điểm kết thúc phiên.
Điểm chỉ hiện trong lịch sử sau khi thoát bằng nút quay lại rồi “Thoát bài tập”.
Ngoại lệ duy nhất quan sát được: một bàn không hoàn hảo 71% thì dừng ở màn kết
quả thay vì tự chuyển bàn, nguyên nhân chưa xác định (xem F-13).

## 2. Danh sách sửa theo mức ưu tiên

### P0 — Sai số liệu và chặn luồng chơi, sửa trước

**F-01. Mỗi bàn hoàn thành bị ghi trùng 2 lần vào lịch sử (cả 4 bài).**
- Tái hiện: chơi đúng một bàn ở bất kỳ bài nào trong họ, thoát ra, mở tab lịch
  sử của bài đó.
- Bằng chứng: Tìm chữ 1 bàn cấp 4 sạch làm lịch sử từ 4 lên 6 phiên, thêm đúng
  cấp 4 +1.020 nhân hai; Tìm Số 1 phiên làm lịch sử từ 0 lên 2 phiên giống hệt
  nhau, cấp 3, 95%, +428 điểm; Tìm trong văn bản 1 bàn làm lịch sử từ 0 lên 2
  phiên giống hệt nhau, cấp 10, 100%, +2.900 điểm; Tìm Từ 1 bàn cấp 1 làm lịch sử
  từ 0 lên 2 phiên, cấp 1, 100%, +650 điểm.
- Hậu quả: số phiên, trung bình, kỷ lục đều bị thổi phồng gấp đôi.
- Kết quả mong đợi: một bàn hoàn thành chỉ tạo đúng một dòng lịch sử, và mọi
  thống kê suy ra từ đó phải khớp với dòng đó.

**F-02. Độ chính xác ở màn kết quả và lịch sử không khớp với số lần bấm thật.
Modal phân tích mới là con số đúng.**
- Tái hiện: cố tình bấm sai rồi bấm đúng, ghi lại số lần bấm thật, đối chiếu ba
  nơi: modal phân tích, màn kết quả (nếu có), lịch sử.
- Bằng chứng:
  - Tìm Số cấp 3: bấm thật 8 lần, 6 đúng, 2 sai, tức 75%. Modal phân tích ghi
    75%, đúng. Màn kết quả ghi 95%, lịch sử ghi 95%.
  - Tìm trong văn bản cấp 10: bấm thật 5 lần, 3 đúng, 2 sai, tức 60%. Modal phân
    tích ghi 60%, đúng. Lịch sử ghi 100%.
  - Tìm chữ bàn không hoàn hảo: bấm 7 lần, 5 đúng, 2 sai, tức 71%. Modal phân
    tích và màn kết quả đều ghi 71%, đúng, nhưng lịch sử vẫn nhân đôi dòng đó.
- Kết quả mong đợi: một định nghĩa độ chính xác duy nhất, tính từ số lần bấm
  thật, dùng chung cho modal, màn kết quả và lịch sử.

**F-03. Điểm màn kết quả tự tụt trong lúc người chơi còn đang đọc, và điểm
lịch sử lệch đúng một giây so với màn kết quả.**
- Công thức đã đo được ở các bàn 100% (chế độ tùy chỉnh, nơi có màn kết quả):
  điểm(t) = cấp × max(100, 300 − 5×t), tức tụt đều 5 × cấp điểm mỗi giây, chạm
  sàn 100 × cấp ở giây 40. Ví dụ cấp 7: xong ở giây 7 được +1.855, giây 12 còn
  +1.680, giây 22 còn +1.330, giây 31 còn +1.015, giây 38 còn +770, từ giây 57
  trở đi đứng ở sàn +700. Cấp 8: xong ở giây 7 được +2.120, giây 11 còn +1.960,
  giây 25 còn +1.400, từ giây 54 trở đi đứng ở sàn +800.
- Điểm lịch sử luôn cao hơn điểm màn kết quả lúc xong đúng 35 điểm ở cấp 7 và
  40 điểm ở cấp 8, tức khớp với công thức ở thời điểm xong trừ 1 giây. Ví dụ
  cấp 7 xong ở giây 7 hiện +1.855 nhưng lịch sử ghi +1.890, đúng bằng
  2.100 − 35×6.
- Trường hợp bàn không hoàn hảo cấp 8: kết quả +1.808 ở giây 9 và +1.528 ở giây
  16, độ dốc vẫn −40 điểm/giây nhưng điểm khởi đầu thấp hơn 232 điểm so với
  2.400 của bàn hoàn hảo. Quy tắc trừ điểm cho bàn không hoàn hảo mới chỉ có
  một điểm dữ liệu nên chưa xác định được.
- Trường hợp Tìm Số: điểm kết quả +570 nhưng lịch sử chỉ +428, và 570 × 0,75
  = 427,5 gần đúng bằng 428, nhưng đây mới là suy luận từ một con số trùng hợp,
  chưa được chứng minh.
- Kết quả mong đợi: điểm phải đóng băng ngay khi bàn kết thúc, không tụt theo
  thời gian đọc màn hình. Điểm lịch sử phải bằng đúng điểm đã đóng băng đó.
  Nếu có trừ điểm vì bấm sai thì phải ghi rõ quy tắc trừ.

**F-04. Phiên chuẩn Tìm chữ không bao giờ tự kết thúc, và bộ chọn số vòng
không có tác dụng.**
- Tái hiện: chọn “Khởi động 6 lượt”, chơi xong 6 bàn, bấm “Đã hiểu” sau modal
  phân tích.
- Bằng chứng: sau vòng 6 vẫn ra bàn thứ 7, không có tổng kết phiên, không có
  màn kết quả cho các bàn 100%. Cách duy nhất để ra là nút quay lại rồi “Thoát
  bài tập”. Điều này trái với Schulte, vốn đã có phiên nhiều vòng thật với đếm
  vòng và tổng kết phiên.
- Kết quả mong đợi: hoặc phiên có điểm kết và tổng kết sau đúng số vòng đã
  chọn, hoặc bỏ bộ chọn số vòng đi nếu chưa làm được, chứ không để bộ chọn
  không có tác dụng mà vẫn hiện.

**F-05. Cài đặt tùy chỉnh Tìm chữ bị bỏ qua: số vòng chỉ cho 1 bàn, giới hạn
thời gian không chặn gì cả.**
- Tái hiện: bảng tùy chỉnh chỉ cho chỉnh số vòng 3 / 5 / 8 / 10 / 15 và giới hạn
  thời gian 30 / 45 / 60 / 90 giây hoặc tự do, không có chỗ chỉnh lưới, số mục
  tiêu hay biến thể, và ghi rõ chế độ tùy chỉnh không ảnh hưởng cấp DDA chính.
- Bằng chứng:
  - Đặt 3 vòng, chơi nhanh xong bàn 1 trong 7 giây thì màn kết quả hiện ngay,
    không có bàn 2.
  - Đặt giới hạn 30 giây, để nguyên bàn 35 giây thì ở giây 37 bàn vẫn chơi được
    bình thường, không có cảnh báo, đồng hồ đếm lên từ 0 chứ không đếm ngược
    từ 30. Chơi xong ở giây 46 vẫn được điểm sàn +700.
  - Bấm “Luyện lại” từ màn kết quả tùy chỉnh thì ra bàn mới với đồng hồ reset
    về 0, không có chữ vòng 2 ở đâu, màn kết quả chỉ tổng kết bàn đó, và lịch
    sử ghi bàn đó thành một cặp phiên riêng, không khác gì một phiên mới.
- Kết quả mong đợi: hoặc giới hạn thời gian thật sự chặn ở 30 giây (đếm ngược,
  cảnh báo, kết thúc), hoặc đổi nhãn thành mốc tính điểm và bỏ chữ “giới hạn”.
  Số vòng phải tạo ra đúng số bàn kèm đếm vòng và tổng kết phiên, hoặc bỏ lựa
  chọn đó đi.

**F-06. Trang chi tiết lệch với bàn chơi thật ở hầu hết các cấp và bài
(xem bảng đầy đủ ở mục 3).**
- Tái hiện: mở bất kỳ trang chi tiết nào, ghi lưới và số mục tiêu, rồi bắt đầu
  chơi và đếm bàn.
- Kết quả mong đợi: trang chi tiết phải ghi đúng lưới, số mục tiêu và biến thể
  của bàn đầu tiên thật của cấp đó. Nếu con số trên trang là khoảng của cả
  phiên hay cấp cao nhất thì phải ghi rõ là khoảng, không ghi như một con số
  duy nhất của bàn.

**F-07. Tên biến thể trong game khác tên trên trang chi tiết ở các cấp vô hạn,
và ba biến thể được quảng cáo không có hiệu ứng như tên gọi.**
- Tên lệch: ∞-III trang chi tiết ghi ngụy trang chuyển màu nhưng trong game là
  đảo gương; ∞-IV ghi hỗn loạn font chữ nhưng trong game là xung đột font chữ;
  ∞-V ghi nhiễu nhấp nháy nhưng trong game là hỗn loạn kích thước chữ; ∞-VI ghi
  săn mục tiêu hai dạng hoa thường nhưng trong game là ký tự dễ nhầm; ∞-VII ghi
  nhiễu ký hiệu toán và Hy Lạp nhưng trong game là xâm nhập ký hiệu; ∞-VIII ghi
  lưới mở rộng nhưng trong game là ngụy trang màu sắc; ∞-IX ghi mê cung gương
  dọc nhưng trong game là mê cung gương và xoay. Chỉ ∞-II khớp tên.
- Hiệu ứng không có thật:
  - Tìm chữ cấp 10, biến thể lưới ký tự động: quan sát hai ảnh cách nhau khoảng
    32 giây, mọi ô đều giống hệt chữ và vị trí, không thấy lưới chuyển động,
    trôi hay xáo lại.
  - Tìm chữ cấp 12 Stroop, biến thể nhiễu màu sắc: chơi 3 bàn khác nhau, mọi chữ
    đều cùng một màu xám đậm, không thấy biến thiên màu sắc, mục tiêu chỉ nhận
    biết được nhờ hình dạng chữ.
  - ∞-V, biến thể được ghi là nhiễu nhấp nháy: quan sát hai ảnh cách nhau 30
    giây, chữ, vị trí và kích thước đều giống hệt, không thấy nhấp nháy ở đâu;
    hiệu ứng thật duy nhất là kích thước chữ tĩnh khác nhau, làm ô mục tiêu nhỏ
    khó thấy hơn chứ không phải nhấp nháy.
- Kết quả mong đợi: hoặc làm đúng hiệu ứng như tên gọi, hoặc đổi tên biến thể
  cho khớp hiệu ứng thật. Đừng để tên gọi hứa một cơ chế mà bàn chơi không có.

**F-08. Bộ đếm “Đã tìm” kẹt ở 0 trong chế độ chuẩn của Tìm chữ.**
- Tái hiện: chơi bất kỳ bàn chuẩn nào tới khi xong, nhìn tiêu đề game.
- Bằng chứng: tiêu đề vẫn ghi 0/x dù đã bấm đủ mục tiêu, trong khi chế độ tùy
  chỉnh thì bộ đếm cập nhật, ví dụ 5/5. Người chơi không có phản hồi tiến độ
  đáng tin trong lúc chơi ở chế độ chuẩn.
- Kết quả mong đợi: bộ đếm phải cập nhật theo từng lần bấm đúng ở mọi chế độ.

**F-09. Lỗi bấm sai của họ Tìm chữ không bao giờ vào “Lịch sử sai”.**
- Tái hiện: ở Tìm chữ, bấm sai 3 lần rồi thoát bàn dở bằng “Thoát bài tập” mà
  không hoàn thành; hoặc bấm sai 2 lần rồi hoàn thành bàn; sau đó mở trang lịch
  sử sai.
- Bằng chứng: cả hai trường hợp đều không thêm mục nào, lịch sử sai vẫn chỉ có
  1 mục Schulte cũ từ một ngày trước, mục tiêu 1 so với bấm nhầm ô số 8. Bộ lọc
  bài tập của trang lịch sử sai thậm chí không liệt kê Tìm chữ. Trường hợp bàn
  dở thì không có cả lịch sử phiên lẫn lịch sử sai; trường hợp bàn xong có lỗi
  thì có lịch sử phiên nhân đôi với độ chính xác thật 71% nhưng vẫn không có
  lịch sử sai, và độ chính xác trung bình trên trang chi tiết chỉ đổi từ 100%
  xuống 99%.
- Kết quả mong đợi: lỗi bấm sai phải được ghi vào lịch sử sai với đủ thông tin
  mục tiêu, ô bấm nhầm và cấp độ, ở cả bàn dở và bàn đã xong, và bộ lọc phải có
  đủ các bài trong họ Tìm chữ.

**F-10. Đồng hồ không dừng khi mở hộp thoại, dù hộp thoại thoát nói là tạm dừng.**
- Tái hiện: ghi đồng hồ, mở hộp thoại hướng dẫn hoặc thoát, chờ 10 giây trong
  hộp thoại, đóng lại và ghi đồng hồ ngay sau đó.
- Bằng chứng: Tìm chữ, hộp thoại hướng dẫn từ 5 giây lên 18 giây sau 10 giây chờ
  rồi 22 giây sau khi đóng; hộp thoại thoát từ 27 giây lên 40 giây rồi 44 giây
  sau khi tiếp tục chơi. Tìm trong văn bản cũng vậy: hướng dẫn từ 5 lên 20 rồi
  24 giây, thoát từ 88 lên 102 giây. Mỗi lần chờ 10 giây làm đồng hồ tăng 13 tới
  15 giây, tức có khoảng 3 tới 5 giây chi phí công cụ cộng thêm, nhưng hướng
  thì không mơ hồ: đồng hồ vẫn chạy. Đồng hồ còn cộng dồn qua nhiều bàn trong
  một phiên và vẫn chạy trong lúc hộp thoại tạm dừng đang mở.
- Kết quả mong đợi: mở hộp thoại hướng dẫn hoặc thoát phải dừng đồng hồ thật,
  hoặc bỏ chữ tạm dừng đi và nói rõ đồng hồ vẫn chạy.

### P1 — Tin cậy dữ liệu và trải nghiệm, sửa ngay sau P0

**F-11. Lịch sử trang chi tiết bắt đầu ở 0 mỗi phiên, trong khi cấp độ, XP,
chuỗi và số lượt tích lũy ở tab hồ sơ vẫn còn.**
- Bằng chứng: đầu phiên 3, lịch sử trang chi tiết của Tìm chữ, Tìm Số và Tìm
  trong văn bản đều ghi 0 phiên và “Chưa có lượt tập nào được ghi nhận”, dù các
  phiên trước đã chơi chúng. Cùng lúc đó, tab hồ sơ “Toàn Bộ 33 Bài Tập & Biến
  Thể” ghi Tìm chữ 0% chính xác với 126 lượt, Tìm Số 0% với 6 lượt, Tìm trong văn
  bản 0% với 10 lượt, và Tìm Từ là chưa luyện tập dù có hiển thị cấp độ. Tab hồ
  sơ ghi 0% chính xác cho mọi bài đã luyện, trong khi số lượt của nó là tích lũy
  mọi thời gian, còn bộ đếm phiên trang chi tiết thì bắt đầu ở 0 dù cấp DDA và
  XP vẫn giữ nguyên. Nguyên nhân chưa được chứng minh, không nên tự suy ra.
- Kết quả mong đợi: một nguồn dữ liệu duy nhất cho số phiên và độ chính xác,
  hiển thị giống nhau ở trang chi tiết, tab hồ sơ và lịch sử, hoặc ghi rõ hai
  con số đó đo hai thứ khác nhau.

**F-12. Bộ đếm phiên trang chi tiết của Tìm chữ dừng ở 50 trong khi dòng mới
vẫn vào.**
- Bằng chứng: bộ đếm dừng ở 50 dù 6 dòng hoàn thành mới vẫn xuất hiện ở đầu
  danh sách, gồm bàn chuẩn cấp 7, bàn tùy chỉnh cấp 8 và bàn không hoàn hảo cấp
  8. Cách giải thích phù hợp nhất là giới hạn 50 dòng và dòng cũ bị đẩy ra,
  nhưng đây mới là suy luận, chưa được chứng minh. Bản thân khung lịch sử chỉ
  hiện 10 dòng mới nhất.
- Kết quả mong đợi: hoặc bỏ giới hạn 50, hoặc ghi rõ chỉ giữ 50 dòng mới nhất
  và bộ đếm phải nói rõ nó đếm dòng đang giữ hay tổng mọi thời gian.

**F-13. Hành vi màn kết quả không nhất quán giữa bàn hoàn hảo và bàn không
hoàn hảo, và nhãn cấp trên màn kết quả lệch với cấp đã chơi.**
- Bằng chứng: các bàn 100% ở chế độ chuẩn thì tự chuyển bàn sau modal phân tích,
  không có màn kết quả. Một bàn không hoàn hảo 71% thì dừng ở màn kết quả sau
  modal. Nguyên nhân kích hoạt màn kết quả này mới chỉ có một quan sát nên chưa
  xác định được.
- Bằng chứng khác: màn kết quả Tìm Số cấp 3 ghi “Cấp độ 4”, tức cấp sau phiên
  chứ không phải cấp đã chơi, trong khi các dòng lịch sử của cùng phiên đó ghi
  “Cấp 3”. Báo cáo trước đây cũng thấy màn kết quả Schulte ghi cấp mới sau khi
  DDA lên cấp.
- Kết quả mong đợi: màn kết quả phải ghi cấp đã chơi, và quy tắc khi nào có màn
  kết quả, khi nào tự chuyển bàn phải thống nhất cho mọi mức độ chính xác.

**F-14. Routine 10 phút: chặng Tìm chữ chơi lại thì lặp bàn không đếm, và không
có màn tổng kết routine riêng.**
- Bằng chứng: bấm “Luyện lại” trong chặng Tìm chữ thì mỗi lần ra bàn mới vẫn
  trong chặng 2/5, bàn nào cũng có màn kết quả và nút chuyển chặng, nhưng không
  bao giờ thấy đếm bàn. Hoàn thành routine chỉ được báo bằng việc về trang chủ
  kèm pháo giấy, không có trang tổng kết routine riêng.
- Kết quả mong đợi: thêm đếm bàn khi chơi lại trong chặng, và thêm màn tổng kết
  routine gồm điểm từng chặng, tổng điểm, XP và thời gian, trước khi về trang
  chủ.

**F-15. Tìm Từ: kéo không có tác dụng, quy tắc xác nhận mờ, và không có hướng
dẫn cách bấm.**
- Bằng chứng đầy đủ ở mục 1.1. Hướng dẫn trong game nói “nhấp/kéo để khoanh
  chọn” nhưng kéo chậm, kéo nhanh và bấm thẻ mục tiêu rồi kéo đều thất bại.
  Gợi ý “Soi chữ cái đầu” thì hoạt động và trừ lượt nhìn thấy được, từ 3/3
  xuống 2/3, nhưng gợi ý không dạy người chơi cách xác nhận.
- Kết quả mong đợi: hoặc làm kéo hoạt động thật, hoặc đổi hướng dẫn thành cách
  bấm và ghi rõ quy tắc xác nhận, ví dụ bấm đủ chữ theo thứ tự và bấm lại chữ
  cuối để chốt. Thêm phản hồi nhìn thấy được khi một từ được chốt và khi một
  lựa chọn chưa đủ điều kiện.

**F-16. Lựa chọn biến thể Tìm chữ còn lưu sang phiên sau mà không báo, và một
số nhãn biến thể gây hiểu nhầm.**
- Bằng chứng: lần mở cấp 4 tiếp theo kế thừa lựa chọn “Ngẫu nhiên tất cả” và
  chia bàn ký tự dễ nhầm với mục tiêu O, nhiễu 0/C/G/D/Q. Trong một lần rút duy
  nhất, “Ngẫu nhiên tất cả” cho bàn dấu thanh với mục tiêu ỹ nhưng nhãn tiêu đề
  vẫn là dấu thanh tiếng Việt. Nhãn “Mục tiêu kép” ở cấp 11 nhưng chữ hoa không
  bắt buộc. Bấm biến thể thì chia bàn mới ngay, không cần xong bàn cũ, và đồng
  hồ reset về 0.
- Kết quả mong đợi: ghi rõ lựa chọn biến thể có lưu sang phiên sau hay không,
  nhãn tiêu đề phải đổi theo biến thể thật của bàn, và nhãn mục tiêu kép phải
  khớp với điều kiện hoàn thành thật.

**F-17. Tìm trong văn bản: xong một bàn không có màn kết quả, điểm lịch sử là
con số phẳng không xuất hiện ở đâu khác.**
- Bằng chứng: xong bàn cấp 10 với 3 từ khóa thì phía sau modal phân tích đã có
  bàn mới, đóng modal thì bàn mới vẫn chạy, thoát bằng “Thoát bài tập” thì về
  thẳng trang chi tiết, không có màn kết quả nào. Lịch sử ghi +2.900 điểm cho
  bàn đó, trong khi không có màn nào hiện con số đó. Bàn cấp 10 trước đó cũng
  ghi +1.000 điểm phẳng tương tự.
- Kết quả mong đợi: hoặc có màn kết quả cho mỗi bàn với điểm và cách tính điểm,
  hoặc ghi rõ điểm mỗi bàn được tính thế nào và hiện nó ngay sau khi xong bàn.

### P2 — Nội dung và văn bản, sửa khi làm P0 và P1

**F-18. Ngôn ngữ đồng hồ mâu thuẫn nhau giữa các bài và giữa hướng dẫn với
trang chi tiết.**
- Tìm chữ, Tìm Từ và Tìm trong văn bản đếm lên, Tìm Số đếm ngược, nhưng hướng
  dẫn Tìm chữ lại viết “trước khi đồng hồ đếm ngược về 0”, trong khi trang chi
  tiết gọi mốc thời gian là mốc tính điểm thưởng tốc độ, không phải giới hạn.
  Không quan sát được trường hợp Tìm chữ hết giờ ở bất kỳ bàn nào.
- Kết quả mong đợi: chỗ nào đếm lên và không giới hạn thì ghi rõ như vậy, chỗ
  nào đếm ngược thì làm đúng đếm ngược như hướng dẫn đã hứa, và nói rõ Tìm chữ
  có hết giờ hay không.

**F-19. Thiếu trường thông tin và thiếu mẫu số.**
- Không có số mục tiêu cho Tìm Số ở mọi cấp, cho Tìm chữ vô hạn ∞-I và cho Tìm
  trong văn bản ở mọi cấp. Bộ đếm “đã tìm” của Tìm Số không có mẫu số. Trang chi
  tiết Tìm trong văn bản cấp 7 chỉ ghi mốc 60 giây, không ghi độ dài đoạn văn
  hay số mục tiêu, trong khi trong game là đoạn văn 223 từ với nhiệm vụ đầu
  tiên chỉ tìm 1 từ khóa.
- Kết quả mong đợi: bổ sung đầy đủ số mục tiêu, độ dài đoạn văn và mẫu số cho
  bộ đếm ở mọi cấp.

**F-20. Quy tắc phân biệt hoa thường và dấu không được giải thích, dù game
khớp theo đúng ký tự.**
- Bằng chứng: các cấp 4, 5, 6, 9, 11 khớp theo đúng ký tự gồm cả hoa thường và
  dấu, không khớp theo chữ cái gốc. Ví dụ bàn dấu thanh yêu cầu chữ thường “â”
  trong khi lưới đầy các dạng Â, Ấ, Ầ, Ẩ, Ẫ, Ậ; bàn cấp 9 yêu cầu Ã hoa trong
  khi ã thường làm nhiễu và không được tính; bàn cấp 11 yêu cầu u thường trong
  khi U hoa không bắt buộc.
- Kết quả mong đợi: ghi rõ ngay trong hướng dẫn và trên bàn chơi là game phân
  biệt chính xác hoa thường và dấu, kèm một ví dụ.

**F-21. Lưới Tìm Từ tràn khỏi khung nhìn ở một số cấp, và ký hiệu kích thước
không nhất quán.**
- Bằng chứng: cấp 3 lần đầu thấy khoảng 14 cột và 10 hàng nhìn được vì lưới tràn
  khỏi khung nhìn. Cấp 1 trang chi tiết ghi 8×10 nhưng trong game là 10 cột nhân
  8 hàng, tức cùng số ô nhưng ký hiệu chiều bị đảo.
- Kết quả mong đợi: hiển thị trọn lưới hoặc ghi đúng kích thước thật trong game,
  và thống nhất ký hiệu hàng nhân cột ở mọi nơi.

## 3. Bảng đối chiếu trang chi tiết so với trong game

### 3.1. Tìm chữ, 12 cấp chuẩn

| Cấp | Trang chi tiết | Bàn chơi thật |
| --- | --- | --- |
| 1 | 4×4, 3 mục tiêu, 30 giây | 5×5, 3 mục tiêu, mục tiêu c |
| 2 | 5×5, 4 mục tiêu, 35 giây | 5×5, 3 mục tiêu, mục tiêu ò thường |
| 3 | 6×6, 5 mục tiêu, 40 giây | 6×6, 4 mục tiêu, mục tiêu d |
| 4 | 7×7, 6 mục tiêu, 45 giây | 6×6, 4 mục tiêu, mục tiêu ă thường |
| 5 | 8×8, 7 mục tiêu, 45 giây | 6×6, 4 mục tiêu, mục tiêu Ệ hoa |
| 6 | 9×9, 8 mục tiêu, 45 giây | 7×7, 5 mục tiêu, mục tiêu Ỹ hoa |
| 7 | 10×10, 9 mục tiêu, 40 giây | 7×7, 5 mục tiêu, mục tiêu Ư hoa |
| 8 | 12×12, 10 mục tiêu, 40 giây | 7×7, 5 mục tiêu, mục tiêu c, Ụ, Ó tùy bàn |
| 9 | 12×12, 10 mục tiêu, 35 giây | 8×8, 7 mục tiêu, mục tiêu Ã hoa |
| 10 | 12×14, 11 mục tiêu, 35 giây | 8×8, 7 mục tiêu, mục tiêu B, ỡ tùy bàn |
| 11 | 14×14, 12 mục tiêu, 30 giây | 8×8, 7 mục tiêu, mục tiêu u thường |
| 12 | 14×16, 14 mục tiêu, 30 giây | 8×8, 7 mục tiêu, mục tiêu x, B, Ẵ, ẳ tùy bàn |

Quy luật quan sát được, chưa phải quy tắc đã chứng minh: bàn thật gom thành
từng band, cấp 1 là 5×5/3, cấp 2 là 5×5/3, cấp 3 tới 5 là 6×6/4, cấp 6 và 8 là
7×7/5, cấp 9 tới 12 là 8×8/7, trong khi trang chi tiết ghi lưới và mục tiêu lớn
hơn nhiều và tăng dần. Mốc thời gian cũng không tăng đơn điệu: 30 giây ở cấp 1,
40 giây ở cấp 7 rồi 30 giây ở cấp 12.

### 3.2. Tìm chữ, 10 cấp vô hạn

| Cấp | Trang chi tiết | Trong game |
| --- | --- | --- |
| ∞-I | Trường nhiễu song ngữ, 8×8, 35 giây | Săn chữ Latin học thuật, 8×8, 6 mục tiêu, mục tiêu I |
| ∞-II | Chữ xoay, 8×8, 35 giây | Chữ xoay 90/180/270 độ, 8×8, 6 mục tiêu, mục tiêu B, khớp tên |
| ∞-III | Ngụy trang chuyển màu, 8×8, 30 giây | Đảo gương, 8×8, 6 mục tiêu, mục tiêu G, lệch tên |
| ∞-IV | Hỗn loạn font chữ, 9×9, 35 giây | Xung đột font chữ, 8×8, 8 mục tiêu, mục tiêu I, lệch tên và lưới |
| ∞-V | Nhiễu nhấp nháy, 9×9, 30 giây | Hỗn loạn kích thước chữ, 9×9, 8 mục tiêu, mục tiêu B, lệch tên, không nhấp nháy |
| ∞-VI | Săn mục tiêu hai dạng hoa thường, 10×10, 30 giây | Ký tự dễ nhầm, 9×9, 8 mục tiêu, mục tiêu d, lệch tên và lưới |
| ∞-VII | Nhiễu ký hiệu toán và Hy Lạp, 10×10, 35 giây | Xâm nhập ký hiệu, 9×9, 8 mục tiêu, mục tiêu G, lệch tên và lưới |
| ∞-VIII | Lưới mở rộng, 10×10, 40 giây | Ngụy trang màu sắc, 10×10, 10 mục tiêu, mục tiêu c, lệch tên, khớp lưới |
| ∞-IX | Mê cung gương dọc, 11×11, 35 giây | Mê cung gương và xoay, 10×10, 10 mục tiêu, mục tiêu d, lệch tên và lưới |
| ∞-X | Dòng ma trận vô hạn, 12×12, 60 giây | Ma trận tổng hợp 10×10, 10×10, 10 mục tiêu, mục tiêu G, lệch tên và lưới |

Trang chi tiết các cấp vô hạn đều không ghi số mục tiêu.

### 3.3. Tìm Số, Tìm Từ, Tìm trong văn bản

- Tìm Số cấp 2: trang chi tiết 5×5, 35 giây, không ghi số mục tiêu; trong game
  bắt đầu 4×4, đếm ngược từ 30 giây, cơ chế tìm từng số một theo thứ tự, mỗi lần
  đúng thì lưới tạo lại với số mới và lưới lớn dần lên 5×5.
- Tìm Số cấp 3: trang chi tiết 6×6, 40 giây, không ghi số mục tiêu; trong game
  5×5, đếm ngược từ 30 giây, một mục tiêu số tại một thời điểm, bộ đếm đã tìm
  không có mẫu số.
- Tìm Từ cấp 1: trang chi tiết 8×10, 2 mục tiêu, 60 giây; trong game 10 cột nhân
  8 hàng, 2 mục tiêu.
- Tìm Từ cấp 2: trang chi tiết 10×12, 3 mục tiêu, 60 giây; trong game 10 cột nhân
  8 hàng, 2 mục tiêu.
- Tìm Từ cấp 3: trang chi tiết 12×15, 3 mục tiêu, 60 giây; trong game 14 cột nhân
  10 hàng, 3 mục tiêu.
- Tìm Từ cấp 4: trang chi tiết 12×20, 3 mục tiêu, 60 giây; trong game 14 cột nhân
  10 hàng, 3 mục tiêu.
- Tìm trong văn bản cấp 7: trang chi tiết chỉ ghi mốc 60 giây; trong game đoạn
  văn 223 từ, nhiệm vụ đầu tìm 1 từ khóa, sau đó tự chuyển sang nhiệm vụ tiếp
  theo, rồi biến thể 3 từ khóa ở cấp 9 và biến thể từ đồng nghĩa ở cấp 10.
- Tìm trong văn bản cấp 10: trang chi tiết chỉ ghi mốc 45 giây và ghi chú tìm
  khái niệm đồng nghĩa; trong game đoạn văn 243 từ, tìm đồng thời 3 từ khóa,
  đồng hồ đếm lên, xong bàn thì bàn mới tự bắt đầu mà không có màn kết quả.

## 4. Điểm làm tốt, nên giữ nguyên khi sửa

- Hướng dẫn riêng theo từng bài và có trích dẫn khoa học, không chung chung:
  Tìm chữ nói về chữ dễ nhầm nét và quét theo hàng, Tìm Số nhắc tới Dehaene và
  Posner, Tìm Từ nhắc tới Treisman và Gelade 1980, Tìm trong văn bản nhắc tới
  quét kiểu S/Z và Guthrie và Mosenthal 1987.
- Biến thể dấu thanh tiếng Việt và ký tự dễ nhầm lẫn của Tìm chữ là bài luyện
  đúng đích, không phải đổi giao diện cho có.
- Gợi ý của Tìm Từ hoạt động và trừ lượt nhìn thấy được, từ 3/3 xuống 2/3.
- Tìm trong văn bản dùng đoạn văn thật dài, từ bấm được, có biến thể nhiều từ
  khóa và từ đồng nghĩa.
- Modal phân tích là nơi duy nhất có độ chính xác khớp với số lần bấm thật ở
  cả Tìm Số và Tìm trong văn bản, nên giữ modal này làm nguồn số liệu đúng khi
  sửa các nơi còn lại.
- Routine 10 phút đi được hết 5 chặng, chặng Đảo ngữ có đếm vòng 1/5 tới 5/5 rõ
  ràng, chặng Tầm Nhìn và Chữ Chạy có màn kết quả và nút chuyển chặng rõ ràng.
- Không thấy rõ lỗi cắt chữ hay tương phản kém trong các ảnh chụp, ngoại trừ
  lưới Tìm Từ tràn khỏi khung nhìn ở một số cấp.

## 5. Thứ tự sửa đề xuất cho dev

1. Ghi lịch sử đúng một lần mỗi bàn, dùng một định nghĩa độ chính xác duy nhất
   lấy từ số lần bấm thật, và đóng băng điểm ngay khi bàn kết thúc (F-01, F-02,
   F-03).
2. Cho phiên chuẩn một điểm kết và tổng kết, và làm cho cài đặt tùy chỉnh thật
   sự có tác dụng: số vòng tạo đúng số bàn, giới hạn thời gian hoặc chặn thật
   hoặc đổi nhãn thành mốc tính điểm (F-04, F-05).
3. Sửa trang chi tiết và tên biến thể cho khớp bàn chơi thật, hoặc sửa bàn chơi
   cho khớp trang chi tiết, chọn một nguồn duy nhất làm chuẩn (F-06, F-07).
4. Sửa bộ đếm đã tìm, đồng hồ khi mở hộp thoại và lịch sử sai (F-08, F-09, F-10).
5. Sửa Tìm Từ: làm kéo hoạt động hoặc đổi hướng dẫn thành cách bấm và ghi rõ
   quy tắc xác nhận (F-15).
6. Gỡ các mâu thuẫn dữ liệu còn lại: lịch sử bắt đầu ở 0, tab hồ sơ so với trang
   chi tiết, bộ đếm dừng ở 50, nhãn cấp trên màn kết quả, điểm phẳng của Tìm
   trong văn bản (F-11, F-12, F-13, F-17).
7. Dọn các nhãn và văn bản gây hiểu nhầm còn lại: biến thể lưu sang phiên sau,
   mục tiêu kép, mốc thời gian, phân biệt hoa thường và dấu, kích thước lưới
   Tìm Từ (F-14, F-16, F-18, F-19, F-20, F-21).

## 6. Tiêu chí nghiệm thu gợi ý

- Chơi một bàn ở mỗi bài trong họ, thoát ra, lịch sử tăng đúng 1 dòng, điểm và
  độ chính xác ở lịch sử bằng đúng modal phân tích và màn kết quả đã đóng băng.
- Chơi một phiên 6 vòng ở chế độ chuẩn thì sau vòng 6 có tổng kết phiên, không
  ra bàn thứ 7.
- Đặt tùy chỉnh 3 vòng và giới hạn 30 giây thì hoặc chơi được đúng 3 bàn kèm đếm
  vòng, hoặc hết 30 giây thì phiên kết thúc với cảnh báo rõ ràng, không có
  trường hợp chơi tiếp tới giây 46 mà không có gì xảy ra.
- Mở trang chi tiết bất kỳ trong họ, ghi lưới và số mục tiêu, bắt đầu chơi và
  đếm được đúng lưới và số mục tiêu đó ở bàn đầu tiên.
- Bấm sai ở Tìm chữ rồi mở lịch sử sai thì thấy đúng lỗi đó, với mục tiêu, ô
  bấm nhầm và cấp độ.
- Mở hộp thoại hướng dẫn hoặc thoát, chờ 10 giây, đóng lại thì đồng hồ không
  tăng thêm.
- Ở Tìm Từ, kéo một từ theo hướng dẫn và bấm một từ theo hướng dẫn đều xác nhận
  được, và hướng dẫn ghi đúng cách chơi thật.
- Ở cấp 10, cấp 12 và ∞-V, tên biến thể và hiệu ứng nhìn thấy được phải khớp
  nhau: lưới chuyển động thì phải chuyển động, nhiễu màu thì phải có màu, nhấp
  nháy thì phải nhấp nháy, hoặc đổi tên cho khớp hiệu ứng thật.

## 7. Còn chưa xác minh được, và vì sao

- Trang chi tiết so với trong game của Tìm chữ cấp 3, 4, 5, 6, 9, 11 không được
  đo lại trong phiên 3, chỉ có số liệu từ các phiên trước.
- Quy tắc trừ điểm chính xác cho bàn không hoàn hảo: mới chỉ có một bàn 71% với
  mức trừ 232 điểm, chưa đủ để kết luận quy tắc.
- Nguyên nhân lịch sử trang chi tiết bắt đầu ở 0, nguyên nhân bộ đếm dừng ở 50,
  và nguyên nhân kích hoạt màn kết quả ở bàn không hoàn hảo: đều là suy luận từ
  quan sát, chưa có bằng chứng về cơ chế bên trong.
- Việc cấp 4 Tìm Từ trước đây thất bại bằng cách bấm mà nay lại thành công: chưa
  xác định được là do khác phương pháp, khác trạng thái bàn hay lỗi đã được sửa.
- Nhập cảm ứng trên mobile cho Tìm Từ: công cụ test không có điều khiển đổi
  viewport mobile nên chưa test được, kết luận về Tìm Từ chỉ giới hạn ở trình
  duyệt desktop.
- Cơ chế gây ra ghi trùng lịch sử và cơ chế gây ra độ chính xác lệch nhau: chỉ
  thấy hiện tượng, chưa có bằng chứng về code hay luồng ghi dữ liệu.
