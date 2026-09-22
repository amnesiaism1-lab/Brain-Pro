import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage: Lớp nền tảng cho kiến trúc Page Object Model (POM)
 * Cơ sở: ISTQB CTAL-TAE (Test Adaptation Layer)
 * Tuân thủ quy tắc: Không arbitrary sleep, web-first auto-retry, semantic waiting.
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Điều hướng an toàn tới URL với networkidle hoặc domcontentloaded
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Chờ một phần tử xuất hiện một cách rõ ràng mà không dùng sleep
   */
  async waitForElement(locator: Locator, timeoutMs: number = 5000): Promise<void> {
    await expect(locator).toBeVisible({ timeout: timeoutMs });
  }

  /**
   * Điền dữ liệu an toàn (clear input trước khi điền để tránh append)
   */
  async safeFill(locator: Locator, value: string): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.fill('');
    await locator.fill(value);
  }

  /**
   * Nhấn nút và chờ một network response cụ thể hoàn tất (Chống Race Condition)
   */
  async clickAndWaitForResponse(button: Locator, urlSubstring: string, expectedStatus: number = 200): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes(urlSubstring) && resp.status() === expectedStatus
    );
    await button.click();
    await responsePromise;
  }
}
