import React from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export default function KpiCard({ 
  title, 
  value, 
  trend, 
  isPositive, 
  icon,
  iconBgColor = 'bg-slate-100',
  iconColor = 'text-slate-500'
}: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex flex-col relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBgColor, iconColor)}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-md",
              isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
            )}>
              {isPositive ? '↑' : '↓'} {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
