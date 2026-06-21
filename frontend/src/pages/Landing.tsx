import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, ShieldAlert, BarChart3, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import presentationImg from '@/assets/presentation.png';
import feature1Img from '@/assets/feature-1.png';
import feature2Img from '@/assets/feature-2.png';
import feature3Img from '@/assets/feature-3.png';
import feature4Img from '@/assets/feature-4.png';

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
      
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Glowing Orbs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-brand-200/30 to-brand-400/20 blur-[100px]" />
        <div className="absolute top-[30%] -left-64 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-200/30 to-purple-300/20 blur-[120px]" />
        <div className="absolute top-[70%] -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-rose-200/20 to-orange-200/10 blur-[90px]" />

        {/* Abstract Curved Line Shapes (Blobs) */}
        <svg className="absolute top-[15%] right-[5%] w-[500px] h-[500px] text-brand-600/5 opacity-60 animate-[spin_60s_linear_infinite]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M42.7,-73.4C55.9,-67.5,67.6,-56.3,76.5,-42.6C85.4,-28.9,91.6,-12.7,89.5,2.6C87.4,17.9,77.1,32.3,65.8,44.4C54.5,56.5,42.2,66.2,28.2,73.1C14.2,80,-1.6,84.1,-17.1,81.4C-32.6,78.7,-47.9,69.2,-58.5,56C-69.1,42.8,-75,25.9,-77.2,8.9C-79.4,-8.1,-77.9,-25.2,-69.5,-39C-61.1,-52.8,-45.8,-63.3,-31.2,-68.2C-16.6,-73.1,-2.7,-72.4,12,-73.4C26.7,-74.4,42.7,-73.4,42.7,-73.4Z" transform="translate(100 100)" />
        </svg>

        <svg className="absolute top-[60%] -left-[5%] w-[400px] h-[400px] text-indigo-500/5 opacity-60 animate-[spin_40s_linear_infinite_reverse]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M45.7,-76.3C58.9,-69.3,69.1,-55.3,77.2,-40.1C85.3,-24.9,91.3,-8.5,88.4,6.5C85.5,21.5,73.7,35.1,61.1,46.5C48.5,57.9,35.1,67.1,20.2,72.4C5.3,77.7,-11.1,79.1,-26.4,75.2C-41.7,71.3,-55.9,62.1,-66.6,49.5C-77.3,36.9,-84.5,20.9,-85.1,4.7C-85.7,-11.5,-79.7,-27.9,-69.7,-40.4C-59.7,-52.9,-45.7,-61.5,-31.6,-67.7C-17.5,-73.9,-3.3,-77.7,11.5,-77.6C26.3,-77.5,45.7,-76.3,45.7,-76.3Z" transform="translate(100 100)" />
        </svg>
      </div>

      {/* Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-6 md:px-12 max-w-[1400px] mx-auto w-full z-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-outfit">ChurnSense</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="px-5 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm font-semibold text-white transition-all shadow-sm">
            Sign Up
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 w-full relative z-10">
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 md:px-12 max-w-[1400px] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content (Text) */}
            <div className="lg:col-span-7 text-left flex flex-col items-start">
              {/* Removed Enterprise Customer Retention badge */}
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1] font-outfit"
              >
                Stop guessing. <br />
                <span className="text-brand-600">Start predicting churn.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-slate-500 mb-8 max-w-xl leading-relaxed"
              >
                Analyze behavior, accurately predict risk with machine learning, and automate mitigation campaigns before your customers cancel.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8"
              >
                <Link 
                  to="/user-dashboard"
                  className="group bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-3 w-full sm:w-auto justify-center text-[15px]"
                >
                  Let's Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Removed checkmark feature list */}            </div>

            {/* Right Content (Image) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative flex justify-center lg:justify-end items-center w-full"
            >
              {/* Decorative background glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-400/20 blur-[80px] rounded-full -z-10 pointer-events-none"></div>
              <div className="absolute top-1/3 left-2/3 w-[50%] h-[50%] bg-purple-400/10 blur-[60px] rounded-full -z-10 pointer-events-none"></div>
              
              <img 
                src={presentationImg} 
                alt="ChurnSense Customer Analytics Presentation" 
                className="w-full max-w-[500px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(37,99,235,0.15)] transition-all duration-500 hover:scale-[1.02]"
              />
            </motion.div>
            
          </div>
        </section>

        {/* Features Cards Section */}
        <section className="py-16 bg-white border-y border-slate-100 relative">
          
          <motion.div {...fadeIn} className="max-w-7xl mx-auto px-6 md:px-12 mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-outfit">Everything you need to retain users</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">From live dashboards to automated mitigation pipelines, ChurnSense gives you the tools to act fast.</p>
          </motion.div>

          <div className="flex flex-col gap-16 px-6 md:px-12 max-w-[1400px] mx-auto mt-8">
            
            {/* Feature 1: Image Left, Text Right */}
            <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 md:order-1 flex justify-center">
                <img src={feature1Img} alt="Live Risk Dashboard" className="w-full max-w-[320px] lg:max-w-[380px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="order-1 md:order-2 space-y-5">
                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 font-outfit tracking-tight">Live Risk Dashboard</h3>
                <p className="text-slate-500 leading-relaxed text-lg">
                  Monitor your entire customer base in real-time. Spot trends and overall health scores instantly with clear visual analytics to proactively keep your customers happy. Our live risk dashboard aggregates millions of data points into a single pane of glass, allowing your retention team to understand exactly where to focus their efforts each day.
                </p>
              </div>
            </motion.div>

            {/* Feature 2: Text Left, Image Right */}
            <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="space-y-5 md:pr-8">
                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 font-outfit tracking-tight">Early Warning System</h3>
                <p className="text-slate-500 leading-relaxed text-lg">
                  Get alerted the moment behavior changes, allowing you to intervene with automated mitigation campaigns before it's too late. Stop churn before it happens. By setting up custom triggers based on product usage drops or billing failures, you can automatically send targeted offers or schedule check-in calls with at-risk accounts.
                </p>
              </div>
              <div className="flex justify-center">
                <img src={feature2Img} alt="Early Warning System" className="w-full max-w-[320px] lg:max-w-[380px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" />
              </div>
            </motion.div>

            {/* Feature 3: Image Left, Text Right */}
            <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 md:order-1 flex justify-center">
                <img src={feature3Img} alt="Deep Analytics" className="w-full max-w-[320px] lg:max-w-[380px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="order-1 md:order-2 space-y-5">
                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 font-outfit tracking-tight">Deep Analytics</h3>
                <p className="text-slate-500 leading-relaxed text-lg">
                  Understand the 'why' behind churn. Analyze geographical, behavioral, and engagement factors to optimize product flow and pinpoint the root cause. Dive deep into cohort analysis to see how different user segments perform over time, enabling data-driven decisions that fundamentally improve your core product experience.
                </p>
              </div>
            </motion.div>

            {/* Feature 4: Text Left, Image Right */}
            <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="space-y-5 md:pr-8">
                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 font-outfit tracking-tight">Smart Segmentation</h3>
                <p className="text-slate-500 leading-relaxed text-lg">
                  Automatically group users by risk level and MRR to prioritize your retention efforts effectively and maximize revenue saved dynamically. ChurnSense learns your customer profiles and automatically segments them into high, medium, and low risk buckets, ensuring your Customer Success Managers spend time where it matters most.
                </p>
              </div>
              <div className="flex justify-center">
                <img src={feature4Img} alt="Smart Segmentation" className="w-full max-w-[320px] lg:max-w-[380px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" />
              </div>
            </motion.div>
            
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto relative">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 font-outfit">How it works</h2>
            <p className="text-slate-500 text-lg">From raw data to actionable retention insights in minutes.</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-4 gap-6 relative"
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
