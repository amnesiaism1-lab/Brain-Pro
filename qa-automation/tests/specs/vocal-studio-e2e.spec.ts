import { test, expect } from '@playwright/test';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity-ide/brain/168a50a0-f22d-44f7-8111-69405ae22f4a';

test.describe('Vocal Studio Fullscreen E2E Test Suite', () => {
  test('End-to-End: Fullscreen Studio, Demo Track Analysis, Pitch Runway, and Multi-Viewport Verification', async ({ page }) => {
    // 1. Navigate to Vocal Studio via Hash
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/#/vocal-studio');
    await page.waitForLoadState('networkidle');

    // 2. Verify Fullscreen Studio Header & Stepper
    await expect(page.getByText('Studio Luyện Hát Vocal')).toBeVisible();
    await expect(page.getByRole('button', { name: /① Phân Tích/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /② Luyện Hát/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /③ Báo Cáo/i })).toBeVisible();

    // 3. Load Demo Track (Khởi Động Đô Trưởng)
    const demoBtn = page.getByRole('button', { name: 'Khởi Động Đô Trưởng' });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // 4. Wait for analysis results
    await expect(page.getByText('Quãng Bài Hát (Song Range)')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/C3\s*–\s*G/).first()).toBeVisible();
    await expect(page.getByText('Kế Hoạch Luyện Tập Đề Xuất')).toBeVisible();

    // Take Step 1 Analysis Screenshot
    await page.screenshot({ path: `${ARTIFACT_DIR}/screenshot_step1_analysis.png` });

    // 5. Navigate to Step 2: Luyện Hát
    const goToSingBtn = page.getByRole('button', { name: /Vào Phòng Luyện Hát/i });
    await expect(goToSingBtn).toBeVisible();
    await goToSingBtn.click();

    // 6. Verify Canvas & Interactive Tools in SingAlong Tab
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify Mini-Keyboard exists
    await expect(page.getByText('Bàn phím nốt âm giai')).toBeVisible();

    // Verify Transport Controls
    await expect(page.getByRole('button', { name: /Hát Theo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tùy Chọn Hát/i })).toBeVisible();

    // Take Step 2 SingAlong Screenshot
    await page.screenshot({ path: `${ARTIFACT_DIR}/screenshot_step2_singalong.png` });

    // Test Sing Options Popover
    await page.getByRole('button', { name: /Tùy Chọn Hát/i }).click();
    await expect(page.getByText('Cài Đặt Luyện Hát')).toBeVisible();
    await expect(page.getByText('Dung sai nốt (Tuning Tolerance):')).toBeVisible();
    await expect(page.getByText('Chuẩn (±35¢)')).toBeVisible();
    await expect(page.getByText('Chuyên gia (±10¢)')).toBeVisible();

    // Take Popover Screenshot
    await page.screenshot({ path: `${ARTIFACT_DIR}/screenshot_sing_options_popover.png` });

    // Close Popover by clicking the trigger button again
    await page.getByRole('button', { name: /Tùy Chọn Hát/i }).click();

    // 7. Navigate to Step 3: Báo Cáo
    await page.getByRole('button', { name: /③ Báo Cáo/i }).click();
    await expect(page.getByText('Báo Cáo Độ Chuẩn Tông Giọng Hát')).toBeVisible();
    await expect(page.getByText('Chuẩn Tông (In-Tune)')).toBeVisible();
    await expect(page.getByText('Bị Non (Flat)')).toBeVisible();
    await expect(page.getByText('Bị Gắt (Sharp)')).toBeVisible();

    // Take Step 3 Report Screenshot
    await page.screenshot({ path: `${ARTIFACT_DIR}/screenshot_step3_report.png` });

    // 8. Viewport Verification (Mobile 375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Studio Hát')).toBeVisible();
    await page.screenshot({ path: `${ARTIFACT_DIR}/screenshot_mobile_375px.png` });
  });
});
