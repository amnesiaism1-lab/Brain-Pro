import React, { useState } from 'react';
import { CHORD_TYPE_CATALOG, IChordTypeInfo } from '../../services/musicTheoryService';
import { auditoryEngine } from '../../services/auditoryEngine';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { Note } from 'tonal';
import { Volume2, Music, ArrowRight, Play, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ChordsModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug } = useAppStore();
  const [selectedChordKey, setSelectedChordKey] = useState<string>('Major');
  const [rootNote, setRootNote] = useState<string>('C4');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // A/B Comparison state
  const [compareA, setCompareA] = useState<string>('Major');
  const [compareB, setCompareB] = useState<string>('Minor');

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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
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
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>Chơi Hợp Âm (Block)</span>
            </button>
            <button
              onClick={() => handlePlayChord(currentNotes, 'arpeggio')}
              disabled={isPlaying}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95"
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
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg p-1.5"
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
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-sm"
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
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg p-1.5"
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
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-sm"
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
                className={`p-4 rounded-2xl text-left border-2 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-slate-900 dark:text-white shadow-md ring-2 ring-amber-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-800 dark:text-slate-200'
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

      {/* NEW: Kết Đoạn Hòa Âm (Harmonic Cadences - M1-4) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Kết Đoạn Hòa Âm & Dấu Câu Âm Nhạc (Cadences)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cách các hợp âm nối đuôi nhau về đích — tạo cảm giác hạ màn viên mãn, lơ lửng hay bất ngờ hụt hẫng
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
              chords: [['G3', 'B3', 'D4', 'G4'], ['C4', 'E4', 'G4', 'C5']]
            },
            {
              type: 'half',
              nameVi: 'Kết Lửng (Half Cadence)',
              formula: 'I / IV → V',
              feel: 'Lơ lửng chờ câu tiếp theo',
              desc: 'Tạm dừng lại ở hợp âm Át (V), tựa dấu phẩy giữa câu nhạc.',
              chords: [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4', 'G4']]
            },
            {
              type: 'deceptive',
              nameVi: 'Kết Hụt (Deceptive)',
              formula: 'V → vi (Thứ)',
              feel: 'Bất ngờ, kịch tính hụt hẫng',
              desc: 'Kỳ vọng về C Trưởng nhưng bất ngờ rơi vào La Thứ (Am).',
              chords: [['G3', 'B3', 'D4', 'G4'], ['A3', 'C4', 'E4', 'A4']]
            },
            {
              type: 'plagal',
              nameVi: 'Kết Ngợi Khen (Plagal)',
              formula: 'IV → I',
              feel: 'Thanh thoát, dịu dàng "Amen"',
              desc: 'Hợp âm Fa Trưởng (F) êm đềm trôi về Đô Trưởng (C).',
              chords: [['F3', 'A3', 'C4', 'F4'], ['C4', 'E4', 'G4', 'C5']]
            }
          ].map(cad => (
            <div key={cad.type} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
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
              </div>

              <button
                onClick={async () => {
                  await auditoryEngine.resumeAudioContext();
                  auditoryEngine.playCadence(cad.chords);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-amber-500/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Nghe Tiến Trình</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Hòa Âm Ngầm (Implied Harmony - M1-6) */}
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
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 text-left hover:border-amber-400 transition-all active:scale-98 flex items-center justify-between"
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

      {/* CTA */}
      <div className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Sẵn sàng nhận diện hợp âm bằng tai?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Nghe hợp âm vang lên và đoán đúng Trưởng, Thứ, 7 hay Giảm!
          </p>
        </div>
        <button
          onClick={handleStartChordExercise}
          className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
        >
          <span>Luyện Tập: Nhận Diện Hợp Âm (Chord Identify)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
