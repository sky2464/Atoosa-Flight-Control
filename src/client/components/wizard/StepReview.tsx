import React from 'react';
import { RefreshCw } from 'lucide-react';
import type { PreFlightRecommendation } from '../../../shared/types.ts';

interface StepReviewProps {
  recommendation: PreFlightRecommendation | null;
  aiStreamText: string;
  isAnalyzing: boolean;
  onBack: () => void;
  onNext: () => void;
}

export const StepReview: React.FC<StepReviewProps> = ({
  recommendation,
  aiStreamText,
  isAnalyzing,
  onBack,
  onNext,
}) => {
  const stack = recommendation
    ? [
        { label: 'Frontend', value: recommendation.recommendedStack.frontend },
        { label: 'Backend', value: recommendation.recommendedStack.backend },
        { label: 'Database', value: recommendation.recommendedStack.database },
        { label: 'Container', value: recommendation.recommendedStack.containerization },
      ]
    : [];

  return (
    <div className="space-y-8">
      {isAnalyzing && (
        <p className="flex items-center gap-2 text-[13px] text-slate-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Weighing the trade-offs…
        </p>
      )}

      {recommendation && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stack.map((s) => (
            <div key={s.label} className="space-y-1">
              <dt className="text-xs text-slate-400">{s.label}</dt>
              <dd className="text-sm text-slate-100">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {recommendation?.dockerEvaluation && (
        <section className="space-y-3">
          <h3 className="section-title">
            Docker: <span className="text-slate-300 font-normal">{recommendation.dockerEvaluation.recommendation}</span>
          </h3>
          <p className="text-[13px] leading-relaxed text-slate-400">{recommendation.dockerEvaluation.reasoning}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[13px]">
            <ul className="space-y-1.5">
              <li className="text-xs text-slate-400">Pros</li>
              {recommendation.dockerEvaluation.pros.map((p, i) => (
                <li key={i} className="flex gap-2 text-slate-300">
                  <span className="dot bg-emerald-400 mt-2" />
                  {p}
                </li>
              ))}
            </ul>
            <ul className="space-y-1.5">
              <li className="text-xs text-slate-400">Trade-offs</li>
              {recommendation.dockerEvaluation.cons.map((c, i) => (
                <li key={i} className="flex gap-2 text-slate-300">
                  <span className="dot bg-amber-400 mt-2" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-xs text-slate-400">AI notes</h3>
        <div className="rounded-xl border border-slate-800/60 p-4 max-h-56 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">
            {aiStreamText || 'Waiting for the analysis…'}
          </pre>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">
          Back
        </button>
        <button onClick={onNext} className="btn-primary">
          Continue
        </button>
      </div>
    </div>
  );
};
