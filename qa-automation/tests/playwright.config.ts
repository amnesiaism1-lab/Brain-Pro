import { defineConfig, devices } from '@playwright/test';

/**
 * Cấu hình Playwright chuẩn mực cho Universal QA Operating System
 * Tuân thủ CTAL-TAE: Quản lý rủi ro, thu thập bằng chứng đầy đủ, cô lập bài test.
 */
export default defineConfig({
  testDir: './specs',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000 // Web-first assertion auto-retry timeout
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Hỗ trợ retry để đo lường Flakiness Index
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../reports/html-report', open: 'never' }],
    ['json', { outputFile: '../reports/execution-results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://demo.playwright.dev',
    trace: 'retain-on-failure', // Thu thập Trace file khi fail
    screenshot: 'only-on-failure', // Chụp ảnh màn hình khi fail
    video: 'retain-on-failure', // Quay video khi fail
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'Desktop WebKit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  outputDir: '../evidence/test-artifacts'
});
