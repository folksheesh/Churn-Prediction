import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Sparkles,
  Users,
  TrendingUp,
  Brain,
  Layers,
  ShieldAlert,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export interface Segment {
  name: string;
  churn_rate: number;
  users: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
}

export interface FeatureData {
  feature: string;
  importance: number; // 0-100 percentage
  segments: Segment[];
  insight: string;
}

// ──────────────────────────────────────────────
// Risk config
// ──────────────────────────────────────────────
const riskConfig = {
  HIGH: {
    label: 'HIGH',
    pill: 'bg-rose-50 text-rose-700 border-rose-200',
    bar: 'from-rose-500 to-rose-400',
    barBg: 'bg-rose-50',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    glow: 'shadow-rose-200/40',
  },
  MEDIUM: {
    label: 'MEDIUM',
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'from-amber-500 to-amber-400',
    barBg: 'bg-amber-50',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    glow: 'shadow-amber-200/40',
  },
  LOW: {
    label: 'LOW',
    pill: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    bar: 'from-yellow-500 to-yellow-400',
    barBg: 'bg-yellow-50',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700',
    glow: 'shadow-yellow-200/40',
  },
  SAFE: {
    label: 'SAFE',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar: 'from-emerald-500 to-emerald-400',
    barBg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    glow: 'shadow-emerald-200/40',
  },
};

// ──────────────────────────────────────────────
// Insight Box
// ──────────────────────────────────────────────
function InsightBox({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.35 }}
      className="mt-5 flex items-stretch gap-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-violet-50/60 to-purple-50/40 border border-indigo-100/80 p-4"
    >
      <div className="flex-1 flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm shadow-indigo-200/60">
            <Sparkles size={13} className="text-white" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">AI Insight</span>
          <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Risk Badge
// ──────────────────────────────────────────────
function RiskBadge({ risk }: { risk: Segment['risk'] }) {
  const c = riskConfig[risk];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide border ${c.pill}`}>
      <span className={`w-1 h-1 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ──────────────────────────────────────────────
// Segment Row with animated risk bar
// ──────────────────────────────────────────────
function SegmentRow({ segment, index, maxRate }: { segment: Segment; index: number; maxRate: number }) {
  const c = riskConfig[segment.risk];
  const barWidthPct = maxRate > 0 ? Math.max((segment.churn_rate / maxRate) * 100, 3) : 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
      className="group"
    >
      <div className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-slate-50/80 transition-all duration-200 -mx-1">
        {/* Left: Name + Users */}
        <div className="w-[140px] shrink-0">
          <span className="text-[13px] font-semibold text-slate-800 block leading-tight">{segment.name}</span>
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
            <Users size={9} />
            {segment.users.toLocaleString()} users
          </span>
        </div>

        {/* Center: Bar */}
        <div className="flex-1 relative">
          <div className={`w-full h-2.5 rounded-full ${c.barBg} overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${barWidthPct}%` }}
              transition={{ delay: index * 0.06 + 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full bg-gradient-to-r ${c.bar} shadow-sm ${c.glow}`}
            />
          </div>
        </div>

        {/* Right: Rate + Badge */}
        <div className="flex items-center gap-3 shrink-0 w-[120px] justify-end">
          <span className={`text-sm font-bold tabular-nums ${c.text}`}>{segment.churn_rate}%</span>
          <RiskBadge risk={segment.risk} />
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Expandable Feature Detail
// ──────────────────────────────────────────────
function ExpandableFeatureDetail({ segments, insight, featureName }: { segments: Segment[]; insight: string; featureName: string }) {
  const maxRate = Math.max(...segments.map(s => s.churn_rate), 1);
  const totalUsers = segments.reduce((acc, s) => acc + s.users, 0);
  const highRiskCount = segments.filter(s => s.risk === 'HIGH' || s.risk === 'MEDIUM').reduce((acc, s) => acc + s.users, 0);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="pt-3 pb-1 px-1">
        {/* Summary strip */}
        <div className="flex items-center gap-6 mb-4 px-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Users size={11} className="text-slate-400" />
            <span className="font-semibold text-slate-700">{totalUsers.toLocaleString()}</span> total users analyzed
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldAlert size={11} className="text-rose-400" />
            <span className="font-semibold text-rose-600">{highRiskCount.toLocaleString()}</span> at elevated risk
          </div>
        </div>

        {/* Header row */}
        <div className="flex items-center gap-4 px-3 pb-2 border-b border-slate-100/80">
          <span className="w-[140px] shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Segment</span>
          <span className="flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Churn Distribution</span>
          <span className="w-[120px] text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Level</span>
        </div>

        {/* Segment rows */}
        <div className="divide-y divide-slate-50">
          {segments.map((segment, i) => (
            <SegmentRow key={segment.name} segment={segment} index={i} maxRate={maxRate} />
          ))}
        </div>

        {/* Insight */}
        {insight && <InsightBox text={insight} />}
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Feature Importance Card (Main component per row)
// ──────────────────────────────────────────────
function FeatureImportanceCard({ data, rank }: { data: FeatureData; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  // Determine bar color by importance
  const barColor =
    data.importance >= 40 ? 'from-rose-500 via-pink-500 to-rose-400'
    : data.importance >= 20 ? 'from-amber-500 via-orange-400 to-amber-400'
    : data.importance >= 10 ? 'from-blue-500 via-indigo-400 to-blue-400'
    : 'from-slate-400 via-slate-300 to-slate-300';

  const borderClass = expanded
    ? 'border-indigo-200/80 bg-white shadow-md shadow-indigo-100/30 ring-1 ring-indigo-100/40'
    : 'border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-slate-300/80 hover:-translate-y-[1px]';

  return (
    <div className={`rounded-xl border transition-all duration-300 ${borderClass}`}>
      {/* Clickable Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 group cursor-pointer focus:outline-none"
      >
        {/* Rank badge */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-200 ${
          expanded
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
        }`}>
          {rank}
        </div>

        {/* Feature name */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-indigo-900 transition-colors">
            {data.feature}
          </h4>
          {data.segments.length > 0 && (
            <span className="text-[10px] text-slate-400 font-medium">
              {data.segments.length} segments • Click to explore
            </span>
          )}
        </div>

        {/* Importance bar */}
        <div className="w-[180px] shrink-0 hidden sm:block">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.importance}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
            />
          </div>
        </div>

        {/* Importance value */}
        <div className="w-[60px] text-right shrink-0">
          <span className="text-sm font-bold text-slate-800 tabular-nums">{data.importance}%</span>
          <span className="text-[9px] text-slate-400 block font-medium">impact</span>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <ChevronRight
            size={16}
            className={`transition-colors duration-200 ${
              expanded ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-500'
            }`}
          />
        </motion.div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence>
        {expanded && data.segments.length > 0 && (
          <div className="px-5 pb-5 border-t border-slate-100/80">
            <ExpandableFeatureDetail segments={data.segments} insight={data.insight} featureName={data.feature} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Container — FeatureExplainability
// ──────────────────────────────────────────────
interface FeatureExplainabilityProps {
  features: FeatureData[];
  loading?: boolean;
}

export default function FeatureExplainability({ features, loading }: FeatureExplainabilityProps) {
  const totalSegments = features.reduce((acc, f) => acc + f.segments.length, 0);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-100 rounded w-64" />
          <div className="h-3 bg-slate-100 rounded w-96" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-white via-slate-50/50 to-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm shadow-indigo-200/50">
                <Brain size={14} className="text-white" />
              </div>
              Main Reasons for Decreased Engagement
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 ml-[38px]">
              <Layers size={11} className="text-slate-400" />
              Key factors impacting customer engagement • Click any factor to explore
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              Top {features.length} Factors • {totalSegments} Segments
            </span>
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="p-5 space-y-3">
        {features.map((feature, i) => (
          <FeatureImportanceCard key={feature.feature} data={feature} rank={i + 1} />
        ))}

        {features.length === 0 && (
          <div className="text-sm text-slate-400 py-12 text-center">
            Analyzing data to determine top engagement factors...
          </div>
        )}
      </div>
    </div>
  );
}
