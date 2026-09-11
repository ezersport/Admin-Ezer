'use client';

import React from 'react';
import type { Order } from '../types';
import { Printer, CheckSquare, Package, MapPin, Phone, User, Calendar } from 'lucide-react';

interface OrderPackingTicketProps {
  order: Order;
  onPrint?: () => void;
}

export const OrderPackingTicket: React.FC<OrderPackingTicketProps> = ({ order, onPrint }) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón de impresión en pantalla (se oculta al imprimir con media print) */}
      <div className="flex items-center justify-between print:hidden">
        <span className="text-xs text-slate-400 font-medium">
          Rótulo Oficial de Despacho (Sin prendas internas ni precios)
        </span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Ticket de Despacho</span>
        </button>
      </div>

      {/* TICKET FÍSICO / COMANDA DE EMPAQUE (80mm o Media Carta) */}
      <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-2xl max-w-lg mx-auto font-mono text-xs print:m-0 print:p-4 print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Encabezado del Taller */}
        <div className="text-center border-b-2 border-dashed border-slate-400 pb-4 mb-4">
          <h2 className="font-sans font-black text-2xl tracking-tighter text-slate-900 uppercase">
            EZER SPORT
          </h2>
          <p className="text-[11px] text-slate-600 font-semibold uppercase">
            Taller de Confección Textil Venezolano
          </p>
          <p className="text-[10px] text-slate-500">
            Los Teques, Edo. Miranda • WhatsApp: 0424-128-2108
          </p>
          <div className="mt-3 inline-block bg-slate-900 text-white px-4 py-1 rounded-lg text-lg font-black tracking-wider">
            {order.numero_orden}
          </div>
        </div>

        {/* Metadatos de la Orden */}
        <div className="border-b-2 border-dashed border-slate-400 pb-3 mb-3 space-y-1 text-slate-800">
          <div className="flex justify-between text-[11px]">
            <span className="font-bold">FECHA EMISIÓN:</span>
            <span>{new Date(order.created_at).toLocaleDateString('es-VE')} {new Date(order.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="font-bold">TOTAL PRENDAS:</span>
            <span className="font-black text-slate-900">{order.total_unidades} unidades</span>
          </div>
        </div>

        {/* Datos Completos del Cliente y Destino */}
        <div className="border-b-2 border-dashed border-slate-400 pb-4 mb-4 space-y-1.5 text-slate-800">
          <div className="text-[11px] font-sans font-bold text-slate-900 uppercase bg-slate-100 px-2 py-0.5 rounded">
            Datos de Envío &amp; Receptor
          </div>
          <div className="pt-1">
            <p className="font-bold text-sm text-slate-900">
              {order.nombre_cliente} {order.apellido_cliente}
            </p>
            <p className="text-[11px]">
              <strong>Cédula:</strong> {order.cedula_cliente}
            </p>
            <p className="text-[11px]">
              <strong>Teléfono / WhatsApp:</strong> {order.telefono_cliente}
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200">
            <p className="text-[11px]">
              <strong>Zona de Destino:</strong> {order.zona_nombre}
            </p>
            {order.punto_encuentro && (
              <p className="text-[11px]">
                <strong>Punto de Encuentro:</strong> {order.punto_encuentro}
              </p>
            )}
            {order.empresa_envio && (
              <p className="text-[11px] font-bold text-slate-900">
                <strong>Empresa Encomienda:</strong> {order.empresa_envio}
              </p>
            )}
            {order.codigo_agencia && (
              <p className="text-[11px]">
                <strong>Agencia Destino:</strong> {order.codigo_agencia}
              </p>
            )}
            {order.estado_destino && (
              <p className="text-[11px]">
                <strong>Estado / Ciudad:</strong> {order.estado_destino} {order.ciudad_destino ? `- ${order.ciudad_destino}` : ''}
              </p>
            )}
            {order.direccion_detalle && (
              <p className="text-[11px] text-slate-600">
                <strong>Dirección / Ref:</strong> {order.direccion_detalle}
              </p>
            )}
          </div>
        </div>

        {/* Rótulo de Despacho y Entrega (Sin lista de prendas ni precios) */}
        <div className="pt-2">
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 text-center space-y-1">
            <p className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
              📦 RÓTULO EXTERNO DE DESPACHO • ENCOMIENDA &amp; DELIVERY
            </p>
            <p className="text-[10px] text-slate-500">
              Pegar en el exterior del paquete para identificación y entrega al destinatario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
