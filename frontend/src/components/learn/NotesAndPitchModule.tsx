import React, { useState } from 'react';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { auditoryEngine } from '../../services/auditoryEngine';
import { MidiStatusIndicator } from '../ui/MidiStatusIndicator';
import { InteractiveOscilloscope } from '../ui/InteractiveOscilloscope';
import { Play, Volume2, ArrowRight, TrendingUp, RotateCcw, Compass, Layers } from 'lucide-react';
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
  const [activeContourPreview, setActiveContourPreview] = useState<string | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

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

  const handlePlaySequence = async (notes: string[], name?: string) => {
    if (isPlayingDemo) return;
    try {
      setIsPlayingDemo(true);
      if (name) setActiveContourPreview(name);
      await auditoryEngine.resumeAudioContext();
      for (const n of notes) {
        auditoryEngine.playNote(n, 0.42, { volume: 0.6 });
        await new Promise(r => setTimeout(r, 340));
      }
    } finally {
      setIsPlayingDemo(false);
    }
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
              Nhấp chuột hoặc kết nối đàn MIDI USB để trải nghiệm âm sắc nốt nhạc thực tế
            </p>
          </div>
          {activeNote && (
            <div className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold text-xs animate-pulse">
              Đang phát: {activeNote}
            </div>
          )}
        </div>

        <div className="flex justify-center py-2 overflow-x-auto">
          <PianoKeyboard
            octaveRange={[4, 5]}
            activeNotes={activeNote ? [activeNote] : []}
            onKeyClick={handlePlayNote}
            showLabels={true}
            enableMidiHighlight={true}
          />
        </div>
      </div>

      {/* Oscilloscope & Frequency Generator Section */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔬</span> Trực Quan Hóa Sóng Âm (Oscilloscope)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quan sát dạng sóng hình sin dao động theo thời gian thực tương ứng với từng tần số Hertz
          </p>
        </div>

        <InteractiveOscilloscope height={130} />

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Thử nhanh các mốc tần số chuẩn:
          </span>
          {[220, 261.63, 329.63, 440, 523.25, 880].map((f) => (
            <button
              key={f}
              onClick={() => handlePlayFreq(f)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
            >
              {f} Hz
            </button>
          ))}
        </div>
      </div>

      {/* Note Frequency Reference Table */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          Bảng Tra Cứu Tần Số 12 Bán Âm Trong Quãng 4 & 5
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2.5 px-3">Ký Hiệu Nốt</th>
                <th className="py-2.5 px-3">Tên Việt Nam</th>
                <th className="py-2.5 px-3">Tần số Octave 4</th>
                <th className="py-2.5 px-3">Tần số Octave 5</th>
                <th className="py-2.5 px-3 text-right">Thử Âm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {NOTE_TABLE.map((row) => (
                <tr key={row.note} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{row.note}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">{row.vi}</td>
                  <td className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">{row.freq4} Hz</td>
                  <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400">{row.freq5} Hz</td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => handlePlayNote(`${row.note.split(' ')[0]}4`)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition-all"
                    >
                      Nghe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHUYÊN ĐỀ 1: Melodic Contour & Parsons Code (Cấp 10) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              1. Đường Nét Giai Điệu & Mã Parsons (Melodic Contour - Cấp 10)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trước khi nhớ chính xác nốt cụ thể, vỏ não thính giác nhận dạng hình dáng chuyển động: Lên (Up - U), Xuống (Down - D) hay Đứng Yên (Repeat - R)
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Khoa học nhận thức âm nhạc chứng minh rằng <strong>hình dáng tổng thể (Gestalt Contour)</strong> là thứ đầu tiên não bộ lưu trữ khi nghe một câu hát mới. Mã Parsons chỉ ghi lại xu hướng chuyển động tương đối giữa các nốt liên tiếp, độc lập hoàn toàn với giọng (key) hay cao độ tuyệt đối.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              id: 'ascend',
              name: 'Đường Lên Liên Tục (Ascending)',
              symbol: '↗',
              code: 'U → U → U',
              desc: 'Chuỗi nốt leo dần lên cao từng bước',
              notes: ['C4', 'E4', 'G4', 'C5'],
              points: [
                { x: 10, y: 35 }, { x: 40, y: 25 }, { x: 70, y: 15 }, { x: 100, y: 5 }
              ]
            },
            {
              id: 'descend',
              name: 'Đường Xuống Liên Tục (Descending)',
              symbol: '↘',
              code: 'D → D → D',
              desc: 'Chuỗi nốt hạ dần xuống thấp như bậc thang',
              notes: ['C5', 'G4', 'E4', 'C4'],
              points: [
                { x: 10, y: 5 }, { x: 40, y: 15 }, { x: 70, y: 25 }, { x: 100, y: 35 }
              ]
            },
            {
              id: 'arch',
              name: 'Hình Cầu Vồng (Arch ∧)',
              symbol: '∧',
              code: 'U → U → D → D',
              desc: 'Giai điệu bay lên đỉnh rồi lượn xuống thấp',
              notes: ['C4', 'G4', 'C5', 'G4', 'C4'],
              points: [
                { x: 10, y: 35 }, { x: 32, y: 20 }, { x: 55, y: 5 }, { x: 78, y: 20 }, { x: 100, y: 35 }
              ]
            },
            {
              id: 'wave',
              name: 'Lượn Sóng Nhấp Nhô (Wave ∿)',
              symbol: '∿',
              code: 'U → D → U → D',
              desc: 'Lên rồi xuống luân phiên nhịp nhàng',
              notes: ['E4', 'A4', 'D4', 'G4', 'E4'],
              points: [
                { x: 10, y: 25 }, { x: 32, y: 8 }, { x: 55, y: 32 }, { x: 78, y: 12 }, { x: 100, y: 25 }
              ]
            }
          ].map(c => {
            const isPlaying = activeContourPreview === c.id && isPlayingDemo;
            const polylineStr = c.points.map(p => `${p.x},${p.y}`).join(' ');

            return (
              <div 
                key={c.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isPlaying 
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-md' 
                    : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{c.symbol}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{c.code}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1.5">{c.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{c.desc}</p>
                </div>

                {/* Mini SVG Trajectory Preview */}
                <div className="w-full h-12 bg-slate-900 rounded-xl flex items-center justify-center p-1 overflow-hidden">
                  <svg viewBox="0 0 110 40" className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke={isPlaying ? '#f59e0b' : '#06b6d4'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylineStr}
                    />
                    {c.points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill={isPlaying ? '#fbbf24' : '#38bdf8'}
                      />
                    ))}
                  </svg>
                </div>

                <button
                  type="button"
                  disabled={isPlayingDemo}
                  onClick={() => handlePlaySequence(c.notes, c.id)}
                  className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs ${
                    isPlaying 
                      ? 'bg-amber-500 text-slate-950 font-black' 
                      : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlaying ? 'Đang phát...' : '▶ Nghe Dáng Nét'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHUYÊN ĐỀ 2: Bát Độ Tương Đương & Bước Nhảy Âm Vực (Cấp 11) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              2. Bát Độ Tương Đương: Sắc Tính Âm (Chroma) vs Chiều Cao Âm (Height - Cấp 11)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Giải mã hiện tượng tại sao nốt C3, C4, C5 cùng mang tên "Đô" nhưng lại tạo nên bước nhảy cao độ kịch tính
            </p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
          <p>
            Mô hình xoắn ốc âm thanh của Shepard (The Pitch Spiral) phân tích cảm nhận cao độ thành 2 trục độc lập:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pitch Chroma (Sắc tính âm):</strong> Vị trí của nốt trên vòng cung 12 cung tròn (Đô, Rê, Mi...). Các nốt cách nhau đúng 1 quãng tám (như C3, C4, C5) có <em>Chroma giống hệt nhau</em> vì tỷ lệ họa âm chẵn 2:1 hòa quyện hoàn hảo.</li>
            <li><strong>Pitch Height (Độ cao âm thanh):</strong> Trục thẳng đứng đo tần số Hertz tuyến tính (C3 = 130.8Hz trầm đục, C4 = 261.6Hz trung âm, C5 = 523.2Hz thanh sáng).</li>
          </ul>
          <p>
            Ở Cấp 11 (Bước Nhảy Bát Độ), thử thách dành cho bạn là không để hiện tượng "trùng sắc tính" đánh lừa thính giác khi ngón tay phải bấm đúng phím đàn ở tầng quãng tám chính xác.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <button
            type="button"
            disabled={isPlayingDemo}
            onClick={() => handlePlaySequence(['C3', 'C4', 'C5', 'C4', 'C3'])}
            className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-black text-amber-800 dark:text-amber-300 block">
                Thí Nghiệm 1: Bước Nhảy Đô 3 ↔ Đô 4 ↔ Đô 5
              </span>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                Cùng 1 nốt Đô nhưng tần số gấp đôi liên tiếp (130Hz → 261Hz → 523Hz)
              </span>
            </div>
            <Volume2 className="w-5 h-5 text-amber-600 shrink-0" />
          </button>

          <button
            type="button"
            disabled={isPlayingDemo}
            onClick={() => handlePlaySequence(['C3', 'G4', 'E3', 'B4', 'C5'])}
            className="p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-left transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 block">
                Thí Nghiệm 2: Giai Điệu Bát Độ Xen Kẽ (Octave Leap Jumps)
              </span>
              <span className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80">
                Chuỗi nhảy vọt liên tục giữa âm vực trầm C3 và âm vực cao C5
              </span>
            </div>
            <Volume2 className="w-5 h-5 text-indigo-600 shrink-0" />
          </button>
        </div>
      </div>

      {/* CHUYÊN ĐỀ 3: Thao Tác Trí Nhớ Làm Việc Đảo Ngược (Cấp 9) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              3. Thao Tác Trí Nhớ Làm Việc Đảo Ngược (Reverse Recall - Cấp 9)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kỹ thuật kích hoạt vùng trán trước trán lưng bên (DLPFC) để lưu trữ và đảo ngược trật tự thời gian
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Trong bài kiểm tra trí thông minh Wechsler (WAIS-IV), bài test <strong>Lặp số đảo ngược (Backward Digit Span)</strong> được coi là thước đo chuẩn xác nhất cho <em>Khả năng xử lý trí nhớ làm việc (Working Memory Manipulation)</em>. Ở Cấp 9, bạn không thể chỉ "phát lại thụ động" âm thanh vừa nghe; bộ não buộc phải giữ nguyên mảng dữ liệu âm thanh và đọc lại theo chỉ số nghịch đảo từ nốt cuối cùng về nốt đầu tiên.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <button
            type="button"
            disabled={isPlayingDemo}
            onClick={() => handlePlaySequence(['C4', 'E4', 'G4', 'B4'])}
            className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-left transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                1. Nghe Chuỗi Xuôi: C4 → E4 → G4 → B4
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Thứ tự phát âm tự nhiên theo thời gian
              </span>
            </div>
            <Volume2 className="w-5 h-5 text-slate-500 shrink-0" />
          </button>

          <button
            type="button"
            disabled={isPlayingDemo}
            onClick={() => handlePlaySequence(['B4', 'G4', 'E4', 'C4'])}
            className="p-4 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-left transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-black text-purple-800 dark:text-purple-300 block">
                2. Thứ Tự Bạn Phải Gõ: B4 → G4 → E4 → C4
              </span>
              <span className="text-[11px] text-purple-700/80 dark:text-purple-400/80">
                Đảo ngược chuỗi từ cuối lên đầu
              </span>
            </div>
            <RotateCcw className="w-5 h-5 text-purple-600 shrink-0" />
          </button>
        </div>
      </div>

      {/* CHUYÊN ĐỀ 4: Nốt Ngoại Điệu (Chromatic Oddball - Cấp 12) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
            <span>⚡</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              4. Trọng Lực Điệu Thức & Nốt Ngoại Điệu (Chromatic Oddball - Cấp 12)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rèn luyện phản xạ ức chế nhận thức (Inhibition Control) khi nghe một nốt thăng/giáng ngoại điệu xen vào giai điệu
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Khi một câu nhạc diễn ra trong thang âm tự nhiên Đô Trưởng (C Major), nếu xuất hiện 1 nốt chromatic bất thường (như F# hoặc G#), 
          vỏ não sẽ phát ra điện thế không khớp MMN (Mismatch Negativity) tức thì do sự phá vỡ cấu trúc âm chuẩn (Tonal Gravity Schema).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isPlayingDemo}
            onClick={() => handlePlaySequence(['C4', 'D4', 'E4', 'G4', 'A4', 'C5'])}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-left hover:bg-emerald-100/50 transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
          >
            <div>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">
                1. Giai Điệu Thuần Trong Giọng (In-Key)
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                C4 - D4 - E4 - G4 - A4 - C5 (Hoàn toàn thuận tai)
              </span>
            </div>
            <Volume2 className="w-5 h-5 text-emerald-600 shrink-0" />
          </button>

          <button
            type="button"
            disabled={isPlayingDemo}
            onClick={() => handlePlaySequence(['C4', 'D4', 'E4', 'F#4', 'A4', 'C5'])}
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-left hover:bg-rose-100/50 transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
          >
            <div>
              <span className="text-xs font-black text-rose-800 dark:text-rose-300 block">
                2. Giai Điệu Bị Xâm Nhập (Chromatic Oddball)
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                C4 - D4 - E4 - <strong className="underline">F#4 (Lạ!)</strong> - A4 - C5
              </span>
            </div>
            <Volume2 className="w-5 h-5 text-rose-600 shrink-0" />
          </button>
        </div>
      </div>

      {/* BẢN ĐỒ TIẾN HÓA 12 CẤP ĐỘ NHẬN THỨC CAO ĐỘ */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Bản Đồ 12 Cấp Độ Nhận Thức Của Bài Tập Nhớ Cao Độ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lộ trình sư phạm khoa học giúp não bộ phát triển từ người mới bắt đầu đến năng lực cảm âm tinh nhuệ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-700 dark:text-blue-300">
                Chặng 1 (Cấp 1 - 3)
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">Khởi Động Dấu Vết Âm Học</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Chuỗi 3–4 nốt tự nhiên (Diatonic) trong Octave 4. Cấp 1–2 có đèn phím gợi ý trực quan để liên kết âm thanh và vị trí không gian; Cấp 3 tắt hoàn toàn gợi ý, buộc bộ não kích hoạt trí nhớ thính giác thuần túy (Blind Echoic Memory).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                Chặng 2 (Cấp 4 - 8)
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">Mở Rộng Dung Lượng & Bán Âm</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Xuất hiện phím đen (bán âm Chromatic), mở rộng âm vực từ 1 lên 2 và 3 quãng tám (C3–B5), chuỗi nốt tăng dần từ 5 lên 7 nốt — chạm giới hạn dung lượng trí nhớ làm việc kinh điển của George Miller (7 ± 2 đơn vị).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-700 dark:text-purple-300">
                Chặng 3 (Cấp 9 - 10)
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">Thao Tác Trí Nhớ & Gestalt</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Cấp 9:</strong> Đảo ngược chuỗi âm thanh (Reverse Recall) đòi hỏi thùy trán DLPFC lưu giữ và đảo thứ tự thời gian. <strong>Cấp 10:</strong> Nhận diện hình dáng quỹ đạo giai điệu toàn cục (Melodic Contour) theo mã Parsons (Lên, Xuống, Cầu Vồng, Lượn Sóng).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300">
                Chặng 4 (Cấp 11 - 12)
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">Bát Độ & Trọng Lực Điệu Thức</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Cấp 11:</strong> Bước nhảy quãng 8 (Octave Leaps) thử thách phân biệt Sắc tính âm (Pitch Chroma) vs Chiều cao âm (Pitch Height). <strong>Cấp 12:</strong> Bắt nốt ngoại điệu (Chromatic Oddball) rèn luyện sự nhạy bén của điện thế không khớp MMN trong hệ âm điệu thức.
            </p>
          </div>
        </div>
      </div>

      {/* CTA to Practice */}
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 via-brand-500/10 to-purple-500/10 border border-brand-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Đã nắm vững nốt nhạc và cao độ?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Thử thách tai của bạn với trọn bộ 12 cấp độ rèn luyện nhận thức cao độ trên đàn piano!
          </p>
        </div>
        <button
          onClick={handleStartPitchExercise}
          className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <span>Luyện Tập: Nhớ Cao Độ (Pitch Recall)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
