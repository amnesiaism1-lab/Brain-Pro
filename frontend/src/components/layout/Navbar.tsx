import React from 'react';
import { Home, Brain, BookOpen, Settings, User, Cloud, LogIn, LogOut } from 'lucide-react';
import { useAppStore, MainNavTab } from '../../store/useAppStore';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    activeGameSlug, 
    playSound,
    authUser,
    setIsAuthModalOpen,
    logout
  } = useAppStore();

  // Hide bottom nav while game is actively playing to maximize focus & screen area
  if (activeGameSlug) {
    return null;
  }

  const navItems: Array<{ id: MainNavTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" />
    },
    {
      id: 'exercises',
      label: 'Bài tập',
      icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
    },
    {
      id: 'learn',
      label: 'Lý thuyết',
      icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
    },
    {
      id: 'user',
      label: authUser ? 'Hồ sơ' : 'User',
      icon: authUser?.avatarUrl ? (
        <img 
          src={authUser.avatarUrl} 
          alt={authUser.username}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ring-1 ring-brand-500" 
        />
      ) : (
        <User className="w-5 h-5 sm:w-6 sm:h-6" />
      )
    }
  ];

  const handleSelect = (tab: MainNavTab) => {
    playSound('click');
    setActiveTab(tab);
  };

  return (
    <>
      {/* Mobile & Tablet Fixed Bottom Navigation Bar */}
      <nav 
        id="app-bottom-nav" 
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#ECE5D8] dark:bg-slate-900 border-t border-[#D5CBB9] dark:border-slate-800 shadow-lg md:hidden"
      >
        <div className="grid grid-cols-5 max-w-lg mx-auto py-1 px-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 transition-all duration-150 btn-press ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-semibold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-brand-100/70 dark:bg-brand-900/40' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Left Floating Navigation Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-[#F5EFE6] dark:bg-slate-900 border-r border-[#D5CBB9] dark:border-slate-800 flex-col z-40 p-4 shadow-sm">
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-[#D5CBB9]/60 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Brain className="w-6 h-6 animate-pulse-fast" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight leading-none">
              BRAIN PRO
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Luyện Não & Đọc Nhanh</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 btn-press ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Account Card at Bottom of Desktop Sidebar */}
        {authUser ? (
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-[#D5CBB9]/50 dark:border-slate-700/50 flex items-center justify-between gap-2.5">
            <div 
              onClick={() => handleSelect('user')}
              className="flex items-center gap-2.5 cursor-pointer flex-1 truncate group"
            >
              {authUser.avatarUrl ? (
                <img 
                  src={authUser.avatarUrl} 
                  alt={authUser.username}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500 shrink-0" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {authUser.username[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="truncate text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-brand-600 transition-colors">
                  {authUser.username}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase Cloud
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-amber-50 dark:from-slate-800 dark:to-slate-850 border border-brand-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300">
              <Cloud className="w-4 h-4" />
              <span>Đồng Bộ Đám Mây</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Đăng nhập Google để lưu điểm và đồng bộ đa thiết bị.
            </p>
            <button
              onClick={() => {
                playSound('click');
                setIsAuthModalOpen(true);
              }}
              className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm btn-press"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập Google</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
