import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/layout/Header';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
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
import { WrongAnswerHistoryView } from './components/wrong-answers/WrongAnswerHistoryView';
import { VocalStudio } from './components/vocal-studio/VocalStudio';
import { useVocalStudioStore } from './store/vocalStudioStore';
import { useNavigationSync } from './hooks/useNavigationSync';
import { useReminderScheduler } from './hooks/useReminderScheduler';

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
  useNavigationSync();
  const { activeAlert, dismissAlert } = useReminderScheduler();

  const isVocalStudioOpen = useVocalStudioStore((s) => s.isOpen);
  const closeVocalStudio = useVocalStudioStore((s) => s.closeStudio);

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
      case 'wrong-history':
        return <WrongAnswerHistoryView />;
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
      <div className={`min-h-screen bg-[#ECE5D8] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col ${!activeGameSlug && !isVocalStudioOpen ? 'md:pl-64' : ''} transition-colors duration-200`}>
        {!isVocalStudioOpen && (
          <>
            <Header />
            <main className="flex-1 w-full">
              {renderCurrentView()}
            </main>
            {(!activeGameSlug && !selectedExerciseSlug) && <Footer />}
            <Navbar />
          </>
        )}

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

        {/* Global Fullscreen Vocal Studio */}
        <VocalStudio
          isOpen={isVocalStudioOpen}
          onClose={closeVocalStudio}
        />

        {/* Real-time In-App Reminder Toast */}
        {activeAlert && (
          <div className="fixed top-20 right-4 z-50 max-w-sm p-4 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-2xl shadow-2xl border border-white/20 animate-scale-up flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200 font-bold block">
                🔔 Nhắc nhở rèn luyện ({activeAlert.time})
              </span>
              <p className="text-xs font-bold text-white mt-0.5">{activeAlert.label}</p>
            </div>
            <button
              onClick={dismissAlert}
              className="text-white/70 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
