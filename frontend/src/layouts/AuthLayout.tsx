import React from 'react';
import { Outlet } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 relative overflow-hidden flex-col justify-between p-12">
        {/* Glow effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-60"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-60"></div>
        <div className="absolute -bottom-24 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-60"></div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/30 shadow-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black font-outfit tracking-tight text-white">ChurnSense</span>
        </div>

        <div className="relative z-10 text-white mt-12">
          <h1 className="text-4xl lg:text-5xl font-black font-outfit leading-[1.1] mb-6">
            Predict churn.<br />
            Retain customers.<br />
            <span className="text-brand-200">Grow revenue.</span>
          </h1>
          <p className="text-brand-100/90 text-lg max-w-md font-medium leading-relaxed">
            The next-generation AI platform that helps you identify at-risk customers before they leave.
          </p>
        </div>
        

      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative z-20">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in">
          {/* Mobile branding */}
          <div className="flex lg:hidden justify-center items-center gap-2 mb-10">
            <div className="bg-brand-500 p-2.5 rounded-xl shadow-md glow-brand">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black font-outfit tracking-tight text-slate-900">ChurnSense</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
