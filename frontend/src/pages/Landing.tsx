import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, ShieldAlert, BarChart3, Users, ArrowRight } from 'lucide-react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-6 md:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">ChurnSight</span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            to="/user-dashboard"
            className="text-sm font-medium bg-zinc-900 text-white px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 mb-6 leading-tight">
            Stop guessing. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Start predicting churn.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 mb-10 max-w-3xl mx-auto leading-relaxed">
            Analyze customer behavior, predict churn risks with machine learning, and take action before they leave. The complete intelligence platform for proactive retention.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/user-dashboard"
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-8 py-3.5 rounded-lg transition-all shadow-md flex items-center gap-2"
            >
              Enter User Dashboard <ArrowRight size={18} />
            </Link>
            <Link 
              to="/admin/login"
              className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 font-medium px-8 py-3.5 rounded-lg transition-all shadow-sm"
            >
              Admin Access
            </Link>
          </div>
        </section>

        {/* Features Cards Section (Scrollable) */}
        <section className="py-20 bg-zinc-50 border-y border-zinc-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">Powerful Retention Tools</h2>
            <p className="text-zinc-500 text-lg">Everything you need to keep your customers happy and subscribed.</p>
          </div>
          <div className="flex overflow-x-auto pb-8 pt-4 px-6 md:px-12 gap-6 snap-x snap-mandatory hide-scrollbar max-w-[1400px] mx-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            
            <div className="min-w-[320px] max-w-[320px] bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-sm snap-center shrink-0 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Live Risk Dashboard</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Monitor your entire customer base in real-time. Spot trends and overall health scores instantly.
              </p>
            </div>

            <div className="min-w-[320px] max-w-[320px] bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-sm snap-center shrink-0 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Early Warning System</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Get alerted the moment a customer's behavior changes, allowing you to intervene before it's too late.
              </p>
            </div>

            <div className="min-w-[320px] max-w-[320px] bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-sm snap-center shrink-0 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Deep Analytics</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Understand the 'why' behind churn. Analyze geographical, behavioral, and engagement factors.
              </p>
            </div>

            <div className="min-w-[320px] max-w-[320px] bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-sm snap-center shrink-0 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Customer Segmentation</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Automatically group users by risk level and value to prioritize your retention efforts effectively.
              </p>
            </div>
            
          </div>
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </section>

        {/* How It Works Section */}
        <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">How ChurnSight Works</h2>
            <p className="text-zinc-500 text-lg">From data upload to actionable insights.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting lines for md screens */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-[2px] bg-zinc-200 z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center bg-[#fcfcfc] px-2">
              <div className="w-16 h-16 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-6 shadow-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Upload Data CSV</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Upload your customer history data into the system in CSV format.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center bg-[#fcfcfc] px-2">
              <div className="w-16 h-16 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-6 shadow-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Data Validation</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                The system automatically validates format completeness, columns, and data integrity.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center bg-[#fcfcfc] px-2">
              <div className="w-16 h-16 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-6 shadow-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">AI Processing</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Our Machine Learning models identify churn patterns and calculate risk percentages.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center bg-[#fcfcfc] px-2">
              <div className="w-16 h-16 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-6 shadow-sm">
                4
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Final Results</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Get an interactive dashboard of high-risk customers and AI retention recommendations.
              </p>
            </div>
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t border-zinc-200 text-center text-zinc-400 text-sm mt-auto">
        <p>&copy; 2026 ChurnSight Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
