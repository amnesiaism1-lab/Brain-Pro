import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { IPersonalAnchor, HANOI_COGNITIVE_GRAPH } from '@brain-exercises/shared';
import { 
  Home, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Plus, 
  Trash2, 
  X, 
  Navigation, 
  CheckCircle2, 
  Compass,
  Building,
  Info
} from 'lucide-react';

interface PersonalAnchorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnchorForDrill?: (anchor: IPersonalAnchor) => void;
}

export const PersonalAnchorsModal: React.FC<PersonalAnchorsModalProps> = ({
  isOpen,
  onClose,
  onSelectAnchorForDrill
}) => {
  const { 
    personalAnchors, 
    addPersonalAnchor, 
    deletePersonalAnchor,
    playSound
  } = useAppStore();

  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState<IPersonalAnchor['label']>('home');
  const [customTitle, setCustomTitle] = useState('');
  const [district, setDistrict] = useState('Đống Đa');
  const [nearestStreet, setNearestStreet] = useState('');
  const [nearestIntersection, setNearestIntersection] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !nearestStreet.trim()) return;

    addPersonalAnchor({
      label,
      customTitle: customTitle.trim(),
      district,
      nearestStreet: nearestStreet.trim(),
      nearestIntersection: nearestIntersection.trim() || 'Chưa xác định ngã tư',
      notes: notes.trim()
    });

    playSound('victory');
    setIsAdding(false);
    setCustomTitle('');
    setNearestStreet('');
    setNearestIntersection('');
    setNotes('');
  };

  const getIcon = (type: IPersonalAnchor['label']) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5 text-amber-400" />;
      case 'workplace': return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'school': return <GraduationCap className="w-5 h-5 text-emerald-400" />;
      default: return <MapPin className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Đích Cá Nhân & Điểm Neo Thường Ngày
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {personalAnchors.length} Điểm
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ghim Nhà, Chỗ làm, Trường học để hệ thống tự động sinh bài tập lập tuyến quen thuộc
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          
          <div className="flex items-center justify-between pb-2">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              Mẹo xe máy: Thuộc 4 lối thoát từ nhà ra trục chính giúp bạn đi đâu cũng thuận lợi
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm Điểm Neo Mới
              </button>
            )}
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleSave} className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Ghim Vị Trí Cá Nhân Mới
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Loại Điểm Neo</label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="home">Nhà riêng</option>
                    <option value="workplace">Nơi làm việc / Cơ quan</option>
                    <option value="school">Trường học</option>
                    <option value="frequent_spot">Quán quen / Điểm hay lui tới</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tên Gọi Gợi Nhớ</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="VD: Nhà riêng Thanh Xuân, Chỗ làm Duy Tân..."
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quận / Huyện</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    {HANOI_COGNITIVE_GRAPH.metadata.districtsCovered.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phố Tiếp Cận Gần Nhất</label>
                  <input
                    type="text"
                    value={nearestStreet}
                    onChange={(e) => setNearestStreet(e.target.value)}
                    placeholder="VD: Nguyễn Trãi, Thái Hà..."
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nút Giao Thoát Ra Trục</label>
                  <input
                    type="text"
                    value={nearestIntersection}
                    onChange={(e) => setNearestIntersection(e.target.value)}
                    placeholder="VD: Ngã Tư Sở, Mai Dịch..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Ghi chú ngõ ngách / Mẹo đi xe máy</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Ngõ 190 thông sang Vũ Trọng Phụng, tránh quay đầu..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu Điểm Neo
                </button>
              </div>
            </form>
          )}

          {/* List of Anchors */}
          <div className="space-y-3">
            {personalAnchors.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Chưa có điểm neo cá nhân nào. Hãy bấm "Thêm Điểm Neo Mới" để bắt đầu luyện tuyến từ nhà của bạn!
              </div>
            ) : (
              personalAnchors.map((anchor) => (
                <div
                  key={anchor.id}
                  className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition-all flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                      {getIcon(anchor.label)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{anchor.customTitle}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-300 border border-slate-600/40">
                          {anchor.district}
                        </span>
                      </div>
                      <p className="text-xs text-amber-300/90 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-amber-400/80" />
                        Phố: <strong className="text-white font-medium">{anchor.nearestStreet}</strong> ➔ Ra nút giao: <strong className="text-amber-200 font-medium">{anchor.nearestIntersection}</strong>
                      </p>
                      {anchor.notes && (
                        <p className="text-[11px] text-slate-400 italic">
                          "{anchor.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-center shrink-0">
                    {onSelectAnchorForDrill && (
                      <button
                        onClick={() => {
                          onSelectAnchorForDrill(anchor);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Luyện Tuyến
                      </button>
                    )}
                    <button
                      onClick={() => deletePersonalAnchor(anchor.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/40 transition-colors cursor-pointer"
                      title="Xóa điểm neo này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Dữ liệu lưu an toàn trên máy của bạn và đồng bộ với hồ sơ cá nhân.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
