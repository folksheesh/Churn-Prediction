import { Link, useLocation } from 'react-router-dom';
import { Users, Activity, LayoutDashboard, Database, Settings, BarChart3, ShieldAlert, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Sidebar() {
  const { pathname } = useLocation();
  const [adminOpen, setAdminOpen] = useState(true);

  const mainNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Customers', href: '/customers', icon: Users },
  ];

  const adminNavItems = [
    { name: 'Model Health', href: '/admin', icon: Activity },
    { name: 'Data Pipeline', href: '/admin/data', icon: Database },
    { name: 'Alerts', href: '/admin/alerts', icon: ShieldAlert },
  ];

  return (
    <aside className="w-[240px] border-r border-zinc-200 bg-zinc-50/30 flex flex-col hidden md:flex shrink-0 h-screen sticky top-0">
      {/* Workspace Selector */}
      <div className="h-14 flex items-center px-3 border-b border-zinc-200/60 mt-2 mb-2">
        <div className="flex items-center gap-2.5 w-full hover:bg-zinc-100/80 p-1.5 rounded-md transition-colors cursor-pointer group">
          <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center font-bold shadow-sm text-xs">
            C
          </div>
          <div className="flex flex-col flex-1">
            <span className="font-semibold text-sm tracking-tight text-zinc-900 leading-none">ChurnSense</span>
            <span className="text-[10px] text-zinc-500 font-medium mt-0.5">Acme Corp</span>
          </div>
          <ChevronDown size={14} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="text-[10px] font-semibold text-zinc-400/80 mb-2 px-3 uppercase tracking-wider">Workspace</div>
            <nav className="space-y-0.5 px-2">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors group relative",
                      isActive 
                        ? "bg-zinc-100/80 text-zinc-900" 
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
                    )}
                  >
                    <Icon size={15} className={isActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600"} /> 
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation */}
          <div className="mt-6">
            <div 
              className="flex items-center justify-between px-3 mb-2 cursor-pointer group"
              onClick={() => setAdminOpen(!adminOpen)}
            >
              <div className="text-[10px] font-semibold text-zinc-400/80 uppercase tracking-wider group-hover:text-zinc-600 transition-colors">Administration</div>
              <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", !adminOpen && "-rotate-90")} />
            </div>
            {adminOpen && (
              <nav className="space-y-0.5 px-2">
                {adminNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href) && item.href !== '/admin' || (item.href === '/admin' && pathname === '/admin');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors group relative",
                        isActive 
                          ? "bg-zinc-100/80 text-zinc-900" 
                          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
                      )}
                    >
                      <Icon size={15} className={isActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600"} /> 
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer User Profile */}
      <div className="p-3 border-t border-zinc-200/60 bg-zinc-50/50">
        <Link to="/settings" className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-100/80 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-zinc-200/50 border border-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-[10px]">
              JD
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-zinc-900 leading-none">Jane Doe</span>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                System Active
              </span>
            </div>
          </div>
          <Settings size={14} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
        </Link>
      </div>
    </aside>
  );
}
