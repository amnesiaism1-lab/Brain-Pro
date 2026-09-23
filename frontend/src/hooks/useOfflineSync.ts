import { useEffect, useState, useCallback } from 'react';
import { IGameAttemptRequest } from '@brain-exercises/shared';

const STORAGE_KEY = 'be_offline_attempts_buffer';

export interface BufferedAttempt {
  id: string;
  attempt: IGameAttemptRequest;
  queuedAt: string;
  retryCount: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Load buffered attempts from local storage
  const getBufferedAttempts = useCallback((): BufferedAttempt[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  // Update pending count state
  const refreshPendingCount = useCallback(() => {
    const list = getBufferedAttempts();
    setPendingCount(list.length);
  }, [getBufferedAttempts]);

  // Buffer an attempt for later sync
  const bufferAttempt = useCallback((attempt: IGameAttemptRequest) => {
    try {
      const current = getBufferedAttempts();
      const buffered: BufferedAttempt = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        attempt,
        queuedAt: new Date().toISOString(),
        retryCount: 0
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, buffered]));
      setPendingCount(current.length + 1);
      console.log('Buffered attempt locally for offline sync:', buffered.id);
    } catch (err) {
      console.error('Failed to buffer attempt locally:', err);
    }
  }, [getBufferedAttempts]);

  // Flush buffer to backend
  const flushPendingAttempts = useCallback(async () => {
    if (!navigator.onLine) return;
    const current = getBufferedAttempts();
    if (current.length === 0) return;

    console.log(`Syncing ${current.length} offline attempts with backend...`);
    const remaining: BufferedAttempt[] = [];

    for (const item of current) {
      try {
        const response = await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.attempt)
        });

        if (!response.ok) {
          throw new Error(`Sync attempt failed with HTTP status ${response.status}`);
        }
        console.log(`Successfully synced offline attempt: ${item.id}`);
      } catch (err) {
        console.warn(`Failed to sync attempt ${item.id}, retaining in queue:`, err);
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      setPendingCount(remaining.length);
    } catch (e) {
      console.error('Failed to update buffered attempts:', e);
    }
  }, [getBufferedAttempts]);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      flushPendingAttempts();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (navigator.onLine) {
      flushPendingAttempts();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushPendingAttempts, refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    bufferAttempt,
    flushPendingAttempts
  };
}
