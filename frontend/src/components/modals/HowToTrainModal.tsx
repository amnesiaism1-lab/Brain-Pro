import React from 'react';
import { X, BookOpen, Eye, Zap, Target, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const HowToTrainModal: React.FC = () => {
  const { isHowToTrainOpen, setIsHowToTrainOpen, playSound } = useAppStore();

  if (!isHowToTrainOpen) return null;

  const handleClose = () => {
    playSound('click');
    setIsHowToTrainOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-brand-600 text-white">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6" />
            <h2 className="text-lg font-bold">Luyện tập như thế nào?</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 dark:text-slate-300">
          <div className="bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 rounded-2xl p-4">
            <h3 className="font-bold text-brand-800 dark:text-brand-300 flex items-center gap-2 mb-1.5">
              <Zap className="w-5 h-5 text-brand-600" />
              1. Khử Thói Quen Đọc Thầm (Subvocalization)
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Đọc thầm là thói quen phát âm từng từ trong cổ họng hoặc tâm trí. Mắt bạn có thể thu nhận 800+ từ/phút nhưng phát âm chỉ đạt 200 từ/phút. Bằng cách dùng kỹ thuật <strong>Chữ Chạy (RSVP)</strong> và <strong>Chuỗi từ</strong>, não bạn sẽ chuyển thẳng từ hình ảnh chữ sang ý niệm mà không cần phát âm.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-4">
            <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-1.5">
              <Eye className="w-5 h-5 text-amber-600" />
              2. Mở Rộng Thị Giác Ngoại Vi
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Thực hành với <strong>Bảng Schulte</strong> và <strong>Tầm Nhìn</strong>: Giữ nguyên mắt tại tâm màn hình, tuyệt đối không đảo con ngươi sang hai bên. Hãy thả lỏng và để vùng nhìn ngoại vi bao quát toàn bộ ma trận số.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-1.5">
              <Target className="w-5 h-5 text-emerald-600" />
              3. Giảm Bước Nhảy Mắt (Fixations)
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Người đọc thông thường dừng mắt 6-8 lần trên mỗi dòng sách. Người đọc nhanh chỉ dừng 2 lần (đầu dòng và cuối dòng) và hấp thụ trọn vẹn cụm 3-4 từ cùng một lúc.
            </p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Lịch Trình Khuyến Nghị</h4>
            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <span><strong>Buổi sáng:</strong> Gói 5 phút (Khởi động trí nhớ & phản xạ).</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <span><strong>Buổi chiều/tối:</strong> Gói 15-30 phút (Mở rộng góc nhìn & Đọc bài báo mẫu).</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            onClick={handleClose}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-md btn-press"
          >
            Đã hiểu, sẵn sàng luyện tập!
          </button>
        </div>
      </div>
    </div>
  );
};
