import { FailureCategory } from './ExecutionRecord';

/**
 * Failure Classifier: Phân loại thất bại tự động theo cây quyết định QA
 */
export class FailureClassifier {
  static classify(errorMessage: string, httpStatus?: number, retryPasses: boolean = false): FailureCategory {
    const msg = errorMessage.toLowerCase();

    // 1. Kiểm tra sự cố môi trường
    if (httpStatus && [502, 503, 504].includes(httpStatus)) {
      return 'ENVIRONMENT_PROBLEM';
    }
    if (msg.includes('econnrefused') || msg.includes('etimedout') || msg.includes('cors policy')) {
      return 'ENVIRONMENT_PROBLEM';
    }

    // 2. Kiểm tra sự cố dữ liệu kiểm thử
    if (msg.includes('user is locked') || msg.includes('insufficient funds') || msg.includes('duplicate key')) {
      return 'TEST_DATA_PROBLEM';
    }

    // 3. Kiểm tra tính chập chờn (Flakiness)
    if (retryPasses) {
      return 'FLAKY_RACE_CONDITION';
    }
    if (msg.includes('animation') || msg.includes('element is not clickable at point') || msg.includes('detached from the dom')) {
      return 'FLAKY_RACE_CONDITION';
    }

    // 4. Kiểm tra lỗi mã kịch bản tự động hóa
    if (msg.includes('waiting for locator') || msg.includes('timeouterror: locator.')) {
      return 'AUTOMATION_SCRIPT_BUG';
    }

    // 5. Mặc định nếu không phải các lỗi trên -> Nghi vấn lỗi sản phẩm (Application Bug)
    if (msg.includes('expected') && msg.includes('received')) {
      return 'APPLICATION_BUG';
    }

    return 'UNCLASSIFIED';
  }
}
