import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Gift,
  Phone,
  Tag,
  BarChart3,
  Sparkles,
  TrendingUp,
  Shield,
  Users,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME CONFIG
══════════════════════════════════════════════════════════════════════════════ */

interface ThemeConfig {
  dark: boolean;
  // Page
  pageBg: string;
  orb1: string; orb2: string; orb3: string;
  // Panels & cards
  panelBg: string; panelBdr: string; panelShadow: string;
  cardBg: string; cardBdr: string;
  mainCardBg: string; mainCardBdr: string;
  adminCardBg: string; adminCardBdr: string;
  // Typography
  h: string;   // heading
  b: string;   // body
  s: string;   // subdued
  m: string;   // muted
  // Options
  optBg: string; optBdr: string; optShadow: string;
  selBg: string; selBdr: string; selShadow: string;
  optTxt: string; selTxt: string;
  // Controls
  backBg: string; backBdr: string; backIcon: string;
  disabledBg: string; disabledTxt: string; disabledBdr: string;
  // Progress & dots
  track: string; dotInactive: string;
  // Hint pill
  pillBg: string; pillTxt: string; pillBdr: string;
  // Processing
  procStepDoneBg: string; procStepDoneBdr: string;
  procStepActiveBg: string;
  procStepDoneTxt: string; procStepActiveTxt: string; procStepInactiveTxt: string;
  procInactiveDot: string;
  // Processing brain bg
  brainBg: string;
  // Stats
  statN: string; statS: string;
  // Result badge (dark theme uses bg class strings, light uses inline)
  badgeDark: boolean;
  // Insight / SHAP cards
  insightBg: string; insightBdr: string; insightIconBg: string;
  shapTrack: string;
  // Retry button
  retryBg: string; retryTxt: string;
  // Admin benefits icon
  benefitIconBg: string; benefitIconTxt: string;
}

const DARK: ThemeConfig = {
  dark: true,
  pageBg: 'linear-gradient(135deg, #030712 0%, #0a0f1e 50%, #060d1f 100%)',
  orb1: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
  orb2: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
  orb3: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
  panelBg: 'rgba(255,255,255,0.04)',
  panelBdr: 'rgba(255,255,255,0.08)',
  panelShadow: '0 8px 32px rgba(0,0,0,0.35)',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBdr: 'rgba(255,255,255,0.08)',
  mainCardBg: 'linear-gradient(135deg, rgba(15,20,40,0.85) 0%, rgba(20,10,40,0.85) 100%)',
  mainCardBdr: 'rgba(255,255,255,0.08)',
  adminCardBg: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(124,58,237,0.12) 100%)',
  adminCardBdr: 'rgba(99,102,241,0.25)',
  h: '#ffffff',
  b: 'rgba(255,255,255,0.78)',
  s: 'rgba(255,255,255,0.50)',
  m: 'rgba(255,255,255,0.32)',
  optBg: 'rgba(255,255,255,0.05)',
  optBdr: '1.5px solid rgba(255,255,255,0.09)',
  optShadow: '0 2px 8px rgba(0,0,0,0.18)',
  selBg: 'linear-gradient(135deg, rgba(37,99,235,0.24) 0%, rgba(124,58,237,0.24) 100%)',
  selBdr: '1.5px solid rgba(99,102,241,0.55)',
  selShadow: '0 0 24px rgba(37,99,235,0.18), 0 4px 16px rgba(0,0,0,0.2)',
  optTxt: 'rgba(255,255,255,0.75)',
  selTxt: '#e0e7ff',
  backBg: 'rgba(255,255,255,0.07)',
  backBdr: '1px solid rgba(255,255,255,0.10)',
  backIcon: 'rgba(255,255,255,0.60)',
  disabledBg: 'rgba(255,255,255,0.06)',
  disabledTxt: 'rgba(255,255,255,0.25)',
  disabledBdr: '1px solid rgba(255,255,255,0.08)',
  track: 'rgba(255,255,255,0.08)',
  dotInactive: 'rgba(255,255,255,0.15)',
  pillBg: 'rgba(99,102,241,0.15)',
  pillTxt: '#a5b4fc',
  pillBdr: 'rgba(99,102,241,0.25)',
  procStepDoneBg: 'rgba(37,99,235,0.12)',
  procStepDoneBdr: 'rgba(37,99,235,0.25)',
  procStepActiveBg: 'rgba(255,255,255,0.05)',
  procStepDoneTxt: '#93c5fd',
  procStepActiveTxt: 'rgba(255,255,255,0.85)',
  procStepInactiveTxt: 'rgba(255,255,255,0.28)',
  procInactiveDot: 'rgba(255,255,255,0.12)',
  brainBg: '#050b1a',
  statN: '#ffffff',
  statS: 'rgba(255,255,255,0.35)',
  badgeDark: true,
  insightBg: 'rgba(255,255,255,0.04)',
  insightBdr: 'rgba(255,255,255,0.08)',
  insightIconBg: 'rgba(99,102,241,0.20)',
  shapTrack: 'rgba(255,255,255,0.07)',
  retryBg: 'rgba(255,255,255,0.06)',
  retryTxt: 'rgba(255,255,255,0.45)',
  benefitIconBg: 'rgba(37,99,235,0.20)',
  benefitIconTxt: '#60a5fa',
};

const LIGHT: ThemeConfig = {
  dark: false,
  pageBg: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 60%, #eff6ff 100%)',
  orb1: 'radial-gradient(circle, #93c5fd 0%, transparent 70%)',
  orb2: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)',
  orb3: 'radial-gradient(circle, #7dd3fc 0%, transparent 70%)',
  panelBg: 'rgba(255,255,255,0.88)',
  panelBdr: 'rgba(226,232,240,0.9)',
  panelShadow: '0 4px 20px rgba(15,23,42,0.07)',
  cardBg: '#ffffff',
  cardBdr: '#e2e8f0',
  mainCardBg: 'rgba(255,255,255,0.96)',
  mainCardBdr: '#e2e8f0',
  adminCardBg: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(124,58,237,0.05) 100%)',
  adminCardBdr: 'rgba(99,102,241,0.18)',
  h: '#0f172a',
  b: '#334155',
  s: '#64748b',
  m: '#94a3b8',
  optBg: '#ffffff',
  optBdr: '1.5px solid #e2e8f0',
  optShadow: '0 1px 4px rgba(15,23,42,0.05)',
  selBg: 'linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(124,58,237,0.07) 100%)',
  selBdr: '1.5px solid #818cf8',
  selShadow: '0 0 18px rgba(99,102,241,0.12), 0 2px 10px rgba(15,23,42,0.05)',
  optTxt: '#334155',
  selTxt: '#1e1b4b',
  backBg: '#f1f5f9',
  backBdr: '1px solid #e2e8f0',
  backIcon: '#64748b',
  disabledBg: '#f8fafc',
  disabledTxt: '#94a3b8',
  disabledBdr: '1px solid #e2e8f0',
  track: '#e2e8f0',
  dotInactive: '#cbd5e1',
  pillBg: 'rgba(99,102,241,0.10)',
  pillTxt: '#4338ca',
  pillBdr: 'rgba(99,102,241,0.20)',
  procStepDoneBg: 'rgba(37,99,235,0.07)',
  procStepDoneBdr: 'rgba(37,99,235,0.18)',
  procStepActiveBg: 'rgba(255,255,255,0.90)',
  procStepDoneTxt: '#2563eb',
  procStepActiveTxt: '#0f172a',
  procStepInactiveTxt: '#94a3b8',
  procInactiveDot: '#cbd5e1',
  brainBg: '#eef2ff',
  statN: '#0f172a',
  statS: '#94a3b8',
  badgeDark: false,
  insightBg: '#f8fafc',
  insightBdr: '#e2e8f0',
  insightIconBg: 'rgba(99,102,241,0.10)',
  shapTrack: '#e2e8f0',
  retryBg: '#f1f5f9',
  retryTxt: '#64748b',
  benefitIconBg: 'rgba(37,99,235,0.10)',
  benefitIconTxt: '#2563eb',
};

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════════════════════ */

const QUESTIONS = [
  {
    question: 'Seberapa sering Anda menggunakan layanan ini?',
    hint: 'Frekuensi penggunaan',
    options: [
      { emoji: '🔥', label: 'Hampir setiap hari' },
      { emoji: '😊', label: 'Beberapa kali seminggu' },
      { emoji: '😐', label: 'Sesekali saja' },
      { emoji: '😴', label: 'Jarang digunakan' },
    ],
  },
  {
    question: 'Jika layanan ini berbayar, paket mana yang paling cocok untuk Anda?',
    hint: 'Tipe paket langganan',
    options: [
      { emoji: '🌱', label: 'Starter' },
      { emoji: '⚡', label: 'Basic' },
      { emoji: '💎', label: 'Premium' },
      { emoji: '🏢', label: 'Enterprise' },
    ],
  },
  {
    question: 'Kapan terakhir kali Anda menggunakan layanan ini?',
    hint: 'Aktivitas terakhir',
    options: [
      { emoji: '✅', label: 'Hari ini' },
      { emoji: '📅', label: '1–3 hari lalu' },
      { emoji: '🕐', label: '1 minggu lalu' },
      { emoji: '⏰', label: 'Lebih dari 2 minggu lalu' },
    ],
  },
  {
    question: 'Jika mengalami masalah, seberapa sering Anda menghubungi customer support?',
    hint: 'Frekuensi support',
    options: [
      { emoji: '😎', label: 'Tidak pernah' },
      { emoji: '🙂', label: 'Kadang-kadang' },
      { emoji: '😟', label: 'Sering' },
      { emoji: '😰', label: 'Sangat sering' },
    ],
  },
  {
    question: 'Sudah berapa lama Anda menjadi pelanggan?',
    hint: 'Masa berlangganan',
    options: [
      { emoji: '🆕', label: 'Kurang dari 3 bulan' },
      { emoji: '📆', label: '3–12 bulan' },
      { emoji: '🏅', label: '1–2 tahun' },
      { emoji: '🏆', label: 'Lebih dari 2 tahun' },
    ],
  },
  {
    question: 'Berapa kisaran biaya langganan per bulan?',
    hint: 'Nilai berlangganan',
    options: [
      { emoji: '💵', label: '< $20' },
      { emoji: '💴', label: '$20 – $50' },
      { emoji: '💶', label: '$50 – $100' },
      { emoji: '💷', label: '> $100' },
    ],
  },
];

const RISK_MATRIX: number[][] = [
  [0.05, 0.32, 0.68, 0.92],
  [0.72, 0.48, 0.22, 0.08],
  [0.04, 0.28, 0.62, 0.90],
  [0.12, 0.38, 0.70, 0.92],
  [0.72, 0.50, 0.28, 0.08],
  [0.68, 0.45, 0.24, 0.10],
];

const WEIGHTS = [0.28, 0.12, 0.30, 0.15, 0.10, 0.05];

const PROCESSING_STEPS = [
  'Menganalisis aktivitas pengguna',
  'Memproses pola penggunaan',
  'Menghitung risiko churn',
  'Menyiapkan rekomendasi',
];

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════════ */

function calcRisk(answers: number[]): number {
  const raw = answers.reduce((sum, ans, i) => sum + WEIGHTS[i] * RISK_MATRIX[i][ans], 0);
  return Math.min(95, Math.max(8, Math.round(raw * 100)));
}

function riskMeta(pct: number) {
  if (pct <= 30)
    return {
      label: 'Low Risk', color: '#10b981', glow: 'rgba(16,185,129,0.22)', emoji: '🟢',
      darkBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      lightBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  if (pct <= 60)
    return {
      label: 'Medium Risk', color: '#f59e0b', glow: 'rgba(245,158,11,0.22)', emoji: '🟡',
      darkBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      lightBadge: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  if (pct <= 80)
    return {
      label: 'High Risk', color: '#f97316', glow: 'rgba(249,115,22,0.22)', emoji: '🟠',
      darkBadge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      lightBadge: 'bg-orange-50 text-orange-700 border-orange-200',
    };
  return {
    label: 'Critical Risk', color: '#ef4444', glow: 'rgba(239,68,68,0.22)', emoji: '🔴',
    darkBadge: 'bg-red-500/20 text-red-300 border-red-500/30',
    lightBadge: 'bg-red-50 text-red-700 border-red-200',
  };
}

function getInsight(pct: number): string {
  if (pct <= 30)
    return 'Pelanggan ini menunjukkan pola keterlibatan yang sangat baik dan loyalitas tinggi. Kemungkinan churn sangat rendah dalam 30 hari ke depan.';
  if (pct <= 60)
    return 'Beberapa sinyal risiko terdeteksi, termasuk penurunan frekuensi penggunaan. Tindakan proaktif dianjurkan untuk mencegah churn sebelum terlambat.';
  if (pct <= 80)
    return 'Pelanggan menunjukkan pola aktivitas yang menurun dan memiliki kemungkinan tinggi untuk berhenti berlangganan dalam waktu dekat. Intervensi segera sangat diperlukan.';
  return 'Risiko churn sangat kritis. Data menunjukkan ketidakaktifan signifikan dan sinyal kuat keluarnya pelanggan. Tindakan retensi darurat diperlukan sekarang juga.';
}

function getFactors(answers: number[]) {
  return [
    { label: 'Aktivitas penggunaan',     score: RISK_MATRIX[0][answers[0]], color: '#3b82f6' },
    { label: 'Waktu sejak login terakhir', score: RISK_MATRIX[2][answers[2]], color: '#8b5cf6' },
    { label: 'Frekuensi support ticket', score: RISK_MATRIX[3][answers[3]], color: '#ec4899' },
    { label: 'Masa berlangganan',         score: RISK_MATRIX[4][answers[4]], color: '#f59e0b' },
    { label: 'Nilai paket langganan',     score: RISK_MATRIX[1][answers[1]], color: '#10b981' },
  ].sort((a, b) => b.score - a.score);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CIRCULAR PROGRESS
══════════════════════════════════════════════════════════════════════════════ */

function CircularProgress({
  pct,
  color,
  glow,
  t,
}: {
  pct: number;
  color: string;
  glow: string;
  t: ThemeConfig;
}) {
  const R = 76;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ background: glow }} />
      <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
        <circle
          cx="100" cy="100" r={R} fill="none"
          stroke={t.dark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}
          strokeWidth="12"
        />
        <motion.circle
          cx="100" cy="100" r={R} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 12px ${color}80)` }}
        />
      </svg>
      <div className="relative text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-5xl font-black leading-none"
          style={{ color: t.h }}
        >
          {pct}%
        </motion.div>
        <div className="text-sm mt-1 font-medium" style={{ color: t.s }}>risiko churn</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   THEME TOGGLE BUTTON (floating)
══════════════════════════════════════════════════════════════════════════════ */

function ThemeToggle({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-50">
      <motion.button
        id="expo-theme-toggle"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.07)',
          border: isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(15,23,42,0.12)',
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : '0 4px 12px rgba(15,23,42,0.08)',
        }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Sun size={17} style={{ color: 'rgba(255,255,255,0.75)' }} />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Moon size={17} style={{ color: '#475569' }} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */

type Screen = 'hero' | 'questions' | 'processing' | 'result';

export default function ExpoDemo() {
  const [screen, setScreen] = useState<Screen>('hero');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(6).fill(-1));
  const [churnPct, setChurnPct] = useState(0);
  const [direction, setDirection] = useState(1);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const navigate = useNavigate();

  const t = themeMode === 'dark' ? DARK : LIGHT;

  useEffect(() => {
    if (screen !== 'processing') return;
    setCheckedSteps([]);
    const timers = PROCESSING_STEPS.map((_, i) =>
      setTimeout(() => setCheckedSteps(prev => [...prev, i]), 650 + i * 600)
    );
    const done = setTimeout(() => setScreen('result'), 650 + PROCESSING_STEPS.length * 600 + 400);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [screen]);

  const handleAnswer = (idx: number) => {
    const next = [...answers];
    next[currentQ] = idx;
    setAnswers(next);
  };

  const handleNext = () => {
    if (answers[currentQ] === -1) return;
    setDirection(1);
    if (currentQ < 5) {
      setCurrentQ(q => q + 1);
    } else {
      setChurnPct(calcRisk(answers));
      setScreen('processing');
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (currentQ > 0) setCurrentQ(q => q - 1);
    else setScreen('hero');
  };

  const handleReset = () => {
    setAnswers(new Array(6).fill(-1));
    setCurrentQ(0);
    setCheckedSteps([]);
    setChurnPct(0);
    setScreen('hero');
  };

  const meta = riskMeta(churnPct);

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-start font-sans overflow-x-hidden"
      animate={{ background: t.pageBg }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ background: t.orb1, opacity: t.dark ? 0.20 : 0.40 }}
          transition={{ duration: 0.5 }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ background: t.orb2, opacity: t.dark ? 0.15 : 0.35 }}
          transition={{ duration: 0.5 }}
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ background: t.orb3, opacity: t.dark ? 0.10 : 0.30 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl"
        />
      </div>

      {/* Theme toggle */}
      <ThemeToggle isDark={t.dark} onToggle={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')} />

      {/* Mobile container */}
      <div className="relative z-10 w-full max-w-[430px] mx-auto min-h-screen flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {screen === 'hero' && (
            <HeroSection key="hero" t={t} onStart={() => setScreen('questions')} />
          )}
          {screen === 'questions' && (
            <QuestionSection
              key={`q-${currentQ}`}
              t={t}
              direction={direction}
              question={QUESTIONS[currentQ]}
              questionIndex={currentQ}
              totalQuestions={QUESTIONS.length}
              selected={answers[currentQ]}
              onSelect={handleAnswer}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {screen === 'processing' && (
            <ProcessingSection key="processing" t={t} checkedSteps={checkedSteps} />
          )}
          {screen === 'result' && (
            <ResultSection
              key="result"
              t={t}
              pct={churnPct}
              meta={meta}
              answers={answers}
              onReset={handleReset}
              onDashboard={() => navigate('/admin/dashboard')}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────────────────────────────────────── */

function HeroSection({ t, onStart }: { t: ThemeConfig; onStart: () => void }) {
  return (
    <motion.div
      key="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-6 py-16 text-center relative"
    >
      {/* Top brand bar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="absolute top-10 left-6 right-6 flex items-center justify-between pr-14"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg">
            <img src="/logoo.jpeg" alt="ChurnSense" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-[15px] tracking-tight" style={{ color: t.h }}>ChurnSense</span>
        </div>
        <div className="text-[11px] font-medium uppercase tracking-widest" style={{ color: t.m }}>AI Demo</div>
      </motion.div>

      {/* Brain icon with pulse */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative mb-10"
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: t.dark
              ? 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(124,58,237,0.2) 100%)'
              : 'linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(124,58,237,0.10) 100%)',
            boxShadow: t.dark
              ? '0 0 60px rgba(37,99,235,0.25), inset 0 0 40px rgba(124,58,237,0.1)'
              : '0 0 40px rgba(99,102,241,0.15), inset 0 0 30px rgba(99,102,241,0.06)',
            border: t.dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(99,102,241,0.20)',
          }}
        >
          <span className="text-4xl select-none">🧠</span>
        </div>
        {[1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${t.dark ? 'rgba(99,102,241,0.20)' : 'rgba(99,102,241,0.25)'}` }}
            animate={{ scale: [1, 1.4 + i * 0.2], opacity: [0.6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-wide"
        style={{
          background: t.pillBg,
          border: `1px solid ${t.pillBdr}`,
          color: t.pillTxt,
        }}
      >
        <Sparkles size={12} />
        🚀 AI Customer Retention Demo
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="text-[28px] sm:text-3xl font-black leading-[1.18] tracking-tight mb-4"
        style={{ color: t.h }}
      >
        Bisakah AI Mengetahui{' '}
        <span
          style={{
            background: t.dark
              ? 'linear-gradient(135deg, #60a5fa, #a78bfa)'
              : 'linear-gradient(135deg, #2563eb, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Pelanggan yang Akan Berhenti Berlangganan?
        </span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="text-[15px] leading-relaxed mb-10 max-w-xs"
        style={{ color: t.s }}
      >
        Jawab beberapa pertanyaan singkat dan lihat prediksi churn Anda dalam hitungan detik.
      </motion.p>

      {/* CTA */}
      <motion.button
        id="expo-demo-start-btn"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-[16px]"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          boxShadow: t.dark
            ? '0 8px 32px rgba(37,99,235,0.38), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 8px 28px rgba(37,99,235,0.28), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        Mulai Demo
        <ArrowRight size={18} />
      </motion.button>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.6 }}
        className="absolute bottom-10 left-6 right-6 flex items-center justify-center gap-6"
      >
        {[
          { label: '94.2%', sub: 'Akurasi AI' },
          { label: '< 3s', sub: 'Waktu prediksi' },
          { label: '10k+', sub: 'Pelanggan dianalisis' },
        ].map(({ label, sub }) => (
          <div key={label} className="text-center">
            <div className="font-bold text-[15px]" style={{ color: t.statN }}>{label}</div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: t.statS }}>{sub}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUESTION WIZARD SECTION
───────────────────────────────────────────────────────────────────────────── */

interface QuestionSectionProps {
  t: ThemeConfig;
  direction: number;
  question: typeof QUESTIONS[0];
  questionIndex: number;
  totalQuestions: number;
  selected: number;
  onSelect: (i: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function QuestionSection({
  t, direction, question, questionIndex, totalQuestions, selected, onSelect, onNext, onBack,
}: QuestionSectionProps) {
  const progress = (questionIndex / totalQuestions) * 100;
  const canNext = selected !== -1;

  const variants = {
    enter: { x: direction > 0 ? 60 : -60, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
    exit: { x: direction > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.22 } },
  };

  return (
    <motion.div
      key={`q-${questionIndex}`}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className="flex flex-col min-h-screen px-5 pt-14 pb-8"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 pr-14">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          id={`expo-back-q${questionIndex + 1}`}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: t.backBg, border: t.backBdr }}
        >
          <ChevronLeft size={18} style={{ color: t.backIcon }} />
        </motion.button>

        <div className="text-sm font-semibold tracking-wide" style={{ color: t.s }}>
          {questionIndex + 1} / {totalQuestions}
        </div>

        <div className="w-10 h-10 rounded-xl overflow-hidden opacity-70">
          <img src="/logoo.jpeg" alt="ChurnSense" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.track }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === questionIndex ? 20 : 6,
                height: 6,
                backgroundColor:
                  i < questionIndex ? '#2563eb'
                  : i === questionIndex ? '#7c3aed'
                  : t.dotInactive,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Hint + question */}
      <div className="mb-2">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: t.pillBg, color: t.pillTxt, border: `1px solid ${t.pillBdr}` }}
        >
          <Sparkles size={10} />
          {question.hint}
        </div>
        <h2 className="text-[20px] font-bold leading-snug mb-6" style={{ color: t.h }}>
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 flex-1">
        {question.options.map((opt, i) => {
          const isSel = selected === i;
          return (
            <motion.button
              key={i}
              id={`expo-q${questionIndex + 1}-opt${i + 1}`}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelect(i)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left"
              style={{
                background: isSel ? t.selBg : t.optBg,
                border: isSel ? t.selBdr : t.optBdr,
                boxShadow: isSel ? t.selShadow : t.optShadow,
                transition: 'all 0.2s ease',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
            >
              <span className="text-2xl select-none flex-shrink-0">{opt.emoji}</span>
              <span className="font-semibold text-[15px] flex-1" style={{ color: isSel ? t.selTxt : t.optTxt }}>
                {opt.label}
              </span>
              {isSel && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <CheckCircle2 size={20} style={{ color: '#6366f1', flexShrink: 0 }} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Next button */}
      <motion.button
        id={`expo-next-q${questionIndex + 1}`}
        whileHover={canNext ? { scale: 1.02, y: -1 } : {}}
        whileTap={canNext ? { scale: 0.98 } : {}}
        onClick={onNext}
        disabled={!canNext}
        className="mt-6 w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2.5"
        style={
          canNext
            ? {
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: '#fff',
                boxShadow: t.dark
                  ? '0 8px 24px rgba(37,99,235,0.32)'
                  : '0 6px 20px rgba(37,99,235,0.22)',
              }
            : {
                background: t.disabledBg,
                color: t.disabledTxt,
                border: t.disabledBdr,
              }
        }
      >
        {questionIndex < 5 ? 'Lanjutkan' : 'Lihat Prediksi AI'}
        <ArrowRight size={18} />
      </motion.button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROCESSING SECTION
───────────────────────────────────────────────────────────────────────────── */

function ProcessingSection({ t, checkedSteps }: { t: ThemeConfig; checkedSteps: number[] }) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
    >
      {/* Spinning ring + brain */}
      <div className="relative mb-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24 rounded-full absolute inset-0"
          style={{ background: 'conic-gradient(from 0deg, #2563eb, #7c3aed, #2563eb)', padding: 3 }}
        />
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center relative"
          style={{ background: t.brainBg, border: '3px solid transparent' }}
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-4xl">🧠</span>
          </motion.div>
        </div>
        {/* Orbiting dot */}
        <motion.div
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            top: -6, left: '50%',
            boxShadow: '0 0 10px #60a5fa',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          transformTemplate={({ rotate }) => `rotate(${rotate}) translateX(52px)`}
        />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold mb-2"
        style={{ color: t.h }}
      >
        AI sedang menganalisis...
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-sm mb-10"
        style={{ color: t.s }}
      >
        Memproses pola perilaku pelanggan Anda
      </motion.p>

      {/* Step checklist */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        {PROCESSING_STEPS.map((step, i) => {
          const isDone = checkedSteps.includes(i);
          const isActive = !isDone && checkedSteps.length === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: isDone
                  ? t.procStepDoneBg
                  : isActive
                  ? t.procStepActiveBg
                  : 'transparent',
                border: isDone
                  ? `1px solid ${t.procStepDoneBdr}`
                  : '1px solid transparent',
              }}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <CheckCircle2 size={18} style={{ color: '#3b82f6' }} />
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    className="w-4 h-4 rounded-full border-2"
                    animate={{ borderColor: ['#6366f1', '#8b5cf6', '#6366f1'] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ borderTopColor: 'transparent' }}
                  />
                ) : (
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ borderColor: t.procInactiveDot }}
                  />
                )}
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: isDone
                    ? t.procStepDoneTxt
                    : isActive
                    ? t.procStepActiveTxt
                    : t.procStepInactiveTxt,
                }}
              >
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RESULT SECTION
───────────────────────────────────────────────────────────────────────────── */

interface ResultSectionProps {
  t: ThemeConfig;
  pct: number;
  meta: ReturnType<typeof riskMeta>;
  answers: number[];
  onReset: () => void;
  onDashboard: () => void;
}

function ResultSection({ t, pct, meta, answers, onReset, onDashboard }: ResultSectionProps) {
  const factors = getFactors(answers);
  const insight = getInsight(pct);
  const badgeClass = t.dark ? meta.darkBadge : meta.lightBadge;

  const recommendations = [
    {
      icon: <Gift size={20} />,
      title: 'Loyalty Program',
      desc: 'Berikan reward atau benefit eksklusif untuk mempertahankan pelanggan.',
      color: '#7c3aed',
      darkBg: 'rgba(124,58,237,0.12)',
      lightBg: 'rgba(124,58,237,0.06)',
    },
    {
      icon: <Phone size={20} />,
      title: 'Customer Follow-Up',
      desc: 'Lakukan pendekatan personal melalui call atau chat langsung.',
      color: '#2563eb',
      darkBg: 'rgba(37,99,235,0.12)',
      lightBg: 'rgba(37,99,235,0.06)',
    },
    {
      icon: <Tag size={20} />,
      title: 'Special Discount',
      desc: 'Tawarkan promo retensi atau diskon eksklusif untuk perpanjangan.',
      color: '#059669',
      darkBg: 'rgba(5,150,105,0.12)',
      lightBg: 'rgba(5,150,105,0.06)',
    },
  ];

  const businessBenefits = [
    { icon: <Users size={15} />, text: 'Mengidentifikasi pelanggan berisiko tinggi' },
    { icon: <Zap size={15} />,   text: 'Menjalankan campaign retensi otomatis' },
    { icon: <TrendingUp size={15} />, text: 'Mengurangi customer churn secara signifikan' },
    { icon: <Shield size={15} />, text: 'Meningkatkan customer lifetime value' },
  ];

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-screen"
    >
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between pr-14">
          <div className="flex items-center gap-2">
            <img src="/logoo.jpeg" alt="ChurnSense" className="w-7 h-7 rounded-lg object-cover opacity-80" />
            <span className="font-semibold text-sm" style={{ color: t.s }}>ChurnSense</span>
          </div>
          <button
            onClick={onReset}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: t.retryBg, color: t.retryTxt }}
          >
            Coba Lagi
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-5">

        {/* ── Churn Risk Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="rounded-3xl p-6 text-center"
          style={{
            background: t.mainCardBg,
            border: `1px solid ${t.mainCardBdr}`,
            backdropFilter: 'blur(20px)',
            boxShadow: t.panelShadow,
          }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: t.m }}
          >
            Hasil Prediksi AI
          </div>
          <div className="flex justify-center mb-5">
            <CircularProgress pct={pct} color={meta.color} glow={meta.glow} t={t} />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border ${badgeClass}`}
          >
            <span>{meta.emoji}</span>
            {meta.label}
          </motion.div>
        </motion.div>

        {/* ── AI Insight ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl p-5"
          style={{
            background: t.insightBg,
            border: `1px solid ${t.insightBdr}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: t.insightIconBg }}
            >
              <BarChart3 size={14} style={{ color: '#6366f1' }} />
            </div>
            <span className="font-semibold text-[13px]" style={{ color: t.h }}>Insight AI</span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: t.s }}>{insight}</p>
        </motion.div>

        {/* ── Recommendations ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div
            className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
            style={{ color: t.m }}
          >
            Rekomendasi Tindakan
          </div>
          <div className="flex flex-col gap-3">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.1, duration: 0.4 }}
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{
                  background: t.dark ? rec.darkBg : rec.lightBg,
                  border: `1px solid ${rec.color}30`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${rec.color}22`, color: rec.color }}
                >
                  {rec.icon}
                </div>
                <div>
                  <div className="font-semibold text-[13px] mb-0.5" style={{ color: t.h }}>{rec.title}</div>
                  <div className="text-[12px] leading-relaxed" style={{ color: t.s }}>{rec.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── SHAP Explainability ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="rounded-2xl p-5"
          style={{
            background: t.insightBg,
            border: `1px solid ${t.insightBdr}`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: t.insightIconBg }}
            >
              <Sparkles size={13} style={{ color: '#6366f1' }} />
            </div>
            <div>
              <div className="font-semibold text-[13px]" style={{ color: t.h }}>Faktor Penentu Prediksi</div>
              <div className="text-[11px]" style={{ color: t.m }}>Terinspirasi dari SHAP Explanation</div>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            {factors.map((f, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[12px] font-medium" style={{ color: t.s }}>{f.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: f.color }}>
                    {Math.round(f.score * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: t.shapTrack }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: f.color, boxShadow: `0 0 8px ${f.color}55` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(f.score * 100)}%` }}
                    transition={{ delay: 0.6 + i * 0.12, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Admin Transition ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="rounded-3xl p-6 text-center"
          style={{
            background: t.adminCardBg,
            border: `1px solid ${t.adminCardBdr}`,
          }}
        >
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: t.pillBg, color: t.pillTxt, border: `1px solid ${t.pillBdr}` }}
          >
            <Sparkles size={10} />
            Untuk Perusahaan
          </div>
          <h3 className="font-bold text-[17px] mb-2 leading-snug" style={{ color: t.h }}>
            Bagaimana perusahaan menggunakan prediksi ini?
          </h3>
          <p className="text-[13px] mb-5 leading-relaxed" style={{ color: t.s }}>
            Prediksi seperti ini membantu perusahaan mengambil tindakan nyata secara otomatis.
          </p>

          <div className="flex flex-col gap-2.5 mb-6 text-left">
            {businessBenefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: t.benefitIconBg, color: t.benefitIconTxt }}
                >
                  {b.icon}
                </div>
                <span className="text-[13px]" style={{ color: t.b }}>{b.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            id="expo-goto-dashboard-btn"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDashboard}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 text-white"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              boxShadow: t.dark
                ? '0 8px 24px rgba(37,99,235,0.35)'
                : '0 6px 18px rgba(37,99,235,0.22)',
            }}
          >
            Lihat Dashboard Admin
            <ArrowRight size={17} />
          </motion.button>
        </motion.div>

        <div className="h-4" />
      </div>
    </motion.div>
  );
}
