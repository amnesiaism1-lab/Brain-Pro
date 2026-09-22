import { test, expect } from '../fixtures/execution-fixture';
import { DemoPortalPage } from '../pages/DemoPortalPage';

/**
 * STEP 1: VÒNG LẶP NGUYÊN TỬ (THE ATOMIC TEST LOOP)
 * Mục tiêu: Chứng minh pipeline cơ sở hoạt động chắc chắn:
 * 1 Test Case -> 1 Browser Execution -> 1 Evidence Bundle -> 1 Execution Record
 * 
 * Traceability: REQ-DEMO-01 -> COND-DEMO-001 -> TC-ATOMIC-001
 */

test.describe('Vòng Lặp Nguyên Tử: Điều Hướng & Xác Minh Tài Liệu Khởi Tạo', () => {

  test('TC-ATOMIC-001 : Người dùng có thể điều hướng từ Trang Chủ tới Trang Hướng Dẫn Cài Đặt', async ({ page, executionRecord }) => {
    // 1. Khởi tạo Page Object Model
    const portal = new DemoPortalPage(page);

    // 2. Thực hiện hành động: Điều hướng tới Trang Chủ
    await portal.navigateToHome();

    // 3. Khẳng định Lớp 1 (Heading chính xác & Semantic role)
    await expect(portal.mainHeading).toContainText('Playwright');

    // 4. Thực hiện hành động: Nhấn nút Get Started
    await portal.clickGetStarted();

    // 5. Khẳng định Lớp 2 & Lớp 3 (Test Oracle: Trang Installation hiển thị đầy đủ tiêu đề và nội dung)
    await portal.verifyInstallationPageLoaded();

    // Ghi nhận Oracle đánh giá thành công vào Execution Record
    executionRecord.oracleEvaluations.push({
      oracleId: 'ORACLE-DOC-NAV-01',
      isSatisfied: true,
      explanation: 'Trang Installation đã load thành công với đầy đủ mã lệnh cài đặt và tiêu đề chuẩn.'
    });
  });

});
