import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  X, Sparkles, Cloud, ShieldCheck, Zap, ArrowRight, 
  LogIn, UserPlus, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '28140765256-fv97mp8c2f0u3pd030r5t8hmbathmjtf.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    loginWithGoogle, 
    loginGuestFallback,
    isSyncing,
    darkMode,
    playSound 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'google' | 'demo'>('google');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoName, setDemoName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Initialize and render Google Identity Services Button
  useEffect(() => {
    if (!isAuthModalOpen) return;
    setAuthError(null);

    const initGoogleGsi = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response.credential) {
                const success = await loginWithGoogle(response.credential);
                if (!success) {
                  setAuthError('Không thể xác thực tài khoản Google với máy chủ. Vui lòng thử lại!');
                }
              }
            },
            auto_select: false
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: darkMode ? 'filled_black' : 'outline',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'continue_with',
              logo_alignment: 'left',
              width: 320
            });
          }
        } catch (e) {
          console.warn('Google GSI initialization error:', e);
        }
      }
    };

    // If script already loaded
    if (window.google?.accounts?.id) {
      initGoogleGsi();
    } else {
      // Poll briefly for script
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGoogleGsi();
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [isAuthModalOpen, darkMode, loginWithGoogle]);

  if (!isAuthModalOpen) return null;

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    await loginGuestFallback(demoEmail, demoName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-[#FDFBF7] dark:bg-slate-900 border-2 border-brand-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-500/10 dark:bg-brand-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Header Close */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Đăng Nhập Brain Pro
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Đồng bộ đám mây Supabase PostgreSQL
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click');
              setIsAuthModalOpen(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold relative z-10">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('google');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'google'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Tài Khoản Google</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('demo');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'demo'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Tạo Tài Khoản Demo</span>
          </button>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{authError}</span>
          </div>
        )}

        {activeTab === 'google' ? (
          <div className="space-y-4 relative z-10">
            {/* Google GSI Native Button Container */}
            <div className="flex flex-col items-center justify-center min-h-[50px] py-1">
              <div ref={googleBtnContainerRef} className="flex justify-center" />
              
              {isSyncing && (
                <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang kết nối Supabase và đồng bộ dữ liệu...</span>
                </div>
              )}
            </div>

            {/* Cloud Features Bullet List */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Tự động gộp điểm:</strong> Toàn bộ điểm XP, Cấp độ và chuỗi Streak bạn đã chơi sẽ được bảo toàn vĩnh viễn.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Đồng bộ đa thiết bị:</strong> Tiếp tục rèn luyện não bộ liền mạch giữa điện thoại, máy tính bảng và PC.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Bảo mật cao cấp:</strong> Xác thực trực tiếp qua Google OAuth 2.0 & Supabase Auth.</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-3.5 relative z-10">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tên hiển thị / Nickname
              </label>
              <input
                type="text"
                required
                placeholder="VD: Tuấn Phan"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Địa chỉ Email
              </label>
              <input
                type="email"
                required
                placeholder="tuan@gmail.com"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all active:scale-95 btn-press"
            >
              <LogIn className="w-4 h-4" />
              <span>Vào Chơi & Lưu Hồ Sơ</span>
            </button>
          </form>
        )}

        {/* Footer Guest Mode Note */}
        <div className="pt-2 text-center border-t border-slate-200 dark:border-slate-800/80">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Chưa muốn đăng nhập? Bạn có thể đóng cửa sổ này và tiếp tục luyện tập tự do ở <strong>chế độ Khách</strong> mà không bị giới hạn bài tập.
          </p>
        </div>
      </div>
    </div>
  );
};
