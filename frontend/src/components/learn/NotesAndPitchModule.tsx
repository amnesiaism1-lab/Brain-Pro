import React, { useState } from 'react';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { auditoryEngine } from '../../services/auditoryEngine';
import { MidiStatusIndicator } from '../ui/MidiStatusIndicator';
import { InteractiveOscilloscope } from '../ui/InteractiveOscilloscope';
import { Play, Volume2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const NOTE_TABLE = [
  { note: 'C', vi: 'Đô', alt: 'Do', freq4: 261.63, freq5: 523.25 },
  { note: 'C# / Db', vi: 'Đô thăng / Rê giáng', alt: 'Do#/Reb', freq4: 277.18, freq5: 554.37 },
  { note: 'D', vi: 'Rê', alt: 'Re', freq4: 293.66, freq5: 587.33 },
  { note: 'D# / Eb', vi: 'Rê thăng / Mi giáng', alt: 'Re#/Mib', freq4: 311.13, freq5: 622.25 },
  { note: 'E', vi: 'Mi', alt: 'Mi', freq4: 329.63, freq5: 659.25 },
  { note: 'F', vi: 'Fa', alt: 'Fa', freq4: 349.23, freq5: 698.46 },
  { note: 'F# / Gb', vi: 'Fa thăng / Sol giáng', alt: 'Fa#/Solb', freq4: 369.99, freq5: 739.99 },
  { note: 'G', vi: 'Sol', alt: 'Sol', freq4: 392.00, freq5: 783.99 },
  { note: 'G# / Ab', vi: 'Sol thăng / La giáng', alt: 'Sol#/Lab', freq4: 415.30, freq5: 830.61 },
  { note: 'A', vi: 'La (Chuẩn 440Hz)', alt: 'La', freq4: 440.00, freq5: 880.00 },
  { note: 'A# / Bb', vi: 'La thăng / Si giáng', alt: 'La#/Sib', freq4: 466.16, freq5: 932.33 },
  { note: 'B', vi: 'Si', alt: 'Si', freq4: 493.88, freq5: 987.77 },
];

export const NotesAndPitchModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug } = useAppStore();
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [continuousFreq, setContinuousFreq] = useState<number>(440);
  const [isPlayingContinuous, setIsPlayingContinuous] = useState(false);

  const handlePlayNote = (note: string) => {
    setActiveNote(note);
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.playNote(note, 0.6, { volume: 0.5 });
    setTimeout(() => setActiveNote(null), 350);
  };

  const handlePlayFreq = (freq: number) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.playNote(freq, 0.6, { volume: 0.45 });
  };

  const handleStartPitchExercise = () => {
    setSelectedExerciseSlug('pitch-recall');
    setActiveTab('exercises');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview & Theory Box */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎹</span>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Khái Niệm 1: Nốt Nhạc & Cao Độ (Pitch)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Hiểu bản chất vật lý của sóng âm và 12 nốt trong hệ thống bình quân luật
              </p>
            </div>
          </div>
          <MidiStatusIndicator />
        </div>

        <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Cao độ (Pitch)</strong> là cảm giác thính giác về độ "cao" (thanh) hay "thấp" (trầm) của âm thanh, được quyết định trực tiếp bởi <strong>tần số dao động (Hz)</strong> của sóng âm. Tần số dao động càng nhanh thì tai ta nghe càng cao.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 not-prose">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1">
                Quy luật Quãng 8 (Octave): Gấp đôi tần số
              </h4>
              <p className="text-slate-600 dark:text-slate-300">
                Khi tần số dao động của một nốt tăng gấp đôi (hoặc giảm một nửa), tai con người cảm nhận chúng là <em>cùng một nốt nhưng ở quãng cao hơn</em>:
                <br />• <strong>A3</strong> = 220 Hz &nbsp;→&nbsp; <strong>A4</strong> = 440 Hz (chuẩn quốc tế) &nbsp;→&nbsp; <strong>A5</strong> = 880 Hz.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
              <h4 className="font-bold text-cyan-700 dark:text-cyan-400 text-sm mb-1">
                Hệ Thống 12 Bình Quân Luật (12-TET)
              </h4>
              <p className="text-slate-600 dark:text-slate-300">
                Âm nhạc phương Tây hiện đại chia một quãng tám thành <strong>12 nửa cung (semitones)</strong> hoàn toàn bằng nhau về mặt toán học theo tỉ lệ lũy thừa <code>2^(1/12) ≈ 1.05946</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Piano Section */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              Bàn Phím Piano Tương Tác (Octave 4 - 5)
            </h3>
            <p className="text-xs text-slate-400">
              Nhấn chuột hoặc bấm phím trên đàn MIDI thật để nghe và quan sát cao độ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">So sánh Octave A:</span>
            <button
              onClick={() => handlePlayNote('A3')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-amber-300"
            >
              A3 (220Hz)
            </button>
            <button
              onClick={() => handlePlayNote('A4')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-cyan-300"
            >
              A4 (440Hz)
            </button>
            <button
              onClick={() => handlePlayNote('A5')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-emerald-300"
            >
              A5 (880Hz)
            </button>
          </div>
        </div>

        {/* Real-time Oscilloscope */}
        <InteractiveOscilloscope height={70} lineColor="#22d3ee" isActive={true} />

        {/* 2-Octave Piano */}
        <div className="flex justify-center pt-2">
          <PianoKeyboard
            octaveRange={[4, 5]}
            activeNotes={activeNote ? [activeNote] : []}
            onKeyClick={handlePlayNote}
            enableMidiHighlight={true}
          />
        </div>
      </div>

      {/* Continuous Frequency Sweep Section */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          🔬 Thử Nghiệm Tần Số Liên Tục (Pure Tone Generator)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Kéo thanh trượt để trải nghiệm sự thay đổi cao độ từ trầm đến bổng (từ 110Hz đến 1760Hz):
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="w-full sm:flex-1 space-y-2">
            <div className="flex justify-between text-xs font-mono font-bold">
              <span className="text-slate-500">110 Hz (A2)</span>
              <span className="text-base text-cyan-600 dark:text-cyan-400 font-black">{continuousFreq} Hz</span>
              <span className="text-slate-500">1760 Hz (A6)</span>
            </div>
            <input
              type="range"
              min={110}
              max={1760}
              step={1}
              value={continuousFreq}
              onChange={(e) => {
                const val = Number(e.target.value);
                setContinuousFreq(val);
                handlePlayFreq(val);
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={() => handlePlayFreq(continuousFreq)}
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Phát {continuousFreq} Hz</span>
          </button>
        </div>
      </div>

      {/* Note Reference Table */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          📑 Bảng Đối Chiếu 12 Nốt: Quốc Tế ↔ Tên Việt ↔ Tần Số
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Ký hiệu Quốc Tế</th>
                <th className="p-3">Tên Tiếng Việt</th>
                <th className="p-3">Tần số Octave 4</th>
                <th className="p-3">Tần số Octave 5</th>
                <th className="p-3 text-right">Thử Nghe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {NOTE_TABLE.map((row) => (
                <tr key={row.note} className="hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{row.note}</td>
                  <td className="p-3 font-sans text-slate-600 dark:text-slate-300 font-semibold">{row.vi}</td>
                  <td className="p-3 text-cyan-600 dark:text-cyan-400 font-bold">{row.freq4} Hz</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">{row.freq5} Hz</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handlePlayNote(`${row.note.split(' ')[0]}4`)}
                      className="px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-sans font-bold text-[11px]"
                    >
                      ▶ Nghe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: Đường Nét Giai Điệu (Melodic Contour - Parsons Code - M1-1) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Đường Nét Giai Điệu & Mã Parsons (Melodic Contour)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trước khi nhớ chính xác nốt cụ thể, vỏ não thính giác nhận dạng hình dáng chuyển động: Lên (Up), Xuống (Down) hay Đứng Yên (Repeat)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              name: 'Đường Leo Lên (Ascent)',
              symbol: '↗',
              code: 'U - U - U',
              desc: 'Giai điệu bước đều lên cao',
              notes: ['C4', 'E4', 'G4', 'C5']
            },
            {
              name: 'Đường Hạ Xuống (Descent)',
              symbol: '↘',
              code: 'D - D - D',
              desc: 'Giai điệu hạ dần xuống thấp',
              notes: ['C5', 'G4', 'E4', 'C4']
            },
            {
              name: 'Hình Cầu Vồng (Arch ∧)',
              symbol: '∧',
              code: 'U - U - D - D',
              desc: 'Lên đỉnh cao rồi lượn xuống',
              notes: ['C4', 'G4', 'C5', 'G4', 'C4']
            },
            {
              name: 'Lượn Sóng (Wave ∿)',
              symbol: '∿',
              code: 'U - D - U - D',
              desc: 'Lên xuống nhấp nhô luân phiên',
              notes: ['C4', 'G4', 'E4', 'A4', 'F4']
            }
          ].map(c => (
            <div key={c.name} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{c.symbol}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{c.code}</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1">{c.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{c.desc}</p>
              </div>

              <button
                onClick={async () => {
                  await auditoryEngine.resumeAudioContext();
                  auditoryEngine.playNoteSequence(c.notes, 280, 0.4);
                }}
                className="w-full py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-cyan-500/20"
              >
                <span>▶ Nghe Dáng Nét</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Nốt Ngoại Điệu (Chromatic Oddball - M0-4) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Phát Hiện Nốt Ngoại Điệu "Sai Nhà" (Chromatic Oddball)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rèn luyện phản xạ ức chế nhận thức (Inhibition Control) khi nghe một nốt thăng/giáng lạc loài xen vào giai điệu
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Khi một câu nhạc đang diễn ra êm ả trong thang âm tự nhiên Đô Trưởng (C Major), nếu xuất hiện 1 nốt chromatic bất thường (như F# hoặc G#), 
          vỏ não sẽ phát ra điện thế không khớp MMN (Mismatch Negativity) tức thì.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={async () => {
              await auditoryEngine.resumeAudioContext();
              // In-key melody: C - D - E - G - A - C
              auditoryEngine.playNoteSequence(['C4', 'D4', 'E4', 'G4', 'A4', 'C5'], 280, 0.4);
            }}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-left hover:bg-emerald-100/50 transition-all active:scale-98 flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">
                1. Giai Điệu Thuần Trong Giọng (In-Key)
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                C4 - D4 - E4 - G4 - A4 - C5 (Hoàn toàn thuận tai)
              </span>
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">▶</span>
          </button>

          <button
            onClick={async () => {
              await auditoryEngine.resumeAudioContext();
              // Melody with F# chromatic intruder at position 4
              auditoryEngine.playNoteSequence(['C4', 'D4', 'E4', 'F#4', 'A4', 'C5'], 280, 0.4);
            }}
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-left hover:bg-rose-100/50 transition-all active:scale-98 flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-black text-rose-800 dark:text-rose-300 block">
                2. Giai Điệu Bị Xâm Nhập (Chromatic Oddball)
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                C4 - D4 - E4 - <strong className="underline">F#4 (Lạ!)</strong> - A4 - C5
              </span>
            </div>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">▶</span>
          </button>
        </div>
      </div>

      {/* CTA to Practice */}
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 via-brand-500/10 to-purple-500/10 border border-brand-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Đã nắm vững nốt nhạc và cao độ?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Thử thách tai của bạn với bài tập ghi nhớ chuỗi cao độ trên đàn piano!
          </p>
        </div>
        <button
          onClick={handleStartPitchExercise}
          className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
        >
          <span>Luyện Tập: Nhớ Cao Độ (Pitch Recall)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
