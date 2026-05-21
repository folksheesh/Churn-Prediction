import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      <header className="flex justify-end p-6">
        <Link 
          to="/login"
          className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Admin Login &rarr;
        </Link>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-2">
            Churn<span className="font-normal">Sight</span>
          </h1>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-blue-600 mb-8">
            Reduce Customer Churn
          </h2>
          <p className="text-base md:text-lg text-zinc-500 mb-10 max-w-2xl leading-relaxed">
            Analyze, predict, and prevent customer churn with our powerful analytics platform. 
            Make data-driven decisions to improve customer retention.
          </p>
          <Link 
            to="/user-dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md transition-colors shadow-sm"
          >
            Enter User Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
