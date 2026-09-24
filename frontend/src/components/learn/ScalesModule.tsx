import React, { useState } from 'react';
import { Scale, Note } from 'tonal';
import { auditoryEngine } from '../../services/auditoryEngine';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { Play, Volume2, Music, Sparkles } from 'lucide-react';

interface IScaleInfo {
  name: string;
  nameVi: string;
  mode: string;
  feel: string;
}

const POPULAR_SCALES: IScaleInfo[] = [
  { name: 'major', nameVi: 'Trưởng Tự Nhiên (Ionian)', mode: 'Ionian', feel: 'Tươi sáng, hoàn mỹ, kinh điển' },
  { name: 'minor', nameVi: 'Thứ Tự Nhiên (Aeolian)', mode: 'Aeolian', feel: 'U buồn, tự nhiên, sâu lắng' },
  { name: 'harmonic minor', nameVi: 'Thứ Hòa Âm (Harmonic Minor)', mode: 'Harmonic', feel: 'Ả Rập, Trung Đông bí ẩn, kịch tính' },
  { name: 'dorian', nameVi: 'Dorian Mode', mode: 'Dorian', feel: 'Màu sắc Trung Cổ, Jazz/Funk, u sầu nhưng hi vọng' },
  { name: 'mixolydian', nameVi: 'Mixolydian Mode', mode: 'Mixolydian', feel: 'Classic Rock, Bluesy, tươi sáng phóng khoáng' },
  { name: 'lydian', nameVi: 'Lydian Mode', mode: 'Lydian', feel: 'Phim điện ảnh, khoa học viễn tưởng, huyền ảo bay bổng' },
  { name: 'phrygian', nameVi: 'Phrygian Mode', mode: 'Phrygian', feel: 'Flamenco Tây Ban Nha, căng thẳng, ma mị' },
  { name: 'major pentatonic', nameVi: 'Ngũ Cung Trưởng', mode: 'Pentatonic', feel: 'Dân ca Á Đông, trong trẻo, êm đềm' },
  { name: 'minor pentatonic', nameVi: 'Ngũ Cung Thứ', mode: 'Pentatonic', feel: 'Blues, Rock solo kinh điển' },
  { name: 'blues', nameVi: 'Âm Giai Blues (với Blue Note)', mode: 'Blues', feel: 'Màu sắc Blues nồng nàn, gai góc' },
];

export const ScalesModule: React.FC = () => {
  const [selectedScaleType, setSelectedScaleType] = useState<string>('major');
  const [root, setRoot] = useState<string>('C');
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Get notes for scale
  const scaleData = Scale.get(`${root}4 ${selectedScaleType}`);
  const scaleNotes = scaleData.notes.map(n => n.includes('4') || n.includes('5') ? n : `${n}4`);

  // Build full ascending + descending sequence with octave return
  const fullSequence = [
    ...scaleNotes,
    `${root}5`,
    ...[...scaleNotes].reverse()
  ];

  const handlePlayScale = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await auditoryEngine.resumeAudioContext();
      for (let i = 0; i < fullSequence.length; i++) {
        const note = fullSequence[i];
        setActiveNote(note);
        auditoryEngine.playNote(note, 0.35, { volume: 0.45 });
        await new Promise(r => setTimeout(r, 280));
      }
    } finally {
      setActiveNote(null);
      setIsPlaying(false);
    }
  };

  const currentInfo = POPULAR_SCALES.find(s => s.name === selectedScaleType) || POPULAR_SCALES[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Theory */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎵</span>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Khái Niệm 4: Âm Giai & Điệu Thức (Scales & Modes)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chuỗi các nốt nhạc được sắp xếp theo quy luật cung và nửa cung, định hình phong cách âm nhạc
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Âm giai (Scale)</strong> là một tập hợp các nốt nhạc được sắp xếp theo thứ tự cao độ tăng dần hoặc giảm dần. Nếu hợp âm là "khối màu" thì âm giai là "bảng màu" đầy đủ để người nghệ sĩ sáng tác nên giai điệu.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-3">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                Quy luật Cung - Nửa Cung của Âm Giai Trưởng
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Công thức: <strong>1 - 1 - 1/2 - 1 - 1 - 1 - 1/2</strong> (C - D - E - F - G - A - B - C).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <h4 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                Điệu thức Giáo Hội (Church Modes)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Cùng 7 phím trắng piano nhưng bắt đầu từ nốt khác nhau (Dorian từ D, Phrygian từ E...) tạo nên các tâm trạng âm nhạc kỳ ảo khác nhau!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Scale Player */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-emerald-400" />
              Khám Phá Điệu Thức Trên Piano
            </h3>
            <p className="text-xs text-slate-400">
              Chọn nốt gốc và loại âm giai để xem các nốt sáng đèn và nghe chạy thang âm
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Chủ âm:</span>
            {['C', 'D', 'E', 'F', 'G', 'A'].map(n => (
              <button
                key={n}
                onClick={() => setRoot(n)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                  root === n ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Current Scale Banner */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 font-black text-base font-mono">
                {root} {currentInfo.nameVi}
              </span>
            </div>
            <p className="text-xs text-amber-300 mt-1.5 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              {currentInfo.feel}
            </p>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Các nốt trong âm giai:{' '}
              {scaleNotes.map(n => (
                <span key={n} className="inline-block mr-1.5 px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                  {n.replace(/\d/, '')}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlayScale}
            disabled={isPlaying}
            className="px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-400/30 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-4 h-4 animate-spin" />
                <span>Đang phát thang âm...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Phát Âm Giai Lên & Xuống</span>
              </>
            )}
          </button>
        </div>

        {/* Piano Keyboard */}
        <div className="flex justify-center pt-2">
          <PianoKeyboard
            octaveRange={[4, 5]}
            selectedNotes={scaleNotes}
            activeNotes={activeNote ? [activeNote] : []}
            enableMidiHighlight={true}
          />
        </div>
      </div>

      {/* Scale Catalog Grid */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          🎼 10 Âm Giai & Điệu Thức Kinh Điển
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POPULAR_SCALES.map((scale) => {
            const isSelected = selectedScaleType === scale.name;
            return (
              <button
                key={scale.name}
                onClick={() => setSelectedScaleType(scale.name)}
                className={`p-4 rounded-2xl text-left border-2 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{scale.nameVi}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {scale.mode}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  💡 {scale.feel}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
