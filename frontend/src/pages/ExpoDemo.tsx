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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

// Risk contribution per answer index — higher = more churn risk
const RISK_MATRIX: number[][] = [
  [0.05, 0.32, 0.68, 0.92], // Q1: login freq
  [0.72, 0.48, 0.22, 0.08], // Q2: plan tier (Starter=high)
  [0.04, 0.28, 0.62, 0.90], // Q3: last activity
  [0.12, 0.38, 0.70, 0.92], // Q4: support tickets
  [0.72, 0.50, 0.28, 0.08], // Q5: tenure (new=high)
  [0.68, 0.45, 0.24, 0.10], // Q6: monthly value (low=high)
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
    return { label: 'Low Risk', color: '#10b981', glow: 'rgba(16,185,129,0.25)', emoji: '🟢', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (pct <= 60)
    return { label: 'Medium Risk', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)', emoji: '🟡', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  if (pct <= 80)
    return { label: 'High Risk', color: '#f97316', glow: 'rgba(249,115,22,0.25)', emoji: '🟠', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
  return { label: 'Critical Risk', color: '#ef4444', glow: 'rgba(239,68,68,0.25)', emoji: '🔴', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
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
    { label: 'Aktivitas penggunaan', score: RISK_MATRIX[0][answers[0]], color: '#3b82f6' },
    { label: 'Waktu sejak login terakhir', score: RISK_MATRIX[2][answers[2]], color: '#8b5cf6' },
    { label: 'Frekuensi support ticket', score: RISK_MATRIX[3][answers[3]], color: '#ec4899' },
    { label: 'Masa berlangganan', score: RISK_MATRIX[4][answers[4]], color: '#f59e0b' },
    { label: 'Nilai paket langganan', score: RISK_MATRIX[1][answers[1]], color: '#10b981' },
  ].sort((a, b) => b.score - a.score);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CIRCULAR PROGRESS SVG
══════════════════════════════════════════════════════════════════════════════ */

function CircularProgress({ pct, color, glow }: { pct: number; color: string; glow: string }) {
  const R = 76;
  const C = 2 * Math.PI * R; // ≈ 477.5
  const offset = C * (1 - pct / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Glow halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-30"
        style={{ background: glow }}
      />
      <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
        {/* Track */}
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        {/* Progress arc */}
        <motion.circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 12px ${color}80)` }}
        />
      </svg>
      {/* Centre text */}
      <div className="relative text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-5xl font-black text-white leading-none"
        >
          {pct}%
        </motion.div>
        <div className="text-sm text-white/50 mt-1 font-medium">risiko churn</div>
      </div>
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
  const navigate = useNavigate();

  // Processing sequence
  useEffect(() => {
    if (screen !== 'processing') return;
    setCheckedSteps([]);
    const timers = PROCESSING_STEPS.map((_, i) =>
      setTimeout(() => setCheckedSteps(prev => [...prev, i]), 650 + i * 600)
    );
    const done = setTimeout(() => setScreen('result'), 650 + PROCESSING_STEPS.length * 600 + 400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
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
      const risk = calcRisk(answers);
      setChurnPct(risk);
      setScreen('processing');
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (currentQ > 0) {
      setCurrentQ(q => q - 1);
    } else {
      setScreen('hero');
    }
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
    <div
      className="min-h-screen flex flex-col items-center justify-start font-sans overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg, #030712 0%, #0a0f1e 50%, #060d1f 100%)' }}
    >
      {/* Global ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' }} />
      </div>

      {/* Mobile container — centered phone-like frame on desktop */}
      <div className="relative z-10 w-full max-w-[430px] mx-auto min-h-screen flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {screen === 'hero' && (
            <HeroSection key="hero" onStart={() => setScreen('questions')} />
          )}
          {screen === 'questions' && (
            <QuestionSection
              key={`q-${currentQ}`}
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
            <ProcessingSection key="processing" checkedSteps={checkedSteps} />
          )}
          {screen === 'result' && (
            <ResultSection
              key="result"
              pct={churnPct}
              meta={meta}
              answers={answers}
              onReset={handleReset}
              onDashboard={() => navigate('/admin/dashboard')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────────────────────────────────────── */

function HeroSection({ onStart }: { onStart: () => void }) {
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
        className="absolute top-10 left-6 right-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg">
            <img src="/logoo.jpeg" alt="ChurnSense" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight">ChurnSense</span>
        </div>
        <div className="text-[11px] text-white/40 font-medium uppercase tracking-widest">AI Demo</div>
      </motion.div>

      {/* Decorative ring */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative mb-10"
      >
        <div className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(124,58,237,0.2) 100%)',
            boxShadow: '0 0 60px rgba(37,99,235,0.25), inset 0 0 40px rgba(124,58,237,0.1)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
          <span className="text-4xl select-none">🧠</span>
        </div>
        {/* Pulse rings */}
        {[1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-blue-500/20"
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
          background: 'linear-gradient(90deg, rgba(37,99,235,0.2), rgba(124,58,237,0.2))',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#a5b4fc',
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
        className="text-[28px] sm:text-3xl font-black text-white leading-[1.18] tracking-tight mb-4"
      >
        Bisakah AI Mengetahui{' '}
        <span
          className="inline-block"
          style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Pelanggan yang Akan Berhenti Berlangganan?
        </span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="text-[15px] text-white/55 leading-relaxed mb-10 max-w-xs"
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
        className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-[16px] shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          boxShadow: '0 8px 32px rgba(37,99,235,0.35), 0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        Mulai Demo
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
      </motion.button>

      {/* Social proof strip */}
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
            <div className="text-white font-bold text-[15px]">{label}</div>
            <div className="text-white/35 text-[11px] font-medium mt-0.5">{sub}</div>
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
  direction,
  question,
  questionIndex,
  totalQuestions,
  selected,
  onSelect,
  onNext,
  onBack,
}: QuestionSectionProps) {
  const progress = ((questionIndex) / totalQuestions) * 100;
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
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          id={`expo-back-q${questionIndex + 1}`}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <ChevronLeft size={18} className="text-white/70" />
        </motion.button>

        <div className="text-white/45 text-sm font-semibold tracking-wide">
          {questionIndex + 1} / {totalQuestions}
        </div>

        {/* Brand icon */}
        <div className="w-10 h-10 rounded-xl overflow-hidden opacity-60">
          <img src="/logoo.jpeg" alt="ChurnSense" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === questionIndex ? 20 : 6,
                height: 6,
                backgroundColor: i < questionIndex ? '#2563eb' : i === questionIndex ? '#7c3aed' : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="mb-2">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          <Sparkles size={10} />
          {question.hint}
        </div>
        <h2 className="text-[20px] font-bold text-white leading-snug mb-6">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 flex-1">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <motion.button
              key={i}
              id={`expo-q${questionIndex + 1}-opt${i + 1}`}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelect(i)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-200"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(124,58,237,0.25) 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: isSelected
                  ? '1.5px solid rgba(99,102,241,0.6)'
                  : '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: isSelected
                  ? '0 0 24px rgba(37,99,235,0.2), 0 4px 16px rgba(0,0,0,0.2)'
                  : '0 2px 8px rgba(0,0,0,0.15)',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
            >
              <span className="text-2xl select-none flex-shrink-0">{opt.emoji}</span>
              <span
                className="font-semibold text-[15px] flex-1"
                style={{ color: isSelected ? '#e0e7ff' : 'rgba(255,255,255,0.75)' }}
              >
                {opt.label}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <CheckCircle2 size={20} className="text-indigo-400 flex-shrink-0" />
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
        onClick={handleNext}
        disabled={!canNext}
        className="mt-6 w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2.5 transition-all duration-300"
        style={{
          background: canNext
            ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
            : 'rgba(255,255,255,0.06)',
          color: canNext ? '#fff' : 'rgba(255,255,255,0.25)',
          boxShadow: canNext ? '0 8px 24px rgba(37,99,235,0.3)' : 'none',
          border: canNext ? 'none' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {questionIndex < 5 ? 'Lanjutkan' : 'Lihat Prediksi AI'}
        <ArrowRight size={18} />
      </motion.button>
    </motion.div>
  );

  function handleNext() {
    onNext();
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROCESSING SECTION
───────────────────────────────────────────────────────────────────────────── */

function ProcessingSection({ checkedSteps }: { checkedSteps: number[] }) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
    >
      {/* Animated brain icon */}
      <div className="relative mb-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24 rounded-full absolute inset-0"
          style={{
            background: 'conic-gradient(from 0deg, #2563eb, #7c3aed, #2563eb)',
            padding: 3,
          }}
        />
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center relative"
          style={{ background: '#050b1a', border: '3px solid transparent' }}
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
            top: -6, left: '50%', translateX: '-50%',
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
        className="text-xl font-bold text-white mb-2"
      >
        AI sedang menganalisis...
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-white/45 text-sm mb-10"
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
              animate={{ opacity: isDone || isActive ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: isDone
                  ? 'rgba(37,99,235,0.12)'
                  : isActive
                  ? 'rgba(255,255,255,0.05)'
                  : 'transparent',
                border: isDone
                  ? '1px solid rgba(37,99,235,0.25)'
                  : '1px solid transparent',
              }}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <CheckCircle2 size={18} className="text-blue-400" />
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    className="w-4 h-4 rounded-full border-2 border-indigo-500"
                    animate={{ borderColor: ['#6366f1', '#8b5cf6', '#6366f1'] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ borderTopColor: 'transparent' }}
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/15" />
                )}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: isDone ? '#93c5fd' : isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}
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
  pct: number;
  meta: ReturnType<typeof riskMeta>;
  answers: number[];
  onReset: () => void;
  onDashboard: () => void;
}

function ResultSection({ pct, meta, answers, onReset, onDashboard }: ResultSectionProps) {
  const factors = getFactors(answers);
  const insight = getInsight(pct);

  const recommendations = [
    {
      icon: <Gift size={20} />,
      title: 'Loyalty Program',
      desc: 'Berikan reward atau benefit eksklusif untuk mempertahankan pelanggan.',
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.12)',
    },
    {
      icon: <Phone size={20} />,
      title: 'Customer Follow-Up',
      desc: 'Lakukan pendekatan personal melalui call atau chat langsung.',
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.12)',
    },
    {
      icon: <Tag size={20} />,
      title: 'Special Discount',
      desc: 'Tawarkan promo retensi atau diskon eksklusif untuk perpanjangan.',
      color: '#059669',
      bg: 'rgba(5,150,105,0.12)',
    },
  ];

  const businessBenefits = [
    { icon: <Users size={15} />, text: 'Mengidentifikasi pelanggan berisiko tinggi' },
    { icon: <Zap size={15} />, text: 'Menjalankan campaign retensi otomatis' },
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-1"
        >
          <div className="flex items-center gap-2">
            <img src="/logoo.jpeg" alt="ChurnSense" className="w-7 h-7 rounded-lg object-cover opacity-80" />
            <span className="text-white/60 font-semibold text-sm">ChurnSense</span>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-white/35 hover:text-white/60 font-medium transition-colors px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Coba Lagi
          </button>
        </motion.div>
      </div>

      {/* Main content — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-5">

        {/* ── Churn Risk Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="rounded-3xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(15,20,40,0.8) 0%, rgba(20,10,40,0.8) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-5">
            Hasil Prediksi AI
          </div>

          {/* Circular progress */}
          <div className="flex justify-center mb-5">
            <CircularProgress pct={pct} color={meta.color} glow={meta.glow} />
          </div>

          {/* Risk badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border ${meta.badge}`}
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
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.2)' }}
            >
              <BarChart3 size={14} className="text-indigo-400" />
            </div>
            <span className="text-white font-semibold text-[13px]">Insight AI</span>
          </div>
          <p className="text-white/60 text-[13px] leading-relaxed">{insight}</p>
        </motion.div>

        {/* ── Recommendations ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-3 px-1">
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
                  background: rec.bg,
                  border: `1px solid ${rec.color}30`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${rec.color}25`, color: rec.color }}
                >
                  {rec.icon}
                </div>
                <div>
                  <div className="text-white font-semibold text-[13px] mb-0.5">{rec.title}</div>
                  <div className="text-white/50 text-[12px] leading-relaxed">{rec.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Explainability (SHAP-inspired) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.2)' }}
            >
              <Sparkles size={13} className="text-indigo-400" />
            </div>
            <div>
              <div className="text-white font-semibold text-[13px]">Faktor Penentu Prediksi</div>
              <div className="text-white/35 text-[11px]">Terinspirasi dari SHAP Explanation</div>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            {factors.map((f, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-white/65 text-[12px] font-medium">{f.label}</span>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: f.color }}
                  >
                    {Math.round(f.score * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: f.color, boxShadow: `0 0 8px ${f.color}60` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(f.score * 100)}%` }}
                    transition={{ delay: 0.6 + i * 0.12, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Admin Transition Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="rounded-3xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(124,58,237,0.12) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
          >
            <Sparkles size={10} />
            Untuk Perusahaan
          </div>
          <h3 className="text-white font-bold text-[17px] mb-2 leading-snug">
            Bagaimana perusahaan menggunakan prediksi ini?
          </h3>
          <p className="text-white/45 text-[13px] mb-5 leading-relaxed">
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
                  style={{ background: 'rgba(37,99,235,0.2)', color: '#60a5fa' }}
                >
                  {b.icon}
                </div>
                <span className="text-white/70 text-[13px]">{b.text}</span>
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
              boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
            }}
          >
            Lihat Dashboard Admin
            <ArrowRight size={17} />
          </motion.button>
        </motion.div>

        {/* Footer spacer */}
        <div className="h-4" />
      </div>
    </motion.div>
  );
}
