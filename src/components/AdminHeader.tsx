'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Moon, ExternalLink } from 'lucide-react';
import { ConnectivityBadge } from './ConnectivityBadge';
import { useTheme } from './ThemeContext';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  currentRate?: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  currentRate = 76.50,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#091b33]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 transition-colors">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Tasa BCV Ticker on mobile / desktop */}
        <Link
          href="/tasa"
          className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 font-semibold hover:border-[#009fe3] transition-colors"
          title="Ver o editar tasa oficial BCV"
        >
          <span className="text-[#009fe3] font-bold">BCV:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {currentRate.toFixed(2)} Bs
          </span>
        </Link>

        {/* SELECTOR MODO CLARO / OSCURO */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all active:scale-95 cursor-pointer"
          title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-xs">Modo Oscuro</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-xs">Modo Claro</span>
            </>
          )}
        </button>

        <ConnectivityBadge />

        <Link
          href="https://wa.me/584241282108"
          target="_blank"
          className="hidden lg:flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors font-medium"
        >
          <span>WhatsApp Taller</span>
          <ExternalLink className="w-4 h-4 text-emerald-500" />
        </Link>
      </div>
    </header>
  );
};
