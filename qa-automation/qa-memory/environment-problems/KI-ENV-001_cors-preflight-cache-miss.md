---
id: "KI-ENV-001"
title: "Lỗi CORS Preflight OPTIONS Timeout Khi Chạy Test API Giữa Các Miền Khác Nhau"
type: "environment-problem"
status: "active"
confidence: "high"
app_applicability:
  target: "Universal"
  stack: ["FastAPI", "Express", "Spring Boot", "Nginx"]
  environment: ["dev", "staging"]
first_seen: "2026-03-20"
last_verified: "2026-09-13"
source:
  execution_id: "EXEC-20260320-0033"
  author: "Automation-Engineer-Agent"
  reviewed_by: "DevOps-Lead"
problem: "Trình duyệt chặn request POST/PUT khi test chạy từ http://localhost:3000 gọi tới backend API tại http://api.staging.internal với lỗi 'Access to fetch at ... has been blocked by CORS policy: Response to preflight request doesn't pass access control check'."
root_cause: "Cổng kiểm thử local chưa được đưa vào danh sách Access-Control-Allow-Origin hoặc server không phản hồi mã 204/200 cho HTTP OPTIONS request."
solution: "1. Trong môi trường test, cấu hình Playwright 'baseURL' hoặc dùng route handler page.route() để proxy; 2. Yêu cầu backend mở Access-Control-Allow-Origin cho nguồn test."
evidence_ref: "evidence/traces/EXEC-20260320-0033.zip"
---

# Hướng Dẫn Kỹ Thuật: Vượt Qua Rào Cản CORS Trong Test Automation

Khi gặp lỗi này:
1. Đánh dấu trạng thái Test Execution là **BLOCKED (ENVIRONMENT_PROBLEM)** chứ **KHÔNG PHẢI APPLICATION_BUG**.
2. Kiểm tra log Network HAR xem request OPTIONS có nhận được header `Access-Control-Allow-Origin: *` hoặc origin cụ thể hay không.
3. Nếu cần chạy kiểm thử độc lập mà backend chưa kịp update, sử dụng Playwright API request context thay vì browser fetch để bỏ qua ràng buộc CORS của trình duyệt.
