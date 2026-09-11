'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  CreditCard,
  Tags,
  Search,
  ExternalLink,
} from 'lucide-react';
import { ConnectivityBadge } from './ConnectivityBadge';

interface DesktopSidebarProps {
  currentRate?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ currentRate = 76.50 }) => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard & Finanzas', icon: LayoutDashboard },
    { href: '/pedidos', label: 'Pedidos & Tracking', icon: ShoppingCart },
    { href: '/productos', label: 'Prendas & Stock', icon: Package },
    { href: '/categorias', label: 'Categorías de Ropa', icon: Tags },
    { href: '/entregas', label: 'Rutas & Envíos', icon: Truck },
    { href: '/metodos-pago', label: 'Métodos de Pago', icon: CreditCard },
    { href: '/tasa', label: 'Tasa BCV Oficial', icon: DollarSign },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#091b33] border-r border-slate-200 dark:border-slate-800 shrink-0 select-none min-h-screen transition-colors">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800/80">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform bg-[#0c3755] flex items-center justify-center p-1 border border-slate-200 dark:border-slate-700">
            <img
              src="/icon.png"
              alt="Logo Ezer"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight block leading-tight">
              EZER <span className="text-[#009fe3]">ADMIN</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              Taller Textil • Confección
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-semibold transition-all ${
                isActive
                  ? 'bg-[#009fe3] text-white font-bold shadow-lg shadow-[#009fe3]/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Sistema Taller v2</span>
          <span className="font-medium">Los Teques 🇻🇪</span>
        </div>
      </div>
    </aside>
  );
};
