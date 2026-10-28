import { ExerciseSlug, ICustomExercisePreset } from '@brain-exercises/shared';

export interface CustomPresetsSlice {
  customPresets: Record<string, ICustomExercisePreset[]>;
  activeCustomPresetIdBySlug: Record<string, string | null>;
  activeSessionSource: 'ladder' | 'custom';
  
  setActiveSessionSource: (source: 'ladder' | 'custom') => void;
  saveCustomPreset: (preset: ICustomExercisePreset) => void;
  deleteCustomPreset: (slug: ExerciseSlug, presetId: string) => void;
  setActiveCustomPreset: (slug: ExerciseSlug, presetId: string | null) => void;
  getActiveCustomPreset: (slug: ExerciseSlug) => ICustomExercisePreset | null;
}

const STORAGE_KEY = 'be_custom_presets_v1';
const ACTIVE_PRESETS_KEY = 'be_active_custom_preset_ids_v1';

export function loadPersistedPresets(): Record<string, ICustomExercisePreset[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load custom presets from localStorage:', e);
  }
  return {};
}

export function loadPersistedActivePresetIds(): Record<string, string | null> {
  try {
    const raw = localStorage.getItem(ACTIVE_PRESETS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load active custom preset IDs from localStorage:', e);
  }
  return {};
}

export function persistCustomPresets(presets: Record<string, ICustomExercisePreset[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to persist custom presets to localStorage:', e);
  }
}

export function persistActivePresetIds(activeIds: Record<string, string | null>): void {
  try {
    localStorage.setItem(ACTIVE_PRESETS_KEY, JSON.stringify(activeIds));
  } catch (e) {
    console.warn('Failed to persist active custom preset IDs to localStorage:', e);
  }
}
