import React, { useState } from 'react';
import { X, Bell, Clock, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const RemindersModal: React.FC = () => {
  const { isRemindersOpen, setIsRemindersOpen, reminders, addReminder, toggleReminder, playSound } = useAppStore();
  const [time, setTime] = useState('08:00');
  const [label, setLabel] = useState('Luyện não 15 phút mỗi ngày');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isRemindersOpen) return null;

  const handleClose = () => {
    playSound('click');
    setIsRemindersOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('correct');
    addReminder({
      id: `rem-${Date.now()}`,
      reminderTime: time,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      isEnabled: true,
      label
    });
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsRemindersOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-brand-600 text-white">
          <div className="flex items-center gap-2.5">
            <Bell className="w-6 h-6" />
            <h2 className="text-lg font-bold">Cài đặt Nhắc nhở</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Existing Reminders List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch nhắc hiện tại</h3>
            {reminders.map((rem) => (
              <div 
                key={rem.id} 
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 flex items-center justify-center font-bold text-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold text-slate-800 dark:text-white">{rem.reminderTime}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{rem.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playSound('click');
                    toggleReminder(rem.id);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    rem.isEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      rem.isEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Reminder Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Thêm giờ nhắc mới</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Khung giờ tập</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Lời nhắc</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nhập ghi chú..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 btn-press"
            >
              {isSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Đã lưu lịch nhắc!
                </>
              ) : (
                'Lưu thông báo'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
