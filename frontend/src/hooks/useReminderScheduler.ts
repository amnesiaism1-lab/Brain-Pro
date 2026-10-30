import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useReminderScheduler() {
  const reminders = useAppStore(s => s.reminders);
  const playSound = useAppStore(s => s.playSound);
  const lastFiredMinuteRef = useRef<string>('');
  const [activeAlert, setActiveAlert] = useState<{ label: string; time: string } | null>(null);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentHm = `${hours}:${minutes}`;
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...

      if (lastFiredMinuteRef.current === currentHm) return;

      const matchingReminder = reminders.find(rem => {
        if (!rem.isEnabled) return false;
        if (rem.reminderTime !== currentHm) return false;
        if (rem.daysOfWeek && rem.daysOfWeek.length > 0 && !rem.daysOfWeek.includes(dayOfWeek)) {
          return false;
        }
        return true;
      });

      if (matchingReminder) {
        lastFiredMinuteRef.current = currentHm;
        playSound('correct');
        setActiveAlert({
          label: matchingReminder.label || 'Đã đến giờ rèn luyện nhận thức!',
          time: currentHm
        });

        // Trigger native browser notification if granted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Brain Pro - Giờ Luyện Não!', {
              body: matchingReminder.label || 'Hãy dành 10-15 phút rèn luyện nhận thức hôm nay.',
              icon: '/favicon.png'
            });
          } catch {}
        }
      }
    };

    const interval = setInterval(checkReminders, 15000);
    checkReminders();

    return () => clearInterval(interval);
  }, [reminders, playSound]);

  return { activeAlert, dismissAlert: () => setActiveAlert(null) };
}
