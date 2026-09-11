'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Smartphone,
  Building2,
  Bitcoin,
  DollarSign,
  Edit2,
  X,
} from 'lucide-react';
import {
  getStoredPaymentMethods,
  saveStoredPaymentMethods,
} from '../../lib/store';
import type { PaymentMethod } from '../../types';
import { AdminHeader } from '../../components/AdminHeader';

export default function MetodosPagoPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de edición o nuevo método
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setMethods(getStoredPaymentMethods());
  }, []);

  const triggerSuccessBanner = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleToggle = (id: string) => {
    const updated = methods.map((m) =>
      m.id === id ? { ...m, activo: !m.activo } : m
    );
    setMethods(updated);
    saveStoredPaymentMethods(updated);
    triggerSuccessBanner();
  };

  const handleCopy = (m: PaymentMethod) => {
    let text = `${m.nombre}\n`;
    if (m.banco) text += `Banco: ${m.banco}\n`;
    if (m.titular) text += `Titular: ${m.titular}\n`;
    if (m.cedula_rif) text += `Cédula / RIF: ${m.cedula_rif}\n`;
    if (m.telefono) text += `Teléfono: ${m.telefono}\n`;
    if (m.numero_cuenta) text += `Cuenta: ${m.numero_cuenta}\n`;
    if (m.pay_id) text += `Binance Pay ID: ${m.pay_id}\n`;
    if (m.instrucciones) text += `Nota: ${m.instrucciones}`;

    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;

    let updated: PaymentMethod[];
    if (isNew) {
      updated = [...methods, editingMethod];
    } else {
      updated = methods.map((m) =>
        m.id === editingMethod.id ? editingMethod : m
      );
    }

    setMethods(updated);
    saveStoredPaymentMethods(updated);
    setEditingMethod(null);
    setIsNew(false);
    triggerSuccessBanner();
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este método de pago?')) return;
    const updated = methods.filter((m) => m.id !== id);
    setMethods(updated);
    saveStoredPaymentMethods(updated);
    triggerSuccessBanner();
  };

  const openNewModal = () => {
    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      codigo: 'custom',
      nombre: '',
      titular: '',
      cedula_rif: 'V-',
      activo: true,
      orden: methods.length + 1,
      instrucciones: 'Por favor envía tu comprobante con el número de referencia.',
    };
    setEditingMethod(newMethod);
    setIsNew(true);
  };

  const getMethodIcon = (codigo: string) => {
    switch (codigo) {
      case 'pago_movil':
        return <Smartphone className="w-5 h-5 text-[#009fe3]" />;
      case 'deposito_divisas':
        return <Building2 className="w-5 h-5 text-emerald-500" />;
      case 'binance':
        return <Bitcoin className="w-5 h-5 text-amber-500" />;
      default:
        return <DollarSign className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Métodos de Pago de Venezuela"
        subtitle="Administra Pago Móvil, Binance Pay y Taquilla Bancaria"
      />

      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-[#009fe3]" />
              <span>Cuentas Bancarias & Pasarelas</span>
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
              Administra tus cuentas bancarias, Pago Móvil, Binance Pay y Depósitos en taquilla en tiempo real sin reiniciar el sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <div className="flex items-center gap-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-sm font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5" />
                <span>Cambios guardados</span>
              </div>
            )}

            <button
              onClick={openNewModal}
              className="flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Método</span>
            </button>
          </div>
        </div>

        {/* Grid de métodos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                method.activo
                  ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xl'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {getMethodIcon(method.codigo)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {method.nombre}
                    </h3>
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        method.activo ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {method.activo ? 'ACTIVO PARA CLIENTES' : 'INACTIVO'}
                    </span>
                  </div>
                </div>

                {/* Controles de estado y edición */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(method.id)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      method.activo
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                    title={method.activo ? 'Desactivar' : 'Activar'}
                  >
                    {method.activo ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setEditingMethod(method);
                      setIsNew(false);
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Editar datos"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Datos bancarios */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-sm">
                {method.banco && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Banco:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{method.banco}</span>
                  </div>
                )}
                {method.titular && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Titular:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{method.titular}</span>
                  </div>
                )}
                {method.cedula_rif && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Cédula / RIF:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{method.cedula_rif}</span>
                  </div>
                )}
                {method.telefono && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Teléfono:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{method.telefono}</span>
                  </div>
                )}
                {method.numero_cuenta && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Cuenta Bancaria:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{method.numero_cuenta}</span>
                  </div>
                )}
                {method.pay_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Binance Pay ID:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{method.pay_id}</span>
                  </div>
                )}
                {method.instrucciones && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 italic">
                    {method.instrucciones}
                  </div>
                )}
              </div>

              {/* Botón rápido para copiar al portapapeles */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => handleCopy(method)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#009fe3] hover:text-[#0082ba] transition-colors cursor-pointer"
                >
                  {copiedId === method.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">¡Copiado para WhatsApp!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar datos para enviar al cliente</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(method.id)}
                  className="text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar método"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DE EDICIÓN / NUEVO MÉTODO */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                {isNew ? 'Registrar Nuevo Método de Pago' : 'Editar Método de Pago'}
              </h3>
              <button
                onClick={() => setEditingMethod(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nombre Público *
                </label>
                <input
                  type="text"
                  required
                  value={editingMethod.nombre}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, nombre: e.target.value })
                  }
                  placeholder="Ej: Pago Móvil BDV / Banesco / Binance Pay"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Banco / Pasarela
                  </label>
                  <input
                    type="text"
                    value={editingMethod.banco || ''}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, banco: e.target.value })
                    }
                    placeholder="Ej: Banco de Venezuela (0102)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Cédula o RIF
                  </label>
                  <input
                    type="text"
                    value={editingMethod.cedula_rif || ''}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        cedula_rif: e.target.value,
                      })
                    }
                    placeholder="V-18452190 o J-50123456"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Teléfono Pago Móvil
                  </label>
                  <input
                    type="text"
                    value={editingMethod.telefono || ''}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        telefono: e.target.value,
                      })
                    }
                    placeholder="0424-1282108"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Binance Pay ID
                  </label>
                  <input
                    type="text"
                    value={editingMethod.pay_id || ''}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        pay_id: e.target.value,
                      })
                    }
                    placeholder="584128210"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={editingMethod.titular || ''}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, titular: e.target.value })
                  }
                  placeholder="Ej: Ezer Sport Taller Textil"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Instrucciones para el Comprobante
                </label>
                <textarea
                  rows={2}
                  value={editingMethod.instrucciones || ''}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      instrucciones: e.target.value,
                    })
                  }
                  placeholder="Instrucciones al cliente sobre cómo enviar su captura o referencia..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Método</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
