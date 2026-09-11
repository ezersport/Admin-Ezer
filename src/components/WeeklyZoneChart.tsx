'use client';

import React from 'react';
import type { Order } from '../types';
import { formatUSD } from '../lib/utils';
import { MapPin, Truck, TrendingUp } from 'lucide-react';

interface WeeklyZoneChartProps {
  orders: Order[];
}

export const WeeklyZoneChart: React.FC<WeeklyZoneChartProps> = ({ orders }) => {
  // Agrupar pedidos por zona
  const zoneStats = {
    caracas_sabado: { label: 'Caracas (Sábados)', count: 0, units: 0, revenue: 0, profit: 0, color: 'bg-[#009fe3]' },
    teques_metro: { label: 'Los Teques (Metro)', count: 0, units: 0, revenue: 0, profit: 0, color: 'bg-emerald-500' },
    san_antonio: { label: 'San Antonio Altos', count: 0, units: 0, revenue: 0, profit: 0, color: 'bg-amber-500' },
    nacional: { label: 'Envíos Nacionales', count: 0, units: 0, revenue: 0, profit: 0, color: 'bg-indigo-500' },
  };

  orders.forEach((ord) => {
    if (ord.estado === 'cancelado') return;
    const type = ord.tipo_destino in zoneStats ? ord.tipo_destino : 'nacional';
    zoneStats[type].count += 1;
    zoneStats[type].units += ord.total_unidades;
    zoneStats[type].revenue += ord.subtotal_usd;
    zoneStats[type].profit += ord.ganancia_neta_usd;
  });

  const totalOrders = Object.values(zoneStats).reduce((acc, z) => acc + z.count, 0) || 1;

  return (
    <div className="bg-white dark:bg-[#0e213b] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#009fe3] uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Desglose Logístico &amp; Ganancia</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Ventas Semanales por Destino
          </h3>
        </div>
        <span className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#091b33] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          Total: <strong className="text-slate-900 dark:text-white">{orders.length} pedidos</strong>
        </span>
      </div>

      {/* Progress Bars by Zone */}
      <div className="space-y-4">
        {Object.entries(zoneStats).map(([key, data]) => {
          const percent = Math.round((data.count / totalOrders) * 100);

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-800 dark:text-slate-200">{data.label}</span>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  <span>{data.count} ped. ({data.units} pzs)</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    +{formatUSD(data.profit)} ganancia
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white min-w-8 text-right">{percent}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-[#091b33] overflow-hidden border border-slate-200 dark:border-slate-800">
                <div
                  className={`h-full ${data.color} rounded-full transition-all duration-700`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cards de Métricas por Destino */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {Object.entries(zoneStats).map(([key, data]) => (
          <div
            key={key}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#091b33] border border-slate-200 dark:border-slate-800 text-center space-y-1"
          >
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
              {data.label.split(' ')[0]}
            </span>
            <div className="font-mono font-black text-slate-900 dark:text-white text-base">
              {formatUSD(data.revenue)}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              +{formatUSD(data.profit)} neto
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
