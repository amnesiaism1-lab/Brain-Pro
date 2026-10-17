import React, { useState, useRef } from 'react';
import { 
  COGNITIVE_RELATIONS, 
  RelationId, 
  IRelationshipMastery,
  EXERCISES_METADATA
} from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { 
  Brain, 
  Sparkles, 
  ArrowRight,
  Target,
  Layers,
  HelpCircle,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Eye
} from 'lucide-react';

interface NodeLayout {
  id: RelationId;
  x: number;
  y: number;
}

// 12 nodes arranged in cognitive pipeline
const NETWORK_POSITIONS: NodeLayout[] = [
  { id: 'FOCUS_FIELD', x: 200, y: 70 },
  { id: 'TARGET_POSITION', x: 380, y: 70 },
  { id: 'ORDER_SEQUENCE', x: 560, y: 70 },
  { id: 'SPATIAL_TRANSFORM', x: 200, y: 190 },
  { id: 'IDENTITY_MATCH', x: 380, y: 190 },
  { id: 'TEMPORAL_PREDICT', x: 560, y: 190 },
  { id: 'SIMILARITY_DIFF', x: 200, y: 310 },
  { id: 'TARGET_DISTRACTOR', x: 380, y: 310 },
  { id: 'PART_WHOLE', x: 560, y: 310 },
  { id: 'RULE_ACTION', x: 200, y: 430 },
  { id: 'INHIBITION', x: 380, y: 430 },
  { id: 'CONTEXT_MEANING', x: 560, y: 430 }
];

const NETWORK_CONNECTIONS: Array<{ from: RelationId; to: RelationId }> = [
  { from: 'FOCUS_FIELD', to: 'TARGET_POSITION' },
  { from: 'TARGET_POSITION', to: 'ORDER_SEQUENCE' },
  { from: 'TARGET_POSITION', to: 'SPATIAL_TRANSFORM' },
  { from: 'ORDER_SEQUENCE', to: 'TEMPORAL_PREDICT' },
  { from: 'IDENTITY_MATCH', to: 'SIMILARITY_DIFF' },
  { from: 'TARGET_DISTRACTOR', to: 'SIMILARITY_DIFF' },
  { from: 'RULE_ACTION', to: 'INHIBITION' },
  { from: 'PART_WHOLE', to: 'CONTEXT_MEANING' },
  { from: 'TEMPORAL_PREDICT', to: 'CONTEXT_MEANING' },
  { from: 'TARGET_POSITION', to: 'IDENTITY_MATCH' },
  { from: 'INHIBITION', to: 'CONTEXT_MEANING' }
];

export const BrainMap: React.FC = () => {
  const { 
    relationshipMasteries, 
    setSelectedExerciseSlug, 
    setActiveGameSlug, 
    getExerciseLevel,
    setActiveTab, 
    playSound 
  } = useAppStore();
  const [selectedNodeId, setSelectedNodeId] = useState<RelationId>('TARGET_POSITION');
  const [hoveredNodeId, setHoveredNodeId] = useState<RelationId | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [labelMode, setLabelMode] = useState<'smart' | 'all'>('smart');

  const handleZoomIn = () => {
    playSound('click');
    setZoom(z => Math.min(2.4, +(z + 0.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    playSound('click');
    setZoom(z => Math.max(0.65, +(z - 0.25).toFixed(2)));
  };

  const handleResetView = () => {
    playSound('click');
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if not clicking directly on a node
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'network-canvas-bg') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const rawMastery = relationshipMasteries[selectedNodeId];
  const hasData = rawMastery && rawMastery.exposureCount > 0;

  const selectedMastery: IRelationshipMastery = rawMastery || {
    relationId: selectedNodeId,
    accuracy: 0,
    exposureCount: 0,
    medianResponseMs: 0,
    stability: 0,
    transferScore: 0,
    currentTier: 1,
    localContexts: []
  };

  const selectedDef = COGNITIVE_RELATIONS[selectedNodeId] || {
    nameVi: selectedNodeId,
    definition: '',
    representativeGames: [],
    descriptionVi: ''
  };

  const getNodeColor = (mastery?: IRelationshipMastery) => {
    if (!mastery || mastery.exposureCount === 0) return '#94A3B8'; // Slate (Chưa mở)
    const acc = mastery.accuracy;
    if (acc >= 0.85) return '#10B981'; // Emerald
    if (acc >= 0.70) return '#3B82F6'; // Blue
    if (acc >= 0.55) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const handleSelectGame = (slug: string) => {
    playSound('click');
    setActiveGameSlug(slug as any);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              Bản Đồ Mạng Lưới Nhận Thức 12 Nút
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-500">
              Mỗi nút đại diện cho một mối quan hệ nhận thức thực nghiệm nối liền các bài tập
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
            Vững (≥85%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm" />
            Khá (≥70%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm" />
            Đang luyện
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400 inline-block shadow-sm" />
            Chưa mở (0 lượt)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* SVG Network Graph (Left 2 Columns) */}
        <div 
          className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md relative overflow-hidden flex flex-col items-center justify-center min-h-[480px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom & Pan Floating Controls Toolbar */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={handleZoomIn}
              title="Phóng to"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-500 px-1 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              title="Thu nhỏ"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              title="Căn giữa mặc định"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            <button
              onClick={() => {
                playSound('click');
                setLabelMode(m => m === 'smart' ? 'all' : 'smart');
              }}
              title="Chuyển đổi kiểu hiển thị nhãn"
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                labelMode === 'smart'
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {labelMode === 'smart' ? 'Nhãn thông minh' : 'Tất cả nhãn'}
            </button>
          </div>

          <svg 
            id="network-canvas-bg"
            viewBox="100 15 560 480" 
            className={`w-full h-auto max-h-[520px] select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <g 
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
              style={{ 
                transformOrigin: '380px 250px',
                transition: isPanning ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              {/* Draw Connecting Edges */}
              {NETWORK_CONNECTIONS.map((conn, idx) => {
                const fromNode = NETWORK_POSITIONS.find(p => p.id === conn.from);
                const toNode = NETWORK_POSITIONS.find(p => p.id === conn.to);
                if (!fromNode || !toNode) return null;

                const isConnectedToSelected = selectedNodeId === conn.from || selectedNodeId === conn.to;
                const isConnectedToHovered = hoveredNodeId === conn.from || hoveredNodeId === conn.to;
                const isHighlighted = isConnectedToSelected || isConnectedToHovered;

                return (
                  <line
                    key={`edge-${idx}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={isConnectedToSelected ? '#6366F1' : (isConnectedToHovered ? '#3B82F6' : '#CBD5E1')}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    strokeDasharray={isHighlighted ? undefined : '4 4'}
                    opacity={isHighlighted ? 1 : 0.45}
                    style={{ transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s' }}
                  />
                );
              })}

              {/* Draw Nodes */}
              {NETWORK_POSITIONS.map(pos => {
                const mastery = relationshipMasteries[pos.id];
                const isSelected = selectedNodeId === pos.id;
                const isHovered = hoveredNodeId === pos.id;
                const nodeColor = getNodeColor(mastery);
                const def = COGNITIVE_RELATIONS[pos.id];
                const nodeAcc = mastery && mastery.exposureCount > 0 ? Math.round(mastery.accuracy * 100) : null;
                const displayName = def ? def.nameVi : pos.id;

                return (
                  <g 
                    key={pos.id}
                    onClick={() => {
                      playSound('click');
                      setSelectedNodeId(pos.id);
                    }}
                    onMouseEnter={() => setHoveredNodeId(pos.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className="cursor-pointer"
                  >
                    {/* Selection Ring (outer spinning dashed ring) */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={35}
                        fill="rgba(99, 102, 241, 0.08)"
                        stroke="#6366F1"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{ 
                          animationDuration: '10s', 
                          transformOrigin: `${pos.x}px ${pos.y}px` 
                        }}
                      />
                    )}

                    {/* Hover Highlight Ring */}
                    {isHovered && !isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={33}
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        style={{ transition: 'all 0.15s ease-out' }}
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? 27 : (isHovered ? 28 : 24)}
                      fill={nodeColor}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected || isHovered ? 3.5 : 2.5}
                      style={{ 
                        transition: 'r 0.18s ease-out, stroke-width 0.18s ease-out',
                        filter: isHovered || isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.08))'
                      }}
                    />

                    {/* Tier Badge inside circle */}
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={11}
                      fontWeight="900"
                      fontFamily="monospace"
                      className="pointer-events-none select-none"
                    >
                      T{mastery ? mastery.currentTier : 1}
                    </text>

                    {/* Smart Label with Pill Backdrop on Selected / Hovered or when All Labels mode is active */}
                    {(labelMode === 'all' || isSelected || isHovered) && (
                      <g className="pointer-events-none select-none">
                        <rect
                          x={pos.x - (displayName.length * 3.8 + 8)}
                          y={pos.y + 30}
                          width={displayName.length * 7.6 + 16}
                          height={18}
                          rx={9}
                          fill={isSelected ? '#4F46E5' : isHovered ? '#0F172A' : '#F1F5F9'}
                          opacity={isSelected || isHovered ? 0.95 : 0.85}
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 42}
                          textAnchor="middle"
                          fill={isSelected || isHovered ? '#FFFFFF' : '#334155'}
                          fontSize={9.5}
                          fontWeight={isSelected || isHovered ? '800' : '700'}
                          className="transition-colors duration-150"
                        >
                          {displayName}
                        </text>
                      </g>
                    )}

                    {/* Floating Detailed Tooltip on Hover */}
                    {isHovered && (
                      <g className="pointer-events-none select-none animate-fade-in z-30">
                        <rect
                          x={pos.x - 70}
                          y={pos.y - 52}
                          width={140}
                          height={28}
                          rx={14}
                          fill="#0F172A"
                          opacity={0.95}
                          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                        />
                        <text
                          x={pos.x}
                          y={pos.y - 34}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize={10}
                          fontWeight="800"
                        >
                          {nodeAcc !== null ? `${displayName} · ${nodeAcc}%` : `${displayName} · Chưa mở`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Node Detail Card (Right 1 Column) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-xl">
                Cấp Bậc T{selectedMastery.currentTier}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedMastery.exposureCount > 0 ? `${selectedMastery.exposureCount} lượt thử nghiệm` : 'Chưa luyện tập'}
              </span>
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-800 dark:text-white">
                {selectedDef.nameVi}
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {selectedNodeId}
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
              {selectedDef.definition}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium">Độ chính xác EMA</span>
                <div className="text-xl font-black text-brand-600 mt-0.5">
                  {hasData ? `${Math.round(selectedMastery.accuracy * 100)}%` : '--'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium">Thời gian phản xạ</span>
                <div className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                  {hasData ? `${selectedMastery.medianResponseMs}ms` : '--'}
                </div>
              </div>
            </div>

            {/* Notice if no data */}
            {!hasData && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300">
                💡 Bạn chưa có dữ liệu thực nghiệm cho nút này. Bấm vào bài tập bên dưới để luyện tập và mở khóa chỉ số!
              </div>
            )}

            {/* Representative Games */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Bài tập rèn luyện quan hệ này (Bấm để tập ngay):
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedDef.representativeGames.map(slug => {
                  const meta = EXERCISES_METADATA.find(e => e.slug === slug);
                  const currentLvl = getExerciseLevel(slug as any) || 1;
                  return (
                    <button
                      key={slug}
                      onClick={() => handleSelectGame(slug)}
                      className="px-3.5 py-2 bg-brand-50 hover:bg-brand-600 hover:text-white dark:bg-slate-700/60 dark:hover:bg-brand-600 text-brand-700 dark:text-brand-300 dark:hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-sm group border border-brand-200/60 dark:border-slate-600"
                    >
                      <Play className="w-3 h-3 fill-current text-brand-600 dark:text-brand-400 group-hover:text-white shrink-0" />
                      <span>{meta?.title || slug}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-200/80 dark:bg-slate-600 group-hover:bg-white/20 font-mono font-bold">
                        Cấp {currentLvl}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
            <span className="text-[11px] text-slate-400">
              Chỉ số chuyển giao Transfer: <strong>{hasData ? `${Math.round(selectedMastery.transferScore * 100)}%` : '0%'}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
