'use client';

import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Package,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import {
  getStoredCategories,
  saveStoredCategories,
  getStoredProducts,
} from '../../lib/store';
import { supabase } from '../../lib/supabase';
import type { Category, Product } from '../../types';
import { AdminHeader } from '../../components/AdminHeader';

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal de edición o creación
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setCategories(getStoredCategories());
    setProducts(getStoredProducts());

    // Cargar categorías y prendas directamente desde Supabase
    const loadSupabaseData = async () => {
      if (!supabase) return;
      setIsLoading(true);
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('orden', { ascending: true });

        if (!catError && catData && catData.length > 0) {
          setCategories(catData);
          saveStoredCategories(catData);
        }

        const { data: prodData } = await supabase.from('products').select('*');
        if (prodData && prodData.length > 0) {
          setProducts(prodData as any);
        }
      } catch (err) {
        console.warn('Error al conectar con Supabase en categorías:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSupabaseData();
  }, []);

  const triggerSuccessBanner = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleToggleActive = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    const newStatus = !target.activa;
    const updated = categories.map((c) =>
      c.id === id ? { ...c, activa: newStatus } : c
    );
    setCategories(updated);
    saveStoredCategories(updated);
    triggerSuccessBanner();

    if (supabase) {
      try {
        await supabase
          .from('categories')
          .update({ activa: newStatus })
          .eq('id', id);
      } catch (err) {
        console.error('Error al actualizar estado en Supabase:', err);
      }
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const cleanSlug =
      editingCategory.slug ||
      editingCategory.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const finalCategory: Category = {
      ...editingCategory,
      slug: cleanSlug,
      orden: editingCategory.orden || (categories.length + 1),
    };

    let updated: Category[];
    if (isNew) {
      updated = [...categories, finalCategory];
    } else {
      updated = categories.map((c) =>
        c.id === finalCategory.id ? finalCategory : c
      );
    }

    setCategories(updated);
    saveStoredCategories(updated);
    setEditingCategory(null);
    setIsNew(false);
    triggerSuccessBanner();

    // Persistir directamente en Supabase
    if (supabase) {
      try {
        await supabase.from('categories').upsert({
          id: finalCategory.id,
          nombre: finalCategory.nombre,
          slug: finalCategory.slug,
          descripcion: finalCategory.descripcion || '',
          activa: finalCategory.activa,
          icono: finalCategory.icono || 'Tags',
          orden: finalCategory.orden,
        }, { onConflict: 'id' });
      } catch (err) {
        console.error('Error al guardar categoría en Supabase:', err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const productCount = products.filter(
      (p) => p.categoria === id || p.categoria === categories.find((c) => c.id === id)?.slug
    ).length;
    if (productCount > 0) {
      alert(`No se puede eliminar esta categoría porque tiene ${productCount} prenda(s) asignadas. Reasigna las prendas primero.`);
      return;
    }
    if (!confirm('¿Seguro que deseas eliminar esta categoría de la base de datos?')) return;

    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    saveStoredCategories(updated);
    triggerSuccessBanner();

    if (supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.error('Error al eliminar categoría en Supabase:', err);
      }
    }
  };

  const openNewModal = () => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      nombre: '',
      slug: '',
      descripcion: '',
      activa: true,
      orden: categories.length + 1,
    };
    setEditingCategory(newCat);
    setIsNew(true);
  };

  const countProducts = (cat: Category) => {
    return products.filter((p) => p.categoria === cat.slug || p.categoria === cat.id).length;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Categorías de Ropa"
        subtitle="Organiza los tipos de prendas confeccionadas en taller"
      />

      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Encabezado y Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Tags className="w-8 h-8 text-[#009fe3]" />
              <span>Gestión de Categorías de Taller</span>
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
              Las categorías que crees aquí aparecerán automáticamente en el formulario de registro de prendas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <div className="flex items-center gap-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-sm font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5" />
                <span>Categorías actualizadas</span>
              </div>
            )}

            <button
              onClick={openNewModal}
              className="flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => {
            const count = countProducts(cat);

            return (
              <div
                key={cat.id}
                className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                  cat.activa
                    ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xl'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/40 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          cat.activa ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl">
                        {cat.nombre}
                      </h3>
                    </div>
                    <span className="inline-block font-mono text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      slug: {cat.slug}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(cat.id)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        cat.activa
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title={cat.activa ? 'Desactivar categoría' : 'Activar categoría'}
                    >
                      {cat.activa ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsNew(false);
                      }}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      title="Editar categoría"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 cursor-pointer"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {cat.descripcion && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {cat.descripcion}
                  </p>
                )}

                {/* Métricas de prendas asociadas */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Package className="w-4 h-4 text-[#009fe3]" />
                    <span>
                      <strong className="text-slate-900 dark:text-white font-bold">{count}</strong> prendas registradas
                    </span>
                  </span>

                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      cat.activa ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {cat.activa ? 'Visible en Catálogo' : 'Oculta'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL CREAR / EDITAR CATEGORÍA */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                {isNew ? 'Crear Nueva Categoría' : 'Editar Categoría'}
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.nombre}
                  onChange={(e) => {
                    const nombre = e.target.value;
                    const autoSlug = nombre
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setEditingCategory({
                      ...editingCategory,
                      nombre,
                      slug: isNew ? autoSlug : editingCategory.slug,
                    });
                  }}
                  placeholder="Ej: Monos Escolares o Pijamas Térmicas"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Identificador URL (Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.slug}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  placeholder="ej: monos-escolares"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={editingCategory.descripcion || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      descripcion: e.target.value,
                    })
                  }
                  placeholder="Describe qué tipo de prendas incluye esta categoría..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Categoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
