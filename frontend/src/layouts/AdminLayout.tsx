import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

import { Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-[#fafafa] relative overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar with mobile classes */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onMobileClose={() => setMobileOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto relative flex flex-col w-full min-w-0">
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center p-4 bg-white border-b border-zinc-200 shrink-0 sticky top-0 z-30">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
          <span className="ml-2 font-semibold text-zinc-900 text-sm">Menu</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
