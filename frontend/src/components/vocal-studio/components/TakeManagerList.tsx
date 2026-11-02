import React, { useState } from 'react';
import {
  Mic,
  Star,
  Trash2,
  Download,
  Play,
  Pause,
  Edit2,
  Check,
  AlertTriangle,
  HardDrive,
} from 'lucide-react';
import { IYouTubeTake } from '../../../services/youtubeTakeStorageService';
import { formatTimeMs } from '../utils/vocalHelpers';

interface TakeManagerListProps {
  takes: IYouTubeTake[];
  activeTakeId: string | null;
  isPlaying: boolean;
  onSelectTake: (take: IYouTubeTake) => void;
  onTogglePlayTake: (take: IYouTubeTake) => void;
  onMarkBestTake: (takeId: string) => void;
  onDeleteTake: (takeId: string) => void;
  onUpdateTakeNote: (takeId: string, note: string) => void;
  onDownloadVocalWav: (take: IYouTubeTake) => void;
  onClearAllTakes: () => void;
  storageUsageMb?: number | null;
}

export const TakeManagerList: React.FC<TakeManagerListProps> = ({
  takes,
  activeTakeId,
  isPlaying,
  onSelectTake,
  onTogglePlayTake,
  onMarkBestTake,
  onDeleteTake,
  onUpdateTakeNote,
  onDownloadVocalWav,
  onClearAllTakes,
  storageUsageMb,
}) => {
  const [editingNoteTakeId, setEditingNoteTakeId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const startEditNote = (take: IYouTubeTake) => {
    setEditingNoteTakeId(take.id);
    setNoteText(take.note || '');
  };

  const saveEditNote = (takeId: string) => {
    onUpdateTakeNote(takeId, noteText.trim());
    setEditingNoteTakeId(null);
  };

  return (
    <div className="space-y-3">
      {/* List Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">Danh Sách Bản Thu (Takes)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
            {takes.length} takes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {storageUsageMb !== undefined && storageUsageMb !== null && (
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              {storageUsageMb} MB
            </span>
          )}

          {takes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition cursor-pointer"
            >
              Xóa tất cả takes
            </button>
          )}
        </div>
      </div>

      {/* Confirmation modal/drawer for wiping session takes */}
      {showConfirmClear && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Xác nhận xóa toàn bộ các bản thu trong phiên này?</span>
          </div>
          <p className="text-[11px] text-rose-200/80">
            Hành động này sẽ giải phóng bộ nhớ IndexedDB trên máy của bạn và không thể hoàn tác.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowConfirmClear(false)}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirmClear(false);
                onClearAllTakes();
              }}
              className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 cursor-pointer"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {takes.length === 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <Mic className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-semibold">Chưa có bản thu nào</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Bấm nút &ldquo;Bắt Đầu Thu&rdquo; ở trên để ghi âm take đầu tiên của bạn. Bạn có thể thu nhiều take để so sánh và chọn bản ưng ý nhất!
          </p>
        </div>
      )}

      {/* Takes Cards */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {takes.map((take) => {
          const isActive = take.id === activeTakeId;
          const isNoteEditing = editingNoteTakeId === take.id;

          return (
            <div
              key={take.id}
              onClick={() => onSelectTake(take)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-950/30 border-sky-500/50 shadow-md shadow-sky-500/5'
                  : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Play/Pause & Take Title */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlayTake(take);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 cursor-pointer ${
                      isActive && isPlaying
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200'
                    }`}
                    title={isActive && isPlaying ? 'Tạm dừng' : 'Nghe thử take này'}
                  >
                    {isActive && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        Take #{take.takeNumber}
                      </span>
                      {take.isBestTake && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[9px] flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                          <span>Tốt nhất</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                      <span>Thời lượng: {formatTimeMs(Math.round(take.durationSec * 1000))}</span>
                      <span>•</span>
                      <span>Mốc: {formatTimeMs(Math.round(take.startPointSec * 1000))}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Mark Best, Download WAV, Edit Note, Delete */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Mark as Best */}
                  <button
                    type="button"
                    onClick={() => onMarkBestTake(take.id)}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      take.isBestTake
                        ? 'text-amber-400 bg-amber-400/10'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                    }`}
                    title={take.isBestTake ? 'Đã chọn làm take tốt nhất' : 'Đặt làm take tốt nhất'}
                  >
                    <Star className={`w-3.5 h-3.5 ${take.isBestTake ? 'fill-amber-400' : ''}`} />
                  </button>

                  {/* Download solo vocal WAV */}
                  <button
                    type="button"
                    onClick={() => onDownloadVocalWav(take)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition cursor-pointer"
                    title="Tải file WAV giọng thu riêng"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Note toggle */}
                  <button
                    type="button"
                    onClick={() => (isNoteEditing ? saveEditNote(take.id) : startEditNote(take))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Ghi chú cho take này"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete take */}
                  <button
                    type="button"
                    onClick={() => onDeleteTake(take.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Xóa take này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Note view / edit */}
              {isNoteEditing ? (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Thêm ghi chú (ví dụ: giọng sáng, lấy hơi tốt...)"
                    className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditNote(take.id);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => saveEditNote(take.id)}
                    className="p-1.5 rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : take.note ? (
                <div className="mt-1.5 text-[11px] text-slate-400 italic bg-slate-950/60 px-2 py-1 rounded">
                  &ldquo;{take.note}&rdquo;
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
