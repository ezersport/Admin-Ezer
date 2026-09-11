'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  valueUSD: string;
  valueBs?: string;
  badgeText?: string;
  badgeType?: 'success' | 'info' | 'warning' | 'neutral';
  icon: LucideIcon;
  subtext?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  valueUSD,
  valueBs,
  badgeText,
  badgeType = 'info',
  icon: Icon,
  subtext,
}) => {
  const badgeColors = {
    success: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    info: 'bg-blue-50 dark:bg-blue-500/15 text-[#009fe3] border-blue-200 dark:border-blue-500/30',
    warning: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    neutral: 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  };

  return (
    <div className="bg-white dark:bg-[#0e213b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#091b33] flex items-center justify-center text-[#009fe3] border border-slate-200 dark:border-slate-800">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {valueUSD}
        </div>
        {valueBs && (
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
            ≈ {valueBs}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {badgeText && (
          <span className={`px-3 py-1 rounded-full border text-xs font-bold ${badgeColors[badgeType]}`}>
            {badgeText}
          </span>
        )}
        {subtext && (
          <span className="text-slate-500 dark:text-slate-400 font-medium ml-auto">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
