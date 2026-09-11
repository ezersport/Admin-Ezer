'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Save,
  CheckCircle2,
  Clock,
  Calculator,
  History,
  DollarSign,
} from 'lucide-react';
import {
  getStoredConfig,
  saveStoredConfig,
} from '../../lib/store';
import { supabase } from '../../lib/supabase';
import type { AppConfig, ExchangeRateRecord } from '../../types';
import { formatUSD, formatBS } from '../../lib/utils';
import { AdminHeader } from '../../components/AdminHeader';

export default function TasaBCVPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [nuevaTasa, setNuevaTasa] = useState<string>('');
  const [history, setHistory] = useState<ExchangeRateRecord[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Simulador de conversión
  const [simuladorUSD, setSimuladorUSD] = useState<number>(27);

  useEffect(() => {
    const currentConfig = getStoredConfig();
    setConfig(currentConfig);
    setNuevaTasa(currentConfig.tasa_bcv > 0 ? currentConfig.tasa_bcv.toFixed(2) : '');

    // Cargar historial y tasa desde Supabase
    if (supabase) {
      supabase.from('app_config').select('*').eq('id', 'global').single().then(({ data }) => {
        if (data && data.tasa_bcv) {
          setConfig(data);
          setNuevaTasa(Number(data.tasa_bcv).toFixed(2));
          saveStoredConfig(data);
        }
      });
      supabase.from('exchange_rates').select('*').order('fecha', { ascending: false }).limit(20).then(({ data }) => {
        if (data && data.length > 0) {
          setHistory(data as any);
        }
      });
    }
  }, []);

  const handleUpdateRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    const rateNumber = parseFloat(nuevaTasa);
    if (isNaN(rateNumber) || rateNumber <= 0) {
      alert('Por favor introduce una tasa válida mayor a 0');
      return;
    }

    const updatedConfig: AppConfig = {
      ...config,
      tasa_bcv: rateNumber,
      tasa_actualizada_al: new Date().toISOString(),
    };

    setConfig(updatedConfig);
    saveStoredConfig(updatedConfig);

    // Agregar registro al historial
    const newRecord: ExchangeRateRecord = {
      id: `hist-${Date.now()}`,
      tasa: rateNumber,
      fuente: 'bcv_oficial',
      fecha: new Date().toISOString(),
      usuario: 'Administrador Taller',
    };

    const newHistory = [newRecord, ...history];
    setHistory(newHistory);
    localStorage.setItem('ezer_admin_rates_history_clean_v3', JSON.stringify(newHistory));
    localStorage.setItem('ezer_rates_clean_v3', JSON.stringify(newHistory));

    // Persistir en Supabase
    if (supabase) {
      supabase.from('app_config').update({ tasa_bcv: rateNumber, tasa_actualizada_al: new Date().toISOString() }).eq('id', 'global').then();
      supabase.from('exchange_rates').insert({ tasa: rateNumber, fuente: 'bcv_oficial', usuario: 'Administrador Taller' }).then();
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Tasa de Cambio Oficial BCV"
        subtitle="Actualiza el valor oficial en Bolívares (Bs) por cada Dólar"
        currentRate={config?.tasa_bcv}
      />

      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              <span>Cotización Oficial BCV</span>
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
              Todas las órdenes, catálogos y recibos de WhatsApp se recalcularán automáticamente con esta tasa.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-sm font-bold animate-fade-in">
              <CheckCircle2 className="w-5 h-5" />
              <span>Tasa BCV actualizada en todo el sistema</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PANEL PRINCIPAL: TASA ACTUAL & FORMULARIO */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    Tasa Vigente en Tienda & Facturación
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {config?.tasa_bcv ? config.tasa_bcv.toFixed(2) : '0.00'}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-slate-500 dark:text-slate-400 font-mono">
                      Bs / USD
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-white mb-0.5">
                    Última actualización:
                  </div>
                  <div>
                    {config?.tasa_actualizada_al
                      ? `${new Date(config.tasa_actualizada_al).toLocaleDateString('es-VE')} ${new Date(config.tasa_actualizada_al).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`
                      : 'Sin actualización previa'}
                  </div>
                </div>
              </div>

              {/* FORMULARIO DE CAMBIO RÁPIDO */}
              <form onSubmit={handleUpdateRate} className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Ingresar Nueva Tasa BCV Oficial (Bs):
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-lg">
                      Bs
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={nuevaTasa}
                      onChange={(e) => setNuevaTasa(e.target.value)}
                      placeholder="Ej: 76.50"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-2xl text-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold text-base shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save className="w-5 h-5" />
                    <span>Guardar y Aplicar</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SIMULADOR DE CONVERSIÓN EN VIVO */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#009fe3]" />
                <span>Calculadora Rápida de Precios para el Taller</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Monto en Dólares ($):
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={simuladorUSD}
                      onChange={(e) => setSimuladorUSD(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Equivalente en Pago Móvil / Taquilla:
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {config?.tasa_bcv
                      ? formatBS(simuladorUSD * config.tasa_bcv)
                      : 'Bs 0,00'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* HISTORIAL AUDITABLE DE CAMBIOS DE TASA */}
          <div className="space-y-4">
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                <span>Historial de Tasas</span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Registro inmutable para conciliación de pagos y auditoría.
              </p>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                    No hay cambios de tasa registrados aún. Ingresa la cotización arriba para registrar la primera tasa BCV.
                  </div>
                ) : (
                  history.map((record) => (
                    <div
                      key={record.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-sm space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                          {record.tasa.toFixed(2)} Bs / $
                        </span>
                        <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                          Oficial BCV
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{new Date(record.fecha || record.created_at || Date.now()).toLocaleDateString('es-VE')}</span>
                        <span>{new Date(record.fecha || record.created_at || Date.now()).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
