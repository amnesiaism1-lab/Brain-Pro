import React, { useMemo } from 'react';
import { Award, Layers, Info, Repeat, AlertCircle, Target, CheckCircle2 } from 'lucide-react';
import { SingSessionStats } from '../types';
import { IVocalAnalysisResult, IVocalPhrase } from '../../../services/vocalFileAnalysisService';
import { DifficultyBadge } from '../components/DifficultyBadge';

interface ReportTabProps {
  analysisResult: IVocalAnalysisResult;
  realtimeScorePct: number | null;
  sessionStats: SingSessionStats;
  onLoopPhrase: (phrase: IVocalPhrase) => void;
  onPracticePhraseSlow?: (phrase: IVocalPhrase) => void;
  onRestartFullSong: () => void;
  onChooseAnotherSong: () => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  analysisResult,
  realtimeScorePct,
  sessionStats,
  onLoopPhrase,
  onPracticePhraseSlow,
  onRestartFullSong,
  onChooseAnotherSong,
}) => {
  const flatPct =
    sessionStats.totalVocalFrames > 0
      ? Math.round((sessionStats.flatFrames / sessionStats.totalVocalFrames) * 100)
      : 0;
  const sharpPct =
    sessionStats.totalVocalFrames > 0
      ? Math.round((sessionStats.sharpFrames / sessionStats.totalVocalFrames) * 100)
      : 0;

  const { practicedCount, tendencyLabel, priorityPhrases } = useMemo(() => {
    const practiced = analysisResult.phrases.filter((p) => {
      const sc = sessionStats.phraseScores[p.phraseIndex];
      return sc && sc.total > 0;
    });

    let tendency = 'Cân bằng';
    if (sessionStats.totalVocalFrames > 0) {
      if (flatPct > sharpPct + 6) tendency = `Hơi thấp (${flatPct}% Non)`;
      else if (sharpPct > flatPct + 6) tendency = `Hơi cao (${sharpPct}% Gắt)`;
      else tendency = 'Ổn định chuẩn tông';
    } else {
      tendency = 'Chưa có dữ liệu';
    }

    const scoredCandidates = practiced
      .map((p) => {
        const sc = sessionStats.phraseScores[p.phraseIndex]!;
        const pct = Math.round((sc.inTune / sc.total) * 100);
        return { phrase: p, pct };
      })
      .filter((x) => x.pct < 85)
      .sort((a, b) => a.pct - b.pct);

    const priority =
      scoredCandidates.length > 0
        ? scoredCandidates.slice(0, 3)
        : analysisResult.phrases
            .filter((p) => p.difficulty === 'Thử thách' || p.difficulty === 'Trung bình')
            .slice(0, 3)
            .map((p) => ({ phrase: p, pct: null as number | null }));

    return {
      practicedCount: practiced.length,
      tendencyLabel: tendency,
      priorityPhrases: priority,
    };
  }, [analysisResult.phrases, sessionStats, flatPct, sharpPct]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-1 sm:px-3">
      {/* 0. Missing Microphone / No Voice Warning */}
      {sessionStats.totalVocalFrames === 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold text-amber-300">Chưa ghi nhận tín hiệu âm thanh micro:</div>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Hệ thống chưa bắt được cao độ giọng hát trong phiên này. Hãy đảm bảo bạn đã cấp quyền truy cập Microphone cho trình duyệt và hát rõ ràng vào micro.
            </p>
          </div>
        </div>
      )}

      {/* 1. Overall Score Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-indigo-950/50 border border-emerald-500/40 text-center relative overflow-hidden">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white">Báo Cáo Độ Chuẩn Tông Giọng Hát</h3>
        <p className="text-xs text-slate-400 mt-1">{analysisResult.fileName}</p>

        <div className="my-4 flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-black font-mono text-emerald-400">
              {realtimeScorePct === null ? '—' : `${realtimeScorePct}%`}
            </div>
            <div className="text-[11px] font-mono uppercase text-slate-400 mt-0.5">
              Tỉ lệ chuẩn cao độ
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800" />

          <div className="text-center">
            <div className="text-2xl font-black font-mono text-sky-400">
              {sessionStats.highestStreak}
            </div>
            <div className="text-[11px] font-mono uppercase text-slate-400 mt-0.5">
              Chuỗi nốt dài nhất
            </div>
          </div>
        </div>

        {/* 4-Metric Summary Grid */}
        <div className="max-w-3xl mx-auto mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-center">
            <div className="text-emerald-400 font-bold text-sm">
              {realtimeScorePct === null ? '—' : `${realtimeScorePct}%`}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Chuẩn Tông (In-Tune)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/20 text-center">
            <div className="text-sky-400 font-bold text-sm">{sessionStats.highestStreak}s</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Chuỗi Chuẩn Dài Nhất</div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-center">
            <div className="text-indigo-300 font-bold text-sm">
              {practicedCount}/{analysisResult.phrases.length} câu
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Độ Phủ Câu Đã Tập</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-center">
            <div className="text-amber-300 font-bold text-xs truncate">{tendencyLabel}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Xu Hướng Khẩu Độ</div>
          </div>
        </div>
      </div>

      {/* 1.5. Top Priority Phrases to Re-practice Slow */}
      {priorityPhrases.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/35 via-slate-950/75 to-indigo-950/35 border border-amber-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Top Câu Cần Luyện Lại Ngay</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Ưu tiên các câu dễ trượt tông hoặc bước nhảy rộng ở tốc độ chậm 0.85x
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {priorityPhrases.map(({ phrase, pct }) => (
              <div
                key={`prio-${phrase.id}`}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-white">
                      Câu {phrase.phraseIndex} · {phrase.sectionLabel || 'Phiên khúc'}
                    </span>
                    {pct !== null ? (
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          pct >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {pct}% chuẩn
                      </span>
                    ) : (
                      <DifficultyBadge difficulty={phrase.difficulty} />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-200 line-clamp-2">
                    {phrase.lyricText || phrase.solfegeText}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onPracticePhraseSlow
                      ? onPracticePhraseSlow(phrase)
                      : onLoopPhrase(phrase)
                  }
                  className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>🎯 Tập Chậm 0.85x</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Phrase-by-Phrase Scorecard */}
      <div className="p-5 rounded-3xl bg-slate-950/60 border border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Đánh Giá Chi Tiết Từng Câu Hát</span>
        </h4>

        <div className="space-y-2">
          {analysisResult.phrases.map((phrase) => {
            const score = sessionStats.phraseScores[phrase.phraseIndex];
            const pct =
              score && score.total > 0 ? Math.round((score.inTune / score.total) * 100) : null;

            return (
              <div
                key={phrase.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-xs">
                      Câu {phrase.phraseIndex}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                      {phrase.sectionLabel || 'Phiên khúc'}
                    </span>
                    <DifficultyBadge difficulty={phrase.difficulty} />
                    <span className="text-[11px] font-mono text-slate-400">
                      ({phrase.lowestNote} – {phrase.highestNote})
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {phrase.lyricText || phrase.solfegeText}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {pct !== null ? (
                    <span
                      className={`text-xs font-mono font-bold ${
                        pct >= 80
                          ? 'text-emerald-400'
                          : pct >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {pct}% chuẩn
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Chưa thử câu này</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onLoopPhrase(phrase)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 text-sky-400 text-[11px] font-bold hover:bg-slate-700 transition flex items-center gap-1"
                  >
                    <Repeat className="w-3 h-3" />
                    <span>Luyện Lại</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Vocal Coach Feedback */}
      <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/20 text-xs text-sky-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sky-300">Lời Khuyên Của Huấn Luyện Viên:</div>
          <p className="text-slate-300 leading-relaxed">
            {sessionStats.totalVocalFrames === 0
              ? 'Chưa có dữ liệu cao độ để phân tích giọng hát. Hãy kiểm tra microphone, bấm "Hát Lại Toàn Bài" và cất giọng theo sóng âm mẫu!'
              : sessionStats.flatFrames > sessionStats.sharpFrames
              ? 'Bạn có xu hướng bị non cao độ (flat) ở các nốt cao. Hãy lấy hơi sâu bằng cơ hoành, giữ thẳng lưng và mở rộng vòm họng để nốt cao thoát âm tự nhiên.'
              : sessionStats.sharpFrames > sessionStats.flatFrames
              ? 'Bạn có xu hướng bị gắt (sharp). Hãy thả lỏng cơ hàm và cơ cổ, tránh tống hơi quá mạnh vào micro.'
              : 'Độ ổn định cao độ của bạn rất tốt! Hãy tiếp tục duy trì luyện tập các câu có bước nhảy quãng rộng để hoàn thiện trọn vẹn bài hát.'}
          </p>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onRestartFullSong}
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
        >
          Hát Lại Toàn Bài
        </button>

        <button
          type="button"
          onClick={onChooseAnotherSong}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition"
        >
          Chọn Bài Hát Khác
        </button>
      </div>
    </div>
  );
};
