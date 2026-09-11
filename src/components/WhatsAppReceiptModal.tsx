'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Copy,
  CheckCircle2,
  AlertTriangle,
  X,
  DollarSign,
  Package,
  MapPin,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import type { Order } from '../types';
import { formatUSD, formatBS } from '../lib/utils';

interface WhatsAppReceiptModalProps {
  order: Order;
  onClose: () => void;
  onUpdateOrderPayment?: (updatedOrder: Order) => void;
}

export const WhatsAppReceiptModal: React.FC<WhatsAppReceiptModalProps> = ({
  order,
  onClose,
  onUpdateOrderPayment,
}) => {
  const [tipoPago, setTipoPago] = useState<'completo_100' | 'abono_50'>(
    order.tipo_pago || 'completo_100'
  );
  const [disponibilidad, setDisponibilidad] = useState<'stock_inmediato' | 'bajo_pedido_confeccion'>(
    order.disponibilidad_pedido || 'stock_inmediato'
  );
  const [copied, setCopied] = useState(false);

  // Cálculos de abono
  const totalUsd = order.total_usd;
  const tasaBcv = order.tasa_cambio_snapshot || 76.50;
  const totalBs = totalUsd * tasaBcv;

  const abonoUsd = tipoPago === 'abono_50' ? totalUsd / 2 : totalUsd;
  const pendienteUsd = tipoPago === 'abono_50' ? totalUsd / 2 : 0;

  const abonoBs = abonoUsd * tasaBcv;
  const pendienteBs = pendienteUsd * tasaBcv;

  // Validación de la regla de despacho en Venezuela
  const esEnvioNacional = order.tipo_destino === 'nacional';
  const requiere100ParaDespacho = esEnvioNacional && tipoPago === 'abono_50';

  // Generar texto para WhatsApp
  const generateWhatsAppMessage = () => {
    let msg = `*🧾 RECIBO OFICIAL DE COMPRA • EZER SPORT*\n`;
    msg += `----------------------------------------\n`;
    msg += `*Orden:* ${order.numero_orden}\n`;
    msg += `*Cliente:* ${order.nombre_cliente} ${order.apellido_cliente}\n`;
    msg += `*Cédula:* ${order.cedula_cliente}\n`;
    msg += `*Teléfono:* ${order.telefono_cliente}\n\n`;

    msg += `*📦 DETALLE DE PRENDAS:*\n`;
    order.items.forEach((it) => {
      const estilo = it.tipo_variante === 'estampado' ? `Estampa: ${it.nombre_variante}` : `Color: ${it.nombre_variante}`;
      msg += `• ${it.cantidad}x ${it.nombre_producto} (Talla ${it.talla} - ${estilo})\n`;
    });

    msg += `\n*Tipo de Entrega:* ${disponibilidad === 'stock_inmediato' ? '⚡ Stock Inmediato' : '🧵 Confección Bajo Pedido'}\n`;
    msg += `*Zona de Entrega:* ${order.zona_nombre}\n`;
    if (order.punto_encuentro) msg += `*Punto de Encuentro:* ${order.punto_encuentro}\n`;
    if (order.empresa_envio) msg += `*Empresa de Envío:* ${order.empresa_envio} (Agencia: ${order.codigo_agencia || 'Por asignar'})\n`;

    msg += `\n*💰 DESGLOSE DE PAGO (Tasa BCV ${tasaBcv.toFixed(2)} Bs):*\n`;
    msg += `• Total Compra: $${totalUsd.toFixed(2)} (${formatBS(totalBs)})\n`;

    if (tipoPago === 'abono_50') {
      msg += `• *Monto Abonado (50%):* $${abonoUsd.toFixed(2)} (${formatBS(abonoBs)})\n`;
      msg += `• *Saldo Pendiente por Pagar:* $${pendienteUsd.toFixed(2)} (${formatBS(pendienteBs)})\n`;
      if (esEnvioNacional) {
        msg += `\n⚠️ *Nota Encomienda:* Recuerda que los envíos nacionales por ${order.empresa_envio || 'agencia'} requieren el 100% cancelado antes del despacho.\n`;
      } else {
        msg += `\n✅ *Nota de Entrega:* El saldo restante se cancela al momento de la entrega.\n`;
      }
    } else {
      msg += `• *Estado del Pago:* ✅ PAGO COMPLETO 100% CUBIERTO\n`;
    }

    msg += `\n*🔍 Puedes rastrear tu pedido en vivo aquí:*\n`;
    msg += `https://ezersport.vercel.app/tracking/${order.numero_orden.replace('#', '')}\n\n`;
    msg += `¡Gracias por tu compra en Ezer Sport! Fabricantes de Ropa Venezolana 🇻🇪`;

    return msg;
  };

  const handleCopy = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    const phone = order.telefono_cliente.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('58') ? phone : `58${phone.replace(/^0/, '')}`;
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Cabecera del modal */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                Recibo Digital de Compra para WhatsApp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Orden {order.numero_orden} • Cliente: {order.nombre_cliente} {order.apellido_cliente}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SELECTORES DE ESTADO DE PAGO & CONFECCIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Modalidad de Pago */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Estado de Pago del Cliente:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoPago('abono_50')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tipoPago === 'abono_50'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Abonó el 50%
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPago('completo_100')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tipoPago === 'completo_100'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Pagó el 100%
                </button>
              </div>
            </div>

            {/* Disponibilidad de la prenda */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Disponibilidad de la Prenda:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDisponibilidad('stock_inmediato')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    disponibilidad === 'stock_inmediato'
                      ? 'bg-[#009fe3] text-white shadow-md font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  En Stock Inmediato
                </button>
                <button
                  type="button"
                  onClick={() => setDisponibilidad('bajo_pedido_confeccion')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    disponibilidad === 'bajo_pedido_confeccion'
                      ? 'bg-purple-600 text-white shadow-md font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Bajo Pedido (Taller)
                </button>
              </div>
            </div>
          </div>

          {/* ALERTA DE REGLA DE DESPACHO EN VENEZUELA */}
          {requiere100ParaDespacho ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                <strong>ATENCIÓN (REGLA DE ENCOMIENDA NACIONAL):</strong> Este pedido tiene destino <strong>{order.zona_nombre} ({order.empresa_envio || 'Agencia'})</strong>.
                Los envíos nacionales NO se despachan en agencia hasta que el cliente cancele el <strong>100% de la orden</strong> (Saldo pendiente: {formatUSD(pendienteUsd)} / {formatBS(pendienteBs)}).
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {tipoPago === 'abono_50' ? (
                  <span>
                    <strong>Entrega Local Habilitada:</strong> Para Caracas (Sábados), Los Teques o San Antonio, el cliente puede despacharse con el <strong>50% de abono</strong>. El saldo de <strong>{formatUSD(pendienteUsd)} ({formatBS(pendienteBs)})</strong> se recibe contra entrega.
                  </span>
                ) : (
                  <span>
                    <strong>Orden 100% Cubierta:</strong> Este pedido está completamente pagado en dólares y bolívares.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* VISTA PREVIA DEL MENSAJE FORMATEADO PARA WHATSAPP */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Vista Previa del Texto a Enviar:
            </span>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap border border-slate-200 dark:border-slate-800 leading-relaxed">
              {generateWhatsAppMessage()}
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500">
            Tasa BCV Aplicada: <strong>{tasaBcv.toFixed(2)} Bs / $</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar para WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Enviar por WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
