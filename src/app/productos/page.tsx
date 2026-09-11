'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Tags,
  Edit3,
  Trash2,
  Clock,
} from 'lucide-react';
import { AdminHeader } from '../../components/AdminHeader';
import { getStoredProducts, getStoredCategories, getStoredConfig, saveStoredProducts, saveStoredCategories } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import type { Product, Category } from '../../types';
import { formatUSD } from '../../lib/utils';

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [currentRate, setCurrentRate] = useState<number>(76.50);

  const handleDeleteProduct = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}" del catálogo? Esta acción no se puede deshacer.`)) return;
    if (supabase) {
      await supabase.from('products').delete().eq('id', id);
    }
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveStoredProducts(updated);
  };

  useEffect(() => {
    setProducts(getStoredProducts());
    setCategories(getStoredCategories());
    const cfg = getStoredConfig();
    if (cfg) setCurrentRate(cfg.tasa_bcv);

    // Cargar productos directamente desde la base de datos Supabase
    if (supabase) {
      supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            const mapped: Product[] = data.map((d: any) => ({
              id: d.id,
              codigo_sku: d.codigo_sku,
              nombre: d.nombre,
              slug: d.slug,
              categoria: d.categoria,
              tela_material: d.tela_material || '',
              descripcion: d.descripcion || '',
              precio_detal_usd: Number(d.precio_detal_usd || 0),
              precio_3_piezas_usd: Number(d.precio_3_piezas_usd || 0),
              precio_mayor_usd: Number(d.precio_mayor_usd || 0),
              costo_produccion_usd: Number(d.costo_produccion_usd || 0),
              disponibilidad: d.disponibilidad || 'inmediato',
              dias_confeccion: Number(d.dias_confeccion || 0),
              imagen_principal: d.imagen_principal || '',
              imagenes_galeria: Array.isArray(d.imagenes_galeria) ? d.imagenes_galeria : [],
              activo: Boolean(d.activo),
              destacado: Boolean(d.destacado),
              variantes: (Array.isArray(d.product_variants) ? d.product_variants : []).map((v: any) => ({
                id: v.id,
                talla: v.talla,
                tipo_variante: v.tipo_variante,
                nombre_variante: v.nombre_variante,
                color_base: v.color_base,
                codigo_hex: v.codigo_hex,
                stock_disponible: Number(v.stock_disponible || 0),
                stock_minimo_alerta: Number(v.stock_minimo_alerta || 3),
              })),
              created_at: d.created_at,
              updated_at: d.updated_at,
            }));
            setProducts(mapped);
            saveStoredProducts(mapped);
          }
        });

      supabase
        .from('categories')
        .select('*')
        .order('orden', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCategories(data);
            saveStoredCategories(data);
          }
        });
    }
  }, []);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'todas' && p.categoria !== selectedCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.codigo_sku && p.codigo_sku.toLowerCase().includes(q)) ||
      (Array.isArray(p.variantes) &&
        p.variantes.some((v) => v.nombre_variante && v.nombre_variante.toLowerCase().includes(q)))
    );
  });

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Catálogo de Confección & Inventario"
        subtitle="Control de costos de taller, precios por volumen y stock de estampados"
        currentRate={currentRate}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Barra superior de acciones */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar prenda, estampa (ej. Spiderman) o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0e213b] border border-slate-300 dark:border-slate-700/80 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3]"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtro de categorías dinámicas */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white dark:bg-[#0e213b] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* Administrador de categorías */}
            <Link
              href="/categorias"
              className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-4 py-2.5 rounded-2xl font-bold text-sm border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Tags className="w-4 h-4 text-[#009fe3]" />
              <span>Categorías</span>
            </Link>

            {/* Nueva Prenda */}
            <Link
              href="/productos/nuevo"
              className="inline-flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Prenda</span>
            </Link>
          </div>
        </div>

        {/* Grid de Productos e Inventario */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-[#0e213b] rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-[#009fe3]/10 text-[#009fe3] flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              No hay prendas en el inventario
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Comienza registrando tu primera prenda de confección con sus costos de corte, escalas de precios (detal y por volumen) y fotos.
            </p>
            <div className="pt-2">
              <Link
                href="/productos/nuevo"
                className="inline-flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Primera Prenda</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => {
            const totalStock = prod.variantes.reduce((acc, v) => acc + v.stock_disponible, 0);
            const hasLowStock = prod.variantes.some((v) => v.stock_disponible <= v.stock_minimo_alerta);

            const gananciaDetal = prod.precio_detal_usd - prod.costo_produccion_usd;
            const margenDetal = prod.precio_detal_usd > 0
              ? Math.round((gananciaDetal / prod.precio_detal_usd) * 100)
              : 0;

            return (
              <div
                key={prod.id}
                className="bg-white dark:bg-[#0e213b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Foto y Badges */}
                  <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-950 overflow-hidden">
                    <img
                      src={prod.imagen_principal}
                      alt={prod.nombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-white/90 dark:bg-[#091b33]/90 backdrop-blur-sm text-slate-800 dark:text-white px-3 py-1 rounded-full text-xs font-bold uppercase border border-slate-200 dark:border-slate-700 shadow-sm">
                        {prod.categoria}
                      </span>
                      {hasLowStock && (
                        <span className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Poco Stock</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
                      {prod.codigo_sku}
                    </div>
                  </div>

                  {/* Datos y Precios */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {prod.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {prod.tela_material}
                      </p>
                    </div>

                    {/* Escala de Precios y Costos */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#091b33] border border-slate-200 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-bold">Detal</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">{formatUSD(prod.precio_detal_usd)}</span>
                      </div>
                      <div className="border-x border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-[#009fe3] block uppercase font-bold">≥ 3 Pzs</span>
                        <span className="text-base font-black text-[#009fe3]">{formatUSD(prod.precio_3_piezas_usd)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 block uppercase font-bold">Mayor 6+</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatUSD(prod.precio_mayor_usd)}</span>
                      </div>
                    </div>

                    {/* Rentabilidad */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        Costo Taller: <strong className="text-slate-900 dark:text-slate-200 font-bold">{formatUSD(prod.costo_produccion_usd)}</strong>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        +{formatUSD(gananciaDetal)} ({margenDetal}%)
                      </span>
                    </div>

                    {/* Variantes: Unicolor y Estampados */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Variantes ({prod.variantes.length})
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Stock Total: <strong className="text-slate-900 dark:text-white">{totalStock} pzs</strong>
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {prod.variantes.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#091b33] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300 dark:border-white/20 shrink-0"
                                style={{ backgroundColor: v.codigo_hex }}
                              ></span>
                              <span className="text-slate-800 dark:text-white font-medium text-xs">
                                {v.nombre_variante}
                              </span>
                              <span className="text-[11px] text-[#009fe3] bg-blue-500/10 px-2 py-0.5 rounded font-bold">
                                {v.talla}
                              </span>
                            </div>

                            <span
                              className={`font-mono text-xs font-bold ${
                                v.stock_disponible <= v.stock_minimo_alerta
                                  ? 'text-amber-600 dark:text-amber-400 font-black'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {v.stock_disponible} pzs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de Acciones: Editar, Eliminar y Estado de Disponibilidad */}
                <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/40">
                  <div className="flex items-center gap-1.5 text-xs">
                    {prod.disponibilidad === 'bajo_pedido' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Bajo Pedido ({prod.dias_confeccion || 5}d)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Stock Inmediato</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/productos/${prod.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#009fe3] hover:bg-[#0082ba] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Eliminar prenda del catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </main>
  );
}
