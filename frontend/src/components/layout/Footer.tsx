import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Brain, Heart, Shield, FileText, HelpCircle, Mail, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug, setIsHowToTrainOpen, playSound } = useAppStore();

  const handleNav = (action: () => void) => {
    playSound('click');
    action();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#E8DFC8]/80 dark:bg-slate-900/90 border-t border-[#D5CBB9] dark:border-slate-800 text-slate-600 dark:text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-16 transition-colors">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand & Mission */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.png"
              alt="Brain Pro Logo"
              className="w-8 h-8 rounded-xl object-cover shadow-sm border border-cyan-500/30"
            />
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              BRAIN PRO
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Hệ sinh thái rèn luyện nhận thức, mở rộng trường nhìn ngoại biên và tăng tốc độ đọc hiểu dựa trên khoa học thần kinh hiện đại.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <span>Phát triển vì não bộ Việt</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>

        {/* Col 2: Kho Huấn Luyện & Học Viện */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Kho Rèn Luyện
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => handleNav(() => { setSelectedExerciseSlug(null); setActiveTab('exercises'); })}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              >
                33 Bài Tập Chuẩn Hóa
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav(() => { setSelectedExerciseSlug('schulte-table'); })}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              >
                Bảng Schulte Đa Cấp
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav(() => { setSelectedExerciseSlug('green-dot'); })}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              >
                Cố Định Điểm Xanh (Fixation)
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav(() => { setSelectedExerciseSlug(null); setActiveTab('learn'); })}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              >
                Học Viện Lý Thuyết Nhận Thức
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Hỗ Trợ & Phương Pháp */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Trợ Giúp & Phương Pháp
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => { playSound('click'); setIsHowToTrainOpen(true); }}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Phương Pháp Luyện Tập</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav(() => { setSelectedExerciseSlug(null); setActiveTab('wrong-history'); })}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              >
                Lịch Sử Lỗi & Lặp Ngắt Quãng
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav(() => { setSelectedExerciseSlug(null); setActiveTab('settings'); })}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              >
                Cài Đặt & Thích Ứng DDA
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav(() => { setSelectedExerciseSlug(null); setActiveTab('user'); })}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              >
                Hồ Sơ & Bản Đồ Nhận Thức
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Pháp Lý & Liên Hệ */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Pháp Lý & Liên Hệ
          </h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-1.5 text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bảo mật dữ liệu cá nhân</span>
            </li>
            <li className="flex items-center gap-1.5 text-slate-500">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Điều khoản sử dụng miễn phí</span>
            </li>
            <li className="flex items-center gap-1.5 text-slate-500">
              <Mail className="w-3.5 h-3.5 text-brand-500" />
              <a href="mailto:support@brainpro.app" className="hover:text-brand-600 transition-colors">
                support@brainpro.app
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-[#D5CBB9]/60 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-500 space-y-1">
        <p>
          Cơ sở khoa học: Walter Schulte (1962), Keith Rayner (1998), George A. Miller (1956), J.R. Stroop (1935), Martinez-Conde et al. (2004).
        </p>
        <p>© 2026 Brain Pro Lab. Bản quyền thuộc về dự án nghiên cứu tối ưu hóa nhận thức & đọc nhanh.</p>
      </div>
    </footer>
  );
};
