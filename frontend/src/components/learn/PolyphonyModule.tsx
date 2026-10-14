import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { auditoryEngine } from '../../services/auditoryEngine';
import { 
  GitFork, 
  Volume2, 
  Play, 
  Pause, 
  Headphones, 
  Sparkles, 
  CheckCircle, 
  Brain, 
  Sliders, 
  ArrowRight,
  Layers,
  Activity,
  Trophy,
  CheckCircle2,
  XCircle,
  Radio
} from 'lucide-react';

export const PolyphonyModule: React.FC = () => {
  const { setSelectedExerciseSlug, setActiveGameSlug, setActiveTab, markTheoryModuleMastered, masteredTheoryModules } = useAppStore();

  const [isPlayingStreams, setIsPlayingStreams] = useState(false);
  const [soloVoice, setSoloVoice] = useState<'soprano' | 'alto' | 'bass' | null>(null);

  // Volume Faders (0 to 1.0)
  const [voiceVolumes, setVoiceVolumes] = useState<{ soprano: number; alto: number; bass: number }>({
    soprano: 0.35,
    alto: 0.32,
    bass: 0.30
  });

  // Cocktail Party Background Noise Simulation
  const [enableNoise, setEnableNoise] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0.12);

  // Chapter 8 Mastery Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const sampleCounterpoint = [
    {
      name: 'soprano',
      displayNameVi: 'Bè Cao (Soprano)',
      notes: [
        { note: 'C5', durationSec: 0.6 },
        { note: 'D5', durationSec: 0.6 },
        { note: 'E5', durationSec: 0.6 },
        { note: 'G5', durationSec: 0.6 },
        { note: 'C5', durationSec: 0.8 }
      ],
      waveform: 'triangle' as OscillatorType,
      pan: 0.4,
      volume: voiceVolumes.soprano,
      color: '#38BDF8',
      roleVi: 'Giai điệu chủ đạo bay bổng ở dải tần số cao.'
    },
    {
      name: 'alto',
      displayNameVi: 'Bè Giữa (Alto)',
      notes: [
        { note: 'G4', durationSec: 0.6 },
        { note: 'A4', durationSec: 0.6 },
        { note: 'B4', durationSec: 0.6 },
        { note: 'C5', durationSec: 0.6 },
        { note: 'G4', durationSec: 0.8 }
      ],
      waveform: 'sine' as OscillatorType,
      pan: 0.0,
      volume: voiceVolumes.alto,
      color: '#A855F7',
      roleVi: 'Điền đầy dải trung âm, kết nối mượt mà giữa bè cao và trầm.'
    },
    {
      name: 'bass',
      displayNameVi: 'Bè Trầm (Bass)',
      notes: [
        { note: 'C3', durationSec: 0.6 },
        { note: 'F3', durationSec: 0.6 },
        { note: 'G3', durationSec: 0.6 },
        { note: 'E3', durationSec: 0.6 },
        { note: 'C3', durationSec: 0.8 }
      ],
      waveform: 'sawtooth' as OscillatorType,
      pan: -0.4,
      volume: voiceVolumes.bass,
      color: '#F59E0B',
      roleVi: 'Móng nhà hòa âm, giữ nhịp đập và chuyển động bậc nốt gốc.'
    }
  ];

  const handlePlayStreams = async (solo?: 'soprano' | 'alto' | 'bass') => {
    if (isPlayingStreams) return;
    setIsPlayingStreams(true);
    setSoloVoice(solo || null);
    try {
      await auditoryEngine.resumeAudioContext();

      if (enableNoise) {
        auditoryEngine.playBabbleNoise(3.6, noiseLevel);
      }

      await auditoryEngine.playPolyphonicStreams(sampleCounterpoint, solo);
    } catch (err) {
      console.warn('Polyphony play error:', err);
    } finally {
      setIsPlayingStreams(false);
      setSoloVoice(null);
    }
  };

  // Chapter 8 Mastery Quiz Questions
  const POLYPHONY_QUESTIONS = [
    {
      id: 'qp1',
      title: 'Câu 1: Cơ chế "Phân Rã Quang Cảnh Thính Giác" (Auditory Scene Analysis của Albert Bregman) cho phép não làm gì?',
      options: [
        { id: 'a', label: 'Tách một hỗn hợp âm thanh phức tạp thành các dòng bè độc lập dựa vào dải tần và khoảng cách thời gian', isCorrect: true },
        { id: 'b', label: 'Tắt hoàn toàn một bên tai', isCorrect: false },
        { id: 'c', label: 'Biến tất cả âm thanh thành tiếng ồn trắng', isCorrect: false },
        { id: 'd', label: 'Làm chậm tốc độ bài hát', isCorrect: false }
      ],
      explanation: 'Chính xác! Não gom các tần số gần nhau và có đặc tính âm sắc đồng nhất thành một dòng thính giác (Stream) liên tục, tách rời với các dòng bè khác.'
    },
    {
      id: 'qp2',
      title: 'Câu 2: Hiệu ứng "Tiệc Cocktail" (Cocktail Party Effect) minh họa cho năng lực nhận thức nào?',
      options: [
        { id: 'a', label: 'Sự chú ý chọn lọc (Selective Attention) — tập trung vào một giọng nói/bè nhạc giữa môi trường huyên náo', isCorrect: true },
        { id: 'b', label: 'Khả năng uống rượu khi nghe nhạc', isCorrect: false },
        { id: 'c', label: 'Khả năng hát karaoke không bị lệch nhịp', isCorrect: false },
        { id: 'd', label: 'Khả năng ngủ sâu trong tiếng ồn', isCorrect: false }
      ],
      explanation: 'Chính xác! Giữa khán phòng ồn ào, vùng trán trước trán (Prefrontal Cortex) có thể lọc bỏ các cuộc trò chuyện nhiễu để khóa chặt vào người nói chuyện đối diện.'
    },
    {
      id: 'qp3',
      title: 'Câu 3: Để luyện nghe các bè phụ (bè Giữa - Alto hoặc bè Trầm - Bass), phương pháp luyện tập hiệu quả nhất là gì?',
      options: [
        { id: 'a', label: 'Giảm dần âm lượng fader của bè chính (Soprano) để tai tập trung bắt sóng các bè phụ trước khi nghe toàn bộ', isCorrect: true },
        { id: 'b', label: 'Bật volume tối đa cho đến khi tai đau', isCorrect: false },
        { id: 'c', label: 'Tắt toàn bộ bài hát chỉ nghe 1 nốt đơn lẻ', isCorrect: false },
        { id: 'd', label: 'Đổi thể loại nhạc sang nhạc điện tử', isCorrect: false }
      ],
      explanation: 'Chính xác! Kỹ thuật mờ dần (Fading/Scaffolding) giúp thính giác nhận diện dấu vết âm học của bè phụ trước, sau đó dễ dàng nhận ra ngay cả khi bè chính chơi to.'
    }
  ];

  const handleSelectQuizOption = (opt: { id: string; label: string; isCorrect: boolean }) => {
    if (quizSelectedOption) return;
    setQuizSelectedOption(opt.id);
    if (opt.isCorrect) {
      auditoryEngine.playFeedback(true);
      setQuizScore(prev => prev + 1);
    } else {
      auditoryEngine.playFeedback(false);
    }

    setTimeout(() => {
      if (quizStep < 2) {
        setQuizStep(prev => prev + 1);
        setQuizSelectedOption(null);
      } else {
        setQuizFinished(true);
        if (quizScore + (opt.isCorrect ? 1 : 0) >= 2) {
          markTheoryModuleMastered('polyphony');
        }
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Intro Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-violet-500/20">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold">
            <GitFork className="w-3.5 h-3.5" />
            <span>Chương 8: Đa Thanh & Bè Phối (Polyphony & Voice Leading)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Nghệ Thuật Tách Bè & Đối Âm Thính Giác
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Trong âm nhạc phức điệu (Polyphony) như các bản Phú-ga của Bach hay nhạc thính phòng, 
            nhiều giai điệu cùng chuyển động độc lập song song. Học cách điều khiển sự chú ý chọn lọc để theo dõi 
            từng bè riêng biệt là đỉnh cao của năng lực cảm thụ âm nhạc.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setActiveGameSlug('voice-track');
                setActiveTab('exercises');
              }}
              className="px-5 py-2.5 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              <span>Luyện Tập Bài "Theo Dõi Bè" Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scientific Principles Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Phân Rã Quang Cảnh Thính Giác
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Nhà tâm lý học Albert Bregman chỉ ra rằng não bộ sử dụng <em>Auditory Scene Analysis</em> để nhóm các tần số 
            gần nhau theo thời gian thành các "dòng thính giác" (Auditory Streams) riêng biệt.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Chú Ý Chọn Lọc (Selective Attention)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Giống như hiệu ứng "Tiệc Cocktail" khi bạn nghe rõ giọng một người giữa khán phòng huyên náo, tai nhạc sĩ 
            có thể phóng to (zoom-in) vào bè Bass hoặc bè Alto trong khi bè Soprano đang hát to nhất.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Chuyển Động Đối Âm (Counterpoint)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Các bè có thể chuyển động <strong>Song song (Parallel)</strong>, <strong>Ngược hướng (Contrary)</strong>, 
            hoặc <strong>Xiên chéo (Oblique - một bè đứng yên, một bè di chuyển)</strong>.
          </p>
        </div>
      </div>

      {/* Interactive Polyphony Mixer Playground with Faders & Noise Distractor */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Bàn Trộn Đa Bè Tương Tác (Interactive Polyphonic Mixer & Faders)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kéo thanh trượt âm lượng (Fader) từng bè để làm mờ bè chính nhằm tăng độ khó khi nghe bè phụ
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Cocktail Party Babble Noise Toggle */}
            <button
              onClick={() => setEnableNoise(!enableNoise)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                enableNoise
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${enableNoise ? 'animate-pulse text-amber-500' : ''}`} />
              <span>{enableNoise ? 'Nhiễu Đám Đông (Bật)' : 'Thêm Nhiễu Quán Cafe'}</span>
            </button>

            <button
              onClick={() => handlePlayStreams()}
              disabled={isPlayingStreams}
              className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                isPlayingStreams && !soloVoice
                  ? 'bg-violet-600 text-white animate-pulse'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPlayingStreams && !soloVoice ? 'Đang Hòa Tấu 3 Bè...' : 'Nghe Cả 3 Bè (Full Ensemble)'}</span>
            </button>
          </div>
        </div>

        {/* 3 Voice Lanes with Independent Volume Faders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleCounterpoint.map(voice => {
            const isThisSolo = soloVoice === voice.name && isPlayingStreams;
            const isPlayingAny = isPlayingStreams && (!soloVoice || soloVoice === voice.name);
            const currentVol = voiceVolumes[voice.name as keyof typeof voiceVolumes];

            return (
              <div
                key={voice.name}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isThisSolo
                    ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-400'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: voice.color }}
                    />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {voice.displayNameVi}
                    </h4>
                  </div>

                  <button
                    onClick={() => handlePlayStreams(voice.name as any)}
                    disabled={isPlayingStreams}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isThisSolo
                        ? 'bg-violet-600 text-white animate-pulse'
                        : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isThisSolo ? 'Đang Solo' : 'Nghe Riêng'}
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 flex justify-between">
                  <span>Cao độ:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {voice.notes.map(n => n.note).join(' - ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {voice.roleVi}
                </p>

                {/* Independent Volume Fader */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Âm lượng fader:</span>
                    <span className="font-bold" style={{ color: voice.color }}>
                      {Math.round(currentVol * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={0.7}
                    step={0.05}
                    value={currentVol}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setVoiceVolumes(prev => ({ ...prev, [voice.name]: val }));
                    }}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                </div>

                {/* Animated Mini Spectrum */}
                <div className="flex items-center justify-center gap-1 pt-1 h-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isPlayingAny ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{
                        height: isPlayingAny ? `${6 + (i * 3) % 16}px` : '4px'
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK MASTERY CHECK (Mini-Game 3 Câu Chương 8) */}
      <div className="p-6 bg-gradient-to-r from-violet-900/10 via-indigo-900/10 to-purple-900/10 border border-violet-500/30 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Thử Thách Nhanh: Làm Chủ Đa Thanh & Tách Bè (3 Câu)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
            {masteredTheoryModules.includes('polyphony') ? '✅ Đã làm chủ chương 8' : `Câu ${quizStep + 1} / 3`}
          </span>
        </div>

        {!quizFinished ? (
          (() => {
            const currentQ = POLYPHONY_QUESTIONS[quizStep];
            return (
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                  {currentQ.title}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map(opt => {
                    const isSelected = quizSelectedOption === opt.id;
                    let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-violet-400';
                    if (quizSelectedOption) {
                      if (opt.isCorrect) btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                      else if (isSelected) btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={quizSelectedOption !== null}
                        onClick={() => handleSelectQuizOption(opt)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between cursor-pointer active:scale-98 ${btnStyle}`}
                      >
                        <span>{opt.label}</span>
                        {quizSelectedOption && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />}
                        {quizSelectedOption && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {quizSelectedOption && (
                  <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs text-violet-900 dark:text-violet-200 animate-fadeIn">
                    {currentQ.explanation}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/30 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {quizScore >= 2 ? '🎉 Xuất sắc! Bạn đã làm chủ chương Đa Thanh & Bè Phối' : 'Hãy thử lại để đạt chuẩn làm chủ nhé!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Bạn đạt <strong>{quizScore}/3 câu đúng</strong>. Huy hiệu làm chủ chương 8 đã được ghi nhận vào học viện.
            </p>
            <button
              onClick={() => {
                setQuizStep(0);
                setQuizScore(0);
                setQuizSelectedOption(null);
                setQuizFinished(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Làm lại bài kiểm tra
            </button>
          </div>
        )}
      </div>

      {/* Polyphony Practice CTA */}
      <div className="p-6 bg-gradient-to-r from-violet-900/20 via-indigo-900/20 to-slate-900/20 border border-violet-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Thử Thách Phân Tách Bè (Auditory Stream Segregation)
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
              TARGET_DISTRACTOR
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Luyện khả năng khóa chặt sự chú ý vào một giọng hát/nhạc cụ duy nhất giữa đám đông phân tâm (Hiệu ứng Cocktail Party).
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedExerciseSlug('voice-track');
            setActiveTab('exercises');
          }}
          className="px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <span>Luyện Tập: Theo Dõi Bè Âm (Voice Track)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
