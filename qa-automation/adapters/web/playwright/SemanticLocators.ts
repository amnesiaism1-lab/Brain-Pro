import { Page, Locator } from '@playwright/test';

/**
 * Semantic Locators Factory: Tạo các locator bền vững theo thứ tự ưu tiên
 * 1. Role -> 2. Label -> 3. Placeholder -> 4. TestId -> 5. Text
 */
export class SemanticLocators {
  static button(page: Page, name: string | RegExp): Locator {
    return page.getByRole('button', { name });
  }

  static inputByLabel(page: Page, label: string | RegExp): Locator {
    return page.getByLabel(label);
  }

  static inputByPlaceholder(page: Page, placeholder: string | RegExp): Locator {
    return page.getByPlaceholder(placeholder);
  }

  static heading(page: Page, name: string | RegExp, level?: 1 | 2 | 3 | 4 | 5 | 6): Locator {
    return page.getByRole('heading', { name, level });
  }

  static testId(page: Page, testId: string): Locator {
    return page.getByTestId(testId);
  }

  static dialog(page: Page, name?: string | RegExp): Locator {
    return page.getByRole('dialog', name ? { name } : undefined);
  }
}
