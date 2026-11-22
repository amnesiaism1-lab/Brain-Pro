import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sun,
  Eye,
  EyeOff,
  RotateCw,
  Search,
  XCircle,
  Sparkles,
  ShieldAlert,
  Target,
  Compass,
  Waves,
  Route,
  Landmark,
  Grid3X3,
  TrainFront,
  ZoomIn,
  Moon,
  MapPin
} from 'lucide-react';
import {
  ALL_HANOI_ENTITIES,
  HANOI_WATER_EDGES,
  HANOI_BRIDGES,
  HANOI_RING_ROADS,
  HANOI_LANDMARKS,
  HANOI_JUNCTIONS,
  HANOI_FRENCH_GRID_STREETS,
  getHanoiSolarAzimuth,
  getHanoiShadowBearing,
  bearingToCardinalName,
  IHanoiEntity
} from '@brain-exercises/shared';

interface HanoiCartographicAtlasProps {
  onLaunchExercise: (mode?: string) => void;
}

type ViewportPreset = 'all' | 'core' | 'west' | 'east_river';

const VIEWPORT_MAP: Record<ViewportPreset, { label: string; viewBox: string }> = {
  all: { label: 'Toàn Cảnh Thủ Đô', viewBox: '40 10 860 680' },
  core: { label: 'Lõi Tứ Quận & Phố Pháp', viewBox: '330 130 350 355' },
  west: { label: 'Khu Tây & Vành Đai 2–3.5', viewBox: '75 160 460 440' },
  east_river: { label: 'Sông Hồng & Tả Ngạn', viewBox: '280 25 600 580' }
};

export const HanoiCartographicAtlas: React.FC<HanoiCartographicAtlasProps> = ({
  onLaunchExercise
}) => {
  // Layer visibility states
  const [showWater, setShowWater] = useState(true);
  const [showRings, setShowRings] = useState(true);
  const [showRadials, setShowRadials] = useState(true);
  const [showMetro, setShowMetro] = useState(true);
  const [showBridges, setShowBridges] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showFrenchGrid, setShowFrenchGrid] = useState(true);

  // Cartographic controls
  const [silentMode, setSilentMode] = useState(false);
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [mapCanvasTheme, setMapCanvasTheme] = useState<'archival_light' | 'blueprint_dark'>('blueprint_dark');
  const [viewportPreset, setViewportPreset] = useState<ViewportPreset>('all');
  const [simulatedHour, setSimulatedHour] = useState<number>(16.5);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<IHanoiEntity | null>(HANOI_WATER_EDGES[6]); // Default Hồ Hoàn Kiếm Km0

  const currentSunAzimuth = useMemo(() => getHanoiSolarAzimuth(simulatedHour), [simulatedHour]);
  const currentShadowBearing = useMemo(() => getHanoiShadowBearing(simulatedHour), [simulatedHour]);
  const currentSunDirectionName = useMemo(
    () => bearingToCardinalName(currentSunAzimuth),
    [currentSunAzimuth]
  );

  const isDarkMap = mapCanvasTheme === 'blueprint_dark';
  const labelHalo = isDarkMap ? '#090f1d' : '#fdfaf3';
  const primaryLabelFill = isDarkMap ? '#f8fafc' : '#0f172a';

  const filteredEntities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_HANOI_ENTITIES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.alias && e.alias.toLowerCase().includes(q)) ||
        e.district.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const findEntity = (id: string): IHanoiEntity | null =>
    ALL_HANOI_ENTITIES.find((e) => e.id === id) || null;

  // Helper to keep SVG labels upright when rotating map 90/180/270 deg
  const renderUprightText = (
    x: number,
    y: number,
    text: string,
    opts?: {
      fill?: string;
      fontSize?: number;
      fontWeight?: number | string;
      anchor?: 'start' | 'middle' | 'end';
      italic?: boolean;
    }
  ) => {
    if (silentMode) return null;
    const fill = opts?.fill || primaryLabelFill;
    const fontSize = opts?.fontSize || 10.5;
    const anchor = opts?.anchor || 'middle';
    const rotTransform = mapRotation !== 0 ? `rotate(${-mapRotation} ${x} ${y})` : undefined;

    return (
      <text
        x={x}
        y={y}
        fill={fill}
        fontSize={fontSize}
        fontWeight={opts?.fontWeight ?? 700}
        fontStyle={opts?.italic ? 'italic' : 'normal'}
        textAnchor={anchor}
        transform={rotTransform}
        style={{ paintOrder: 'stroke', stroke: labelHalo, strokeWidth: 3.6, strokeLinejoin: 'round' }}
        className="pointer-events-none select-none"
      >
        {text}
      </text>
    );
  };

  // Accurate schematic coordinates for the 6 operational bridges along Sông Hồng NW -> SE
  const bridgeCoords = [
    { id: 'bridge-thang-long', x: 315, y: 62, short: '1. Cầu Thăng Long (VĐ3)', dx: -12, dy: -12, anchor: 'end' as const },
    { id: 'bridge-nhat-tan', x: 445, y: 84, short: '2. Cầu Nhật Tân (VĐ2)', dx: 0, dy: -13, anchor: 'middle' as const },
    { id: 'bridge-long-bien', x: 598, y: 268, short: '3. Cầu Long Biên', dx: 14, dy: -3, anchor: 'start' as const },
    { id: 'bridge-chuong-duong', x: 614, y: 300, short: '4. Cầu Chương Dương', dx: 14, dy: 5, anchor: 'start' as const },
    { id: 'bridge-vinh-tuy', x: 695, y: 425, short: '5. Cầu Vĩnh Tuy (VĐ2)', dx: 14, dy: 4, anchor: 'start' as const },
    { id: 'bridge-thanh-tri', x: 795, y: 555, short: '6. Cầu Thanh Trì (VĐ3)', dx: 12, dy: -8, anchor: 'start' as const }
  ];

  // Key multi-tier junctions
  const junctionMarkers = [
    { id: 'junc-mai-dich', x: 275, y: 265, label: 'Mai Dịch' },
    { id: 'junc-cau-giay', x: 355, y: 290, label: 'Cầu Giấy' },
    { id: 'junc-trung-hoa', x: 275, y: 380, label: 'Trung Hòa' },
    { id: 'junc-o-cho-dua', x: 455, y: 385, label: 'Ô Chợ Dừa' },
    { id: 'junc-nga-tu-so', x: 395, y: 415, label: 'Ngã Tư Sở' },
    { id: 'junc-thanh-xuan', x: 325, y: 455, label: 'Thanh Xuân' },
    { id: 'junc-nga-tu-vong', x: 512, y: 465, label: 'Ngã Tư Vọng' },
    { id: 'junc-phap-van', x: 518, y: 580, label: 'Pháp Vân' }
  ];

  // Sun ray coordinates around Hồ Gươm / Central Hanoi (485, 340)
  const sunCenter = { x: 485, y: 340 };
  const sunRad = ((currentSunAzimuth - 90) * Math.PI) / 180;
  const sunOrb = {
    x: sunCenter.x + 280 * Math.cos(sunRad),
    y: sunCenter.y + 280 * Math.sin(sunRad)
  };

  return (
    <div className="space-y-5">
      {/* Toolbar Row 1: Layer Toggles + Map Theme + Silent + Rotate */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Layer Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-extrabold text-slate-600 dark:text-slate-400 mr-1 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Lớp Bản Đồ:
            </span>

            <button
              onClick={() => setShowWater((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showWater
                  ? 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/35'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Sông & Hồ</span>
            </button>

            <button
              onClick={() => setShowRings((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showRings
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Vành Đai 1–3.5</span>
            </button>

            <button
              onClick={() => setShowRadials((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showRadials
                  ? 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/35'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Trục Hướng Tâm</span>
            </button>

            <button
              onClick={() => setShowMetro((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showMetro
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/35'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              <TrainFront className="w-3.5 h-3.5" />
              <span>Metro 2A & 3</span>
            </button>

            <button
              onClick={() => setShowBridges((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showBridges
                  ? 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/35'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>6 Cầu Sông Hồng</span>
            </button>

            <button
              onClick={() => setShowLandmarks((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showLandmarks
                  ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/35'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Điểm Neo & Nút</span>
            </button>

            <button
              onClick={() => setShowFrenchGrid((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showFrenchGrid
                  ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/35'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Ô Phố Pháp</span>
            </button>
          </div>

          {/* Right Mode Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                setMapCanvasTheme((t) => (t === 'blueprint_dark' ? 'archival_light' : 'blueprint_dark'))
              }
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Đổi nền bản đồ Sáng (Giấy Địa Đồ) hoặc Tối (Radar Đêm)"
            >
              {isDarkMap ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{isDarkMap ? 'Nền Radar Tối' : 'Nền Địa Đồ Sáng'}</span>
            </button>

            <button
              onClick={() => setSilentMode((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                silentMode
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
              title="Ẩn toàn bộ tên đường và cầu để tự kiểm tra trí nhớ không gian"
            >
              {silentMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{silentMode ? 'Bản Đồ Câm (Đang Bật)' : 'Hiện Nhãn Học'}</span>
            </button>

            <button
              onClick={() => setMapRotation((prev) => (prev + 90) % 360)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Xoay hướng Bắc bản đồ để luyện phản xạ Mental Rotation (chữ vẫn giữ thẳng dễ đọc)"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-500" />
              <span>Xoay: {mapRotation}°</span>
            </button>
          </div>
        </div>

        {/* Sub-row: Zoom Presets + Instant Entity Search */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <ZoomIn className="w-3.5 h-3.5" /> Vùng Zoom:
            </span>
            {(Object.keys(VIEWPORT_MAP) as ViewportPreset[]).map((vp) => (
              <button
                key={vp}
                onClick={() => setViewportPreset(vp)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  viewportPreset === vp
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {VIEWPORT_MAP[vp].label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh cầu, phố, nút giao, hồ..."
              aria-label="Tìm thực thể trên bản đồ Hà Nội"
              className="w-full pl-8 pr-8 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
            {filteredEntities.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntities.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedEntity(item);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-amber-500/10 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.district}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Grid: Cartographic SVG (8 cols) + Rich Entity Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Vector Atlas */}
        <div
          className={`lg:col-span-8 rounded-3xl p-4 sm:p-5 border relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[590px] transition-colors ${
            isDarkMap
              ? 'bg-[#0B1120] border-slate-800 text-slate-100'
              : 'bg-[#F8F4EC] border-[#D5CBB9] text-slate-900'
          }`}
        >
          {/* Solar Azimuth HUD */}
          <div
            className={`relative z-20 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border backdrop-blur-md ${
              isDarkMap
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white/90 border-[#D5CBB9]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  La Bàn Mặt Trời Hà Nội (21.03°N):
                </div>
                <div className="text-xs sm:text-sm font-black flex items-center gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-mono">
                    {Math.floor(simulatedHour)}h
                    {Math.round((simulatedHour % 1) * 60)
                      .toString()
                      .padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                    Nắng hướng {currentSunDirectionName} ({currentSunAzimuth}°) · Bóng đổ {currentShadowBearing}°
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-[240px]">
              <span className="text-[10px] font-mono font-bold opacity-70">06h</span>
              <input
                type="range"
                min="6"
                max="18"
                step="0.5"
                aria-label="Chọn giờ mặt trời trong ngày"
                value={simulatedHour}
                onChange={(e) => setSimulatedHour(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] font-mono font-bold opacity-70">18h</span>
            </div>
          </div>

          {/* SVG Cartographic Schematic */}
          <div className="relative w-full flex-1 my-3 flex items-center justify-center overflow-hidden rounded-2xl">
            <svg
              viewBox={VIEWPORT_MAP[viewportPreset].viewBox}
              className="w-full h-full max-h-[520px] transition-transform duration-500"
              style={{ transform: `rotate(${mapRotation}deg)` }}
            >
              <defs>
                <pattern id="cartoGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path
                    d="M 60 0 L 0 0 0 60"
                    fill="none"
                    stroke={isDarkMap ? '#1e293b' : '#e5dec9'}
                    strokeWidth="0.8"
                  />
                </pattern>
                <linearGradient id="redRiverFlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={isDarkMap ? '0.55' : '0.45'} />
                  <stop offset="50%" stopColor="#0ea5e9" stopOpacity={isDarkMap ? '0.68' : '0.55'} />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity={isDarkMap ? '0.75' : '0.6'} />
                </linearGradient>
                <linearGradient id="westLakeFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Background Cartographic Grid */}
              <rect x="0" y="0" width="920" height="700" fill="url(#cartoGrid)" />

              {/* Subtle Compass Rose in Top-Right */}
              <g transform="translate(835, 70)" className="pointer-events-none opacity-80">
                <circle
                  cx="0"
                  cy="0"
                  r="24"
                  fill={isDarkMap ? '#0f172a' : '#ffffff'}
                  stroke={isDarkMap ? '#334155' : '#cbd5e1'}
                  strokeWidth="1.5"
                />
                <polygon points="0,-20 5,-4 0,-8 -5,-4" fill="#ef4444" />
                <polygon points="0,20 4,4 0,8 -4,4" fill="#64748b" />
                {renderUprightText(0, -27, 'BẮC (N)', {
                  fill: '#ef4444',
                  fontSize: 9,
                  fontWeight: 900
                })}
              </g>

              {/* Solar Ray Vector */}
              <g className="pointer-events-none">
                <line
                  x1={sunOrb.x}
                  y1={sunOrb.y}
                  x2={sunCenter.x}
                  y2={sunCenter.y}
                  stroke="#f59e0b"
                  strokeWidth="2.2"
                  strokeDasharray="6 5"
                  opacity="0.65"
                />
                <circle cx={sunOrb.x} cy={sunOrb.y} r="13" fill="#f59e0b" stroke="#fef3c7" strokeWidth="2" />
                {renderUprightText(sunOrb.x, sunOrb.y + 3.5, 'SUN', {
                  fill: '#fffbeb',
                  fontSize: 7.5,
                  fontWeight: 900
                })}
              </g>

              {/* ============================================================
                  1. HYDROLOGY LAYER: SÔNG HỒNG, SÔNG ĐUỐNG, TÔ LỊCH, HỒ LỚN
                 ============================================================ */}
              {showWater && (
                <g id="atlas-water">
                  {/* Sông Đuống branching East from Xuân Canh (535,138) -> Gia Lâm */}
                  <path
                    d="M 525,132 C 605,118 710,118 890,142 L 890,158 C 710,134 605,134 535,150 Z"
                    fill="url(#redRiverFlow)"
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedEntity(findEntity('edge-duong-river'))}
                  />
                  {renderUprightText(745, 115, 'SÔNG ĐUỐNG (Cầu Đông Trù · Cầu Đuống)', {
                    fill: isDarkMap ? '#7dd3fc' : '#0369a1',
                    fontSize: 9.5
                  })}

                  {/* Sông Hồng main alluvial channel NW -> N -> E -> SE */}
                  <path
                    d="M 175,15 C 270,45 375,65 465,80 C 545,95 585,205 620,295 C 660,395 735,485 875,660 L 898,642 C 760,468 684,380 644,282 C 606,188 565,75 475,58 C 385,42 280,24 195,0 Z"
                    fill="url(#redRiverFlow)"
                    stroke="#dc2626"
                    strokeWidth="1.2"
                    strokeOpacity="0.45"
                    className="cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setSelectedEntity(findEntity('edge-red-river'))}
                  />
                  {renderUprightText(685, 345, 'SÔNG HỒNG (NHỊ HÀ)', {
                    fill: isDarkMap ? '#fca5a5' : '#b91c1c',
                    fontSize: 11,
                    anchor: 'start'
                  })}

                  {/* Sông Tô Lịch (Bưởi -> Đường Láng -> Ngã Tư Sở -> Kim Giang -> Linh Đàm) */}
                  <path
                    d="M 380,215 C 362,265 352,315 372,368 C 392,418 422,475 475,558"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="4"
                    strokeDasharray="5 3"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('edge-to-lich-river'))}
                  />
                  {renderUprightText(340, 342, 'Sông Tô Lịch', {
                    fill: isDarkMap ? '#67e8f9' : '#0e7490',
                    fontSize: 9,
                    italic: true,
                    anchor: 'end'
                  })}

                  {/* Sông Nhuệ (Cầu Diễn -> Hà Đông Cầu Trắng) */}
                  <path
                    d="M 195,120 C 190,240 198,390 218,560 C 228,615 260,655 310,680"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="3 4"
                    opacity="0.7"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('edge-nhue-river'))}
                  />
                  {renderUprightText(186, 465, 'Sông Nhuệ', {
                    fill: isDarkMap ? '#7dd3fc' : '#0369a1',
                    fontSize: 8.5,
                    italic: true,
                    anchor: 'end'
                  })}

                  {/* Hồ Tây */}
                  <path
                    d="M 412,135 C 468,122 508,158 495,212 C 476,238 418,236 392,205 C 376,178 386,144 412,135 Z"
                    fill="url(#westLakeFill)"
                    stroke="#7dd3fc"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:brightness-110"
                    onClick={() => setSelectedEntity(findEntity('lake-west-lake'))}
                  />
                  {renderUprightText(442, 185, 'HỒ TÂY', {
                    fill: '#ffffff',
                    fontSize: 11.5,
                    fontWeight: 900
                  })}

                  {/* Hồ Trúc Bạch */}
                  <ellipse
                    cx="508"
                    cy="222"
                    rx="14"
                    ry="10"
                    fill="#38bdf8"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lake-truc-bach'))}
                  />

                  {/* Hồ Hoàn Kiếm (Km0 Root Anchor) */}
                  <ellipse
                    cx="545"
                    cy="330"
                    rx="14"
                    ry="21"
                    fill="#10b981"
                    stroke="#fde047"
                    strokeWidth="2.5"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lake-hoan-kiem'))}
                  />
                  {renderUprightText(545, 302, 'HỒ GƯƠM (Km0)', {
                    fill: isDarkMap ? '#6ee7b7' : '#047857',
                    fontSize: 9.5,
                    fontWeight: 900
                  })}

                  {/* Hồ Thiền Quang & Hồ Bảy Mẫu */}
                  <rect
                    x="522"
                    y="386"
                    width="16"
                    height="11"
                    rx="3"
                    fill="#0ea5e9"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lake-thien-quang'))}
                  />
                  <ellipse
                    cx="518"
                    cy="422"
                    rx="16"
                    ry="15"
                    fill="#0284c7"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lake-bay-mau'))}
                  />
                  {renderUprightText(518, 446, 'CV Thống Nhất', {
                    fill: isDarkMap ? '#7dd3fc' : '#0369a1',
                    fontSize: 8
                  })}

                  {/* Hồ Thủ Lệ & Hồ Giảng Võ */}
                  <circle
                    cx="374"
                    cy="288"
                    r="11"
                    fill="#0284c7"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lake-thu-le'))}
                  />
                  <circle
                    cx="422"
                    cy="322"
                    r="9"
                    fill="#0ea5e9"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lake-giang-vo'))}
                  />

                  {/* Hồ Linh Đàm */}
                  <path
                    d="M 468,548 C 495,535 512,555 502,575 C 492,590 468,586 462,568 Z"
                    fill="#0284c7"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lake-linh-dam'))}
                  />
                  {renderUprightText(484, 600, 'Hồ Linh Đàm', {
                    fill: isDarkMap ? '#7dd3fc' : '#0369a1',
                    fontSize: 8.5
                  })}
                </g>
              )}

              {/* ============================================================
                  2. CONCENTRIC RING ROADS LAYER (VĐ1, VĐ2, VĐ2.5, VĐ3, VĐ3.5)
                 ============================================================ */}
              {showRings && (
                <g id="atlas-rings">
                  {/* Vành đai 3.5 (Outer Western-Southern Corridor: Thượng Cát -> Lê Trọng Tấn -> Văn Phú -> Ngọc Hồi) */}
                  <path
                    d="M 215,65 C 155,210 150,365 208,525 C 258,615 395,648 565,645"
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="3"
                    strokeDasharray="8 5"
                    opacity="0.8"
                    className="cursor-pointer hover:opacity-100"
                    onClick={() => setSelectedEntity(findEntity('ring-3-5'))}
                  />
                  {renderUprightText(162, 335, 'VÀNH ĐAI 3.5 (Lê Trọng Tấn)', {
                    fill: isDarkMap ? '#fda4af' : '#be123c',
                    fontSize: 9,
                    anchor: 'middle'
                  })}

                  {/* Vành đai 3 (Closed Loop: Cầu Thăng Long -> Phạm Văn Đồng -> Mai Dịch -> Phạm Hùng -> Khuất Duy Tiến -> Nguyễn Xiển -> Pháp Vân -> Cầu Thanh Trì -> QL1A mới) */}
                  <path
                    d="M 315,62 C 292,145 276,215 275,265 L 275,380 L 325,455 C 378,512 445,555 518,580 L 795,555 C 852,445 858,285 785,165 C 700,72 480,45 315,62 Z"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="5"
                    className="cursor-pointer hover:stroke-violet-400"
                    onClick={() => setSelectedEntity(findEntity('ring-3'))}
                  />
                  {renderUprightText(405, 558, 'VÀNH ĐAI 3 (Phạm Hùng – Khuất Duy Tiến – Nguyễn Xiển)', {
                    fill: isDarkMap ? '#ddd6fe' : '#5b21b6',
                    fontSize: 10
                  })}

                  {/* Vành đai 2.5 (Phú Thượng -> Nguyễn Văn Huyên -> Trần Thái Tông -> Hoàng Đạo Thúy -> Đầm Hồng -> Kim Đồng) */}
                  <path
                    d="M 405,135 C 350,195 322,255 322,325 C 322,395 375,468 455,502 L 595,508"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="2.8"
                    strokeDasharray="5 3"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('ring-2-5'))}
                  />
                  {renderUprightText(322, 355, 'VĐ 2.5 (Hoàng Đạo Thúy)', {
                    fill: isDarkMap ? '#7dd3fc' : '#0369a1',
                    fontSize: 8.5
                  })}

                  {/* Vành đai 2 (Closed Loop: Cầu Vĩnh Tuy -> Minh Khai -> Đại La -> Ngã Tư Vọng -> Trường Chinh -> Ngã Tư Sở -> Đường Láng -> Cầu Giấy -> Bưởi -> Võ Chí Công -> Cầu Nhật Tân -> Đông Trù -> Nguyễn Văn Linh -> Vĩnh Tuy) */}
                  <path
                    d="M 695,425 L 585,452 L 512,465 L 395,415 C 368,368 355,328 355,290 L 380,215 L 415,142 L 445,84 C 545,86 625,102 665,122 L 738,238 L 732,368 Z"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="4.2"
                    className="cursor-pointer hover:stroke-teal-300"
                    onClick={() => setSelectedEntity(findEntity('ring-2'))}
                  />
                  {renderUprightText(462, 452, 'VÀNH ĐAI 2 (Minh Khai – Trường Chinh – Láng)', {
                    fill: isDarkMap ? '#99f6e4' : '#0f766e',
                    fontSize: 9.5
                  })}

                  {/* Vành đai 1 (Core Loop: Trần Khát Chân -> Đại Cồ Việt -> Xã Đàn -> Ô Chợ Dừa -> Hoàng Cầu -> Voi Phục -> Bưởi -> Yên Phụ -> Trần Nhật Duật -> Nguyễn Khoái) */}
                  <path
                    d="M 605,392 L 545,405 L 510,408 L 455,385 L 402,315 L 380,215 C 445,215 512,218 552,235 L 598,318 Z"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="3.5"
                    strokeDasharray="6 3"
                    className="cursor-pointer hover:stroke-amber-300"
                    onClick={() => setSelectedEntity(findEntity('ring-1'))}
                  />
                  {renderUprightText(495, 396, 'VĐ 1 (Đại Cồ Việt – Xã Đàn)', {
                    fill: isDarkMap ? '#fef08a' : '#a16207',
                    fontSize: 8.8
                  })}
                </g>
              )}

              {/* ============================================================
                  3. RADIAL CORRIDORS LAYER (CLOCK-FACE SPOKES)
                 ============================================================ */}
              {showRadials && (
                <g id="atlas-radials">
                  {/* 12h: Võ Chí Công -> Nhật Tân -> Võ Nguyên Giáp (Nội Bài) */}
                  <line x1="415" y1="142" x2="462" y2="18" stroke="#6366f1" strokeWidth="4" />
                  {renderUprightText(472, 34, '12h: Võ Nguyên Giáp (Nội Bài)', {
                    fill: isDarkMap ? '#c7d2fe' : '#3730a3',
                    fontSize: 9,
                    anchor: 'start'
                  })}

                  {/* 11h: Phạm Văn Đồng -> Cầu Thăng Long -> Võ Văn Kiệt */}
                  <line x1="275" y1="265" x2="322" y2="18" stroke="#818cf8" strokeWidth="3.5" />

                  {/* 9h30: Kim Mã -> Cầu Giấy -> Xuân Thủy -> Hồ Tùng Mậu -> Nhổn (QL32) */}
                  <polyline
                    points="505,315 374,288 355,290 275,265 115,235"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3.8"
                  />
                  {renderUprightText(168, 224, '9h30: Xuân Thủy – Nhổn (QL32)', {
                    fill: isDarkMap ? '#fed7aa' : '#9a3412',
                    fontSize: 9
                  })}

                  {/* 8h30: Văn Cao -> Liễu Giai -> Nguyễn Chí Thanh -> Trần Duy Hưng -> Đại lộ Thăng Long */}
                  <polyline
                    points="438,225 412,285 362,332 275,380 85,418"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4"
                  />
                  {renderUprightText(148, 396, '8h30: Đại lộ Thăng Long (Hòa Lạc)', {
                    fill: isDarkMap ? '#bae6fd' : '#075985',
                    fontSize: 9
                  })}

                  {/* 7h30: Giảng Võ -> Láng Hạ -> Lê Văn Lương -> Tố Hữu (BRT) */}
                  <polyline
                    points="455,330 398,370 302,425 162,505"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="3"
                  />
                  {renderUprightText(205, 488, '7h30: Lê Văn Lương – Tố Hữu', {
                    fill: isDarkMap ? '#fef08a' : '#854d0e',
                    fontSize: 8.5
                  })}

                  {/* 7h: Tôn Đức Thắng -> Tây Sơn -> Nguyễn Trãi -> Trần Phú -> Quang Trung (QL6 Hà Đông) */}
                  <polyline
                    points="482,328 455,385 395,415 325,455 218,560 158,625"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="4.2"
                  />
                  {renderUprightText(255, 578, '7h: Nguyễn Trãi – Hà Đông (QL6)', {
                    fill: isDarkMap ? '#fdba74' : '#9a3412',
                    fontSize: 9.5
                  })}

                  {/* 6h: Lê Duẩn -> Giải Phóng -> Ngọc Hồi (QL1A Nam) */}
                  <polyline
                    points="508,325 510,408 512,465 518,580 522,665"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="4"
                  />
                  {renderUprightText(532, 636, '6h: Giải Phóng – Ngọc Hồi (QL1A)', {
                    fill: isDarkMap ? '#fbcfe8' : '#9d174d',
                    fontSize: 9,
                    anchor: 'start'
                  })}

                  {/* 2h: Chương Dương -> Nguyễn Văn Cừ -> Ngô Gia Tự -> Cầu Đuống */}
                  <polyline
                    points="580,310 614,300 738,238 825,135"
                    fill="none"
                    stroke="#fb7185"
                    strokeWidth="3.5"
                  />
                  {renderUprightText(752, 224, '2h: Nguyễn Văn Cừ – Ngô Gia Tự', {
                    fill: isDarkMap ? '#fecdd3' : '#9f1239',
                    fontSize: 8.8,
                    anchor: 'start'
                  })}

                  {/* 3h: Vĩnh Tuy -> Cổ Linh -> Cao tốc 5B Hải Phòng */}
                  <polyline
                    points="695,425 745,392 885,435"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="3.5"
                  />
                  {renderUprightText(812, 405, '3h: Cổ Linh – Cao tốc 5B', {
                    fill: isDarkMap ? '#99f6e4' : '#115e59',
                    fontSize: 8.8
                  })}
                </g>
              )}

              {/* ============================================================
                  4. METRO RAIL LAYER (METRO 2A & METRO 3)
                 ============================================================ */}
              {showMetro && (
                <g id="atlas-metro">
                  {/* Metro 2A: Cát Linh -> Thái Hà -> Láng -> Nguyễn Trãi -> Hà Đông -> Yên Nghĩa */}
                  <polyline
                    points="448,332 422,382 395,415 325,455 218,560 158,625"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.4"
                    strokeDasharray="3 3"
                  />
                  {renderUprightText(308, 492, 'Metro 2A (Cát Linh – Hà Đông)', {
                    fill: isDarkMap ? '#86efac' : '#15803d',
                    fontSize: 8.5
                  })}

                  {/* Metro 3: Nhổn -> Cầu Diễn -> Xuân Thủy -> Cầu Giấy -> (ngầm: Kim Mã -> Ga HN) */}
                  <polyline
                    points="115,235 275,265 355,290 448,332 505,352"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.4"
                    strokeDasharray="3 3"
                  />
                  {renderUprightText(235, 252, 'Metro 3 (Nhổn – Ga HN)', {
                    fill: isDarkMap ? '#fca5a5' : '#b91c1c',
                    fontSize: 8.5
                  })}
                </g>
              )}

              {/* ============================================================
                  5. ORTHOGONAL FRENCH QUARTER GRID INSET
                 ============================================================ */}
              {showFrenchGrid && (
                <g id="atlas-french-grid">
                  <rect
                    x="512"
                    y="344"
                    width="68"
                    height="46"
                    rx="3"
                    fill={isDarkMap ? '#a855f715' : '#9333ea12'}
                    stroke="#a855f7"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                  />
                  {/* East-West avenues: Tràng Thi, Hai Bà Trưng, Lý Thường Kiệt, Trần Hưng Đạo */}
                  <line
                    x1="512"
                    y1="348"
                    x2="580"
                    y2="348"
                    stroke="#c084fc"
                    strokeWidth="2"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('st-trang-thi'))}
                  />
                  <line
                    x1="512"
                    y1="360"
                    x2="580"
                    y2="360"
                    stroke="#a855f7"
                    strokeWidth="1.8"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('st-hai-ba-trung'))}
                  />
                  <line
                    x1="512"
                    y1="372"
                    x2="580"
                    y2="372"
                    stroke="#a855f7"
                    strokeWidth="1.8"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('st-ly-thuong-kiet'))}
                  />
                  <line
                    x1="512"
                    y1="384"
                    x2="580"
                    y2="384"
                    stroke="#9333ea"
                    strokeWidth="2.4"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('st-tran-hung-dao'))}
                  />
                  {/* North-South paired streets: Bà Triệu (↓ South) & Phố Huế (↑ North) */}
                  <line
                    x1="538"
                    y1="344"
                    x2="538"
                    y2="404"
                    stroke="#3b82f6"
                    strokeWidth="2.2"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('st-ba-trieu'))}
                  />
                  <line
                    x1="556"
                    y1="344"
                    x2="556"
                    y2="404"
                    stroke="#f43f5e"
                    strokeWidth="2.2"
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('st-pho-hue'))}
                  />
                  {renderUprightText(574, 368, 'Ô Phố Pháp', {
                    fill: isDarkMap ? '#e9d5ff' : '#6b21a8',
                    fontSize: 8,
                    anchor: 'start'
                  })}
                </g>
              )}

              {/* ============================================================
                  6. 6 RED RIVER BRIDGES (EXACT UPSTREAM -> DOWNSTREAM ORDER)
                 ============================================================ */}
              {showBridges && (
                <g id="atlas-bridges">
                  {bridgeCoords.map((b) => {
                    const ent = findEntity(b.id);
                    const isSelected = selectedEntity?.id === b.id;
                    return (
                      <g
                        key={b.id}
                        className="cursor-pointer"
                        onClick={() => ent && setSelectedEntity(ent)}
                      >
                        {isSelected && (
                          <circle
                            cx={b.x}
                            cy={b.y}
                            r="13"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2"
                          />
                        )}
                        <circle
                          cx={b.x}
                          cy={b.y}
                          r="7.5"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {renderUprightText(b.x + b.dx, b.y + b.dy, b.short, {
                          fill: isDarkMap ? '#6ee7b7' : '#065f46',
                          fontSize: 9.5,
                          fontWeight: 800,
                          anchor: b.anchor
                        })}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ============================================================
                  7. STRATEGIC JUNCTIONS & SKYLINE LANDMARKS
                 ============================================================ */}
              {showLandmarks && (
                <g id="atlas-landmarks-nodes">
                  {/* Junction Nodes */}
                  {junctionMarkers.map((jn) => {
                    const ent = findEntity(jn.id);
                    const isSelected = selectedEntity?.id === jn.id;
                    return (
                      <g
                        key={jn.id}
                        className="cursor-pointer"
                        onClick={() => ent && setSelectedEntity(ent)}
                      >
                        <circle
                          cx={jn.x}
                          cy={jn.y}
                          r={isSelected ? 7 : 5}
                          fill="#facc15"
                          stroke="#0f172a"
                          strokeWidth="1.8"
                        />
                        {renderUprightText(jn.x, jn.y - 9, jn.label, {
                          fill: isDarkMap ? '#fde047' : '#854d0e',
                          fontSize: 8.5,
                          fontWeight: 800
                        })}
                      </g>
                    );
                  })}

                  {/* Keangnam Landmark 72 */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lm-keangnam'))}
                  >
                    <rect
                      x="252"
                      y="335"
                      width="13"
                      height="13"
                      rx="2"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.8"
                    />
                    {renderUprightText(246, 344, 'Keangnam 72', {
                      fill: isDarkMap ? '#fde68a' : '#92400e',
                      fontSize: 9,
                      anchor: 'end'
                    })}
                  </g>

                  {/* Lotte Center Liễu Giai */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lm-lotte-center'))}
                  >
                    <polygon
                      points="406,274 414,290 398,290"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {renderUprightText(418, 286, 'Lotte Liễu Giai', {
                      fill: isDarkMap ? '#bae6fd' : '#075985',
                      fontSize: 8.5,
                      anchor: 'start'
                    })}
                  </g>

                  {/* Lăng Bác */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lm-lang-bac'))}
                  >
                    <rect
                      x="478"
                      y="268"
                      width="13"
                      height="11"
                      rx="2"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {renderUprightText(484, 263, 'Lăng Bác', {
                      fill: isDarkMap ? '#fca5a5' : '#991b1b',
                      fontSize: 8.5
                    })}
                  </g>

                  {/* Ga Hà Nội */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lm-ga-ha-noi'))}
                  >
                    <circle
                      cx="506"
                      cy="378"
                      r="5.5"
                      fill="#f8fafc"
                      stroke="#2563eb"
                      strokeWidth="2.2"
                    />
                    {renderUprightText(496, 378, 'Ga HN', {
                      fill: isDarkMap ? '#cbd5e1' : '#1e3a8a',
                      fontSize: 8,
                      anchor: 'end'
                    })}
                  </g>

                  {/* SVĐ Mỹ Đình */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedEntity(findEntity('lm-svd-my-dinh'))}
                  >
                    <ellipse
                      cx="205"
                      cy="322"
                      rx="9"
                      ry="6.5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {renderUprightText(205, 311, 'SVĐ Mỹ Đình', {
                      fill: isDarkMap ? '#a7f3d0' : '#065f46',
                      fontSize: 8
                    })}
                  </g>
                </g>
              )}
            </svg>
          </div>

          {/* Legend Footer */}
          <div
            className={`relative z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] px-3.5 py-2.5 rounded-2xl border ${
              isDarkMap
                ? 'bg-slate-900/85 border-slate-800 text-slate-300'
                : 'bg-white/90 border-[#D5CBB9] text-slate-700'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-1 rounded bg-yellow-500 inline-block" /> VĐ1
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-1 rounded bg-teal-500 inline-block" /> VĐ2
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-1 rounded bg-sky-500 inline-block" /> VĐ2.5
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-1 rounded bg-violet-500 inline-block" /> VĐ3
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-1 rounded bg-rose-500 inline-block" /> VĐ3.5
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Cầu Sông Hồng
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Nút Giao Đa Tầng
              </span>
            </div>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              Chạm vào thực thể bất kỳ trên bản đồ để giải phẫu
            </span>
          </div>
        </div>

        {/* Right: Rich Entity Inspector + Quick Category Selector */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {selectedEntity ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      Kevin Lynch: {selectedEntity.category.toUpperCase()}
                    </span>
                    {selectedEntity.ringTier && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                        Vành đai {selectedEntity.ringTier}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug pt-0.5">
                    {selectedEntity.name}
                  </h3>
                  {selectedEntity.alias && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {selectedEntity.alias}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  aria-label="Đóng bảng thông tin thực thể"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Địa phận</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {selectedEntity.district}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Tọa độ chuẩn</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedEntity.coords.lat.toFixed(3)}°N, {selectedEntity.coords.lng.toFixed(3)}°E
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Đặc trưng cấu trúc không gian:
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedEntity.description}
                </p>
              </div>

              {selectedEntity.connectedStreets && selectedEntity.connectedStreets.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                    Các tuyến đường hội tụ tại nút:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntity.connectedStreets.map((st) => (
                      <span
                        key={st}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-300/60 dark:border-amber-800/60 space-y-1.5">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Quy tắc neo trí nhớ khi đi đường</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-800 dark:text-amber-100/90 leading-relaxed">
                  {selectedEntity.cognitiveTip}
                </p>
              </div>

              {selectedEntity.isOneWay && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/35 border border-rose-300/60 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Quy định đường một chiều:</strong>{' '}
                    {selectedEntity.oneWayDirection || 'Chỉ lưu thông theo chiều biển báo.'}
                  </div>
                </div>
              )}

              <button
                onClick={() => onLaunchExercise(selectedEntity.practiceModeRecommended)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer btn-press"
              >
                <Target className="w-4 h-4" />
                <span>Thực Hành Phản Xạ Với Thực Thể Này</span>
              </button>
            </div>
          ) : null}

          {/* Quick Directory Picker so Mobile/Keyboard users can inspect every group effortlessly */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Danh bạ chọn nhanh thực thể</span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                {ALL_HANOI_ENTITIES.length} mốc
              </span>
            </div>

            <div className="max-h-[225px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {[
                { label: '6 Cầu Sông Hồng (Thượng → Hạ lưu)', items: HANOI_BRIDGES },
                { label: '6 Tuyến Vành Đai (1 → 4)', items: HANOI_RING_ROADS },
                { label: '8 Đại Nút Giao Đa Tầng', items: HANOI_JUNCTIONS },
                { label: 'Phố Pháp & Đường 1 Chiều', items: HANOI_FRENCH_GRID_STREETS },
                { label: 'Điểm Neo Skyline & Văn Hóa', items: HANOI_LANDMARKS }
              ].map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.items.map((ent) => {
                      const active = selectedEntity?.id === ent.id;
                      return (
                        <button
                          key={ent.id}
                          onClick={() => setSelectedEntity(ent)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                            active
                              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          {ent.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
