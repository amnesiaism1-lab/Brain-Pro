import React, { useState } from 'react';
import { INTERVAL_CATALOG, IIntervalInfo } from '../../services/musicTheoryService';
import { auditoryEngine } from '../../services/auditoryEngine';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { Note } from 'tonal';
import { Volume2, Music, Sparkles, ArrowRight, Play } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const INTERVAL_MNEMONICS: Record<string, { song: string; hint: string }> = {
  '1P': { song: 'Đồng âm tuyệt đối', hint: 'Hai nốt cùng cao độ (1:1)' },
  '2m': { song: 'Hàm Cá Mập (Jaws Theme)', hint: 'Căng thẳng kịch tính, bước nửa cung rình rập' },
  '2M': { song: 'Happy Birthday to you', hint: 'Bước một cung cơ bản, tươi vui' },
  '3m': { song: 'Greensleeves / Lullaby', hint: 'Âm hưởng thứ, u buồn, trữ tình tha thiết' },
  '3M': { song: 'Kìa Con Bướm Vàng / Kumbaya', hint: 'Âm hưởng trưởng, rực rỡ, lạc quan hoan ca' },
  '4P': { song: 'Here Comes The Bride / Amazing Grace', hint: 'Vững chãi, tiếng kèn kêu gọi trang nghiêm' },
  '4A': { song: 'The Simpsons Theme / Maria', hint: 'Quãng của quỷ (Diabolus in Musica), kỳ bí ma mị' },
  '5d': { song: 'The Simpsons Theme', hint: 'Căng thẳng tột độ, cần hút về hòa âm ổn định' },
  '5P': { song: 'Star Wars Theme / Twinkle Twinkle', hint: 'Hùng vĩ, không gian vũ trụ rộng mở bát ngát' },
  '6m': { song: 'The Entertainer (Scott Joplin)', hint: 'Da diết, hoài niệm, lãng mạn sâu sắc' },
  '6M': { song: 'NBC Chimes / My Bonnie Lies Over the Ocean', hint: 'Ấm áp, êm đềm, du dương ngọt ngào' },
  '7m': { song: 'Somewhere (West Side Story) / Star Trek', hint: 'Màu sắc Jazz/Blues phóng khoáng, hướng mở' },
  '7M': { song: 'Take On Me (A-ha) / Superman Theme', hint: 'Lung linh mơ màng, hoài bão vút cao' },
  '8P': { song: 'Somewhere Over The Rainbow', hint: 'Bát độ hoàn mỹ, nhảy vọt không gian trọn vẹn' },
};

export const IntervalsModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug } = useAppStore();
  const [selectedIntervalCode, setSelectedIntervalCode] = useState<string>('5P');
  const [rootNote, setRootNote] = useState<string>('C4');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const selectedInterval = INTERVAL_CATALOG[selectedIntervalCode] || INTERVAL_CATALOG['5P'];
  const targetNote = Note.transpose(rootNote, selectedInterval.code);

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

  const handleStartIntervalExercise = () => {
    setSelectedExerciseSlug('interval-identify');
    setActiveTab('exercises');
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                  rootNote === n ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Current Interval Info Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-black text-base font-mono">
                {selectedInterval.code}
              </span>
              <h4 className="text-lg font-black text-white">{selectedInterval.nameVi}</h4>
              <span className="text-xs text-slate-400 font-medium">({selectedInterval.nameEn})</span>
            </div>
            <p className="text-xs text-amber-300 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {INTERVAL_MNEMONICS[selectedInterval.code]?.song} — {INTERVAL_MNEMONICS[selectedInterval.code]?.hint}
            </p>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Khoảng cách: <strong className="text-cyan-400">{selectedInterval.semitones} nửa cung</strong> | Hai nốt:{' '}
              <strong className="text-emerald-400">{rootNote}</strong> &rarr;{' '}
              <strong className="text-amber-400">{targetNote}</strong>
            </div>
          </div>

          {/* 3 Playback buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlay('ascending')}
              disabled={isPlaying}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Giai Điệu Đi Lên</span>
            </button>
            <button
              onClick={() => handlePlay('descending')}
              disabled={isPlaying}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95"
            >
              <span>Đi Xuống</span>
            </button>
            <button
              onClick={() => handlePlay('harmonic')}
              disabled={isPlaying}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
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

      {/* Grid of 13 Intervals */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          🎹 Bảng 13 Quãng Âm & Bí Kíp Ghi Nhớ Bằng Giai Điệu Quen Thuộc
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(INTERVAL_CATALOG).map((item) => {
            const isSelected = selectedIntervalCode === item.code;
            const mnemonic = INTERVAL_MNEMONICS[item.code];

            return (
              <button
                key={item.code}
                onClick={() => {
                  setSelectedIntervalCode(item.code);
                  auditoryEngine.resumeAudioContext().catch(() => {});
                  const tNote = Note.transpose(rootNote, item.code);
                  auditoryEngine.playInterval(rootNote, tNote, 'ascending', 0.5, 350);
                }}
                className={`p-4 rounded-2xl text-left border-2 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-slate-900 dark:text-white shadow-md ring-2 ring-cyan-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-cyan-400 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400">
                    {item.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {item.semitones} nửa cung
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{item.nameVi}</div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 truncate">
                  💡 {mnemonic?.song}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                  "{item.ratioDescription}"
                </div>
              </button>
            );
          })}
        </div>
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
          className="px-6 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-95 transition-all"
        >
          <span>Luyện Tập: Nhận Diện Quãng (Interval Identify)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
