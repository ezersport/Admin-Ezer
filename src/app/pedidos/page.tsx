'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Search,
  Printer,
  ExternalLink,
  MessageCircle,
  Package,
} from 'lucide-react';
import { AdminHeader } from '../../components/AdminHeader';
import { WhatsAppReceiptModal } from '../../components/WhatsAppReceiptModal';
import {
  getStoredOrders,
  updateOrderStatus,
  getStoredConfig,
  saveStoredOrders,
} from '../../lib/store';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus } from '../../types';
import { formatUSD, formatBs, getStatusLabel } from '../../lib/utils';

export default function PedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [currentRate, setCurrentRate] = useState<number>(76.50);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  useEffect(() => {
    setOrders(getStoredOrders());
    const cfg = getStoredConfig();
    if (cfg) setCurrentRate(cfg.tasa_bcv);

    // Cargar pedidos desde Supabase
    if (supabase) {
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mapped: Order[] = data.map((d: any) => ({
              id: d.id,
              numero_orden: d.numero_orden,
              cedula_cliente: d.cedula_cliente,
              nombre_cliente: d.nombre_cliente,
              apellido_cliente: d.apellido_cliente,
              telefono_cliente: d.telefono_cliente,
              tipo_destino: d.tipo_destino,
              zona_entrega_id: d.zona_entrega_id || '',
              zona_nombre: d.zona_nombre,
              punto_encuentro: d.punto_encuentro,
              empresa_envio: d.empresa_envio,
              codigo_agencia: d.codigo_agencia,
              estado_destino: d.estado_destino,
              ciudad_destino: d.ciudad_destino,
              direccion_detalle: d.direccion_detalle,
              metodo_pago_codigo: d.metodo_pago_codigo,
              referencia_pago: d.referencia_pago,
              tasa_cambio_snapshot: Number(d.tasa_cambio_snapshot || 76.50),
              total_unidades: Number(d.total_unidades || 1),
              subtotal_usd: Number(d.subtotal_usd || 0),
              costo_delivery_usd: Number(d.costo_delivery_usd || 0),
              total_usd: Number(d.total_usd || 0),
              total_bs: Number(d.total_bs || 0),
              costo_total_produccion_usd: Number(d.costo_total_produccion_usd || 0),
              ganancia_neta_usd: Number(d.ganancia_neta_usd || 0),
              tipo_pago: d.tipo_pago || 'completo_100',
              monto_pagado_usd: Number(d.monto_pagado_usd || d.total_usd || 0),
              monto_pendiente_usd: Number(d.monto_pendiente_usd || 0),
              disponibilidad_pedido: d.disponibilidad_pedido || 'stock_inmediato',
              estado: d.estado as OrderStatus,
              items: (Array.isArray(d.order_items) ? d.order_items : []).map((it: any) => ({
                id: it.id,
                producto_id: it.producto_id,
                nombre_producto: it.nombre_producto,
                talla: it.talla,
                tipo_variante: it.tipo_variante,
                nombre_variante: it.nombre_variante,
                cantidad: Number(it.cantidad || 1),
                precio_unitario_aplicado_usd: Number(it.precio_unitario_aplicado_usd || 0),
                costo_unitario_usd: Number(it.costo_unitario_usd || 0),
                subtotal_venta_usd: Number(it.subtotal_venta_usd || 0),
              })),
              ticket_impreso: Boolean(d.ticket_impreso),
              created_at: d.created_at,
              updated_at: d.updated_at,
            }));
            setOrders(mapped);
            saveStoredOrders(mapped);
          }
        });
    }
  }, []);

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    const updated = updateOrderStatus(orderId, newStatus);
    setOrders(updated);

    if (supabase) {
      supabase
        .from('orders')
        .update({ estado: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .then();
    }
  };

  // Filtrado reactivo en tiempo real
  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== 'todos' && o.estado !== selectedStatus) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.numero_orden.toLowerCase().includes(q) ||
      o.nombre_cliente.toLowerCase().includes(q) ||
      o.apellido_cliente.toLowerCase().includes(q) ||
      o.cedula_cliente.toLowerCase().includes(q) ||
      o.telefono_cliente.toLowerCase().includes(q) ||
      o.zona_nombre.toLowerCase().includes(q) ||
      (o.codigo_agencia && o.codigo_agencia.toLowerCase().includes(q))
    );
  });

  const statuses: { id: string; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'por_confirmar', label: 'Por Confirmar' },
    { id: 'pago_confirmado', label: 'Pago Confirmado' },
    { id: 'en_confeccion', label: 'En Confección' },
    { id: 'listo_para_entrega', label: 'Listo para Entrega' },
    { id: 'programado_caracas', label: 'Caracas Sábados' },
    { id: 'en_camino_delivery', label: 'En Camino Delivery' },
    { id: 'despachado_agencia', label: 'Despachado Agencia' },
    { id: 'entregado', label: 'Entregados' },
  ];

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Gestión de Pedidos & Despachos"
        subtitle="Rastreo por # de Orden, comanda de empaque y recibos de WhatsApp"
        currentRate={currentRate}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Controles de Búsqueda y Filtros */}
        <div className="bg-white dark:bg-[#0e213b] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Buscador inteligente */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por #EZ-XXXX, nombre, cédula (V-...), teléfono o agencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-[#091b33] border border-slate-300 dark:border-slate-700/80 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Mostrando <strong className="text-slate-900 dark:text-white font-bold">{filteredOrders.length}</strong> de {orders.length} pedidos
            </span>
          </div>

          {/* Pastillas de Estado */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {statuses.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatus === st.id
                    ? 'bg-[#009fe3] text-white shadow-md shadow-[#009fe3]/25 font-black'
                    : 'bg-slate-100 dark:bg-[#091b33] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* VISTA MÓVIL SIMPLIFICADA (Tarjetas táctiles sin riesgo de cambios accidentales) */}
        <div className="block md:hidden space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-[#0e213b] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm shadow-sm">
              No se encontraron pedidos con los criterios de búsqueda.
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const statusInfo = getStatusLabel(ord.estado);

              return (
                <div
                  key={ord.id}
                  onClick={() => router.push(`/pedidos/${ord.id}`)}
                  className="bg-white dark:bg-[#0e213b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-md hover:border-[#009fe3]/50 transition-all cursor-pointer active:scale-[0.99] space-y-3"
                >
                  {/* Fila 1: N° de Orden, Fecha y Total */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-[#009fe3] tracking-tight">
                          {ord.numero_orden}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ord.created_at).toLocaleDateString('es-VE')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {ord.nombre_cliente} {ord.apellido_cliente}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {ord.cedula_cliente}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-base text-slate-900 dark:text-white">
                        {formatUSD(ord.total_usd)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {formatBs(ord.total_bs)}
                      </div>
                      {ord.tipo_pago === 'abono_50' ? (
                        <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold inline-block mt-0.5">
                          50% Abono
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold inline-block mt-0.5">
                          100% Pago
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fila 2: Información de Entrega y Badges */}
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <div className="truncate pr-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                        {ord.zona_nombre}
                      </span>
                      {ord.punto_encuentro && (
                        <span className="text-[11px] text-[#009fe3] block truncate">
                          📍 {ord.punto_encuentro}
                        </span>
                      )}
                      {ord.empresa_envio && (
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block truncate">
                          📦 {ord.empresa_envio} {ord.codigo_agencia ? `(${ord.codigo_agencia})` : ''}
                        </span>
                      )}
                    </div>

                    {/* Estado del pedido (Solo visual, sin selector para evitar cambios accidentales en móvil) */}
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Fila 3: Acciones Rápidas y aviso "Tocar para ver detalle" */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-[#009fe3] font-semibold flex items-center gap-1">
                      Ver detalle completo →
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForReceipt(ord)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 active:scale-95"
                        title="Recibo WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Recibo WA</span>
                      </button>

                      <Link
                        href={`/ticket/${ord.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-[#009fe3]/15 text-[#009fe3] border border-[#009fe3]/30 text-xs font-bold flex items-center gap-1 active:scale-95"
                        title="Imprimir Rótulo"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Rótulo</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tabla Principal de Pedidos (Exclusiva para Escritorio md: y superior) */}
        <div className="hidden md:block bg-white dark:bg-[#0e213b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-[#091b33] text-slate-700 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Orden / Fecha</th>
                  <th className="p-4">Cliente &amp; Cédula</th>
                  <th className="p-4">Zona / Agencia</th>
                  <th className="p-4">Prendas</th>
                  <th className="p-4">Total &amp; Pago</th>
                  <th className="p-4">Estado del Pedido</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No se encontraron pedidos con los criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const statusInfo = getStatusLabel(ord.estado);
                    const cleanPhone = ord.telefono_cliente.replace(/\D/g, '');
                    const waLink = `https://wa.me/58${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <Link
                            href={`/pedidos/${ord.id}`}
                            className="font-black text-sm text-slate-900 dark:text-white hover:text-[#009fe3] transition-colors block font-mono"
                          >
                            {ord.numero_orden}
                          </Link>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {new Date(ord.created_at).toLocaleDateString('es-VE')} {new Date(ord.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {ord.nombre_cliente} {ord.apellido_cliente}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 block font-mono">
                            {ord.cedula_cliente}
                          </span>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#009fe3] hover:underline text-xs inline-flex items-center gap-1 font-semibold mt-0.5"
                          >
                            <span>{ord.telefono_cliente}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>

                        <td className="p-4 max-w-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                            {ord.zona_nombre}
                          </span>
                          {ord.punto_encuentro && (
                            <span className="text-xs text-[#009fe3] block truncate">
                              📍 {ord.punto_encuentro}
                            </span>
                          )}
                          {ord.empresa_envio && (
                            <span className="text-xs text-indigo-600 dark:text-indigo-300 font-bold block truncate">
                              📦 {ord.empresa_envio} {ord.codigo_agencia ? `(${ord.codigo_agencia})` : ''}
                            </span>
                          )}
                          {ord.numero_guia_envio && (
                            <span className="text-xs bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono inline-block mt-1">
                              Guía: {ord.numero_guia_envio}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {ord.total_unidades} prendas
                            </span>
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                                <span className="text-slate-900 dark:text-white font-bold">{it.cantidad}x</span>{' '}
                                <span>{it.nombre_producto.split(' ')[0]}</span>{' '}
                                <span className="text-[#009fe3]">({it.talla} - {it.nombre_variante})</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-black text-sm text-slate-900 dark:text-white block">
                            {formatUSD(ord.total_usd)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">
                            {formatBs(ord.total_bs)}
                          </span>

                          {ord.tipo_pago === 'abono_50' ? (
                            <span className="text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold inline-block mt-1">
                              Abono 50% ({formatUSD(ord.total_usd / 2)} pend.)
                            </span>
                          ) : (
                            <span className="text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold inline-block mt-1">
                              ✓ 100% Pagado
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="space-y-1.5">
                            <select
                              value={ord.estado}
                              onChange={(e) => handleStatusUpdate(ord.id, e.target.value as OrderStatus)}
                              className="w-full bg-slate-50 dark:bg-[#091b33] border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3] transition-colors cursor-pointer"
                            >
                              <option value="por_confirmar">Por Confirmar</option>
                              <option value="pago_confirmado">Pago Confirmado</option>
                              <option value="en_confeccion">En Confección (Taller)</option>
                              <option value="listo_para_entrega">Listo para Entrega</option>
                              <option value="programado_caracas">Programado Caracas (Sáb)</option>
                              <option value="en_camino_delivery">En Camino Delivery</option>
                              <option value="despachado_agencia">Despachado en Agencia</option>
                              <option value="entregado">Entregado con Éxito</option>
                              <option value="cancelado">Cancelado</option>
                            </select>

                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botón de Recibo para WhatsApp */}
                            <button
                              onClick={() => setSelectedOrderForReceipt(ord)}
                              className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95"
                              title="Generar y Enviar Recibo por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Recibo WA</span>
                            </button>

                            {/* Botón de Ticket de Despacho (SIN PRECIOS) */}
                            <Link
                              href={`/ticket/${ord.id}`}
                              className="inline-flex items-center gap-1.5 bg-[#009fe3]/15 hover:bg-[#009fe3]/25 text-[#009fe3] border border-[#009fe3]/30 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                              title="Imprimir Comanda de Empaque (Sin precios)"
                            >
                              <Printer className="w-3.5 h-3.5" />
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
