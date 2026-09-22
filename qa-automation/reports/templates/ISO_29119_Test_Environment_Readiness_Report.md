# [TERR] Báo Cáo Mức Độ Sẵn Sàng Của Môi Trường Kiểm Thử (Test Environment Readiness Report)

> **Cơ sở tiêu chuẩn**: ISO/IEC/IEEE 29119-3 Clause 7.8  
> **Mục tiêu**: Đảm bảo hạ tầng, server, mạng, cấu hình bảo mật và trình duyệt đã đạt điều kiện trước khi thực thi kiểm thử.

---

## 1. Thông Tin Môi Trường
- **Report ID**: TERR-{{DATE}}-{{RUN_ID}}
- **Target Name**: {{TARGET_APPLICATION}}
- **Môi trường**: {{ENVIRONMENT}} (Local / Staging / UAT)
- **Base URL**: {{BASE_URL}}
- **Trạng thái sẵn sàng**: `[ ] SẴN SÀNG (READY)` / `[ ] CHƯA SẴN SÀNG (NOT READY)`

---

## 2. Danh Mục Kiểm Tra Hạ Tầng (Infrastructure Health Check)

| Thành Phần Hạ Tầng | Điểm Kiểm Tra | Kỳ Vọng | Thực Tế | Sẵn Sàng? |
| :--- | :--- | :---: | :---: | :---: |
| **Web Server** | `GET /health` | HTTP 200 OK | HTTP 200 (12ms) | [x] READY |
| **API Gateway** | `GET /api/v1/status` | HTTP 200 OK | HTTP 200 (25ms) | [x] READY |
| **Database Pool** | DB Connection | Active Connections > 5 | 10 Active | [x] READY |
| **Redis Cache** | Session Storage | PONG | PONG (2ms) | [x] READY |
| **SSL / TLS Certificate**| HTTPS Certificate | Valid (> 30 days) | Valid (180 days) | [x] READY |
| **CORS Policy** | Preflight OPTIONS | Allow Origin: Target | Allowed | [x] READY |

---

## 3. Cấu Hình Trình Duyệt Kiểm Thử (Browser Capabilities)
- **Engine**: Chromium 128.0.8010.12 / Firefox / WebKit
- **Headless Mode**: Enabled (Hỗ trợ quay video & chụp ảnh trace)
- **Viewport**: 1280x720 / 1440x900
