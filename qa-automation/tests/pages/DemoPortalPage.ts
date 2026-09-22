import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../adapters/web/playwright/BasePage';

/**
 * DemoPortalPage: Page Object Model mẫu minh họa cho kiến trúc Universal Adapter
 * Tuân thủ quy tắc: Semantic locators, no arbitrary sleep, multi-layer verification
 */
export class DemoPortalPage extends BasePage {
  readonly searchInput: Locator;
  readonly getStartedLink: Locator;
  readonly mainHeading: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('button', { name: 'Search' });
    this.getStartedLink = page.getByRole('link', { name: 'Get started' });
    this.mainHeading = page.getByRole('heading', { level: 1 });
    this.navigationMenu = page.getByRole('navigation');
  }

  async navigateToHome(): Promise<void> {
    await this.navigateTo('https://playwright.dev/');
  }

  async clickGetStarted(): Promise<void> {
    await this.waitForElement(this.getStartedLink);
    await this.getStartedLink.click();
  }

  /**
   * Thẩm định tầng Oracle: Kiểm tra sự chuyển dịch trạng thái trang
   */
  async verifyInstallationPageLoaded(): Promise<void> {
    // 1. Navigation Check
    await expect(this.page).toHaveURL(/.*intro/);
    
    // 2. Semantic Heading Check
    await expect(this.page.getByRole('heading', { name: 'Installation', level: 1 })).toBeVisible();
    
    // 3. Data Integrity Check (Có code block hướng dẫn cài đặt)
    await expect(this.page.locator('pre').first()).toBeVisible();
  }
}
