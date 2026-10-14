import React, { useState } from 'react';
import { INTERVAL_CATALOG, IIntervalInfo } from '../../services/musicTheoryService';
import { auditoryEngine } from '../../services/auditoryEngine';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { Note } from 'tonal';
import { Volume2, Music, Sparkles, ArrowRight, Play, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface IIntervalMnemonic {
  song: string;
  hint: string;
  notes: string[];
  tempoMs?: number;
}

const INTERVAL_MNEMONICS: Record<string, IIntervalMnemonic> = {
  '1P': { song: 'Đồng âm tuyệt đối', hint: 'Hai nốt cùng cao độ (1:1)', notes: ['C4', 'C4', 'C4', 'C4'], tempoMs: 280 },
  '2m': { song: 'Hàm Cá Mập (Jaws Theme)', hint: 'Căng thẳng rình rập, bước nửa cung kịch tính', notes: ['E4', 'F4', 'E4', 'F4', 'E4', 'F4'], tempoMs: 240 },
  '2M': { song: 'Happy Birthday to you', hint: 'Bước một cung cơ bản, tươi vui', notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4'], tempoMs: 300 },
  '3m': { song: 'Greensleeves / Lullaby', hint: 'Âm hưởng thứ, u buồn, tha thiết', notes: ['A4', 'C5', 'D5', 'E5'], tempoMs: 340 },
  '3M': { song: 'Kìa Con Bướm Vàng / Kumbaya', hint: 'Âm hưởng trưởng, rực rỡ, lạc quan', notes: ['C4', 'D4', 'E4', 'C4'], tempoMs: 290 },
  '4P': { song: 'Here Comes The Bride / Amazing Grace', hint: 'Vững chãi, tiếng kèn kêu gọi trang nghiêm', notes: ['C4', 'F4', 'F4', 'F4'], tempoMs: 310 },
  '4A': { song: 'The Simpsons Theme / Maria', hint: 'Quãng của quỷ (Tritone), ma mị kỳ bí', notes: ['C4', 'F#4', 'G4'], tempoMs: 360 },
  '5d': { song: 'The Simpsons Theme (Giảm)', hint: 'Căng thẳng tột độ, hút về hòa âm ổn định', notes: ['C4', 'Gb4', 'F4'], tempoMs: 360 },
  '5P': { song: 'Star Wars Theme / Twinkle Twinkle', hint: 'Hùng vĩ, không gian vũ trụ rộng mở', notes: ['C4', 'G4', 'F4', 'E4', 'D4', 'C5'], tempoMs: 280 },
  '6m': { song: 'The Entertainer (Scott Joplin)', hint: 'Da diết, hoài niệm, lãng mạn sâu sắc', notes: ['D4', 'D#4', 'E4', 'C5'], tempoMs: 250 },
  '6M': { song: 'NBC Chimes / My Bonnie', hint: 'Ấm áp, êm đềm, du dương ngọt ngào', notes: ['G4', 'E5', 'C5'], tempoMs: 380 },
  '7m': { song: 'Somewhere (West Side Story)', hint: 'Màu sắc Jazz/Blues phóng khoáng', notes: ['C4', 'Bb4', 'A4', 'F4'], tempoMs: 340 },
  '7M': { song: 'Take On Me (A-ha) / Superman', hint: 'Lung linh mơ màng, hoài bão vút cao', notes: ['C4', 'C4', 'B4', 'G4'], tempoMs: 280 },
  '8P': { song: 'Somewhere Over The Rainbow', hint: 'Bát độ hoàn mỹ, nhảy vọt không gian trọn vẹn', notes: ['C4', 'C5', 'B4', 'G4', 'A4', 'B4', 'C5'], tempoMs: 320 },
};

export const IntervalsModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug, markTheoryModuleMastered, masteredTheoryModules } = useAppStore();
  const [selectedIntervalCode, setSelectedIntervalCode] = useState<string>('5P');
  const [rootNote, setRootNote] = useState<string>('C4');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPlayingAnchor, setIsPlayingAnchor] = useState<boolean>(false);

  // Chapter 2 Mastery Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const selectedInterval = INTERVAL_CATALOG[selectedIntervalCode] || INTERVAL_CATALOG['5P'];
  const targetNote = Note.transpose(rootNote, selectedInterval.code);
  const currentMnemonic = INTERVAL_MNEMONICS[selectedInterval.code];

  const handlePlay = async (mode: 'ascending' | 'descending' | 'harmonic') => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playInterval(rootNote, targetNote, mode, 0.6, 400);
    } finally {
      setIsPlaying(false);
    }
  };

  const handlePlayAnchorMelody = async (code: string) => {
    if (isPlayingAnchor) return;
    const mnemonic = INTERVAL_MNEMONICS[code];
    if (!mnemonic || !mnemonic.notes.length) return;

    setIsPlayingAnchor(true);
    try {
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playNoteSequence(mnemonic.notes, mnemonic.tempoMs || 300, 0.38);
    } finally {
      setIsPlayingAnchor(false);
    }
  };

  const handleStartIntervalExercise = () => {
    setSelectedExerciseSlug('interval-identify');
    setActiveTab('exercises');
  };

  // 3-Question Mastery Quiz for Chapter 2
  const INTERVAL_QUESTIONS = [
    {
      id: 'qi1',
      title: 'Câu 1: Quãng 5 Đúng (5P) gồm khoảng cách bao nhiêu bán âm?',
      options: [
        { id: 'a', label: '7 bán âm (Ví dụ: Đô lên Sol)', isCorrect: true },
        { id: 'b', label: '5 bán âm (Ví dụ: Đô lên Fa)', isCorrect: false },
        { id: 'c', label: '6 bán âm (Tritone)', isCorrect: false },
        { id: 'd', label: '8 bán âm (Quãng 6 thứ)', isCorrect: false }
      ],
      explanation: 'Chính xác! Quãng 5 Đúng (5P) có khoảng cách đúng 7 bán âm, mang tỷ lệ họa âm vàng 3:2 mở rộng bát ngát như bài Star Wars hay Twinkle Twinkle.'
    },
    {
      id: 'qi2',
      title: 'Câu 2: Quãng 3 Trưởng (3M) và Quãng 3 Thứ (3m) khác nhau ở điểm cốt lõi nào?',
      options: [
        { id: 'a', label: '3M có 4 bán âm (tươi sáng), 3m có 3 bán âm (u buồn, trữ tình)', isCorrect: true },
        { id: 'b', label: '3M có 3 bán âm, 3m có 4 bán âm', isCorrect: false },
        { id: 'c', label: '3M và 3m có số bán âm giống nhau nhưng khác tên gọi', isCorrect: false },
        { id: 'd', label: '3M chỉ dùng trong nhạc Rock, 3m chỉ dùng trong nhạc Pop', isCorrect: false }
      ],
      explanation: 'Chính xác! Chỉ chênh nhau 1 nửa cung (4 bán âm vs 3 bán âm), nhưng quãng 3 là nhân tố quyết định cảm xúc Trưởng (sáng vui) hay Thứ (trầm buồn).'
    },
    {
      id: 'qi3',
      title: 'Câu 3: Quãng Tritone (4 Tăng / 5 Giảm) có bao nhiêu bán âm?',
      options: [
        { id: 'a', label: 'Đúng 6 bán âm — chia đôi bát độ 12 bán âm', isCorrect: true },
        { id: 'b', label: '4 bán âm', isCorrect: false },
        { id: 'c', label: '8 bán âm', isCorrect: false },
        { id: 'd', label: '10 bán âm', isCorrect: false }
      ],
      explanation: 'Chính xác! Tritone gồm đúng 6 bán âm (chia đôi quãng 8), tạo nên độ cọ xát căng thẳng mãnh liệt đặc trưng cho chủ đề The Simpsons hay nhạc phim giật gân.'
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
          markTheoryModuleMastered('intervals');
        }
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Theory Introduction */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎼</span>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Khái Niệm 2: Quãng Âm (Musical Intervals)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Khoảng cách cao độ giữa hai nốt nhạc — "gạch xây dựng" nên toàn bộ giai điệu và hòa âm
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Quãng (Interval)</strong> đo lường khoảng cách về cao độ giữa hai nốt nhạc, được tính theo số lượng nửa cung (semitones). Có hai cách nghe quãng:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-3">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <h4 className="font-bold text-cyan-700 dark:text-cyan-400 text-sm">
                1. Quãng Giai Điệu (Melodic Interval)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Hai nốt phát <strong>nối tiếp nhau</strong> theo thời gian. Có thể là <em>đi lên (ascending)</em> hoặc <em>đi xuống (descending)</em>.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <h4 className="font-bold text-purple-700 dark:text-purple-400 text-sm">
                2. Quãng Hòa Âm (Harmonic Interval)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Hai nốt phát <strong>cùng một lúc (chồng âm)</strong>. Tạo nên độ hòa hợp (consonance) hoặc độ nghịch/căng thẳng (dissonance).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Interval Explorer & Piano */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-cyan-400" />
              Khám Phá Quãng Trực Quan Trên Phím Đàn
            </h3>
            <p className="text-xs text-slate-400">
              Chọn một quãng bên dưới để nghe thử và xem khoảng cách phím tương ứng
            </p>
          </div>

          {/* Root note picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Nốt gốc:</span>
            {['C4', 'D4', 'E4', 'F4', 'G4'].map(n => (
              <button
                key={n}
                onClick={() => setRootNote(n)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                  rootNote === n ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Current Interval Info Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-black text-base font-mono">
                {selectedInterval.code}
              </span>
              <h4 className="text-lg font-black text-white">{selectedInterval.nameVi}</h4>
              <span className="text-xs text-slate-400 font-medium">({selectedInterval.nameEn})</span>
            </div>
            <p className="text-xs text-amber-300 mt-1 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              {currentMnemonic?.song} — {currentMnemonic?.hint}
            </p>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Khoảng cách: <strong className="text-cyan-400">{selectedInterval.semitones} nửa cung</strong> | Hai nốt:{' '}
              <strong className="text-emerald-400">{rootNote}</strong> &rarr;{' '}
              <strong className="text-amber-400">{targetNote}</strong>
            </div>
          </div>

          {/* Playback Buttons including Song Anchor Audio */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentMnemonic && (
              <button
                onClick={() => handlePlayAnchorMelody(selectedInterval.code)}
                disabled={isPlayingAnchor}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>{isPlayingAnchor ? 'Đang phát...' : 'Nghe Giai Điệu Bài Hát Mẫu'}</span>
              </button>
            )}

            <button
              onClick={() => handlePlay('ascending')}
              disabled={isPlaying}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Giai Điệu Đi Lên</span>
            </button>
            <button
              onClick={() => handlePlay('descending')}
              disabled={isPlaying}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
            >
              <span>Đi Xuống</span>
            </button>
            <button
              onClick={() => handlePlay('harmonic')}
              disabled={isPlaying}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hòa Âm Đồng Thời</span>
            </button>
          </div>
        </div>

        {/* Visual Piano Keyboard */}
        <div className="flex justify-center pt-2">
          <PianoKeyboard
            octaveRange={[4, 5]}
            selectedNotes={[rootNote, targetNote]}
            enableMidiHighlight={true}
          />
        </div>
      </div>

      {/* Grid of 13 Intervals with Song Anchors Audio */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            🎹 Bảng 13 Quãng Âm & Giai Điệu Neo Trí Nhớ (Song Anchors)
          </h3>
          <span className="text-xs text-slate-500">
            Bấm vào nút nốt nhạc để nghe ngay 3–4 nốt mở đầu của bài hát
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(INTERVAL_CATALOG).map((item) => {
            const isSelected = selectedIntervalCode === item.code;
            const mnemonic = INTERVAL_MNEMONICS[item.code];

            return (
              <div
                key={item.code}
                onClick={() => {
                  setSelectedIntervalCode(item.code);
                  auditoryEngine.resumeAudioContext().catch(() => {});
                  const tNote = Note.transpose(rootNote, item.code);
                  auditoryEngine.playInterval(rootNote, tNote, 'ascending', 0.5, 350);
                }}
                className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-slate-900 dark:text-white shadow-md ring-2 ring-cyan-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-cyan-400 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400">
                    {item.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {item.semitones} nửa cung
                    </span>
                    {mnemonic?.notes && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAnchorMelody(item.code);
                        }}
                        title={`Nghe giai điệu mẫu: ${mnemonic.song}`}
                        className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-700 dark:text-amber-300 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{item.nameVi}</div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 truncate">
                  💡 {mnemonic?.song}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                  "{item.ratioDescription}"
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK MASTERY CHECK (Mini-Game 3 Câu Chương 2) */}
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Thử Thách Nhanh: Làm Chủ Quãng Âm (3 Câu)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
            {masteredTheoryModules.includes('intervals') ? '✅ Đã làm chủ chương 2' : `Câu ${quizStep + 1} / 3`}
          </span>
        </div>

        {!quizFinished ? (
          (() => {
            const currentQ = INTERVAL_QUESTIONS[quizStep];
            return (
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                  {currentQ.title}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map(opt => {
                    const isSelected = quizSelectedOption === opt.id;
                    let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-cyan-400';
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
                  <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-900 dark:text-cyan-200 animate-fadeIn">
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
              {quizScore >= 2 ? '🎉 Xuất sắc! Bạn đã làm chủ chương Quãng Âm' : 'Hãy thử lại để đạt chuẩn làm chủ nhé!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Bạn đạt <strong>{quizScore}/3 câu đúng</strong>. Huy hiệu làm chủ chương 2 đã được cập nhật thành công!
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

      {/* CTA */}
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Sẵn sàng thử thách tai nghe quãng?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Luyện nghe 2 nốt và chọn đúng tên quãng từ cấp độ 1 đến vô hạn!
          </p>
        </div>
        <button
          onClick={handleStartIntervalExercise}
          className="px-6 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <span>Luyện Tập: Nhận Diện Quãng (Interval Identify)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
