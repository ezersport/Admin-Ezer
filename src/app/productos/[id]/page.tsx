'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Package,
  TrendingUp,
  AlertCircle,
  Palette,
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  Tags,
  Clock,
} from 'lucide-react';
import { AdminHeader } from '../../../components/AdminHeader';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredCategories,
  saveStoredCategories,
} from '../../../lib/store';
import { supabase } from '../../../lib/supabase';
import type { Product, ProductVariant, Category, VariantStyleType } from '../../../types';
import { formatUSD } from '../../../lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProductoPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  // Datos del producto
  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [categoria, setCategoria] = useState('');
  const [telaMaterial, setTelaMaterial] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<'inmediato' | 'bajo_pedido'>('inmediato');
  const [diasConfeccion, setDiasConfeccion] = useState('5');

  // Imágenes
  const [imagenPrincipal, setImagenPrincipal] = useState<string>('');
  const [imagenesSecundarias, setImagenesSecundarias] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  // Precios y costos
  const [costoTaller, setCostoTaller] = useState('');
  const [precioDetal, setPrecioDetal] = useState('');
  const [precio3Piezas, setPrecio3Piezas] = useState('');
  const [precioMayor, setPrecioMayor] = useState('');

  // Variantes
  const [variantes, setVariantes] = useState<ProductVariant[]>([]);
  const [newTalla, setNewTalla] = useState('Talla 4');
  const [newTipo, setNewTipo] = useState<VariantStyleType>('sublimacion');
  const [newNombreVar, setNewNombreVar] = useState('');
  const [newColorHex, setNewColorHex] = useState('#009fe3');
  const [newStock, setNewStock] = useState('10');

  useEffect(() => {
    // 1. Cargar categorías
    const loadedCategories = getStoredCategories();
    setCategories(loadedCategories);

    if (supabase) {
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

      // 2. Cargar producto desde Supabase
      supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            populateForm(data);
          } else {
            fallbackLocalProduct();
          }
          setLoading(false);
        });
    } else {
      fallbackLocalProduct();
      setLoading(false);
    }
  }, [id]);

  const fallbackLocalProduct = () => {
    const prods = getStoredProducts();
    const found = prods.find((p) => p.id === id);
    if (found) {
      populateForm(found);
    } else {
      setErrorMessage('No se encontró la prenda en el sistema.');
    }
  };

  const populateForm = (data: any) => {
    setNombre(data.nombre || '');
    setSku(data.codigo_sku || '');
    setCategoria(data.categoria || '');
    setTelaMaterial(data.tela_material || '');
    setDescripcion(data.descripcion || '');
    setDisponibilidad((data.disponibilidad as any) || 'inmediato');
    setDiasConfeccion(String(data.dias_confeccion || '5'));
    setImagenPrincipal(data.imagen_principal || '');
    setImagenesSecundarias(Array.isArray(data.imagenes_galeria) ? data.imagenes_galeria : []);

    setCostoTaller(data.costo_produccion_usd ? String(data.costo_produccion_usd) : '');
    setPrecioDetal(data.precio_detal_usd ? String(data.precio_detal_usd) : '');
    setPrecio3Piezas(data.precio_3_piezas_usd ? String(data.precio_3_piezas_usd) : '');
    setPrecioMayor(data.precio_mayor_usd ? String(data.precio_mayor_usd) : '');

    const vars = Array.isArray(data.product_variants)
      ? data.product_variants
      : Array.isArray(data.variantes)
      ? data.variantes
      : [];

    setVariantes(
      vars.map((v: any, idx: number) => ({
        id: v.id || `var-${idx}-${Date.now()}`,
        producto_id: id,
        talla: v.talla || 'Única',
        tipo_variante: v.tipo_variante || 'unicolor',
        nombre_variante: v.nombre_variante || 'Estándar',
        color_base: v.color_base || '',
        codigo_hex: v.codigo_hex || '#009fe3',
        stock_disponible: Number(v.stock_disponible || 0),
        stock_minimo_alerta: Number(v.stock_minimo_alerta || 3),
      }))
    );
  };

  // Cálculos financieros
  const costoNum = parseFloat(costoTaller) || 0;
  const detalNum = parseFloat(precioDetal) || 0;
  const tier3Num = parseFloat(precio3Piezas) || 0;
  const mayorNum = parseFloat(precioMayor) || 0;

  const gananciaDetal = detalNum - costoNum;
  const margenDetal = detalNum > 0 ? Math.round((gananciaDetal / detalNum) * 100) : 0;

  const gananciaTier3 = tier3Num - costoNum;
  const margenTier3 = tier3Num > 0 ? Math.round((gananciaTier3 / tier3Num) * 100) : 0;

  const gananciaMayor = mayorNum - costoNum;
  const margenMayor = mayorNum > 0 ? Math.round((gananciaMayor / mayorNum) * 100) : 0;

  // Manejo de carga de imagen local / Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagenPrincipal(reader.result as string);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Variantes
  const handleAddVariant = () => {
    if (!newNombreVar.trim()) {
      alert('Por favor ingresa un nombre para la variante o estampa (ej. Spiderman Azul)');
      return;
    }

    const newVar: ProductVariant = {
      id: `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      producto_id: id,
      talla: newTalla,
      tipo_variante: newTipo,
      nombre_variante: newNombreVar.trim(),
      color_base: newNombreVar.trim(),
      codigo_hex: newColorHex,
      stock_disponible: parseInt(newStock, 10) || 0,
      stock_minimo_alerta: 3,
    };

    setVariantes([...variantes, newVar]);
    setNewNombreVar('');
  };

  const handleRemoveVariant = (varId: string) => {
    setVariantes(variantes.filter((v) => v.id !== varId));
  };

  // Guardar Cambios
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nombre.trim()) {
      setErrorMessage('Por favor escribe el nombre de la prenda.');
      return;
    }
    if (!costoNum || !detalNum) {
      setErrorMessage('Por favor completa el Costo de Taller y el Precio Detal.');
      return;
    }

    setSaving(true);

    const updatedProduct: Product = {
      id,
      codigo_sku: sku,
      nombre: nombre.trim(),
      slug: nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      categoria,
      tela_material: telaMaterial.trim(),
      descripcion: descripcion.trim(),
      precio_detal_usd: detalNum,
      precio_3_piezas_usd: tier3Num || detalNum,
      precio_mayor_usd: mayorNum || detalNum,
      costo_produccion_usd: costoNum,
      disponibilidad,
      dias_confeccion: disponibilidad === 'bajo_pedido' ? (parseInt(diasConfeccion, 10) || 5) : 0,
      imagen_principal: imagenPrincipal,
      imagenes_galeria: imagenesSecundarias,
      activo: true,
      destacado: true,
      variantes,
    };

    // 1. Guardar en local storage
    const currentProducts = getStoredProducts();
    const updatedList = currentProducts.map((p) => (p.id === id ? updatedProduct : p));
    saveStoredProducts(updatedList);

    // 2. Guardar en Supabase
    if (supabase) {
      try {
        const { error: prodErr } = await supabase
          .from('products')
          .update({
            codigo_sku: updatedProduct.codigo_sku,
            nombre: updatedProduct.nombre,
            slug: updatedProduct.slug,
            categoria: updatedProduct.categoria,
            tela_material: updatedProduct.tela_material,
            descripcion: updatedProduct.descripcion,
            precio_detal_usd: updatedProduct.precio_detal_usd,
            precio_3_piezas_usd: updatedProduct.precio_3_piezas_usd,
            precio_mayor_usd: updatedProduct.precio_mayor_usd,
            costo_produccion_usd: updatedProduct.costo_produccion_usd,
            disponibilidad: updatedProduct.disponibilidad,
            dias_confeccion: updatedProduct.dias_confeccion,
            imagen_principal: updatedProduct.imagen_principal,
            activo: updatedProduct.activo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (prodErr) {
          console.warn('Error al actualizar en Supabase:', prodErr.message);
        }

        // Actualizar variantes (borrar anteriores e insertar actuales)
        await supabase.from('product_variants').delete().eq('producto_id', id);

        if (variantes.length > 0) {
          const varsToInsert = variantes.map((v) => ({
            id: v.id,
            producto_id: id,
            talla: v.talla,
            tipo_variante: v.tipo_variante,
            nombre_variante: v.nombre_variante,
            color_base: v.color_base || null,
            codigo_hex: v.codigo_hex || '#009fe3',
            stock_disponible: v.stock_disponible,
            stock_minimo_alerta: v.stock_minimo_alerta || 3,
          }));

          const { error: varErr } = await supabase.from('product_variants').insert(varsToInsert);
          if (varErr && varErr.message.includes('check constraint')) {
            const fallbackVars = varsToInsert.map((v) => ({
              ...v,
              tipo_variante: v.tipo_variante === 'unicolor' ? 'unicolor' : 'estampado',
            }));
            await supabase.from('product_variants').insert(fallbackVars);
          }
        }
      } catch (err: any) {
        console.error('Excepción al sincronizar con Supabase:', err.message);
      }
    }

    setSaving(false);
    router.push('/productos');
  };

  // Eliminar Prenda
  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}" del catálogo? Esta acción no se puede deshacer.`)) return;

    if (supabase) {
      await supabase.from('products').delete().eq('id', id);
    }
    const currentProducts = getStoredProducts();
    saveStoredProducts(currentProducts.filter((p) => p.id !== id));
    router.push('/productos');
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#009fe3] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500">Cargando prenda desde el catálogo...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Editar Prenda: ${nombre || 'Cargando...'}`}
        subtitle="Actualiza precios por volumen, costos de taller, variantes o disponibilidad"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#009fe3] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Catálogo</span>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar Prenda</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveChanges} className="space-y-8">
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <Package className="w-5 h-5 text-[#009fe3]" />
              <span>Información General de la Prenda</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nombre de la Prenda: *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Categoría de Confección: *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none font-semibold cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Tela / Material de Confección:
                </label>
                <input
                  type="text"
                  value={telaMaterial}
                  onChange={(e) => setTelaMaterial(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Código SKU: *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base font-mono text-slate-900 dark:text-white focus:outline-none uppercase font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Descripción / Especificaciones:
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl p-4 text-base text-slate-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Disponibilidad: En Stock vs Bajo Pedido */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Modalidad de Entrega & Disponibilidad: *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDisponibilidad('inmediato')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    disponibilidad === 'inmediato'
                      ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/30'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-slate-400'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full mt-0.5 border-2 flex items-center justify-center ${
                    disponibilidad === 'inmediato' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-400'
                  }`}>
                    {disponibilidad === 'inmediato' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-slate-900 dark:text-white">
                      🟢 En Stock (Entrega Inmediata)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Piezas confeccionadas listas para despacho en 24-48h.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDisponibilidad('bajo_pedido')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    disponibilidad === 'bajo_pedido'
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 ring-2 ring-amber-500/30'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-slate-400'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full mt-0.5 border-2 flex items-center justify-center ${
                    disponibilidad === 'bajo_pedido' ? 'border-amber-500 bg-amber-500' : 'border-slate-400'
                  }`}>
                    {disponibilidad === 'bajo_pedido' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-slate-900 dark:text-white">
                      🟡 Bajo Pedido («Mándalo a Hacer»)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Se confecciona bajo encargo o personalizado en taller.
                    </span>
                  </div>
                </button>
              </div>

              {disponibilidad === 'bajo_pedido' && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        Tiempo estimado de confección:
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Indica los días hábiles que tarda el taller en confeccionar.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={diasConfeccion}
                      onChange={(e) => setDiasConfeccion(e.target.value)}
                      className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-center font-bold text-base text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">días hábiles</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: FOTOS DE LA PRENDA */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-[#009fe3]" />
              <span>Foto de la Prenda</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-4 rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 relative">
                {imagenPrincipal ? (
                  <img src={imagenPrincipal} alt="Prenda" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span>Sin foto</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-8 space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                  URL de la Foto o Cargar Archivo:
                </label>
                <input
                  type="text"
                  value={imagenPrincipal}
                  onChange={(e) => setImagenPrincipal(e.target.value)}
                  placeholder="/images/pijamas-familiares.webp o URL https://..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                />

                <input
                  ref={mainFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => mainFileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#009fe3]" />
                  <span>{uploadingImage ? 'Cargando imagen...' : 'Subir desde dispositivo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: PRECIOS Y COSTOS */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-[#009fe3]" />
              <span>Precios por Escala &amp; Costo de Taller</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Costo Taller ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={costoTaller}
                  onChange={(e) => setCostoTaller(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Precio Detal ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={precioDetal}
                  onChange={(e) => setPrecioDetal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#009fe3] uppercase block mb-1">Precio x3 ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={precio3Piezas}
                  onChange={(e) => setPrecio3Piezas(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-bold text-[#009fe3] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-600 uppercase block mb-1">Mayor 6+ ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={precioMayor}
                  onChange={(e) => setPrecioMayor(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-bold text-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Tarjetas de Rentabilidad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Margen Detal</span>
                <span className="text-sm font-black text-emerald-600">
                  +{formatUSD(gananciaDetal)} ({margenDetal}%)
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Margen x3</span>
                <span className="text-sm font-black text-[#009fe3]">
                  +{formatUSD(gananciaTier3)} ({margenTier3}%)
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Margen Mayor 6+</span>
                <span className="text-sm font-black text-emerald-600">
                  +{formatUSD(gananciaMayor)} ({margenMayor}%)
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: GESTIÓN DE VARIANTES Y STOCK */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-[#009fe3]" />
                <span>Variantes de Talla, Estampados y Stock ({variantes.length})</span>
              </h3>
            </div>

            {/* Formulario para agregar variante rápida */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Talla</label>
                <select
                  value={newTalla}
                  onChange={(e) => setNewTalla(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-white"
                >
                  <option value="2">Talla 2</option>
                  <option value="4">Talla 4</option>
                  <option value="6">Talla 6</option>
                  <option value="8">Talla 8</option>
                  <option value="10">Talla 10</option>
                  <option value="12">Talla 12</option>
                  <option value="14">Talla 14</option>
                  <option value="S">Talla S</option>
                  <option value="M">Talla M</option>
                  <option value="L">Talla L</option>
                  <option value="XL">Talla XL</option>
                  <option value="Única">Talla Única</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1">Nombre / Estampa</label>
                <input
                  type="text"
                  value={newNombreVar}
                  onChange={(e) => setNewNombreVar(e.target.value)}
                  placeholder="Ej: Mickey Azul Rey o Spiderman"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Técnica</label>
                <select
                  value={newTipo}
                  onChange={(e) => setNewTipo(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-white"
                >
                  <option value="sublimacion">Sublimación</option>
                  <option value="dtf">Estampado DTF</option>
                  <option value="vinil">Vinil Textil</option>
                  <option value="unicolor">Unicolor Liso</option>
                  <option value="estampado">Estampado General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Stock</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white text-center"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="w-full inline-flex items-center justify-center gap-1 bg-[#009fe3] hover:bg-[#0082ba] text-white py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>

            {/* Listado de variantes existentes */}
            <div className="space-y-2">
              {variantes.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: v.codigo_hex }}
                    />
                    <span className="font-bold text-slate-900 dark:text-white">{v.nombre_variante}</span>
                    <span className="text-xs bg-blue-500/15 text-[#009fe3] px-2 py-0.5 rounded-full font-bold">
                      {v.talla}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">({v.tipo_variante})</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      Stock: <strong>{v.stock_disponible} pzs</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Eliminar variante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTÓN PRINCIPAL DE GUARDAR */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href="/productos"
              className="px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#009fe3] hover:bg-[#0082ba] text-white px-8 py-3.5 rounded-2xl font-bold text-base shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Guardando en Supabase...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
