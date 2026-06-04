import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, ShieldAlert, BarChart3, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans overflow-x-hidden text-slate-900 selection:bg-brand-100 selection:text-brand-900 relative">
      
      {/* Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-center px-6 py-5 md:px-12 max-w-[1400px] mx-auto w-full bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-outfit">ChurnSense</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm font-semibold text-white transition-all shadow-sm">
            Admin Login
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 w-full relative z-10">
        
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-6 text-center max-w-5xl mx-auto relative">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-bold tracking-wide mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Enterprise Customer Retention
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1] font-outfit"
          >
            Stop guessing. <br className="hidden md:block" />
            <span className="text-brand-600">Start predicting churn.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Analyze behavior, accurately predict risk with machine learning, and automate mitigation campaigns before your customers cancel.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              to="/user-dashboard"
              className="group bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-3 w-full sm:w-auto justify-center text-[15px]"
            >
              Let's Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-400"
          >
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500"/> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500"/> Setup in minutes</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500"/> 92% Prediction Accuracy</span>
          </motion.div>
        </section>

        {/* Features Cards Section */}
        <section className="py-24 bg-white border-y border-slate-100 relative">
          
          <motion.div {...fadeIn} className="max-w-7xl mx-auto px-6 md:px-12 mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-outfit">Everything you need to retain users</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">From live dashboards to automated mitigation pipelines, ChurnSense gives you the tools to act fast.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 md:px-12 max-w-[1400px] mx-auto"
          >
            
            <motion.div variants={staggerItem} className="bg-[#f8fafc] p-8 rounded-[24px] border border-slate-100 hover:border-slate-200 transition-all duration-200 group">
              <div className="w-12 h-12 bg-white text-brand-600 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                <Activity size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Live Risk Dashboard</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Monitor your entire customer base in real-time. Spot trends and overall health scores instantly with clear visual analytics.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="bg-[#f8fafc] p-8 rounded-[24px] border border-slate-100 hover:border-slate-200 transition-all duration-200 group">
              <div className="w-12 h-12 bg-white text-rose-500 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Early Warning System</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Get alerted the moment behavior changes, allowing you to intervene with automated mitigation campaigns before it's too late.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="bg-[#f8fafc] p-8 rounded-[24px] border border-slate-100 hover:border-slate-200 transition-all duration-200 group">
              <div className="w-12 h-12 bg-white text-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Deep Analytics</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Understand the 'why' behind churn. Analyze geographical, behavioral, and engagement factors to optimize product flow.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="bg-[#f8fafc] p-8 rounded-[24px] border border-slate-100 hover:border-slate-200 transition-all duration-200 group">
              <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Smart Segmentation</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Automatically group users by risk level and MRR to prioritize your retention efforts effectively and maximize revenue saved.
              </p>
            </motion.div>
            
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto relative">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-outfit">How it works</h2>
            <p className="text-slate-500 text-lg">From raw data to actionable retention insights in minutes.</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-4 gap-8 relative"
          >
            {/* Connecting lines for md screens */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-slate-200 z-0"></div>

            {[
              { title: "Upload Data", desc: "Upload your customer history securely via CSV.", step: 1 },
              { title: "Validate", desc: "System verifies format completeness and data integrity.", step: 2 },
              { title: "Process", desc: "ML models identify churn patterns and risk percentages.", step: 3 },
              { title: "Mitigate", desc: "Get an interactive dashboard to launch retention campaigns.", step: 4 }
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem} className="relative z-10 flex flex-col items-center text-center bg-[#f8fafc] px-2 py-4">
                <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center text-brand-600 font-bold text-xl mb-6 relative overflow-hidden font-outfit">
                  <span className="relative z-10">{item.step}</span>
                </div>
                <h3 className="text-[17px] font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center text-slate-500 text-sm mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand-600" />
            <span className="font-bold text-slate-900 font-outfit">ChurnSense</span>
          </div>
          <p>&copy; 2026 ChurnSense Inc. All rights reserved.</p>
          <div className="flex gap-4 font-medium">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
