'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Activity, LayoutDashboard, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: Activity },
    { name: 'Customers', href: '/customers', icon: Users },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 font-bold">C</div>
        <span className="font-semibold tracking-tight text-slate-900">ChurnSense</span>
      </div>
      
      <div className="p-4 flex-1">
        <div className="text-xs font-semibold text-slate-400 mb-4 px-2 uppercase tracking-wider">Overview</div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon size={18} /> {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium text-slate-600">Model Active</span>
        </div>
      </div>
    </aside>
  );
}
