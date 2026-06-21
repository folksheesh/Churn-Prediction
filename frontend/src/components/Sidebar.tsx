import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Activity, LayoutDashboard, Database, Settings, BarChart3, ShieldAlert, ChevronDown, LogOut, ShieldCheck, Upload, Zap, X, Target, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  // Close mobile sidebar on route change
  useEffect(() => {
    if (onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);
  const { user, logout } = useAuth();
  const [adminOpen, setAdminOpen] = useState(true);

  const mainNavItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Analysis', href: '/admin/analysis', icon: BarChart3 },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Active Campaigns', href: '/admin/campaigns', icon: Target },
  ];

  const adminNavItems = [
    { name: 'System Status', href: '/admin', icon: Zap },
    { name: 'Manage Admins', href: '/admin/manage-admins', icon: ShieldCheck },
    { name: 'User Management', href: '/admin/user-management', icon: UserPlus },
  ];

  return (
    <aside className="w-[260px] border-r border-slate-200 bg-[#FAFAFA] flex flex-col shrink-0 h-screen sticky top-0 shadow-xl md:shadow-none">
      {/* Workspace Selector (Linear style) */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200/60 mb-4">
        <Link to="/" className="flex items-center gap-3 w-full hover:bg-slate-100/80 p-1.5 -ml-1.5 rounded-xl transition-all cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center font-bold shadow-[0_2px_10px_rgba(37,99,235,0.2)] text-sm">
            C
          </div>
          <div className="flex flex-col flex-1 justify-center">
            <span className="font-semibold text-[13px] tracking-tight text-slate-900 leading-tight">ChurnSense</span>
            <span className="text-[11px] text-slate-500 font-medium">Acme Corporation</span>
          </div>
          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 hidden md:block" />
        </Link>
        {onMobileClose && (
          <button 
            onClick={onMobileClose}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg ml-auto"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      <div className="px-3 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-8">
          {/* Main Navigation */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-3 px-3 uppercase tracking-wider">Workspace</div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-xl transition-all group relative",
                      isActive 
                        ? "bg-white text-brand-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-100/50" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 border border-transparent"
                    )}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-500 transition-colors"} /> 
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation */}
          <div>
            <div 
              className="flex items-center justify-between px-3 mb-3 cursor-pointer group"
              onClick={() => setAdminOpen(!adminOpen)}
            >
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">Administration</div>
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", !adminOpen && "-rotate-90")} />
            </div>
            
            <div className={cn("grid transition-all duration-200 ease-in-out", adminOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <nav className="space-y-1">
                  {adminNavItems.map((item) => {
                    const isActive = pathname.startsWith(item.href) && item.href !== '/admin' || (item.href === '/admin' && pathname === '/admin');
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-xl transition-all group relative",
                          isActive 
                            ? "bg-white text-brand-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-100/50" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 border border-transparent"
                        )}
                      >
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-500 transition-colors"} /> 
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer User Profile */}
      <div className="p-4 border-t border-slate-200/60 mt-auto">
        <Link 
          to="/admin/profile"
          className="flex items-center justify-between p-2 -mx-2 rounded-xl hover:bg-slate-100/80 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300/50 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name?.substring(0, 2) || 'AD'}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[13px] font-semibold text-slate-900 leading-tight">{user?.name || 'Admin'}</span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active session
              </span>
            </div>
          </div>
          <button 
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              navigate('/'); 
              setTimeout(() => {
                logout();
              }, 0);
            }} 
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </Link>
      </div>
    </aside>
  );
}
