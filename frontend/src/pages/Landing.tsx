import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, ShieldAlert, BarChart3, Users, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col font-sans overflow-x-hidden text-slate-200 selection:bg-brand-500/30 selection:text-brand-100 relative">
      
      {/* Background Gradients & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none blur-[120px] bg-gradient-to-br from-brand-600/40 via-purple-600/20 to-transparent rounded-[100%] z-0" />
      <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] opacity-20 pointer-events-none blur-[100px] bg-gradient-to-bl from-blue-500/40 via-cyan-500/10 to-transparent rounded-full z-0" />

      {/* Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center px-6 py-6 md:px-12 max-w-[1400px] mx-auto w-full z-10 relative"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/10">
            <Activity size={20} className="text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white font-outfit">ChurnSense</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Admin Login
          </Link>
          <Link to="/user-dashboard" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold text-white transition-all">
            Get Started
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 w-full relative z-10">
        {/* Hero Section */}
        <section className="pt-28 pb-40 px-6 text-center max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider mb-8"
          >
            <Sparkles size={14} /> AI-Powered Customer Retention
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-[1.1] font-outfit"
          >
            Stop guessing. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400">
              Start predicting churn.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Analyze customer behavior, predict churn risks with advanced machine learning, and take automated action before they leave. The complete intelligence platform for proactive retention.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              to="/user-dashboard"
              className="group bg-white hover:bg-slate-100 text-slate-900 font-bold px-8 py-4 rounded-full transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] flex items-center gap-3 w-full sm:w-auto justify-center text-lg hover:scale-105 active:scale-95"
            >
              Start Free Trial <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/login"
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-8 py-4 rounded-full transition-all flex items-center gap-3 w-full sm:w-auto justify-center text-lg backdrop-blur-md hover:border-white/20"
            >
              View Demo
            </Link>
          </motion.div>
        </section>

        {/* Features Cards Section (Scrollable) */}
        <section className="py-32 relative border-t border-white/5 bg-slate-900/50">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
          
          <motion.div {...fadeIn} className="max-w-7xl mx-auto px-6 md:px-12 mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 font-outfit">Powerful Retention Tools</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Everything you need to monitor health, predict churn, and engage users before they hit cancel.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="flex overflow-x-auto pb-12 pt-4 px-6 md:px-12 gap-8 snap-x snap-mandatory hide-scrollbar max-w-[1400px] mx-auto" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            
            {/* Card 1 */}
            <motion.div variants={staggerItem} className="min-w-[340px] max-w-[340px] bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl snap-center shrink-0 hover:border-brand-500/50 hover:bg-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 blur-[50px] rounded-full group-hover:bg-brand-500/40 transition-colors" />
              <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-brand-500/20 ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-300">
                <Activity size={26} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-outfit">Live Risk Dashboard</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Monitor your entire customer base in real-time. Spot trends and overall health scores instantly with stunning visual analytics.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div variants={staggerItem} className="min-w-[340px] max-w-[340px] bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl snap-center shrink-0 hover:border-rose-500/50 hover:bg-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[50px] rounded-full group-hover:bg-rose-500/40 transition-colors" />
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-rose-500/20 ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-300">
                <ShieldAlert size={26} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-outfit">Early Warning System</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Get alerted the moment a customer's behavior changes, allowing you to intervene with automated mitigation campaigns before it's too late.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div variants={staggerItem} className="min-w-[340px] max-w-[340px] bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl snap-center shrink-0 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full group-hover:bg-purple-500/40 transition-colors" />
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-500/20 ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 size={26} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-outfit">Deep Analytics</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Understand the 'why' behind churn. Analyze geographical, behavioral, and engagement factors to optimize your product flow.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div variants={staggerItem} className="min-w-[340px] max-w-[340px] bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl snap-center shrink-0 hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/40 transition-colors" />
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20 ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-300">
                <Users size={26} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-outfit">Smart Segmentation</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Automatically group users by risk level and MRR to prioritize your retention efforts effectively and maximize revenue saved.
              </p>
            </motion.div>
            
          </motion.div>
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </section>

        {/* How It Works Section */}
        <section className="py-32 px-6 md:px-12 max-w-6xl mx-auto relative">
          <motion.div {...fadeIn} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 font-outfit">How ChurnSense Works</h2>
            <p className="text-slate-400 text-lg">From raw data upload to actionable retention insights.</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-4 gap-8 relative"
          >
            {/* Connecting lines for md screens */}
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-brand-500/20 via-purple-500/50 to-brand-500/20 z-0"></div>

            {[
              { title: "Upload Data CSV", desc: "Upload your customer history data into the system in CSV format securely.", step: 1 },
              { title: "Data Validation", desc: "The system automatically validates format completeness, columns, and data integrity.", step: 2 },
              { title: "AI Processing", desc: "Our Machine Learning models identify churn patterns and calculate risk percentages.", step: 3 },
              { title: "Final Results", desc: "Get an interactive dashboard of high-risk customers and AI retention recommendations.", step: 4 }
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-8 shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-300 font-outfit">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4 font-outfit">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed px-4">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center text-slate-500 text-sm mt-auto relative z-10 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand-500" />
            <span className="font-bold text-white font-outfit">ChurnSense</span>
          </div>
          <p>&copy; 2026 ChurnSense Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
