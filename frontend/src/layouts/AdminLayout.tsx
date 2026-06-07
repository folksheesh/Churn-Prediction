import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
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

      {/* Right column: mobile header + scrollable content */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Mobile Header — outside overflow container so it's always visible */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-200 shrink-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg active:bg-zinc-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-zinc-900 text-sm">Menu</span>
        </div>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
