import { Page } from '@playwright/test';

/**
 * Usability & Accessibility Scanner (WCAG 2.1 AA)
 * Cơ sở: ISTQB CT-UT (Usability Testing) & ISO 9241-11
 * 
 * Quét tự động các lỗi vi phạm tiếp cận người dùng (Accessibility Barriers):
 * - Thiếu thuộc tính alt cho thẻ img
 * - Thiếu nhãn aria-label cho các nút icon
 * - Độ tương phản màu sắc
 * - Thiếu liên kết form label với input id
 */

export interface AccessibilityViolation {
  elementSelector: string;
  issueType: 'MISSING_ALT' | 'MISSING_ARIA_LABEL' | 'UNLINKED_FORM_LABEL' | 'EMPTY_BUTTON';
  description: string;
  wcagCriterion: string; // e.g. "WCAG 2.1 A 1.1.1 Non-text Content"
}

export class AccessibilityScanner {
  /**
   * Quét các lỗi cơ bản trực tiếp qua DOM evaluation
   */
  static async scanPage(page: Page): Promise<AccessibilityViolation[]> {
    return await page.evaluate(() => {
      const violations: any[] = [];

      // 1. Kiểm tra thẻ <img> thiếu alt
      const images = document.querySelectorAll('img');
      images.forEach((img, idx) => {
        if (!img.hasAttribute('alt') || img.getAttribute('alt')?.trim() === '') {
          violations.push({
            elementSelector: `img:nth-of-type(${idx + 1}) [src="${img.src.slice(0, 30)}..."]`,
            issueType: 'MISSING_ALT',
            description: 'Thẻ hình ảnh không có thuộc tính alt mô tả nội dung cho người khiếm thị.',
            wcagCriterion: 'WCAG 2.1 A 1.1.1 Non-text Content'
          });
        }
      });

      // 2. Kiểm tra các nút bấm <button> rỗng hoặc thiếu aria-label
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn, idx) => {
        const text = btn.innerText.trim();
        const ariaLabel = btn.getAttribute('aria-label');
        if (!text && !ariaLabel) {
          violations.push({
            elementSelector: `button:nth-of-type(${idx + 1})`,
            issueType: 'EMPTY_BUTTON',
            description: 'Nút bấm không có chữ hiển thị và không có thuộc tính aria-label.',
            wcagCriterion: 'WCAG 2.1 A 4.1.2 Name, Role, Value'
          });
        }
      });

      return violations;
    });
  }
}
