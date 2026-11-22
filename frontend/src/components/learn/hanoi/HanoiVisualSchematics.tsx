import React, { useState } from 'react';
import {
  Compass,
  Route,
  Waves,
  Grid3X3,
  ArrowRight,
  ShieldAlert,
  TrainFront,
  MapPin,
  Layers,
  CheckCircle2,
  Bike,
  Sparkles,
  Navigation
} from 'lucide-react';
import {
  HANOI_CLOCK_RADIALS,
  HANOI_RING_DETAILS,
  HANOI_BRIDGE_MATRIX,
  HANOI_ADMIN_CLUSTERS,
  HANOI_TRANSIT_LINES,
  HANOI_COGNITIVE_GRAPH,
  IHanoiClockSpoke
} from '@brain-exercises/shared';

interface HanoiVisualSchematicsProps {
  onLaunchExercise: (mode?: string) => void;
}

type SchematicSubTab = 'clock_12h' | 'unrolled_ribbons' | 'bridges_metro' | 'districts_grid_cells';

export const HanoiVisualSchematics: React.FC<HanoiVisualSchematicsProps> = ({
  onLaunchExercise
}) => {
  const [subTab, setSubTab] = useState<SchematicSubTab>('clock_12h');

  // Sub-tab 1 state: Clock spoke
  const [selectedSpoke, setSelectedSpoke] = useState<IHanoiClockSpoke>(HANOI_CLOCK_RADIALS[6]); // Default 7h Nguyễn Trãi - Hà Đông

  // Sub-tab 2 state: Ring vs Corridor ribbon
  const [ribbonMode, setRibbonMode] = useState<'rings' | 'corridors'>('rings');
  const [selectedRingIdx, setSelectedRingIdx] = useState<number>(1); // Default VĐ2
  const [selectedCorridorIdx, setSelectedCorridorIdx] = useState<number>(0);

  // Sub-tab 3 state: Bridges filter
  const [bridgeFilter, setBridgeFilter] = useState<'operational' | 'all'>('operational');

  // Sub-tab 4 state: Admin cluster & Superblock cell
  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number>(0);
  const [selectedCellIdx, setSelectedCellIdx] = useState<number>(0);

  const filteredBridges =
    bridgeFilter === 'operational'
      ? HANOI_BRIDGE_MATRIX.filter((b) => b.status === 'operational')
      : HANOI_BRIDGE_MATRIX;

  const activeRing = HANOI_RING_DETAILS[selectedRingIdx] || HANOI_RING_DETAILS[0];
  const activeCorridor =
    HANOI_COGNITIVE_GRAPH.corridors[selectedCorridorIdx] || HANOI_COGNITIVE_GRAPH.corridors[0];
  const activeCluster = HANOI_ADMIN_CLUSTERS[selectedClusterIdx] || HANOI_ADMIN_CLUSTERS[0];
  const activeCell = HANOI_COGNITIVE_GRAPH.cells[selectedCellIdx] || HANOI_COGNITIVE_GRAPH.cells[0];

  return (
    <div className="space-y-6">
      {/* Sub-navigation Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          {
            id: 'clock_12h' as const,
            title: '1. Đồng Hồ Hướng Tâm 12h',
            desc: '12 tia đại lộ phóng từ tâm Hồ Gươm',
            Icon: Compass
          },
          {
            id: 'unrolled_ribbons' as const,
            title: '2. Giải Phẫu Đổi Tên Đường',
            desc: '6 Vành đai & 9 Trục "1 đường nhiều tên"',
            Icon: Route
          },
          {
            id: 'bridges_metro' as const,
            title: '3. Chuỗi Cầu & Tàu Điện Metro',
            desc: '13 Cầu Sông Hồng & Ga Metro 2A / 3 / BRT',
            Icon: Waves
          },
          {
            id: 'districts_grid_cells' as const,
            title: '4. 30 Quận/Huyện & Ô Phố Pháp',
            desc: '5 Lớp hành chính, 1 chiều & Superblocks',
            Icon: Grid3X3
          }
        ].map((item) => {
          const Icon = item.Icon;
          const active = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                active
                  ? 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-[#D5CBB9] dark:border-slate-800 hover:border-amber-400/60'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          SUB-MODULE 1: 12-HOUR CLOCK-FACE RADIAL COMPASS
         ===================================================================== */}
      {subTab === 'clock_12h' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive SVG Clock Dial */}
          <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Kỹ Thuật Ghi Nhớ Cực Tốc
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  La Bàn Mặt Đồng Hồ 12 Giờ (Tâm Km0)
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
                Đang chọn: {selectedSpoke.clockLabel}
              </span>
            </div>

            <div className="flex items-center justify-center py-2">
              <svg viewBox="0 0 420 420" className="w-full max-w-[390px] h-auto">
                {/* Concentric Ring Guides */}
                <circle cx="210" cy="210" r="165" fill="none" stroke="#94a3b8" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="210" cy="210" r="115" fill="none" stroke="#8b5cf6" strokeOpacity="0.3" strokeWidth="2" />
                <circle cx="210" cy="210" r="72" fill="none" stroke="#14b8a6" strokeOpacity="0.35" strokeWidth="2" />

                {/* Red River symbolic curve on NE-E quadrant */}
                <path
                  d="M 150,42 C 235,55 315,115 352,210 C 368,260 365,315 345,358"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeOpacity="0.3"
                  strokeWidth="12"
                  strokeLinecap="round"
                />

                {/* All 12 Radial Spokes */}
                {HANOI_CLOCK_RADIALS.map((sp) => {
                  const rad = ((sp.angleDeg - 90) * Math.PI) / 180;
                  const xEnd = 210 + 158 * Math.cos(rad);
                  const yEnd = 210 + 158 * Math.sin(rad);
                  const xLabel = 210 + 184 * Math.cos(rad);
                  const yLabel = 210 + 184 * Math.sin(rad);
                  const isActive = selectedSpoke.clockLabel === sp.clockLabel;

                  return (
                    <g
                      key={sp.clockLabel}
                      onClick={() => setSelectedSpoke(sp)}
                      className="cursor-pointer"
                    >
                      <line
                        x1="210"
                        y1="210"
                        x2={xEnd}
                        y2={yEnd}
                        stroke={isActive ? '#f59e0b' : '#64748b'}
                        strokeWidth={isActive ? 4.5 : 2}
                        strokeOpacity={isActive ? 1 : 0.45}
                      />
                      <circle
                        cx={xEnd}
                        cy={yEnd}
                        r={isActive ? 14 : 10}
                        fill={isActive ? '#f59e0b' : '#1e293b'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <text
                        x={xEnd}
                        y={yEnd + 3.5}
                        textAnchor="middle"
                        fill={isActive ? '#0f172a' : '#f8fafc'}
                        fontSize="8.5"
                        fontWeight="900"
                      >
                        {sp.clockLabel}
                      </text>
                      <text
                        x={xLabel}
                        y={yLabel + 3}
                        textAnchor="middle"
                        fill={isActive ? '#d97706' : '#64748b'}
                        fontSize="8"
                        fontWeight="700"
                      >
                        {sp.compassVi.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Center Hub: Hồ Gươm / Ba Đình */}
                <circle cx="210" cy="210" r="30" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
                <text x="210" y="207" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                  TÂM KM0
                </text>
                <text x="210" y="219" textAnchor="middle" fill="#ecfdf5" fontSize="7.5" fontWeight="700">
                  HỒ GƯƠM
                </text>
              </svg>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Bấm vào từng kim giờ trên mặt đồng hồ để xem chuỗi đường nối tiếp và cửa ngõ đi các tỉnh.
            </p>
          </div>

          {/* Right: Selected Spoke Anatomy + All 12 Spokes Quick Grid */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                  Hướng {selectedSpoke.clockLabel} · {selectedSpoke.compassVi} ({selectedSpoke.angleDeg}°)
                </span>
                {selectedSpoke.transitHighlight && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <TrainFront className="w-3.5 h-3.5" />
                    {selectedSpoke.transitHighlight}
                  </span>
                )}
              </div>

              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {selectedSpoke.title}
              </h4>

              {/* Street Chain Pills */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chuỗi đường thẳng nối tiếp từ trong ra ngoài:
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedSpoke.streetChain.map((st, idx) => (
                    <React.Fragment key={st}>
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 font-bold text-xs border border-amber-500/30">
                        {idx + 1}. {st}
                      </span>
                      {idx < selectedSpoke.streetChain.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1">
                    Các nút cắt Vành đai:
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    {selectedSpoke.ringIntersections.map((ri) => (
                      <li key={ri}>• {ri}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1">
                    Cửa ngõ đi ngoại thành & liên tỉnh:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedSpoke.externalGateway}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-400/40 dark:border-emerald-800/60 text-xs sm:text-sm text-slate-800 dark:text-emerald-100 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Mỏ neo ghi nhớ:</strong> {selectedSpoke.memoryHook}
                </div>
              </div>
            </div>

            {/* 12 Buttons Selector */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {HANOI_CLOCK_RADIALS.map((sp) => {
                const active = selectedSpoke.clockLabel === sp.clockLabel;
                return (
                  <button
                    key={sp.clockLabel}
                    onClick={() => setSelectedSpoke(sp)}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    <div className="text-xs font-black font-mono">{sp.clockLabel}</div>
                    <div className="text-[10px] line-clamp-1 opacity-85">
                      {sp.title.replace('Trục ', '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-MODULE 2: UNROLLED LINEAR RIBBONS (6 RINGS & 9 CORRIDORS)
         ===================================================================== */}
      {subTab === 'unrolled_ribbons' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Trải Phẳng Tuyến Đường (Linear Unrolling)
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Giải Mã Hiện Tượng "Một Đường Thẳng Đổi 6–10 Tên Phố"
              </h3>
            </div>

            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <button
                onClick={() => setRibbonMode('rings')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                  ribbonMode === 'rings'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                6 Tuyến Vành Đai (1 → 4)
              </button>
              <button
                onClick={() => setRibbonMode('corridors')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                  ribbonMode === 'corridors'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                9 Hành Lang Xuyên Tâm
              </button>
            </div>
          </div>

          {ribbonMode === 'rings' ? (
            <div className="space-y-6">
              {/* Ring Pills */}
              <div className="flex flex-wrap gap-2">
                {HANOI_RING_DETAILS.map((r, idx) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRingIdx(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      selectedRingIdx === idx
                        ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 border-transparent shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {r.tierLabel}: {r.name.split('–')[0]}
                  </button>
                ))}
              </div>

              {/* Ring Summary Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Chiều dài & Độ khép kín
                  </span>
                  <span className="font-black text-sm text-slate-900 dark:text-white block mt-0.5">
                    {activeRing.totalLengthKm}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{activeRing.loopStatusVi}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Cầu vượt sông trên tuyến
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                    {activeRing.riverBridges.join(' · ')}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-300/60 dark:border-rose-800/60">
                  <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5" /> Quy tắc sống còn xe máy
                  </span>
                  <span className="font-semibold text-rose-950 dark:text-rose-200 block mt-0.5 leading-relaxed">
                    {activeRing.motorbikeRuleVi}
                  </span>
                </div>
              </div>

              {/* Unrolled Step-by-Step Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Chuỗi các đoạn đường & điểm nút đổi tên liên tiếp:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeRing.nodesChain.map((node, nIdx) => (
                    <div
                      key={node.segmentName}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3"
                    >
                      <div
                        className="w-7 h-7 rounded-xl text-white font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: activeRing.colorHex }}
                      >
                        {nIdx + 1}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {node.segmentName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {node.district}
                          </span>
                        </div>
                        {node.junctionAfter && (
                          <div className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5 pt-0.5">
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                            <span>Chuyển tiếp tại: {node.junctionAfter}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Corridor Selector */}
              <div className="flex flex-wrap gap-2">
                {HANOI_COGNITIVE_GRAPH.corridors.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCorridorIdx(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedCorridorIdx === idx
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {c.name.split(':')[0]}
                  </button>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    {activeCorridor.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {activeCorridor.description}
                  </p>
                </div>

                {/* Street Sequence Ribbon */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeCorridor.streetSequence.map((st, sIdx) => (
                    <React.Fragment key={st}>
                      <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 font-black text-xs sm:text-sm text-slate-900 dark:text-white shadow-xs">
                        {sIdx + 1}. {st}
                      </div>
                      {sIdx < activeCorridor.streetSequence.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Cross streets in order */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Thứ tự các nút giao cắt ngang khi đi dọc tuyến:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {activeCorridor.crossStreetsInOrder.map((cs, cIdx) => (
                      <div
                        key={cs.nodeName}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <span className="font-black text-amber-700 dark:text-amber-400 block">
                          Nút {cIdx + 1}: {cs.nodeName}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          Cắt: {cs.intersectingStreets.join(' · ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs sm:text-sm text-amber-950 dark:text-amber-200">
                  <strong>Quy tắc ghi nhớ:</strong> {activeCorridor.cognitiveRule}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => onLaunchExercise('corridor_chain')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer btn-press"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Luyện Phản Xạ Chuỗi Trục Này</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUB-MODULE 3: 13 RED RIVER BRIDGES & METRO / BRT TRANSIT STRIPS
         ===================================================================== */}
      {subTab === 'bridges_metro' && (
        <div className="space-y-6">
          {/* Bridges Matrix */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Thượng Lưu (Tây Bắc) → Hạ Lưu (Đông Nam)
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Sơ Đồ Đấu Nối Hai Bờ Sông Hồng Qua Các Cây Cầu
                </h3>
              </div>

              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  onClick={() => setBridgeFilter('operational')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                    bridgeFilter === 'operational'
                      ? 'bg-teal-500 text-slate-950 font-black'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Cầu Đang Khai Thác (7)
                </button>
                <button
                  onClick={() => setBridgeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                    bridgeFilter === 'all'
                      ? 'bg-teal-500 text-slate-950 font-black'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Toàn Tuyến Quy Hoạch VĐ3.5–VĐ4 (13)
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredBridges.map((br) => (
                <div
                  key={br.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs ${
                    br.status === 'operational'
                      ? 'bg-slate-50/90 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                      : 'bg-amber-50/40 dark:bg-slate-900/50 border-dashed border-amber-400/50 dark:border-slate-700'
                  }`}
                >
                  {/* Right Bank (West/South Inner City) */}
                  <div className="md:col-span-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Hữu ngạn (Nội đô Tây / Nam)
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {br.rightBankWestSouth}
                    </span>
                  </div>

                  {/* Bridge Center Span */}
                  <div className="md:col-span-4 px-3 py-2 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/30 text-center">
                    <div className="font-black text-sm text-teal-900 dark:text-teal-300">
                      #{br.order}. {br.name}
                    </div>
                    <div className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">
                      {br.ringOrAxis} · {br.statusVi}
                    </div>
                  </div>

                  {/* Left Bank (North/East) + Rule */}
                  <div className="md:col-span-4 space-y-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Tả ngạn (Đông Anh / Long Biên / Gia Lâm)
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {br.leftBankNorthEast}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      {br.vehicleRule}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urban Rail & BRT Station Strips */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                La Bàn Đường Sắt Trên Cao & Làn Ưu Tiên
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Chuỗi Nhà Ga Metro 2A, Metro 3 & Tuyến BRT 01
              </h3>
            </div>

            <div className="space-y-4">
              {HANOI_TRANSIT_LINES.map((line) => (
                <div
                  key={line.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="px-2.5 py-1 rounded-lg text-white font-black text-xs"
                        style={{ backgroundColor: line.colorHex }}
                      >
                        {line.code}
                      </span>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        {line.name} ({line.lengthKm})
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {line.statusVi}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>Trục đường đi qua:</strong> {line.corridorFollowed}
                  </p>

                  {/* Station Chain */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {line.stations.map((st, idx) => (
                      <React.Fragment key={st}>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {st}
                        </span>
                        {idx < line.stations.length - 1 && (
                          <span className="text-slate-400 text-xs">─</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold pt-1">
                    Mẹo nhận diện thực tế: {line.wayfindingRule}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-MODULE 4: 30 ADMIN UNITS, FRENCH ONE-WAY MATRIX & SUPERBLOCKS
         ===================================================================== */}
      {subTab === 'districts_grid_cells' && (
        <div className="space-y-6">
          {/* 1. 30 Administrative Units in 5 Concentric Layers */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Phương Pháp Lớp Vỏ Đồng Tâm (4 + 4 + 4 Quận + 18 Huyện/Thị Xã)
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Phân Cụm Không Gian Toàn Bộ 30 Đơn Vị Hành Chính Hà Nội
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {HANOI_ADMIN_CLUSTERS.map((cl, idx) => (
                <button
                  key={cl.id}
                  onClick={() => setSelectedClusterIdx(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer border ${
                    selectedClusterIdx === idx
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cl.tierBadge}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  {activeCluster.title}
                </h4>
                <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                  Vị trí: {activeCluster.ringPosition}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {activeCluster.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeCluster.units.map((u) => (
                <div
                  key={u.name}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      {u.unitType} {u.name}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {u.compassDir}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {u.identityTag}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {u.keyAnchors.map((anc) => (
                      <span
                        key={anc}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                      >
                        {anc}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Orthogonal French Quarter One-Way Visual Diagram + Superblocks */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* French Quarter Visual Matrix */}
            <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Sơ Đồ Bàn Cờ Trực Giao (Nam Hồ Gươm)
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Ma Trận Chiều Đi Khu Phố Pháp Hoàn Kiếm
                </h3>
              </div>

              <svg viewBox="0 0 440 310" className="w-full h-auto rounded-2xl bg-slate-950 p-2 border border-slate-800">
                {/* Hồ Gươm Top Reference */}
                <rect x="235" y="12" width="95" height="36" rx="14" fill="#10b981" opacity="0.85" />
                <text x="282" y="34" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                  HỒ GƯƠM
                </text>

                {/* Horizontal East-West Streets */}
                {[
                  { y: 72, name: 'Tràng Tiền – Hàng Khay – Tràng Thi', dir: '← 1 CHIỀU ĐÔNG SANG TÂY', color: '#f43f5e' },
                  { y: 128, name: 'Hai Bà Trưng', dir: '↔ 2 Chiều', color: '#a855f7' },
                  { y: 184, name: 'Lý Thường Kiệt', dir: '↔ 2 Chiều', color: '#a855f7' },
                  { y: 240, name: 'Trần Hưng Đạo (Ga HN ↔ Viện 108)', dir: '↔ 2 Chiều', color: '#c084fc' }
                ].map((row) => (
                  <g key={row.name}>
                    <line x1="35" y1={row.y} x2="415" y2={row.y} stroke={row.color} strokeWidth="4" />
                    <text x="42" y={row.y - 8} fill="#f8fafc" fontSize="9.5" fontWeight="800">
                      {row.name}
                    </text>
                    <text x="410" y={row.y - 8} textAnchor="end" fill="#fde047" fontSize="8.5" fontWeight="800">
                      {row.dir}
                    </text>
                  </g>
                ))}

                {/* Vertical North-South Streets */}
                {[
                  { x: 60, name: 'Lê Duẩn', arrow: '↕', color: '#94a3b8' },
                  { x: 130, name: 'Quán Sứ', arrow: '↕', color: '#94a3b8' },
                  { x: 195, name: 'Quang Trung', arrow: '↕', color: '#94a3b8' },
                  { x: 262, name: 'Bà Triệu (↓ NAM)', arrow: '↓', color: '#38bdf8' },
                  { x: 332, name: 'Phố Huế – Hàng Bài (↑ BẮC)', arrow: '↑', color: '#10b981' }
                ].map((col) => (
                  <g key={col.name}>
                    <line x1={col.x} y1="54" x2={col.x} y2="275" stroke={col.color} strokeWidth="4" />
                    <text
                      x={col.x}
                      y="294"
                      textAnchor="middle"
                      fill={col.color === '#94a3b8' ? '#cbd5e1' : col.color}
                      fontSize="8.5"
                      fontWeight="900"
                    >
                      {col.name}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300/50 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Khẩu quyết 6 chữ bất biến:</strong> &ldquo;Phố Huế lên Hồ (↑ Bắc) – Bà Triệu xuống Đai (↓ Nam)&rdquo;. Cửa Nam muốn sang Nhà Hát Lớn tuyệt đối không vào Tràng Thi!
                </div>
              </div>
            </div>

            {/* 9 Superblock Cells Escape Simulator */}
            <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Mô Hình Khối Ô Phố (Superblocks)
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    9 Ô Phố Lớn & Lối Thoát Ngõ Thông
                  </h3>
                </div>
                <Layers className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {HANOI_COGNITIVE_GRAPH.cells.map((cell, idx) => (
                  <button
                    key={cell.id}
                    onClick={() => setSelectedCellIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                      selectedCellIdx === idx
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cell.name.replace('Ô ', '')}
                  </button>
                ))}
              </div>

              {/* Superblock Bounding Box Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-emerald-500/35 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {activeCell.name}
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {activeCell.district}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Khu dân cư bên trong:</strong> {activeCell.folkNeighborhood}
                </div>

                <div>
                  <span className="text-[11px] font-black uppercase text-slate-500 block mb-1">
                    Khung đại lộ bao quanh ô phố:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCell.boundingStreets.map((bs) => (
                      <span
                        key={bs}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-100"
                      >
                        {bs}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-400 block mb-1">
                    Các phố xương cá / lối thoát chính ra trục lớn:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCell.primaryExits.map((ex) => (
                      <span
                        key={ex}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30 text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1 border-t border-slate-200 dark:border-slate-700">
                  <strong>Chiến lược thoát mê cung:</strong> {activeCell.cognitiveStrategy}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
