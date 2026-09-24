import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/layout/Header';
import { Navbar } from './components/layout/Navbar';
import { HomeView } from './components/home/HomeView';
import { ExercisesListView } from './components/exercises/ExercisesListView';
import { ExerciseDetailModal } from './components/exercises/ExerciseDetailModal';
import { ActiveGameContainer } from './components/games/ActiveGameContainer';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { HowToTrainModal } from './components/modals/HowToTrainModal';
import { RemindersModal } from './components/modals/RemindersModal';
import { AuthModal } from './components/auth/AuthModal';
import { RelationDebriefModal } from './components/cognition/RelationDebriefModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useOfflineSync } from './hooks/useOfflineSync';

import { MusicTheoryView } from './components/learn/MusicTheoryView';

export const App: React.FC = () => {
  const { 
    activeTab, 
    selectedExerciseSlug, 
    activeGameSlug, 
    darkMode,
    activeDebriefEvents,
    setActiveDebriefEvents
  } = useAppStore();
  useOfflineSync();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const renderCurrentView = () => {
    if (activeGameSlug) {
      return <ActiveGameContainer />;
    }
    if (selectedExerciseSlug) {
      return <ExerciseDetailModal />;
    }
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'exercises':
        return <ExercisesListView />;
      case 'learn':
        return <MusicTheoryView />;
      case 'settings':
        return <SettingsView />;
      case 'user':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-[#ECE5D8] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col ${!activeGameSlug ? 'md:pl-64' : ''} transition-colors duration-200`}>
        <Header />
        <main className="flex-1 w-full">
          {renderCurrentView()}
        </main>
        <Navbar />

        {/* Global Modals */}
        <HowToTrainModal />
        <RemindersModal />
        <AuthModal />
        {activeDebriefEvents && activeDebriefEvents.length > 0 && (
          <RelationDebriefModal
            events={activeDebriefEvents}
            onClose={() => setActiveDebriefEvents(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
