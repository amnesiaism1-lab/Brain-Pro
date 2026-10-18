import { IPersonalAnchor } from '@brain-exercises/shared';

const STORAGE_KEY_PERSONAL_ANCHORS = 'be_hanoi_personal_anchors';

export interface PersonalAnchorsSliceState {
  personalAnchors: IPersonalAnchor[];
  isPersonalAnchorsOpen: boolean;

  // Actions
  addPersonalAnchor: (anchor: Omit<IPersonalAnchor, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePersonalAnchor: (id: string, updates: Partial<IPersonalAnchor>) => void;
  deletePersonalAnchor: (id: string) => void;
  setIsPersonalAnchorsOpen: (open: boolean) => void;
  loadPersonalAnchors: () => void;
}

const DEFAULT_ANCHORS: IPersonalAnchor[] = [
  {
    id: 'anchor-default-home',
    label: 'home',
    customTitle: 'Nhà riêng (Ví dụ)',
    district: 'Thanh Xuân',
    nearestStreet: 'Nguyễn Trãi',
    nearestIntersection: 'Ngã Tư Sở',
    nearestCellId: 'cell-thanh-cong',
    notes: 'Gần cầu vượt Ngã Tư Sở, tiện rẽ vào Trường Chinh hoặc Đường Láng',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'anchor-default-work',
    label: 'workplace',
    customTitle: 'Công ty / Trường học (Ví dụ)',
    district: 'Cầu Giấy',
    nearestStreet: 'Duy Tân',
    nearestIntersection: 'Ngã tư Duy Tân - Phạm Hùng',
    nearestCellId: 'cell-my-dinh-nam-tu-liem',
    notes: 'Khu công nghệ Duy Tân, cổng ra trục Phạm Hùng (Vành đai 3)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const loadStoredPersonalAnchors = (): IPersonalAnchor[] => {
  if (typeof window === 'undefined') return DEFAULT_ANCHORS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_ANCHORS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PERSONAL_ANCHORS, JSON.stringify(DEFAULT_ANCHORS));
      return DEFAULT_ANCHORS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ANCHORS;
  } catch (err) {
    console.error('Failed to load personal anchors from localStorage', err);
    return DEFAULT_ANCHORS;
  }
};

export const savePersonalAnchorsToStorage = (anchors: IPersonalAnchor[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PERSONAL_ANCHORS, JSON.stringify(anchors));
  } catch (err) {
    console.error('Failed to save personal anchors to localStorage', err);
  }
};

export const createPersonalAnchorsSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
): PersonalAnchorsSliceState => ({
  personalAnchors: loadStoredPersonalAnchors(),
  isPersonalAnchorsOpen: false,

  addPersonalAnchor: (anchorData) => {
    const newAnchor: IPersonalAnchor = {
      ...anchorData,
      id: `anchor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state: any) => {
      const updated = [newAnchor, ...(state.personalAnchors || [])];
      savePersonalAnchorsToStorage(updated);
      return { personalAnchors: updated };
    });
  },

  updatePersonalAnchor: (id, updates) => {
    set((state: any) => {
      const updated = (state.personalAnchors || []).map((a: IPersonalAnchor) => 
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      );
      savePersonalAnchorsToStorage(updated);
      return { personalAnchors: updated };
    });
  },

  deletePersonalAnchor: (id) => {
    set((state: any) => {
      const updated = (state.personalAnchors || []).filter((a: IPersonalAnchor) => a.id !== id);
      savePersonalAnchorsToStorage(updated);
      return { personalAnchors: updated };
    });
  },

  setIsPersonalAnchorsOpen: (open) => {
    set(() => ({ isPersonalAnchorsOpen: open }));
  },

  loadPersonalAnchors: () => {
    const loaded = loadStoredPersonalAnchors();
    set(() => ({ personalAnchors: loaded }));
  }
});
