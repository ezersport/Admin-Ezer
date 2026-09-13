'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  Truck,
  ArrowUpRight,
  Printer,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import { AdminHeader } from '../components/AdminHeader';
import { MetricCard } from '../components/MetricCard';
import { WeeklyZoneChart } from '../components/WeeklyZoneChart';
import { WhatsAppReceiptModal } from '../components/WhatsAppReceiptModal';
import {
  getStoredOrders,
  getStoredConfig,
  getStoredProducts,
} from '../lib/store';
import { supabase } from '../lib/supabase';
import type { Order, AppConfig, Product } from '../types';
import { formatUSD, formatBs, getStatusLabel } from '../lib/utils';

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  useEffect(() => {
    setOrders(getStoredOrders());
    setConfig(getStoredConfig());
    setProducts(getStoredProducts());

    if (supabase) {
      supabase
        .from('app_config')
        .select('*')
        .eq('id', 'global')
        .single()
        .then(({ data }) => {
          if (data) setConfig(data);
        });

      supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setOrders(data);
        });

      supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setProducts(data);
        });
    }
  }, []);

  // Métricas financieras reales
  const validOrders = orders.filter((o) => o.estado !== 'cancelado');
  const totalVentasUSD = validOrders.reduce((acc, o) => acc + o.subtotal_usd, 0);
  const totalCostoUSD = validOrders.reduce((acc, o) => acc + o.costo_total_produccion_usd, 0);
  const gananciaNetaUSD = validOrders.reduce((acc, o) => acc + o.ganancia_neta_usd, 0);
  const totalPrendasVendidas = validOrders.reduce((acc, o) => acc + o.total_unidades, 0);

  const margenPorcentaje = totalVentasUSD > 0
    ? ((gananciaNetaUSD / totalVentasUSD) * 100).toFixed(1)
    : '0';

  const rate = config?.tasa_bcv || 76.50;

  // Pedidos pendientes de confirmación o preparación
  const pendingOrders = orders.filter(
    (o) => o.estado === 'por_confirmar' || o.estado === 'pago_confirmado' || o.estado === 'en_confeccion'
  );

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Dashboard Financiero & Taller"
        subtitle="Control de ganancias, pedidos por zona e inventario Ezer Sport"
        currentRate={rate}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Banner de Jornada Semanal de Caracas */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 dark:from-[#0c2e59] dark:via-[#092344] dark:to-[#0c3b74] border border-blue-200 dark:border-blue-800/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-[#009fe3] flex items-center justify-center shrink-0 border border-blue-400/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-blue-700 dark:text-blue-300">
                  Logística Semanal
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  config?.entregas_caracas_activas
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                }`}>
                  {config?.entregas_caracas_activas ? '● ACTIVA' : '● EN PAUSA'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Jornada de Entregas Caracas (Sábados Torre La Previsora)
              </h2>
              <p className="text-sm text-slate-600 dark:text-blue-200">
                {config?.entregas_caracas_activas
                  ? 'Confirmaciones abiertas para despacho en Plaza Venezuela este sábado.'
                  : 'Jornada en pausa temporal para Caracas.'}
              </p>
            </div>
          </div>

          <Link
            href="/entregas"
            className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 font-bold text-sm shadow-md border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
          >
            Gestionar Entregas
          </Link>
        </div>

        {/* KPIs Financieros Reales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Ganancia Neta Total"
            valueUSD={formatUSD(gananciaNetaUSD)}
            valueBs={formatBs(gananciaNetaUSD * rate)}
            badgeText={`${margenPorcentaje}% Margen`}
            badgeType="success"
            icon={TrendingUp}
            subtext="Beneficio real de taller"
          />

          <MetricCard
            title="Total Ventas Brutas"
            valueUSD={formatUSD(totalVentasUSD)}
            valueBs={formatBs(totalVentasUSD * rate)}
            badgeText={`${totalPrendasVendidas} piezas`}
            badgeType="info"
            icon={DollarSign}
            subtext="Facturación acumulada"
          />

          <MetricCard
            title="Costo de Producción"
            valueUSD={formatUSD(totalCostoUSD)}
            valueBs={formatBs(totalCostoUSD * rate)}
            badgeText="Telas & Costura"
            badgeType="neutral"
            icon={Package}
            subtext="Inversión en manufactura"
          />

          <MetricCard
            title="Pedidos Activos"
            valueUSD={`${pendingOrders.length} en curso`}
            badgeText={`${orders.length} totales`}
            badgeType="warning"
            icon={ShoppingCart}
            subtext="Por confirmar y taller"
          />
        </div>

        {/* Gráfico Estadístico de Ventas por Zona (Caracas, Los Teques, San Antonio, Nacional) */}
        <WeeklyZoneChart orders={orders} />

        {/* Tabla Rápida de Últimos Pedidos */}
        <div className="bg-white dark:bg-[#0e213b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Pedidos Recientes &amp; Preparación
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Imprime comanda de empaque y genera recibos para WhatsApp
              </p>
            </div>

            <Link
              href="/pedidos"
              className="inline-flex items-center gap-1.5 text-sm text-[#009fe3] hover:underline font-bold"
            >
              <span>Ver todos los pedidos</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-[#091b33] text-slate-600 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Orden / Fecha</th>
                  <th className="p-3.5">Cliente &amp; Cédula</th>
                  <th className="p-3.5">Destino</th>
                  <th className="p-3.5">Prendas</th>
                  <th className="p-3.5">Total &amp; Pago</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay pedidos registrados en el sistema. Los pedidos nuevos aparecerán aquí.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((ord) => {
                    const statusInfo = getStatusLabel(ord.estado);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <Link
                          href={`/pedidos/${ord.id}`}
                          className="font-black text-sm text-slate-900 dark:text-white hover:text-[#009fe3] transition-colors block font-mono"
                        >
                          {ord.numero_orden}
                        </Link>
                        <span className="text-xs text-slate-500">
                          {new Date(ord.created_at).toLocaleDateString('es-VE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {ord.nombre_cliente} {ord.apellido_cliente}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">
                          {ord.cedula_cliente} • {ord.telefono_cliente}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                          {ord.zona_nombre}
                        </span>
                        {ord.punto_encuentro && (
                          <span className="text-xs text-[#009fe3] block truncate">
                            📍 {ord.punto_encuentro}
                          </span>
                        )}
                        {ord.codigo_agencia && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-300 block truncate">
                            📦 {ord.codigo_agencia}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {ord.total_unidades} prendas
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block truncate max-w-[180px]">
                          {ord.items.map((it) => `${it.cantidad}x ${it.nombre_variante}`).join(', ')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-black text-sm text-slate-900 dark:text-white block">
                          {formatUSD(ord.total_usd)}
                        </span>
                        {ord.tipo_pago === 'abono_50' ? (
                          <span className="text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold inline-block mt-0.5">
                            Abono 50%
                          </span>
                        ) : (
                          <span className="text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold inline-block mt-0.5">
                            100% Pagado
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderForReceipt(ord)}
                            className="inline-flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                            title="Recibo para WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Recibo</span>
                          </button>

                          <Link
                            href={`/ticket/${ord.id}`}
                            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#091b33] hover:bg-slate-200 dark:hover:bg-[#0c2445] text-slate-800 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
                            title="Imprimir comanda para empaque (Sin precios)"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#009fe3]" />
                            <span className="hidden sm:inline">Ticket</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Recibo WhatsApp */}
      {selectedOrderForReceipt && (
        <WhatsAppReceiptModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </main>
  );
}
