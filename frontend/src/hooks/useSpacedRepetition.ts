import { useCallback } from 'react';
import { calculateNextReviewDate } from '@brain-exercises/shared';

/**
 * Hook quản lý thuật toán Lặp Lại Cách Quãng (SM-2 Spaced Repetition System)
 * 
 * Quality:
 *  0: Hoàn toàn sai hoặc không nhận biết được gì
 *  1: Sai nhưng nhận ra khi nghe lại đáp án
 *  2: Sai nhưng nhớ mang máng
 *  3: Đúng nhưng do dự hoặc mất nhiều thời gian (>4s)
 *  4: Đúng sau chút cân nhắc ngắn
 *  5: Nhận diện phản xạ tức thì hoàn hảo (<1.5s)
 */
export function useSpacedRepetition() {
  const evaluateReview = useCallback((
    currentEF: number = 2.5,
    reviewCount: number = 0,
    quality: 0 | 1 | 2 | 3 | 4 | 5 = 4
  ) => {
    return calculateNextReviewDate(currentEF, reviewCount, quality);
  }, []);

  return { evaluateReview };
}
