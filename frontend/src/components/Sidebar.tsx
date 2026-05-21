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
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 flex flex-col hidden md:flex shrink-0 h-screen sticky top-0">
      {/* Workspace Selector */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-200/80">
        <div className="flex items-center gap-3 w-full hover:bg-zinc-100 p-2 rounded-lg transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold shadow-sm">
            C
          </div>
          <div className="flex flex-col flex-1">
            <span className="font-semibold text-sm tracking-tight text-zinc-900 leading-tight">ChurnSense</span>
            <span className="text-xs text-zinc-500 font-medium">Acme Corp</span>
          </div>
          <ChevronDown size={14} className="text-zinc-400" />
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 mb-3 px-2 uppercase tracking-wider">Workspace</div>
            <nav className="space-y-0.5">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                      isActive 
                        ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/60" 
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 border border-transparent"
                    )}
                  >
                    <Icon size={16} className={isActive ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700"} /> 
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation */}
          <div>
            <div 
              className="flex items-center justify-between px-2 mb-3 cursor-pointer group"
              onClick={() => setAdminOpen(!adminOpen)}
            >
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider group-hover:text-zinc-600 transition-colors">Administration</div>
              <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", !adminOpen && "-rotate-90")} />
            </div>
            {adminOpen && (
              <nav className="space-y-0.5">
                {adminNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href) && item.href !== '/admin' || (item.href === '/admin' && pathname === '/admin');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                        isActive 
                          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/60" 
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 border border-transparent"
                      )}
                    >
                      <Icon size={16} className={isActive ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700"} /> 
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
      <div className="p-4 border-t border-zinc-200/80 bg-zinc-50">
        <Link to="/settings" className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              JD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900">Jane Doe</span>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                System Active
              </span>
            </div>
          </div>
          <Settings size={16} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
        </Link>
      </div>
    </aside>
  );
}
