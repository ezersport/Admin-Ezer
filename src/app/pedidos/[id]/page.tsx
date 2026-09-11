'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  ExternalLink,
  MessageCircle,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  Save,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { AdminHeader } from '../../../components/AdminHeader';
import { WhatsAppReceiptModal } from '../../../components/WhatsAppReceiptModal';
import {
  getStoredOrders,
  saveStoredOrders,
  getStoredConfig,
} from '../../../lib/store';
import type { Order, OrderStatus } from '../../../types';
import { formatUSD, formatBs, getStatusLabel } from '../../../lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [guideNumber, setGuideNumber] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    const orderId = params?.id as string;
    if (orderId) {
      const orders = getStoredOrders();
      const found = orders.find((o) => o.id === orderId || o.numero_orden === orderId);
      if (found) {
        setOrder(found);
        setGuideNumber(found.numero_guia_envio || '');
      }
    }
  }, [params]);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-base text-slate-600 dark:text-slate-300 font-bold">
          No se encontró la orden solicitada.
        </p>
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#009fe3] text-white font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Pedidos</span>
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: OrderStatus) => {
    const orders = getStoredOrders();
    const updated = orders.map((o) =>
      o.id === order.id ? { ...o, estado: newStatus, updated_at: new Date().toISOString() } : o
    );
    saveStoredOrders(updated);
    setOrder({ ...order, estado: newStatus });
  };

  const handleSaveGuide = (e: React.FormEvent) => {
    e.preventDefault();
    const orders = getStoredOrders();
    const updated = orders.map((o) =>
      o.id === order.id ? { ...o, numero_guia_envio: guideNumber.trim() } : o
    );
    saveStoredOrders(updated);
    setOrder({ ...order, numero_guia_envio: guideNumber.trim() });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const statusInfo = getStatusLabel(order.estado);
  const cleanPhone = order.telefono_cliente.replace(/\D/g, '');
  const waLink = `https://wa.me/58${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Detalle de Pedido ${order.numero_orden}`}
        subtitle={`Registrado el ${new Date(order.created_at).toLocaleDateString('es-VE')}`}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Barra superior de navegación y acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/pedidos"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a listado de pedidos</span>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Generar Recibo de WhatsApp */}
            <button
              onClick={() => setShowReceiptModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Generar Recibo WhatsApp</span>
            </button>

            {/* Imprimir Ticket de Empaque (CERO PRECIOS) */}
            <Link
              href={`/ticket/${order.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#009fe3] hover:bg-[#0082ba] text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket de Empaque</span>
            </Link>
          </div>
        </div>

        {/* Grid de Estado y Datos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Artículos y Logística */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta de Prendas e Importes */}
            <div className="bg-white dark:bg-[#0e213b] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Prendas Solicitadas ({order.total_unidades} Unidades)
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Desglose de confección, variantes y costos de taller
                  </p>
                </div>
                <span className="text-sm font-mono font-bold bg-slate-100 dark:bg-[#091b33] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  {order.numero_orden}
                </span>
              </div>

              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#091b33] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {item.cantidad}x {item.nombre_producto}
                        </span>
                        <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-[#009fe3]">
                          {item.tipo_variante}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        <strong>Talla:</strong> {item.talla} •{' '}
                        <strong>Modelo/Estampa:</strong>{' '}
                        <span className="text-[#009fe3] font-semibold">{item.nombre_variante}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Costo unitario taller: {formatUSD(item.costo_unitario_usd)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-4">
                      <span className="text-base font-black text-slate-900 dark:text-white block">
                        {formatUSD(item.subtotal_venta_usd)}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">
                        +{formatUSD(item.ganancia_item_usd)} ganancia
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen Financiero */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal Prendas:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatUSD(order.subtotal_usd)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Costo Delivery / Traslado:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {order.costo_delivery_usd === 0 ? '¡Gratis!' : formatUSD(order.costo_delivery_usd)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Costo Total de Taller:</span>
                  <span className="font-bold text-rose-500">-{formatUSD(order.costo_total_produccion_usd)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span>TOTAL ORDEN:</span>
                  <div className="text-right">
                    <span>{formatUSD(order.total_usd)}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 block font-mono">
                      ≈ {formatBs(order.total_bs)}
                    </span>
                  </div>
                </div>

                {/* Badge de Abono 50% vs 100% */}
                {order.tipo_pago === 'abono_50' ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-amber-800 dark:text-amber-300 block">
                        Modalidad: Abono 50%
                      </span>
                      <span className="text-xs text-amber-700 dark:text-amber-400">
                        Abonado: {formatUSD(order.total_usd / 2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Saldo por Cobrar:</span>
                      <span className="font-black text-amber-700 dark:text-amber-400 font-mono">
                        {formatUSD(order.total_usd / 2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-sm">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      ✓ Pago Completo 100% Verificado
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                      {formatUSD(order.total_usd)}
                    </span>
                  </div>
                )}

                <div className="mt-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Ganancia Neta de esta orden:
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    +{formatUSD(order.ganancia_neta_usd)}
                  </span>
                </div>
              </div>
            </div>

            {/* Número de Guía de Encomienda */}
            <div className="bg-white dark:bg-[#0e213b] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Guía de Envío &amp; Despacho (MRW / Zoom / Tealca)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Registra el número de cupón o guía para que el cliente lo rastree automáticamente en su link web.
              </p>

              <form onSubmit={handleSaveGuide} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ej: MRW-9842104 o ZOOM-881203"
                  value={guideNumber}
                  onChange={(e) => setGuideNumber(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-[#091b33] border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                />
                <button
                  type="submit"
                  className="bg-[#009fe3] hover:bg-[#0082ba] text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                >
                  Guardar Guía
                </button>
              </form>
              {savedSuccess && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Guía actualizada correctamente.
                </p>
              )}
            </div>
          </div>

          {/* Col 3: Estado, Cliente y Destino */}
          <div className="space-y-6">
            {/* Estado del Pedido */}
            <div className="bg-white dark:bg-[#0e213b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                Fase Actual del Pedido
              </span>
              <div
                className={`p-3.5 rounded-2xl border text-center font-black text-sm ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
              >
                {statusInfo.label}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cambiar Estado:
                </label>
                <select
                  value={order.estado}
                  onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                  className="w-full bg-slate-50 dark:bg-[#091b33] border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3] cursor-pointer"
                >
                  <option value="por_confirmar">Por Confirmar</option>
                  <option value="pago_confirmado">Pago Confirmado</option>
                  <option value="en_confeccion">En Confección (Taller)</option>
                  <option value="listo_para_entrega">Listo para Entrega</option>
                  <option value="programado_caracas">Programado Caracas (Sábados)</option>
                  <option value="en_camino_delivery">En Camino Delivery</option>
                  <option value="despachado_agencia">Despachado en Agencia</option>
                  <option value="entregado">Entregado con Éxito</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-white dark:bg-[#0e213b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Información del Cliente
              </h3>

              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-xs text-slate-500 block">Nombre Completo:</span>
                  <strong className="text-slate-900 dark:text-white text-base">
                    {order.nombre_cliente} {order.apellido_cliente}
                  </strong>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Cédula de Identidad:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{order.cedula_cliente}</strong>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Teléfono / WhatsApp:</span>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#009fe3] hover:underline font-bold text-sm inline-flex items-center gap-1.5 mt-0.5"
                  >
                    <span>{order.telefono_cliente}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Datos de Entrega y Destino */}
            <div className="bg-white dark:bg-[#0e213b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Destino de Entrega
              </h3>

              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-xs text-slate-500 block">Zona Seleccionada:</span>
                  <strong className="text-slate-900 dark:text-white">{order.zona_nombre}</strong>
                </div>

                {order.punto_encuentro && (
                  <div>
                    <span className="text-xs text-slate-500 block">Punto de Encuentro:</span>
                    <span className="text-[#009fe3] font-bold">📍 {order.punto_encuentro}</span>
                  </div>
                )}

                {order.empresa_envio && (
                  <div>
                    <span className="text-xs text-slate-500 block">Empresa Encomienda:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{order.empresa_envio}</strong>
                  </div>
                )}

                {order.codigo_agencia && (
                  <div>
                    <span className="text-xs text-slate-500 block">Agencia Receptora:</span>
                    <strong className="text-slate-900 dark:text-white">{order.codigo_agencia}</strong>
                  </div>
                )}

                {order.estado_destino && (
                  <div>
                    <span className="text-xs text-slate-500 block">Estado / Ciudad:</span>
                    <strong className="text-slate-900 dark:text-white">{order.estado_destino} {order.ciudad_destino ? `- ${order.ciudad_destino}` : ''}</strong>
                  </div>
                )}

                {order.direccion_detalle && (
                  <div>
                    <span className="text-xs text-slate-500 block">Dirección / Ref:</span>
                    <span className="text-slate-700 dark:text-slate-200">{order.direccion_detalle}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recibo WhatsApp */}
      {showReceiptModal && (
        <WhatsAppReceiptModal
          order={order}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </main>
  );
}
