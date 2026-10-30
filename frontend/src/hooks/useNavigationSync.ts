import { useEffect, useRef } from 'react';
import { useAppStore, MainNavTab } from '../store/useAppStore';
import { useVocalStudioStore } from '../store/vocalStudioStore';
import { EXERCISES_METADATA, ExerciseSlug } from '@brain-exercises/shared';

const VALID_TABS: MainNavTab[] = ['home', 'exercises', 'learn', 'wrong-history', 'settings', 'user'];
const VALID_SLUGS = new Set<string>(EXERCISES_METADATA.map((e) => e.slug));

export function useNavigationSync() {
  const {
    activeTab,
    setActiveTab,
    selectedExerciseSlug,
    setSelectedExerciseSlug,
    activeGameSlug,
    setActiveGameSlug,
    activeTheoryModuleId,
    setActiveTheoryModuleId
  } = useAppStore();

  const isVocalStudioOpen = useVocalStudioStore((s) => s.isOpen);
  const openVocalStudio = useVocalStudioStore((s) => s.openStudio);
  const closeVocalStudio = useVocalStudioStore((s) => s.closeStudio);

  // Flag to avoid cyclic loops between popstate/hashchange and store updates
  const isHandlingHashChangeRef = useRef(false);
  const isInitializedRef = useRef(false);

  // 1. Parse Hash and update Zustand Store accordingly
  const syncStoreFromHash = (hashStr: string) => {
    isHandlingHashChangeRef.current = true;
    try {
      const cleanHash = hashStr.replace(/^#\/?/, '').trim();
      const parts = cleanHash.split('/').filter(Boolean);

      // Default: empty hash => home
      if (parts.length === 0 || parts[0] === 'home') {
        if (isVocalStudioOpen) closeVocalStudio();
        setActiveGameSlug(null);
        setSelectedExerciseSlug(null);
        setActiveTab('home');
        return;
      }

      const root = parts[0];

      // Route: #/vocal-studio
      if (root === 'vocal-studio') {
        if (!isVocalStudioOpen) openVocalStudio();
        return;
      }

      // If vocal studio was open but hash changed away from it, close it
      if (isVocalStudioOpen) {
        closeVocalStudio();
      }

      // Route: #/game/:slug
      if (root === 'game' && parts[1] && VALID_SLUGS.has(parts[1])) {
        const slug = parts[1] as ExerciseSlug;
        setActiveTab('exercises');
        setSelectedExerciseSlug(slug);
        setActiveGameSlug(slug);
        return;
      }

      // Route: #/exercises/:slug
      if (root === 'exercises' && parts[1] && VALID_SLUGS.has(parts[1])) {
        const slug = parts[1] as ExerciseSlug;
        setActiveTab('exercises');
        setSelectedExerciseSlug(slug);
        setActiveGameSlug(null);
        return;
      }

      // Route: #/exercises
      if (root === 'exercises') {
        setActiveTab('exercises');
        setSelectedExerciseSlug(null);
        setActiveGameSlug(null);
        return;
      }

      // Route: #/learn/:moduleId
      if (root === 'learn') {
        setActiveTab('learn');
        setSelectedExerciseSlug(null);
        setActiveGameSlug(null);
        if (parts[1]) {
          setActiveTheoryModuleId(parts[1]);
        }
        return;
      }

      // Route alias: #/theory or #/academy -> #/learn
      if (root === 'theory' || root === 'academy') {
        setActiveTab('learn');
        setSelectedExerciseSlug(null);
        setActiveGameSlug(null);
        if (parts[1]) {
          setActiveTheoryModuleId(parts[1]);
        }
        window.history.replaceState(null, '', `#/learn${parts[1] ? `/${parts[1]}` : ''}`);
        return;
      }

      // Route: other main tabs (wrong-history, settings, user)
      if (VALID_TABS.includes(root as MainNavTab)) {
        setActiveTab(root as MainNavTab);
        setSelectedExerciseSlug(null);
        setActiveGameSlug(null);
        return;
      }

      // Fallback for unrecognized routes: explicitly update URL hash to #/home
      setActiveTab('home');
      setSelectedExerciseSlug(null);
      setActiveGameSlug(null);
      window.history.replaceState(null, '', '#/home');
    } finally {
      setTimeout(() => {
        isHandlingHashChangeRef.current = false;
      }, 20);
    }
  };

  // 2. Compute expected hash based on current Zustand Store
  const computeExpectedHash = (): string => {
    if (isVocalStudioOpen) {
      return '#/vocal-studio';
    }
    if (activeGameSlug) {
      return `#/game/${activeGameSlug}`;
    }
    if (selectedExerciseSlug) {
      return `#/exercises/${selectedExerciseSlug}`;
    }
    if (activeTab === 'learn' && activeTheoryModuleId) {
      return `#/learn/${activeTheoryModuleId}`;
    }
    if (activeTab === 'home') {
      return '#/home';
    }
    return `#/${activeTab}`;
  };

  // 3. Listen to browser Back/Forward (popstate / hashchange)
  useEffect(() => {
    const handlePopState = () => {
      syncStoreFromHash(window.location.hash);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Initial mount sync: if hash is present, hydrate store from hash; otherwise set default hash
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#/') {
        syncStoreFromHash(window.location.hash);
      } else {
        window.history.replaceState(null, '', '#/home');
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // 4. Update window.location.hash when Zustand store state changes
  useEffect(() => {
    if (isHandlingHashChangeRef.current) return;

    const expectedHash = computeExpectedHash();
    const currentHash = window.location.hash || '#/home';

    if (currentHash !== expectedHash) {
      // Determine whether to push or replace state
      // Push state if switching major contexts so Back button feels completely natural
      const isInitialOrTrivial = currentHash === '#' || currentHash === '#/' || currentHash === '';
      if (isInitialOrTrivial) {
        window.history.replaceState(null, '', expectedHash);
      } else {
        window.history.pushState(null, '', expectedHash);
      }
    }
  }, [
    activeTab,
    selectedExerciseSlug,
    activeGameSlug,
    activeTheoryModuleId,
    isVocalStudioOpen
  ]);
}

