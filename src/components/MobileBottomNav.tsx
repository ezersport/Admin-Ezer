'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Tags,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Inicio', icon: LayoutDashboard },
    { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
    { href: '/productos', label: 'Prendas', icon: Package },
    { href: '/categorias', label: 'Categorías', icon: Tags },
    { href: '/entregas', label: 'Rutas', icon: Truck },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#091b33]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5)] transition-colors">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
              isActive
                ? 'text-[#009fe3] font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${isActive ? 'bg-[#009fe3]/15' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs mt-0.5">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
