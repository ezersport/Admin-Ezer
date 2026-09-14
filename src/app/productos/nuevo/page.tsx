'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { ColorTonePicker } from '../../../components/ColorTonePicker';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredCategories,
  saveStoredCategories,
} from '../../../lib/store';
import { supabase } from '../../../lib/supabase';
import type { Product, ProductVariant, Category, VariantStyleType } from '../../../types';
import { formatUSD } from '../../../lib/utils';

export default function NuevoProductoPage() {
  const router = useRouter();

  // Categorías dinámicas
  const [categories, setCategories] = useState<Category[]>([]);

  // Función inteligente de generación automática de SKU según categoría
  const generateSKU = (catSlug?: string) => {
    let prefix = 'EZ';
    if (catSlug) {
      const s = catSlug.toLowerCase();
      if (s.includes('nino') || s.includes('kid')) prefix = 'EZ-KID';
      else if (s.includes('chaqueta') || s.includes('cortaviento')) prefix = 'EZ-CHQ';
      else if (s.includes('pijama')) prefix = 'EZ-PIJ';
      else if (s.includes('mono') || s.includes('jogger')) prefix = 'EZ-JOG';
      else if (s.includes('combo') || s.includes('volumen')) prefix = 'EZ-CMB';
      else if (s.includes('bebe')) prefix = 'EZ-BEB';
      else {
        const clean = s.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase();
        prefix = clean ? `EZ-${clean}` : 'EZ-TEX';
      }
    }
    const correlativo = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${correlativo}`;
  };

  // Datos básicos del producto
  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState(generateSKU('ninos'));
  const [categoria, setCategoria] = useState('');
  const [telaMaterial, setTelaMaterial] = useState('Algodón Fleece Perchado 100% Calidez');
  const [descripcion, setDescripcion] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<'inmediato' | 'bajo_pedido'>('inmediato');
  const [diasConfeccion, setDiasConfeccion] = useState<string>('2');

  // Manejo de Imágenes (Principal y Secundarias)
  const [imagenPrincipal, setImagenPrincipal] = useState<string>('');
  const [imagenesSecundarias, setImagenesSecundarias] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  // Precios y Costos de Taller (en blanco para iniciar desde 0)
  const [costoTaller, setCostoTaller] = useState('');
  const [precioDetal, setPrecioDetal] = useState('');
  const [precio3Piezas, setPrecio3Piezas] = useState('');
  const [precioMayor, setPrecioMayor] = useState('');

  // Variantes
  const [variantes, setVariantes] = useState<ProductVariant[]>([]);

  // Nueva variante rápida
  const [newTalla, setNewTalla] = useState('S');
  const [newTipo, setNewTipo] = useState<VariantStyleType>('sublimacion');
  const [newNombreVar, setNewNombreVar] = useState('');
  const [newColorName, setNewColorName] = useState('Rosado Pastel');
  const [newColorHex, setNewColorHex] = useState('#F7C6D0');
  const [newVariantMode, setNewVariantMode] = useState<'stock' | 'bajo_pedido'>('stock');
  const [newStock, setNewStock] = useState('10');

  useEffect(() => {
    const loadedCategories = getStoredCategories();
    setCategories(loadedCategories);
    if (loadedCategories.length > 0) {
      const firstCat = loadedCategories[0].slug;
      setCategoria(firstCat);
      setSku(generateSKU(firstCat));
    }

    // Cargar categorías frescas desde Supabase
    if (supabase) {
      supabase
        .from('categories')
        .select('*')
        .order('orden', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCategories(data);
            saveStoredCategories(data);
            setCategoria((prev) => prev || data[0].slug);
            setSku((prev) => prev || generateSKU(data[0].slug));
          }
        });
    }
  }, []);

  const handleCategoryChange = (newCat: string) => {
    setCategoria(newCat);
    setSku(generateSKU(newCat));
  };

  // Cálculos financieros en vivo
  const costoNum = parseFloat(costoTaller) || 0;
  const detalNum = parseFloat(precioDetal) || 0;
  const tier3Num = parseFloat(precio3Piezas) || 0;
  const mayorNum = parseFloat(precioMayor) || 0;

  const gananciaDetal = detalNum - costoNum;
  const margenDetal = detalNum > 0 ? Math.round((gananciaDetal / detalNum) * 100) : 0;

  const gananciaTier3 = tier3Num - costoNum;
  const margenTier3 = tier3Num > 0 ? Math.round((gananciaTier3 / tier3Num) * 100) : 0;

  // Subida de imagen principal
  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Previsualización inmediata mediante Data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagenPrincipal(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Si Supabase está disponible con buckets de almacenamiento
    if (supabase) {
      try {
        setUploadingImage(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `prod_${Date.now()}_main.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('products')
          .upload(fileName, file);

        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);
          if (publicData?.publicUrl) {
            setImagenPrincipal(publicData.publicUrl);
          }
        }
      } catch (err) {
        console.warn('Storage upload fallback to base64', err);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  // Subida de imágenes secundarias / galería
  const handleSecondaryImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImagenesSecundarias((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSecondaryImage = (index: number) => {
    setImagenesSecundarias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    const estampaName = newNombreVar.trim() || newColorName || 'Estándar';
    const isBajoPedido = newVariantMode === 'bajo_pedido';

    const newV: ProductVariant = {
      id: `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      talla: newTalla,
      tipo_variante: newTipo,
      nombre_variante: estampaName,
      color_base: newColorName,
      codigo_hex: newColorHex,
      stock_disponible: isBajoPedido ? 0 : (parseInt(newStock, 10) || 0),
      stock_minimo_alerta: 3,
    };
    setVariantes([...variantes, newV]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariantes(variantes.filter((v) => v.id !== id));
  };

  const handleStockChange = (varId: string, stockVal: number) => {
    setVariantes(
      variantes.map((v) => (v.id === varId ? { ...v, stock_disponible: Math.max(0, stockVal) } : v))
    );
  };

  const handleToggleBajoPedido = (varId: string) => {
    setVariantes(
      variantes.map((v) => (v.id === varId ? { ...v, stock_disponible: 0 } : v))
    );
  };

  const handleToggleStock = (varId: string) => {
    setVariantes(
      variantes.map((v) => (v.id === varId ? { ...v, stock_disponible: 10 } : v))
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImage) {
      alert('La foto se está subiendo al almacenamiento. Espera unos segundos...');
      return;
    }
    if (!nombre.trim()) {
      alert('Por favor introduce el nombre del producto');
      return;
    }

    setSubmitting(true);
    try {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        codigo_sku: sku.toUpperCase(),
        nombre: nombre.trim(),
        slug: nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoria,
        tela_material: telaMaterial,
        descripcion,
        precio_detal_usd: detalNum,
        precio_3_piezas_usd: tier3Num,
        precio_mayor_usd: mayorNum,
        costo_produccion_usd: costoNum,
        disponibilidad: disponibilidad,
        dias_confeccion: parseInt(diasConfeccion, 10) || 2,
        imagen_principal: imagenPrincipal || 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80',
        imagenes_galeria: imagenesSecundarias,
        activo: true,
        destacado: true,
        variantes,
        created_at: new Date().toISOString(),
      };

      const currentProducts = getStoredProducts();
      saveStoredProducts([newProduct, ...currentProducts]);

      // Persistir también en Supabase si está conectado
      if (supabase) {
        try {
          const { error: insertError } = await supabase.from('products').insert({
            id: newProduct.id,
            codigo_sku: newProduct.codigo_sku,
            nombre: newProduct.nombre,
            slug: newProduct.slug,
            categoria: newProduct.categoria,
            tela_material: newProduct.tela_material,
            descripcion: newProduct.descripcion,
            precio_detal_usd: newProduct.precio_detal_usd,
            precio_3_piezas_usd: newProduct.precio_3_piezas_usd,
            precio_mayor_usd: newProduct.precio_mayor_usd,
            costo_produccion_usd: newProduct.costo_produccion_usd,
            disponibilidad: newProduct.disponibilidad,
            dias_confeccion: newProduct.dias_confeccion,
            imagen_principal: newProduct.imagen_principal,
            activo: newProduct.activo,
            destacado: newProduct.destacado,
          });

          if (insertError) {
            console.error('Supabase product insert error:', insertError);
          }

          // Insertar variantes si se configuraron (con manejo tolerante de constraint)
          if (variantes.length > 0) {
            const varsToInsert = variantes.map((v) => ({
              id: v.id,
              producto_id: newProduct.id,
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
        } catch (err) {
          console.warn('Supabase network or server error:', err);
        }
      }

      router.push('/productos');
    } catch (err: any) {
      console.error('Error guardando producto:', err);
      alert(`Error al guardar producto: ${err?.message || 'Error desconocido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Crear Nueva Prenda"
        subtitle="Registra ropa deportiva, trajes de baño o pijamas con costos exactos de taller"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#009fe3] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Inventario</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <Package className="w-5 h-5 text-[#009fe3]" />
              <span>Identificación de la Prenda</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3] cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Código SKU de Taller
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre Oficial de la Prenda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Suéter Oversize Niños Mickey Mouse"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tela o Composición Textil
                </label>
                <input
                  type="text"
                  value={telaMaterial}
                  onChange={(e) => setTelaMaterial(e.target.value)}
                  placeholder="Ej: Algodón Fleece Perchado 100%"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Disponibilidad Predominante
                </label>
                <select
                  value={disponibilidad}
                  onChange={(e) => setDisponibilidad(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3] cursor-pointer"
                >
                  <option value="inmediato">🟢 En Stock Físico (Despacho 24-48h)</option>
                  <option value="bajo_pedido">🟡 Bajo Pedido (Confección a Medida)</option>
                </select>
              </div>

              {/* Tiempo de Confección SIEMPRE configurable */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      Tiempo estimado de confección en taller:
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Indica los días hábiles que tarda el taller para pedidos bajo encargo (ej. 2 días hábiles).
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descripción o Detalles de Taller
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Instrucciones de lavado, horma de la prenda..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CARGA DE IMÁGENES */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-[#009fe3]" />
              <span>Fotos de la Prenda</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* IMAGEN PRINCIPAL */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                  Imagen Principal:
                </label>
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center gap-3">
                  <input
                    ref={mainFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className="block w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#009fe3] file:text-white hover:file:bg-[#0082ba] cursor-pointer"
                  />

                  {imagenPrincipal ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mt-2">
                      <img
                        src={imagenPrincipal}
                        alt="Vista Previa Principal"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImagenPrincipal('')}
                        className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg shadow-md hover:bg-rose-700"
                        title="Quitar foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-500">
                        Selecciona la foto frontal de la prenda (JPG, PNG o WEBP)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* IMÁGENES SECUNDARIAS */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                  Añadir Imágenes Secundarias:
                </label>
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center gap-3">
                  <input
                    ref={secondaryFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleSecondaryImagesChange}
                    className="block w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                  />

                  {imagenesSecundarias.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5 w-full mt-2">
                      {imagenesSecundarias.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                        >
                          <img
                            src={img}
                            alt={`Secundaria ${idx}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeSecondaryImage(idx)}
                            className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-500">
                        Fotos de detalle, reverso o modelos vistiendo la prenda
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: PRECIOS Y COSTOS */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>Costo de Taller y Precios por Volumen</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Costo de Confección ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={costoTaller}
                  onChange={(e) => setCostoTaller(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Precio Detal (1-2 pzs) ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={precioDetal}
                  onChange={(e) => setPrecioDetal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#009fe3] block mb-1">
                  Precio Promo x3 ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={precio3Piezas}
                  onChange={(e) => setPrecio3Piezas(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-[#009fe3] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-600 block mb-1">
                  Mayorista 6+ ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={precioMayor}
                  onChange={(e) => setPrecioMayor(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: GESTIÓN DE VARIANTES Y STOCK */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <Palette className="w-5 h-5 text-purple-500" />
              <span>Variantes: Tallas, Colores, Estampados y Stock ({variantes.length})</span>
            </h3>

            {/* Selector de modo y creación de variante */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Disponibilidad de la variante a crear:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewVariantMode('stock')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      newVariantMode === 'stock'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>📦 En Stock Físico</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVariantMode('bajo_pedido')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      newVariantMode === 'bajo_pedido'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>⏱️ Bajo Pedido (Sin stock)</span>
                  </button>
                </div>
              </div>

              {/* Formulario para agregar variante rápida */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Talla y Botones Rápidos de Talla */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Talla</label>
                  <select
                    value={newTalla}
                    onChange={(e) => setNewTalla(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-white mb-1.5"
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

                  <div className="flex flex-wrap gap-1">
                    {['S', 'M', 'L', 'XL'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewTalla(t)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                          newTalla === t
                            ? 'bg-[#009fe3] text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color de la Prenda con Barra de Tono */}
                <div className="sm:col-span-3">
                  <ColorTonePicker
                    colorName={newColorName}
                    colorHex={newColorHex}
                    onChange={(name, hex) => {
                      setNewColorName(name);
                      setNewColorHex(hex);
                    }}
                  />
                </div>

                {/* Técnica */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Técnica</label>
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

                {/* Nombre / Estampa */}
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre / Estampa (Opcional)</label>
                  <input
                    type="text"
                    value={newNombreVar}
                    onChange={(e) => setNewNombreVar(e.target.value)}
                    placeholder="Ej: Los Ángeles o Mickey"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                  />
                </div>

                {/* Stock (Oculto si es Bajo Pedido) */}
                {newVariantMode === 'stock' ? (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Stock (piezas)</label>
                    <input
                      type="number"
                      min="1"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white text-center"
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-2 flex items-center justify-center p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                    ⏱️ Confección
                  </div>
                )}

                {/* Botón Añadir */}
                <div className="sm:col-span-12 flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="text-xs text-slate-500 font-medium">
                    Prenda: <strong className="text-slate-800 dark:text-slate-200">{newColorName}</strong> • Talla <strong className="text-slate-800 dark:text-slate-200">{newTalla}</strong> • {newVariantMode === 'stock' ? `${newStock} pzs` : 'Bajo pedido'}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1.5 bg-[#009fe3] hover:bg-[#0082ba] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir Variante a este Color</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de variantes existentes agrupadas por Color */}
            <div className="space-y-4">
              {Object.entries(
                variantes.reduce((acc, v) => {
                  const colKey = v.color_base || v.nombre_variante || 'Color Estándar';
                  if (!acc[colKey]) {
                    acc[colKey] = {
                      colorName: colKey,
                      colorHex: v.codigo_hex || '#009fe3',
                      items: [],
                    };
                  }
                  acc[colKey].items.push(v);
                  return acc;
                }, {} as Record<string, { colorName: string; colorHex: string; items: ProductVariant[] }>)
              ).map(([colKey, group]) => (
                <div
                  key={colKey}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-xs"
                >
                  {/* Encabezado del grupo de color */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-xs shrink-0"
                        style={{ backgroundColor: group.colorHex }}
                      />
                      <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-white">
                        {group.colorName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({group.items.length} {group.items.length === 1 ? 'talla' : 'tallas'})
                      </span>
                    </div>
                  </div>

                  {/* Tallas de este color */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {group.items.map((v) => {
                      const isBajoPedido = v.stock_disponible <= 0;
                      return (
                        <div
                          key={v.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-xs bg-blue-500/15 text-[#009fe3] px-2.5 py-0.5 rounded-lg font-black">
                              Talla {v.talla}
                            </span>
                            {v.nombre_variante && v.nombre_variante !== v.color_base && (
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {v.nombre_variante}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 capitalize">
                              ({v.tipo_variante})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            {/* Control de Stock editable / Estado Bajo Pedido */}
                            {isBajoPedido ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1 border border-amber-500/20">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Bajo Pedido</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStock(v.id)}
                                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                                >
                                  + Asignar Stock
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-medium">Stock:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.stock_disponible}
                                  onChange={(e) => handleStockChange(v.id, parseInt(e.target.value, 10) || 0)}
                                  className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                                  title="Editar stock directamente"
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">pzs</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBajoPedido(v.id)}
                                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline cursor-pointer ml-1"
                                >
                                  Cambiar a Bajo Pedido
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Eliminar talla"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTÓN FINAL DE GUARDAR */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href="/productos"
              className="px-6 py-3.5 rounded-2xl text-base font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className={`flex items-center gap-2.5 bg-[#009fe3] hover:bg-[#0082ba] text-white px-8 py-3.5 rounded-2xl text-base font-bold shadow-xl active:scale-95 transition-all ${
                submitting || uploadingImage ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Save className="w-5 h-5" />
              <span>{submitting ? 'Guardando Prenda...' : uploadingImage ? 'Subiendo Foto...' : 'Guardar Prenda en Catálogo'}</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
