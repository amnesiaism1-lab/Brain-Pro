import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SchulteTableGame } from './SchulteTableGame';
import { AnagramGame } from './AnagramGame';
import { FindLetterGame } from './FindLetterGame';
import { FindNumberGame } from './FindNumberGame';
import { EvenOddGame } from './EvenOddGame';
import { DigitSpanGame } from './DigitSpanGame';
import { RsvpSpeedReaderGame } from './RsvpSpeedReaderGame';
import { WordSearchGame } from './WordSearchGame';
import { TwinWordsGame } from './TwinWordsGame';
import { PeripheralVisionGame } from './PeripheralVisionGame';
import { GreenDotGame } from './GreenDotGame';
import { WordChunkingGame } from './WordChunkingGame';
import { ReadingAssessmentGame } from './ReadingAssessmentGame';
import { SpeedPacerGame } from './SpeedPacerGame';
import { TextScanningGame } from './TextScanningGame';
import { CardFlipGame } from './CardFlipGame';
import { StroopClashGame } from './StroopClashGame';
import { SpatialMemoryGame } from './SpatialMemoryGame';
import { SaccadeTrackerGame } from './SaccadeTrackerGame';
import { PitchRecallGame } from './PitchRecallGame';
import { IntervalIdentifyGame } from './IntervalIdentifyGame';
import { RhythmRecallGame } from './RhythmRecallGame';
import { ChordIdentifyGame } from './ChordIdentifyGame';
import { TimbreMatchGame } from './TimbreMatchGame';
import { SoundLocalizationGame } from './SoundLocalizationGame';
import { VoiceTrackGame } from './VoiceTrackGame';
import { RelationalNetworkGame } from './RelationalNetworkGame';
import { CausalCascadeGame } from './CausalCascadeGame';
import { GraphMemoryMatrixGame } from './GraphMemoryMatrixGame';
import { RuleMutationClashGame } from './RuleMutationClashGame';
import { auditoryEngine } from '../../services/auditoryEngine';
import { EXERCISES_METADATA } from '@brain-exercises/shared';
import { Sparkles, Zap, Flame, ArrowRight, X } from 'lucide-react';

export const ActiveGameContainer: React.FC = () => {
  const { 
    activeGameSlug, 
    setActiveGameSlug, 
    getExerciseLevel, 
    activeSynergy, 
    suggestedSynergy, 
    dismissSynergy 
  } = useAppStore();

  // Ensure any ambient drone or lingering sound stops when switching games or closing
  React.useEffect(() => {
    return () => {
      auditoryEngine.stopDrone();
    };
  }, [activeGameSlug]);

  if (!activeGameSlug) return null;

  const exercise = EXERCISES_METADATA.find(e => e.slug === activeGameSlug);
  const currentLvl = getExerciseLevel(activeGameSlug);
  const levelConfig = exercise?.levelConfigs.find(c => c.level === currentLvl);
  const isSuperTier = currentLvl >= 9 && currentLvl <= 12;

  const renderGame = () => {
    switch (activeGameSlug) {
      case 'schulte-table':
        return <SchulteTableGame />;
      case 'anagram':
        return <AnagramGame />;
      case 'find-letter':
        return <FindLetterGame />;
      case 'find-number':
        return <FindNumberGame />;
      case 'even-odd':
        return <EvenOddGame />;
      case 'digit-span':
        return <DigitSpanGame />;
      case 'rsvp-speed-reader':
        return <RsvpSpeedReaderGame />;
      case 'word-search':
        return <WordSearchGame />;
      case 'twin-words':
        return <TwinWordsGame />;
      case 'peripheral-vision':
        return <PeripheralVisionGame />;
      case 'green-dot':
        return <GreenDotGame />;
      case 'word-chunking':
        return <WordChunkingGame />;
      case 'reading-assessment':
        return <ReadingAssessmentGame />;
      case 'reading-pacer':
        return <SpeedPacerGame />;
      case 'text-scanning':
        return <TextScanningGame />;
      case 'card-flip':
        return <CardFlipGame />;
      case 'stroop-clash':
        return <StroopClashGame />;
      case 'spatial-memory':
        return <SpatialMemoryGame />;
      case 'saccade-tracker':
        return <SaccadeTrackerGame />;
      case 'pitch-recall':
        return <PitchRecallGame />;
      case 'interval-identify':
        return <IntervalIdentifyGame />;
      case 'rhythm-recall':
        return <RhythmRecallGame />;
      case 'chord-identify':
        return <ChordIdentifyGame />;
      case 'timbre-match':
        return <TimbreMatchGame />;
      case 'sound-localization':
        return <SoundLocalizationGame />;
      case 'voice-track':
        return <VoiceTrackGame />;
      case 'relational-network':
        return <RelationalNetworkGame />;
      case 'causal-cascade':
        return <CausalCascadeGame />;
      case 'graph-memory-matrix':
        return <GraphMemoryMatrixGame />;
      case 'rule-mutation-clash':
        return <RuleMutationClashGame />;
      default:
        return <SchulteTableGame />;
    }
  };

  const nextSlug = suggestedSynergy
    ? (suggestedSynergy.exerciseASlug === activeGameSlug ? suggestedSynergy.exerciseBSlug : suggestedSynergy.exerciseASlug)
    : null;
  const nextExercise = nextSlug ? EXERCISES_METADATA.find(e => e.slug === nextSlug) : null;

  return (
    <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 w-full transition-all">
      {/* Top Variant & Mastery HUD Banner */}
      {isSuperTier && levelConfig?.variantName && (
        <div className="mb-4 px-4 py-2.5 bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-brand-600/90 text-white rounded-2xl shadow-lg border border-purple-400/40 backdrop-blur-md flex items-center justify-between animate-pulse transition-all">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-white/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            </span>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-200">
                Giai Đoạn III: Siêu Phàm (Cấp {currentLvl}/12)
              </span>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Biến thể: <span className="underline decoration-amber-300 underline-offset-2">{levelConfig.variantName}</span>
              </h4>
            </div>
          </div>
          <span className="text-xs bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2.5 py-1 rounded-full font-semibold">
            {levelConfig.variantCode || 'SIÊU CẤP'}
          </span>
        </div>
      )}

      {/* Main Game Component */}
      {renderGame()}

      {/* Active Synergy Toast */}
      {activeSynergy && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl shadow-2xl border border-amber-300/40 animate-bounce">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-white/20 rounded-xl">
                <Flame className="w-5 h-5 text-yellow-200" />
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                  Combo Cộng Hưởng (+{activeSynergy.bonusXpPercent}% XP)
                </span>
                <p className="text-sm font-bold text-white">{activeSynergy.title}</p>
                <p className="text-xs text-amber-100/90 mt-0.5">{activeSynergy.description}</p>
              </div>
            </div>
            <button 
              onClick={dismissSynergy}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Suggested Synergy Next Game Bar */}
      {suggestedSynergy && nextExercise && (
        <div className="mt-4 p-3 bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-brand-900 dark:text-brand-100">
            <Zap className="w-4 h-4 text-brand-500 shrink-0" />
            <span>
              Gợi ý cộng hưởng não bộ: Luyện tiếp <strong className="font-semibold text-brand-600 dark:text-brand-400">{nextExercise.title}</strong> để nhận thưởng <strong>+{suggestedSynergy.bonusXpPercent}% XP</strong>!
            </span>
          </div>
          <button
            onClick={() => {
              setActiveGameSlug(nextExercise.slug);
              dismissSynergy();
            }}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            Tập Luôn <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
