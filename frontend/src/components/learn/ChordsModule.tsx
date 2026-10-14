import React, { useState } from 'react';
import { CHORD_TYPE_CATALOG, IChordTypeInfo } from '../../services/musicTheoryService';
import { auditoryEngine } from '../../services/auditoryEngine';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { Note } from 'tonal';
import { Volume2, Music, ArrowRight, Play, Sparkles, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ChordsModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug, markTheoryModuleMastered, masteredTheoryModules } = useAppStore();
  const [selectedChordKey, setSelectedChordKey] = useState<string>('Major');
  const [rootNote, setRootNote] = useState<string>('C4');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // A/B Comparison state
  const [compareA, setCompareA] = useState<string>('Major');
  const [compareB, setCompareB] = useState<string>('Minor');

  // Chapter 3 Mastery Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const chordInfo: IChordTypeInfo = CHORD_TYPE_CATALOG[selectedChordKey] || CHORD_TYPE_CATALOG['Major'];
  const currentNotes = chordInfo.formula.map(interval => Note.transpose(rootNote, interval));

  const handlePlayChord = async (notes: string[], mode: 'block' | 'arpeggio' = 'block') => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playChord(notes, mode, 1.2, 70);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleStartChordExercise = () => {
    setSelectedExerciseSlug('chord-identify');
    setActiveTab('exercises');
  };

  // Chapter 3 Mastery Quiz Questions
  const CHORD_QUESTIONS = [
    {
      id: 'qc1',
      title: 'Câu 1: Hợp âm Trưởng (Major Triad) được cấu tạo từ công thức quãng nào tính từ nốt gốc?',
      options: [
        { id: 'a', label: 'Nốt gốc + Quãng 3 Trưởng (3M) + Quãng 5 Đúng (5P)', isCorrect: true },
        { id: 'b', label: 'Nốt gốc + Quãng 3 Thứ (3m) + Quãng 5 Đúng (5P)', isCorrect: false },
        { id: 'c', label: 'Nốt gốc + Quãng 3 Thứ + Quãng 5 Giảm (Diminished)', isCorrect: false },
        { id: 'd', label: 'Nốt gốc + Quãng 4 Đúng + Quãng 5 Đúng', isCorrect: false }
      ],
      explanation: 'Chính xác! Hợp âm Trưởng gồm nốt gốc, quãng 3 Trưởng (4 bán âm) và quãng 5 Đúng (7 bán âm), tạo nên âm hưởng tươi sáng, rực rỡ và vững vàng.'
    },
    {
      id: 'qc2',
      title: 'Câu 2: Điểm khác biệt mấu chốt giữa Hợp âm Thứ (Minor) và Hợp âm Trưởng (Major) là gì?',
      options: [
        { id: 'a', label: 'Nốt bậc 3 bị giáng xuống nửa cung (b3 - quãng 3 Thứ)', isCorrect: true },
        { id: 'b', label: 'Nốt bậc 5 bị thăng lên nửa cung', isCorrect: false },
        { id: 'c', label: 'Không có nốt gốc', isCorrect: false },
        { id: 'd', label: 'Bị thiếu mất 1 nốt nhạc', isCorrect: false }
      ],
      explanation: 'Chính xác! Nốt bậc 3 là nốt linh hồn quyết định tính chất: quãng 3 Trưởng mang lại cảm giác sáng vui, còn quãng 3 Thứ mang lại cảm giác trầm u, sâu lắng.'
    },
    {
      id: 'qc3',
      title: 'Câu 3: Tiến trình "Kết Hụt" (Deceptive Cadence: V → vi) tạo ra hiệu ứng tâm lý nào?',
      options: [
        { id: 'a', label: 'Bất ngờ hụt hẫng vì người nghe kỳ vọng về hợp âm Chủ (I) nhưng bất ngờ rơi vào hợp âm Thứ (vi)', isCorrect: true },
        { id: 'b', label: 'Hạ màn trọn vẹn không còn gì tiếc nuối', isCorrect: false },
        { id: 'c', label: 'Gây chói tai khó chịu như tiếng còi báo động', isCorrect: false },
        { id: 'd', label: 'Làm người nghe buồn ngủ', isCorrect: false }
      ],
      explanation: 'Chính xác! Hợp âm Át (V) tạo sức căng rất lớn, não bộ dự đoán sẽ hồi về nốt Chủ (I), nhưng việc đổi hướng sang hợp âm Thứ (vi) tạo nên nút thắt bất ngờ kịch tính.'
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
          markTheoryModuleMastered('chords');
        }
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview & Theory */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎶</span>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Khái Niệm 3: Hợp Âm & Màu Sắc Cảm Xúc (Chords)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sự kết hợp đồng thời của 3 nốt nhạc trở lên tạo nên không gian và chiều sâu cảm xúc
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Hợp âm (Chord)</strong> là tập hợp từ 3 nốt nhạc trở lên vang lên cùng lúc (hoặc rải liên tiếp). Mỗi loại hợp âm có một "màu sắc tâm lý" đặc trưng:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose my-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="font-black text-amber-700 dark:text-amber-400 text-sm block">1. Hợp Âm Trưởng (Major)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Gồm nốt gốc + quãng 3 Trưởng + quãng 5 Đúng. Đem lại cảm giác <strong>sáng sủa, vui tươi, tràn đầy năng lượng</strong>.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
              <span className="font-black text-blue-700 dark:text-blue-400 text-sm block">2. Hợp Âm Thứ (Minor)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Nốt bậc 3 hạ xuống nửa cung (quãng 3 Thứ). Đem lại cảm giác <strong>u buồn, êm dịu, sâu lắng, nội tâm</strong>.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <span className="font-black text-purple-700 dark:text-purple-400 text-sm block">3. Hợp Âm 7 (Seventh)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Thêm nốt bậc 7. Tạo chiều sâu phong phú đặc trưng cho nhạc <strong>Jazz, Blues, Soul và Pop hiện đại</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Chord Keyboard & Visualizer */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-400" />
              Khám Phá Hợp Âm & Vị Trí Phím
            </h3>
            <p className="text-xs text-slate-400">
              Chọn hợp âm bên dưới để xem các phím cấu thành và nghe hòa âm
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Nốt gốc:</span>
            {['C4', 'D4', 'E4', 'F4', 'G4', 'A4'].map(r => (
              <button
                key={r}
                onClick={() => setRootNote(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                  rootNote === r ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Current Chord Banner */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30 font-black text-base font-mono">
                {rootNote.replace(/\d/, '')}{chordInfo.symbolSuffix}
              </span>
              <h4 className="text-lg font-black text-white">{chordInfo.nameVi}</h4>
              <span className="text-xs text-slate-400">({chordInfo.nameEn})</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Cảm xúc: {chordInfo.feelDescription}
            </p>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Các nốt:{' '}
              {currentNotes.map((n, i) => (
                <span key={n} className="inline-block mr-2 px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                  {n} ({chordInfo.formula[i]})
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlayChord(currentNotes, 'block')}
              disabled={isPlaying}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Chơi Hợp Âm (Block)</span>
            </button>
            <button
              onClick={() => handlePlayChord(currentNotes, 'arpeggio')}
              disabled={isPlaying}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Rải Nốt (Arpeggio)</span>
            </button>
          </div>
        </div>

        {/* Piano Visualization */}
        <div className="flex justify-center pt-2">
          <PianoKeyboard
            octaveRange={[4, 5]}
            selectedNotes={currentNotes}
            enableMidiHighlight={true}
          />
        </div>
      </div>

      {/* A / B Comparison Lab */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          ⚖️ Phòng Thí Nghiệm So Sánh A / B (Major vs Minor vs 7th)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Nghe xen kẽ giữa hai loại hợp âm để rèn luyện thính giác nhận diện sắc thái cảm xúc:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">Hợp Âm A</span>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg p-1.5 text-slate-900 dark:text-white cursor-pointer"
              >
                {Object.keys(CHORD_TYPE_CATALOG).map(k => (
                  <option key={k} value={k}>{CHORD_TYPE_CATALOG[k].nameVi}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              💡 {CHORD_TYPE_CATALOG[compareA]?.feelDescription}
            </p>
            <button
              onClick={() => {
                const notes = CHORD_TYPE_CATALOG[compareA].formula.map(i => Note.transpose(rootNote, i));
                handlePlayChord(notes, 'block');
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Nghe Hợp Âm A ({rootNote.replace(/\d/, '')}{CHORD_TYPE_CATALOG[compareA]?.symbolSuffix})</span>
            </button>
          </div>

          {/* Card B */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-300 dark:border-indigo-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500 text-white">Hợp Âm B</span>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg p-1.5 text-slate-900 dark:text-white cursor-pointer"
              >
                {Object.keys(CHORD_TYPE_CATALOG).map(k => (
                  <option key={k} value={k}>{CHORD_TYPE_CATALOG[k].nameVi}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              💡 {CHORD_TYPE_CATALOG[compareB]?.feelDescription}
            </p>
            <button
              onClick={() => {
                const notes = CHORD_TYPE_CATALOG[compareB].formula.map(i => Note.transpose(rootNote, i));
                handlePlayChord(notes, 'block');
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Nghe Hợp Âm B ({rootNote.replace(/\d/, '')}{CHORD_TYPE_CATALOG[compareB]?.symbolSuffix})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 12 Chords */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          📚 Danh Mục 12 Loại Hợp Âm Phổ Biến
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(CHORD_TYPE_CATALOG).map((chord) => {
            const isSelected = selectedChordKey === chord.type;
            return (
              <button
                key={chord.type}
                onClick={() => {
                  setSelectedChordKey(chord.type);
                  const notes = chord.formula.map(i => Note.transpose(rootNote, i));
                  handlePlayChord(notes, 'block');
                }}
                className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-slate-900 dark:text-white shadow-md ring-2 ring-amber-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-amber-600 dark:text-amber-400">
                    {rootNote.replace(/\d/, '')}{chord.symbolSuffix || 'Maj'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {chord.formula.join('-')}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{chord.nameVi}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  "{chord.feelDescription}"
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* NEW: Kết Đoạn Hòa Âm with Voice Resolution Display & Contrast Fix */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Kết Đoạn Hòa Âm & Sơ Đồ Dẫn Dắt Bè (Cadences & Voice Resolution)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cách các hợp âm nối đuôi nhau về đích và sơ đồ các nốt bè dẫn truyền giải tỏa sức căng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              type: 'authentic',
              nameVi: 'Kết Trọn (Authentic)',
              formula: 'V → I',
              feel: 'Viên mãn, trọn vẹn hạ màn',
              desc: 'Hợp âm Át (G) giải quyết triệt để về hợp âm Chủ (C).',
              chords: [['G3', 'B3', 'D4', 'G4'], ['C4', 'E4', 'G4', 'C5']],
              voiceMotion: 'Nốt dẫn B3 (7M) hút mạnh lên C4; D4 giải quyết về E4'
            },
            {
              type: 'half',
              nameVi: 'Kết Lửng (Half Cadence)',
              formula: 'I / IV → V',
              feel: 'Lơ lửng chờ câu tiếp theo',
              desc: 'Tạm dừng lại ở hợp âm Át (V), tựa dấu phẩy giữa câu nhạc.',
              chords: [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4', 'G4']],
              voiceMotion: 'C4 chuyển về B3/D4, dừng lại ở nốt Sol tạo độ căng lơ lửng'
            },
            {
              type: 'deceptive',
              nameVi: 'Kết Hụt (Deceptive)',
              formula: 'V → vi (Thứ)',
              feel: 'Bất ngờ, kịch tính hụt hẫng',
              desc: 'Kỳ vọng về C Trưởng nhưng bất ngờ rơi vào La Thứ (Am).',
              chords: [['G3', 'B3', 'D4', 'G4'], ['A3', 'C4', 'E4', 'A4']],
              voiceMotion: 'G3 nhảy lên A3; B3 vẫn lên C4 nhưng nền bass chuyển sang Thứ'
            },
            {
              type: 'plagal',
              nameVi: 'Kết Ngợi Khen (Plagal)',
              formula: 'IV → I',
              feel: 'Thanh thoát, dịu dàng "Amen"',
              desc: 'Hợp âm Fa Trưởng (F) êm đềm trôi về Đô Trưởng (C).',
              chords: [['F3', 'A3', 'C4', 'F4'], ['C4', 'E4', 'G4', 'C5']],
              voiceMotion: 'A3 trôi nhẹ nhàng xuống G3; F3 bước nhẹ xuống E3'
            }
          ].map(cad => (
            <div key={cad.type} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400">
                  {cad.formula}
                </span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  {cad.nameVi}
                </h4>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium mt-0.5">
                  "{cad.feel}"
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {cad.desc}
                </p>

                {/* Voice leading notes visualization pill */}
                <div className="mt-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  <span className="text-amber-600 dark:text-amber-400 font-bold block mb-1">
                    {cad.chords[0].join(' ')} ➔ {cad.chords[1].join(' ')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[9px] block">
                    {cad.voiceMotion}
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  await auditoryEngine.resumeAudioContext();
                  auditoryEngine.playCadence(cad.chords);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-amber-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Nghe Tiến Trình</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Hòa Âm Ngầm (Implied Harmony) with Contrast Fix */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎼</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Hòa Âm Ngầm Trong Giai Điệu Đơn Âm (Implied Harmony)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Một cây sáo hay một giọng hát solo vẫn có thể khiến người nghe cảm nhận rõ hợp âm đang đổi
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Khi một nhạc cụ độc tấu (như đàn Cello của Bach) chơi một chuỗi nốt rải arpeggio nhanh, não bộ sẽ tự động gom các nốt lại thành một khối hợp âm trong bộ nhớ làm việc thính giác (Working Memory).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              name: 'Arpeggio C Major',
              notes: ['C4', 'E4', 'G4', 'C5'],
              feel: 'Trưởng sáng bừng (Do - Mi - Sol - Do)'
            },
            {
              name: 'Arpeggio A Minor',
              notes: ['A3', 'C4', 'E4', 'A4'],
              feel: 'Thứ lắng sâu (La - Do - Mi - La)'
            },
            {
              name: 'Arpeggio G7 (Dominant)',
              notes: ['G3', 'B3', 'D4', 'F4'],
              feel: 'Át 7 thúc giục hồi về nốt chủ'
            }
          ].map(arp => (
            <button
              key={arp.name}
              onClick={async () => {
                await auditoryEngine.resumeAudioContext();
                auditoryEngine.playNoteSequence(arp.notes, 220, 0.4);
              }}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-left hover:border-amber-400 transition-all active:scale-98 flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {arp.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {arp.feel}
                </span>
              </div>
              <Play className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* QUICK MASTERY CHECK (Mini-Game 3 Câu Chương 3) */}
      <div className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Thử Thách Nhanh: Làm Chủ Hợp Âm (3 Câu)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            {masteredTheoryModules.includes('chords') ? '✅ Đã làm chủ chương 3' : `Câu ${quizStep + 1} / 3`}
          </span>
        </div>

        {!quizFinished ? (
          (() => {
            const currentQ = CHORD_QUESTIONS[quizStep];
            return (
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                  {currentQ.title}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map(opt => {
                    const isSelected = quizSelectedOption === opt.id;
                    let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400';
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
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
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
              {quizScore >= 2 ? '🎉 Xuất sắc! Bạn đã làm chủ chương Hợp Âm' : 'Hãy thử lại để đạt chuẩn làm chủ nhé!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Bạn đạt <strong>{quizScore}/3 câu đúng</strong>. Huy hiệu làm chủ chương 3 đã được cập nhật thành công!
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
      <div className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Sẵn sàng nhận diện hợp âm bằng tai?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Nghe hợp âm vang lên và đoán đúng Trưởng, Thứ, 7 hay Giảm trong game!
          </p>
        </div>
        <button
          onClick={handleStartChordExercise}
          className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
        >
          <span>Luyện Tập: Nhận Diện Hợp Âm (Chord Identify)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
