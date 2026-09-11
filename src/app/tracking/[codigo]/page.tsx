'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Scissors,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { getStoredOrders } from '../../../lib/store';
import type { Order, OrderStatus } from '../../../types';
import { getStatusLabel } from '../../../lib/utils';

export default function OrderTrackingPage() {
  const params = useParams();
  const [queryCode, setQueryCode] = useState<string>('');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const normalizeCode = (str: string) => {
    return str.trim().toUpperCase().replace(/^#/, '');
  };

  const lookupOrder = (code: string) => {
    const clean = normalizeCode(code);
    if (!clean) return;

    const orders = getStoredOrders();
    const found = orders.find(
      (o) =>
        normalizeCode(o.numero_orden) === clean ||
        o.id.toLowerCase() === clean.toLowerCase() ||
        o.cedula_cliente.replace(/\D/g, '') === clean.replace(/\D/g, '')
    );

    setOrder(found || null);
    setSearched(true);
  };

  useEffect(() => {
    const rawParam = params?.codigo as string;
    if (rawParam) {
      const decoded = decodeURIComponent(rawParam);
      setQueryCode(decoded);
      lookupOrder(decoded);
    }
  }, [params]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupOrder(queryCode);
  };

  // Pipeline de estados para la barra visual
  const STEPS: { key: OrderStatus[]; label: string; desc: string }[] = [
    {
      key: ['por_confirmar'],
      label: '1. Pedido Recibido',
      desc: 'Esperando validación del comprobante de pago',
    },
    {
      key: ['pago_confirmado'],
      label: '2. Pago Confirmado',
      desc: 'Pago verificado con éxito en taquilla/banco',
    },
    {
      key: ['en_confeccion'],
      label: '3. En Taller Textil',
      desc: 'Corte, costura o estampado DTF en proceso',
    },
    {
      key: ['listo_para_entrega', 'programado_caracas'],
      label: '4. Empacado & Listo',
      desc: 'Prenda verificada y asignada para despacho',
    },
    {
      key: ['en_camino_delivery', 'despachado_agencia'],
      label: '5. En Ruta / Despachado',
      desc: 'En camino al punto o guía asignada en encomienda',
    },
    {
      key: ['entregado'],
      label: '6. Entregado',
      desc: '¡Prenda en manos del cliente!',
    },
  ];

  const getActiveStepIndex = (status: OrderStatus) => {
    if (status === 'cancelado') return -1;
    for (let i = 0; i < STEPS.length; i++) {
      if (STEPS[i].key.includes(status)) {
        return i;
      }
    }
    return 0;
  };

  const activeIndex = order ? getActiveStepIndex(order.estado) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER PÚBLICO */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-4 py-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#009fe3] flex items-center justify-center font-black text-white text-lg shadow-md shadow-[#009fe3]/20">
            E
          </div>
          <div>
            <span className="font-black text-white text-base tracking-wider block leading-none">
              EZER SPORT
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
              Rastreo de Pedidos en Línea
            </span>
          </div>
        </div>

        <a
          href="https://wa.me/584241282108"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Atención Taller</span>
        </a>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-8">
        {/* BUSCADOR */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-4">
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Rastrea el Estado de tu Pedido
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Ingresa tu número de orden (ejemplo: <strong>#EZ-4821</strong>) o tu número de cédula para conocer en qué etapa se encuentra tu ropa.
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 max-w-md mx-auto"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                placeholder="#EZ-XXXX o Cédula..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 pl-10 text-sm font-mono font-bold text-white focus:outline-none uppercase"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              className="bg-[#009fe3] hover:bg-[#0082ba] text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Consultar
            </button>
          </form>
        </div>

        {/* RESULTADO DE ORDEN ENCONTRADA */}
        {order && (
          <div className="space-y-6 animate-fade-in">
            {/* Tarjeta de Resumen del Pedido */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <span className="text-[11px] font-bold text-[#009fe3] uppercase tracking-wider block">
                    Orden Oficial de Taller
                  </span>
                  <h2 className="text-2xl font-black text-white font-mono">
                    {order.numero_orden}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Cliente: <strong className="text-slate-200">{order.nombre_cliente} {order.apellido_cliente}</strong> • Destino:{' '}
                    <span className="text-[#009fe3] font-semibold">{order.zona_nombre}</span>
                  </p>
                </div>

                <div className="inline-block px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Estado Actual
                  </span>
                  <span className="text-xs font-black text-white uppercase">
                    {getStatusLabel(order.estado).label}
                  </span>
                </div>
              </div>

              {/* BARRA DE PROGRESO INTERACTIVA */}
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Línea de Confección &amp; Entrega
                </span>

                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {STEPS.map((step, idx) => {
                    const isPassed = idx <= activeIndex;
                    const isCurrent = idx === activeIndex;

                    return (
                      <div key={idx} className="relative group">
                        {/* Icono de estado */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-[#009fe3] text-white ring-4 ring-[#009fe3]/20'
                              : isPassed
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        <div>
                          <h4
                            className={`font-bold text-sm ${
                              isCurrent
                                ? 'text-[#009fe3]'
                                : isPassed
                                ? 'text-white'
                                : 'text-slate-500'
                            }`}
                          >
                            {step.label}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {step.desc}
                          </p>

                          {/* Info adicional para estados de ruta */}
                          {isCurrent && order.estado === 'programado_caracas' && (
                            <div className="mt-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
                              📍 <strong>Punto Caracas:</strong> {order.punto_encuentro || 'Plaza Venezuela frente a Torre La Previsora (Sábado)'}
                            </div>
                          )}

                          {isCurrent && order.numero_guia_envio && (
                            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
                              📦 <strong>Guía de Encomienda ({order.empresa_envio || 'Nacional'}):</strong>{' '}
                              <span className="font-bold underline">{order.numero_guia_envio}</span>
                              {order.codigo_agencia && (
                                <p className="text-[11px] mt-1 text-slate-300 font-sans">
                                  Agencia destino: {order.codigo_agencia}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LISTA DE PRENDAS DEL PEDIDO */}
              <div className="border-t border-slate-800 pt-6 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Prendas del Pedido ({order.total_unidades} Pzs)
                </span>

                <div className="space-y-2">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                          {it.cantidad}x
                        </span>
                        <div>
                          <p className="font-bold text-slate-200">
                            {it.nombre_producto}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Talla: <strong>{it.talla}</strong> •{' '}
                            {it.tipo_variante === 'estampado' ? 'Estampa:' : 'Color:'}{' '}
                            <strong className="text-slate-300">{it.nombre_variante}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTÓN WHATSAPP DE AYUDA */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/584241282108?text=${encodeURIComponent(
                    `Hola Ezer Sport, tengo una consulta sobre el estado de mi orden ${order.numero_orden}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contactar a Taller sobre esta Orden</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {searched && !order && (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="font-bold text-white text-base">
              No encontramos una orden con ese código
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Verifica haber escrito correctamente tu número de orden (ej: #EZ-4821) o tu cédula. Si acabas de realizar tu compra por WhatsApp, el taller puede tardar unos minutos en registrarla.
            </p>
          </div>
        )}
      </main>

      {/* FOOTER PÚBLICO */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Ezer Sport • Confección y Ropa Infantil • Los Teques, Venezuela
      </footer>
    </div>
  );
}
