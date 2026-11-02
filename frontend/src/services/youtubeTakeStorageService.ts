/**
 * YouTube Take Storage Service (youtubeTakeStorageService.ts)
 * 
 * Local persistence layer using browser IndexedDB:
 * - Stores sessions (videoId, startPointSec, createdAt, bestTakeId)
 * - Stores multi-take recordings (audio Blobs, waveform peaks, nudge offsets, volumes)
 * - Individual take deletion and whole session wipe (prevents local storage bloat)
 * - Storage usage estimator
 * - Export take as standalone WAV or complete session JSON package
 */

export interface IYouTubeTake {
  id: string;
  sessionId: string;
  takeNumber: number;
  createdAt: number;
  durationSec: number;
  startPointSec: number;
  nudgeOffsetMs: number;
  volume: number; // 0.0 .. 1.5 (default: 1.0)
  isBestTake: boolean;
  audioBlob: Blob;
  waveformData: number[];
  note?: string;
}

export interface IYouTubeSession {
  id: string;
  videoId: string;
  videoTitle?: string;
  startPointSec: number;
  createdAt: number;
  updatedAt: number;
  nudgeOffsetMs: number;
  bestTakeId?: string | null;
}

const DB_NAME = 'brain_exercises_youtube_studio';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_TAKES = 'takes';

class YouTubeTakeStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB không được hỗ trợ trên trình duyệt này.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Sessions store
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const sessionsStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
          sessionsStore.createIndex('videoId', 'videoId', { unique: false });
          sessionsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Takes store
        if (!db.objectStoreNames.contains(STORE_TAKES)) {
          const takesStore = db.createObjectStore(STORE_TAKES, { keyPath: 'id' });
          takesStore.createIndex('sessionId', 'sessionId', { unique: false });
          takesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Save or update session metadata.
   */
  public async saveSession(session: IYouTubeSession): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      store.put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Fetch session by ID.
   */
  public async getSession(sessionId: string): Promise<IYouTubeSession | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.get(sessionId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Save a newly recorded vocal take.
   */
  public async saveTake(take: IYouTubeTake): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TAKES, 'readwrite');
      const store = tx.objectStore(STORE_TAKES);
      store.put(take);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get all takes associated with a session ID, ordered by takeNumber.
   */
  public async getTakesForSession(sessionId: string): Promise<IYouTubeTake[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TAKES, 'readonly');
      const store = tx.objectStore(STORE_TAKES);
      const index = store.index('sessionId');
      const req = index.getAll(sessionId);

      req.onsuccess = () => {
        const takes: IYouTubeTake[] = req.result || [];
        takes.sort((a, b) => a.takeNumber - b.takeNumber);
        resolve(takes);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Update fields of an existing take (e.g. nudgeOffsetMs, volume, isBestTake, note).
   */
  public async updateTake(
    takeId: string,
    updates: Partial<Pick<IYouTubeTake, 'nudgeOffsetMs' | 'volume' | 'isBestTake' | 'note'>>
  ): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TAKES, 'readwrite');
      const store = tx.objectStore(STORE_TAKES);
      const req = store.get(takeId);

      req.onsuccess = () => {
        const take: IYouTubeTake | undefined = req.result;
        if (!take) {
          return reject(new Error('Take không tồn tại'));
        }
        const updated = { ...take, ...updates };
        store.put(updated);
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Mark a take as the best take for a session and unmark others.
   */
  public async setBestTake(sessionId: string, takeId: string): Promise<void> {
    const takes = await this.getTakesForSession(sessionId);
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TAKES, STORE_SESSIONS], 'readwrite');
      const takesStore = tx.objectStore(STORE_TAKES);
      const sessionStore = tx.objectStore(STORE_SESSIONS);

      // Update takes
      for (const t of takes) {
        const isBest = t.id === takeId;
        if (t.isBestTake !== isBest) {
          t.isBestTake = isBest;
          takesStore.put(t);
        }
      }

      // Update session pointer
      const sessionReq = sessionStore.get(sessionId);
      sessionReq.onsuccess = () => {
        const sess = sessionReq.result;
        if (sess) {
          sess.bestTakeId = takeId;
          sess.updatedAt = Date.now();
          sessionStore.put(sess);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete an individual take and free up IndexedDB memory.
   */
  public async deleteTake(takeId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TAKES, 'readwrite');
      const store = tx.objectStore(STORE_TAKES);
      store.delete(takeId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete entire session and all of its audio takes.
   */
  public async deleteSession(sessionId: string): Promise<void> {
    const takes = await this.getTakesForSession(sessionId);
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SESSIONS, STORE_TAKES], 'readwrite');
      const sessionStore = tx.objectStore(STORE_SESSIONS);
      const takesStore = tx.objectStore(STORE_TAKES);

      sessionStore.delete(sessionId);
      for (const take of takes) {
        takesStore.delete(take.id);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Estimates currently used storage in MB.
   */
  public async getStorageUsageEstimate(): Promise<{ usedMb: number; quotaMb: number } | null> {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMb = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
        const quotaMb = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
        return { usedMb: parseFloat(usedMb), quotaMb: parseFloat(quotaMb) };
      } catch (e) {
        console.warn('Storage estimate error:', e);
      }
    }
    return null;
  }

  /**
   * Triggers a browser download of the solo vocal take as a WAV file.
   */
  public downloadVocalTake(take: IYouTubeTake, fileNamePrefix = 'vocal-take'): void {
    const url = URL.createObjectURL(take.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNamePrefix}-${take.takeNumber}-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /**
   * Exports session metadata JSON (offsets, take notes, settings).
   */
  public exportSessionPackage(session: IYouTubeSession, takes: IYouTubeTake[]): void {
    const metadata = {
      app: 'Brain-Exercises Vocal Studio (YouTube Beat Mix)',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      session: {
        id: session.id,
        videoId: session.videoId,
        videoTitle: session.videoTitle,
        startPointSec: session.startPointSec,
        nudgeOffsetMs: session.nudgeOffsetMs,
      },
      takes: takes.map((t) => ({
        takeNumber: t.takeNumber,
        durationSec: t.durationSec,
        startPointSec: t.startPointSec,
        nudgeOffsetMs: t.nudgeOffsetMs,
        volume: t.volume,
        isBestTake: t.isBestTake,
        note: t.note,
      })),
      notes: 'Due to YouTube CORS restrictions, beat audio is not bundled. Use the Video ID to align in your DAW.',
    };

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-session-${session.videoId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export const youtubeTakeStorageService = new YouTubeTakeStorageService();
