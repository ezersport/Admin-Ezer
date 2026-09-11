'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Plus,
  Save,
  Edit2,
  X,
  PackageCheck,
  Tag,
  Building2,
} from 'lucide-react';
import {
  getStoredDeliveryZones,
  saveStoredDeliveryZones,
  getStoredConfig,
  saveStoredConfig,
  getStoredOrders,
} from '../../lib/store';
import { supabase } from '../../lib/supabase';
import type { DeliveryZone, AppConfig, Order } from '../../types';
import { formatUSD } from '../../lib/utils';
import { AdminHeader } from '../../components/AdminHeader';

export default function EntregasPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal para editar ruta completa
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [newPunto, setNewPunto] = useState('');
  const [newAgencia, setNewAgencia] = useState('');

  useEffect(() => {
    setZones(getStoredDeliveryZones());
    setConfig(getStoredConfig());
    setOrders(getStoredOrders());

    if (supabase) {
      supabase.from('delivery_zones').select('*').then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setZones(data);
          saveStoredDeliveryZones(data);
        }
      });
      supabase.from('app_config').select('*').eq('id', 'global').single().then(({ data }) => {
        if (data) {
          setConfig(data);
          saveStoredConfig(data);
        }
      });
    }
  }, []);

  const triggerSuccessBanner = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleToggleZone = (id: string) => {
    const target = zones.find((z) => z.id === id);
    const newStatus = target ? !target.activa_esta_semana : true;
    const updated = zones.map((z) =>
      z.id === id ? { ...z, activa_esta_semana: newStatus } : z
    );
    setZones(updated);
    saveStoredDeliveryZones(updated);
    triggerSuccessBanner();

    if (supabase) {
      supabase.from('delivery_zones').update({ activa_esta_semana: newStatus }).eq('id', id).then();
    }
  };

  const handleToggleCaracasMaster = () => {
    if (!config) return;
    const newMaster = !config.entregas_caracas_activas;
    const updated = {
      ...config,
      entregas_caracas_activas: newMaster,
    };
    setConfig(updated);
    saveStoredConfig(updated);
    triggerSuccessBanner();

    if (supabase) {
      supabase.from('app_config').update({ entregas_caracas_activas: newMaster }).eq('id', 'global').then();
    }
  };

  const handleUpdateCaracasHorario = (nuevoHorario: string) => {
    if (!config) return;
    const updated = { ...config, horario_caracas: nuevoHorario };
    setConfig(updated);
    saveStoredConfig(updated);
    triggerSuccessBanner();

    if (supabase) {
      supabase.from('app_config').update({ horario_caracas: nuevoHorario }).eq('id', 'global').then();
    }
  };

  // Guardar cambios del modal de edición
  const handleSaveZoneModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    const updated = zones.map((z) =>
      z.id === editingZone.id ? editingZone : z
    );
    setZones(updated);
    saveStoredDeliveryZones(updated);
    setEditingZone(null);
    triggerSuccessBanner();

    if (supabase) {
      supabase.from('delivery_zones').upsert(editingZone, { onConflict: 'id' }).then();
    }
  };

  // Manejo de puntos de encuentro
  const handleAddPunto = () => {
    if (!newPunto.trim() || !editingZone) return;
    setEditingZone({
      ...editingZone,
      puntos_encuentro: [...editingZone.puntos_encuentro, newPunto.trim()],
    });
    setNewPunto('');
  };

  const handleRemovePunto = (index: number) => {
    if (!editingZone) return;
    setEditingZone({
      ...editingZone,
      puntos_encuentro: editingZone.puntos_encuentro.filter((_, i) => i !== index),
    });
  };

  // Manejo de agencias de encomienda
  const handleToggleAgency = (agencyName: string) => {
    if (!editingZone) return;
    const current = editingZone.agencias_disponibles || [];
    let nextAgencies: string[];
    if (current.includes(agencyName)) {
      nextAgencies = current.filter((a) => a !== agencyName);
    } else {
      nextAgencies = [...current, agencyName];
    }
    setEditingZone({
      ...editingZone,
      agencias_disponibles: nextAgencies,
    });
  };

  const handleAddCustomAgency = () => {
    if (!newAgencia.trim() || !editingZone) return;
    const current = editingZone.agencias_disponibles || [];
    if (!current.includes(newAgencia.trim())) {
      setEditingZone({
        ...editingZone,
        agencias_disponibles: [...current, newAgencia.trim()],
      });
    }
    setNewAgencia('');
  };

  const getOrdersCountByZone = (zoneId: string) => {
    return orders.filter(
      (o) =>
        o.zona_entrega_id === zoneId &&
        o.estado !== 'entregado' &&
        o.estado !== 'cancelado'
    ).length;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Rutas & Logística de Entregas"
        subtitle="Configura precios de delivery, promociones gratis, puntos y agencias"
      />

      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Truck className="w-8 h-8 text-[#009fe3]" />
              <span>Control de Rutas y Despacho</span>
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
              Todos los valores son 100% editables: puedes ajustar costos, promociones de delivery gratis, puntos y agencias en tiempo real.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-sm font-bold animate-fade-in">
              <CheckCircle2 className="w-5 h-5" />
              <span>Configuración guardada</span>
            </div>
          )}
        </div>

        {/* BANNER PRINCIPAL: SWITCH DE CARACAS SÁBADOS */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 dark:from-blue-950/60 dark:via-slate-900 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-500/30 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-[#009fe3]/15 text-[#009fe3] border border-[#009fe3]/30">
                <Calendar className="w-4 h-4" />
                <span>JORNADA CARACAS (PLAZA VENEZUELA)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Entregas Semanales de los Sábados
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Llevamos los pedidos de taller directamente a Caracas frente a la <strong>Torre La Previsora</strong>.
                Si necesitas pausar el viaje esta semana por mantenimiento o lluvia, desactívalo aquí.
              </p>
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Horario y Mensaje Visible para Clientes:
                </label>
                <input
                  type="text"
                  value={config?.horario_caracas || ''}
                  onChange={(e) => handleUpdateCaracasHorario(e.target.value)}
                  placeholder="Ej: Sábados en Plaza Venezuela frente a Torre La Previsora"
                  className="w-full max-w-md bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="text-left md:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Estado del Viaje
                </span>
                <span
                  className={`text-base font-black ${
                    config?.entregas_caracas_activas
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {config?.entregas_caracas_activas
                    ? 'VIAJE CONFIRMADO ESTE SÁBADO'
                    : 'PAUSADO ESTA SEMANA'}
                </span>
              </div>

              <button
                onClick={handleToggleCaracasMaster}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg cursor-pointer active:scale-95 ${
                  config?.entregas_caracas_activas
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                    : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300'
                }`}
              >
                {config?.entregas_caracas_activas ? (
                  <>
                    <ToggleRight className="w-6 h-6 text-slate-950" />
                    <span>Ruta Caracas Activa</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-6 h-6 text-slate-500" />
                    <span>Ruta Caracas Pausada</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TARJETAS DE TODAS LAS RUTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map((zone) => {
            const pendientes = getOrdersCountByZone(zone.id);

            return (
              <div
                key={zone.id}
                className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                  zone.activa_esta_semana
                    ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xl'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/40 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          zone.activa_esta_semana ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl">
                        {zone.nombre}
                      </h3>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Costo de entrega:{' '}
                      <strong className="text-slate-900 dark:text-slate-200 font-bold">
                        {zone.costo_usd === 0 ? '¡GRATIS!' : formatUSD(zone.costo_usd)}
                      </strong>
                      {zone.monto_minimo_gratis_usd > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-2">
                          (Gratis a partir de {formatUSD(zone.monto_minimo_gratis_usd)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones de la ruta */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleZone(zone.id)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        zone.activa_esta_semana
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title={zone.activa_esta_semana ? 'Desactivar ruta' : 'Activar ruta'}
                    >
                      {zone.activa_esta_semana ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>

                    <button
                      onClick={() => setEditingZone(zone)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      title="Editar costos, puntos y ofertas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Puntos de encuentro configurados */}
                <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Puntos de Encuentro Configurables:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {zone.puntos_encuentro.map((pto, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#009fe3]" />
                        <span>{pto}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Agencias disponibles si aplica */}
                {zone.agencias_disponibles && zone.agencias_disponibles.length > 0 && (
                  <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Agencias de Encomienda Habilitadas:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {zone.agencias_disponibles.map((ag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm font-bold border border-amber-200 dark:border-amber-800/40"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{ag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pedidos pendientes */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-amber-500" />
                    <span>
                      <strong className="text-slate-900 dark:text-white font-bold">{pendientes}</strong> pedidos pendientes
                    </span>
                  </span>
                  <button
                    onClick={() => setEditingZone(zone)}
                    className="text-[#009fe3] font-bold text-sm hover:underline cursor-pointer"
                  >
                    Editar Parámetros
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL 100% EDITABLE DE RUTA / OFERTAS */}
      {editingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                Editar Ruta: {editingZone.nombre}
              </h3>
              <button
                onClick={() => setEditingZone(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveZoneModal} className="p-6 space-y-6">
              {/* Nombre de la Ruta */}
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nombre Público de la Ruta *
                </label>
                <input
                  type="text"
                  required
                  value={editingZone.nombre}
                  onChange={(e) =>
                    setEditingZone({ ...editingZone, nombre: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Costos y Promoción de Entrega Gratis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Costo de Delivery ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editingZone.costo_usd}
                    onChange={(e) =>
                      setEditingZone({
                        ...editingZone,
                        costo_usd: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Coloca 0 si es entrega gratuita.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Compra Mínima para Delivery Gratis ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editingZone.monto_minimo_gratis_usd}
                    onChange={(e) =>
                      setEditingZone({
                        ...editingZone,
                        monto_minimo_gratis_usd: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-base font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">
                    ¡Ideal para ofertas de temporada!
                  </span>
                </div>
              </div>

              {/* PUNTOS DE ENCUENTRO EDITABLES */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                  Puntos de Encuentro:
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPunto}
                    onChange={(e) => setNewPunto(e.target.value)}
                    placeholder="Ej: Estación Metro o Plaza Venezuela..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPunto}
                    className="bg-[#009fe3] hover:bg-[#0082ba] text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                  >
                    Añadir Punto
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {editingZone.puntos_encuentro.map((pto, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#009fe3]" />
                      <span>{pto}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePunto(idx)}
                        className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* AGENCIAS DISPONIBLES (SELECCIÓN RÁPIDA O PERSONALIZADA) */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                  Agencias de Encomienda para Envíos Nacionales:
                </label>
                <p className="text-xs text-slate-500">
                  Selecciona qué agencias trabajas (ej: solo MRW, o Zoom y MRW):
                </p>

                <div className="flex flex-wrap gap-2">
                  {['MRW', 'Zoom', 'Tealca', 'Domesa'].map((ag) => {
                    const isSelected = editingZone.agencias_disponibles?.includes(ag);
                    return (
                      <button
                        key={ag}
                        type="button"
                        onClick={() => handleToggleAgency(ag)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {isSelected ? `✓ ${ag}` : `+ ${ag}`}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newAgencia}
                    onChange={(e) => setNewAgencia(e.target.value)}
                    placeholder="Otra agencia (ej: Liberty Express)..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAgency}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingZone(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
