import React, { useState } from 'react';
import { 
  COGNITIVE_RELATIONS, 
  RelationId, 
  ALL_RELATION_IDS,
  IRelationshipMastery 
} from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Info, 
  Layers,
  ArrowRight,
  Target
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
  const { relationshipMasteries, setSelectedExerciseSlug } = useAppStore();
  const [selectedNodeId, setSelectedNodeId] = useState<RelationId>('TARGET_POSITION');

  const selectedMastery = relationshipMasteries[selectedNodeId] || {
    relationId: selectedNodeId,
    accuracy: 0.5,
    exposureCount: 0,
    medianResponseMs: 600,
    stability: 0.5,
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
    if (!mastery || mastery.exposureCount < 5) return '#94A3B8'; // Slate
    const acc = mastery.accuracy;
    if (acc >= 0.85) return '#10B981'; // Emerald
    if (acc >= 0.70) return '#3B82F6'; // Blue
    if (acc >= 0.55) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              Bản Đồ Mạng Lưới Nhận Thức 12 Nút
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-500">
              Mỗi nút đại diện cho một mối quan hệ nhận thức thực nghiệm, nối liền giữa các bài tập
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
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
            Chưa mở
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Network Graph (Left 2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md relative overflow-hidden flex items-center justify-center min-h-[460px]">
          <svg 
            viewBox="100 20 560 460" 
            className="w-full h-auto max-h-[500px] select-none"
          >
            {/* Draw Connecting Edges */}
            {NETWORK_CONNECTIONS.map((conn, idx) => {
              const fromNode = NETWORK_POSITIONS.find(p => p.id === conn.from);
              const toNode = NETWORK_POSITIONS.find(p => p.id === conn.to);
              if (!fromNode || !toNode) return null;

              const isHighlighted = selectedNodeId === conn.from || selectedNodeId === conn.to;
              return (
                <line
                  key={`edge-${idx}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isHighlighted ? '#6366F1' : '#CBD5E1'}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  strokeDasharray={isHighlighted ? undefined : '4 4'}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Draw Nodes */}
            {NETWORK_POSITIONS.map(pos => {
              const mastery = relationshipMasteries[pos.id];
              const isSelected = selectedNodeId === pos.id;
              const nodeColor = getNodeColor(mastery);
              const def = COGNITIVE_RELATIONS[pos.id];

              return (
                <g 
                  key={pos.id}
                  onClick={() => setSelectedNodeId(pos.id)}
                  className="cursor-pointer group"
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={36}
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={26}
                    fill={nodeColor}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                    className="shadow-lg transition-transform duration-150 group-hover:scale-110"
                  />

                  {/* Tier Badge inside circle */}
                  <text
                    x={pos.x}
                    y={pos.y + 5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize={11}
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    T{mastery ? mastery.currentTier : 1}
                  </text>

                  {/* Label below node */}
                  <text
                    x={pos.x}
                    y={pos.y + 42}
                    textAnchor="middle"
                    fill={isSelected ? '#4F46E5' : '#64748B'}
                    fontSize={10}
                    fontWeight={isSelected ? 'bold' : '600'}
                  >
                    {def ? def.nameVi : pos.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Detail Card (Right 1 Column) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-xl">
                Cấp Bậc T{selectedMastery.currentTier}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedMastery.exposureCount} lượt thử nghiệm
              </span>
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-800 dark:text-white">
                {selectedDef.nameVi}
              </h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
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
                  {Math.round(selectedMastery.accuracy * 100)}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium">Thời gian phản xạ</span>
                <div className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                  {selectedMastery.medianResponseMs}ms
                </div>
              </div>
            </div>

            {/* Representative Games */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bài tập rèn luyện quan hệ này:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedDef.representativeGames.map(slug => (
                  <button
                    key={slug}
                    onClick={() => setSelectedExerciseSlug(slug as any)}
                    className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span>{slug}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-center">
            <span className="text-[11px] text-slate-400">
              Chỉ số chuyển giao Transfer: <strong>{Math.round(selectedMastery.transferScore * 100)}%</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
