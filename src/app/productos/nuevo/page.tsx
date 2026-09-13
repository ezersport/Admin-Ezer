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
  const [diasConfeccion, setDiasConfeccion] = useState<string>('5');

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
  const [newTalla, setNewTalla] = useState('Talla 4');
  const [newTipo, setNewTipo] = useState<VariantStyleType>('sublimacion');
  const [newNombreVar, setNewNombreVar] = useState('');
  const [newColorHex, setNewColorHex] = useState('#009fe3');
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
    if (!newNombreVar.trim()) return;
    const newV: ProductVariant = {
      id: `var-${Date.now()}`,
      talla: newTalla,
      tipo_variante: newTipo,
      nombre_variante: newNombreVar.trim(),
      color_base: newNombreVar.trim(),
      codigo_hex: newColorHex,
      stock_disponible: parseInt(newStock) || 0,
      stock_minimo_alerta: 3,
    };
    setVariantes([...variantes, newV]);
    setNewNombreVar('');
  };

  const handleRemoveVariant = (id: string) => {
    setVariantes(variantes.filter((v) => v.id !== id));
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
        dias_confeccion: disponibilidad === 'bajo_pedido' ? (parseInt(diasConfeccion, 10) || 5) : 0,
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
            const { error: varError } = await supabase.from('product_variants').insert(varsToInsert);
            if (varError && varError.message.includes('check constraint')) {
              // Fallback para esquemas que aún tengan check ('unicolor', 'estampado')
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
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Registrar Prenda de Taller"
        subtitle="Agrega modelos con costos de corte, escalas de precios y fotos"
      />

      <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Inventario</span>
          </Link>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            SKU Asignado: <strong className="font-mono text-slate-900 dark:text-white">{sku}</strong>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECCIÓN 1: DATOS BÁSICOS DEL PRODUCTO */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <Package className="w-5 h-5 text-[#009fe3]" />
              <span>Identificación de la Prenda</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nombre del Producto: *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Conjunto Suéter & Mono Spiderman Niño"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Tipo de Recurso / Categoría: *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Tela y Material de Confección
                </label>
                <input
                  type="text"
                  value={telaMaterial}
                  onChange={(e) => setTelaMaterial(e.target.value)}
                  placeholder="Ej: Algodón Fleece Perchado 100% Antialérgico"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Código SKU: *
                  </label>
                  <button
                    type="button"
                    onClick={() => setSku(generateSKU(categoria))}
                    className="inline-flex items-center gap-1 text-xs text-[#009fe3] hover:underline font-bold transition-all cursor-pointer"
                    title="Generar un nuevo código aleatorio"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar otro SKU</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="EZ-KID-4821"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#009fe3] rounded-2xl pl-4 pr-28 py-3 text-base font-mono text-slate-900 dark:text-white focus:outline-none uppercase font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setSku(generateSKU(categoria))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#009fe3]/15 hover:bg-[#009fe3]/25 text-[#009fe3] border border-[#009fe3]/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    ⚡ Auto-SKU
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Descripción / Tamaños Disponibles:
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Tamaños disponibles Talla 2 a Talla 14. Conjunto abrigado con capucha forrada y mono jogger con elástico suave."
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
                      Piezas ya confeccionadas en taller listas para despacho en 24-48h.
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
                        Indica los días hábiles que tarda el taller en producir y embalar.
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

          {/* SECCIÓN 2: CARGA DE IMÁGENES (PRINCIPAL Y SECUNDARIAS) */}
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

              {/* IMÁGENES SECUNDARIAS / GALERÍA */}
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
                            alt={`Secundaria ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeSecondaryImage(idx)}
                            className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md shadow hover:bg-rose-700"
                            title="Quitar foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-500">
                        Añade fotos de detalles, espalda o estampados adicionales
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: PRECIOS Y COSTOS DE PRODUCCIÓN */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>Costos de Taller y Escala de Precios</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Costo de Taller */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                <label className="text-xs font-bold text-amber-800 dark:text-amber-400 block mb-1">
                  Costo de Fabricación ($)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={costoTaller}
                  onChange={(e) => setCostoTaller(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800 rounded-xl px-3 py-2 text-base font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                />
                <span className="text-[11px] text-amber-700 dark:text-amber-500 block mt-1">
                  Tela + Confección + DTF
                </span>
              </div>

              {/* Detal (1-2 Pzs) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Precio Detal (1-2 Pzs) ($)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={precioDetal}
                  onChange={(e) => setPrecioDetal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                  Ganancia: +{formatUSD(gananciaDetal)} ({margenDetal}%)
                </span>
              </div>

              {/* Promoción (3+ Pzs) */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                <label className="text-xs font-bold text-blue-800 dark:text-blue-300 block mb-1">
                  A partir de 3 Pzs ($ c/u)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={precio3Piezas}
                  onChange={(e) => setPrecio3Piezas(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-blue-300 dark:border-blue-800 rounded-xl px-3 py-2 text-base font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-[#009fe3] font-bold block mt-1">
                  3 Pzs = {formatUSD(tier3Num * 3)}
                </span>
              </div>

              {/* Mayorista (6+ Pzs) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Precio Mayor (6+ Pzs) ($)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={precioMayor}
                  onChange={(e) => setPrecioMayor(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-purple-600 dark:text-purple-400 font-bold block mt-1">
                  Para revendedores
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: VARIANTES (UNICOLOR VS ESTAMPADOS & TALLAS) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5">
              <Palette className="w-5 h-5 text-purple-500" />
              <span>Variantes: Tallas, Colores y Estampados</span>
            </h3>

            {/* Formulario rápido de variante */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                Agregar Variante a esta Prenda:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Talla
                  </label>
                  <select
                    value={newTalla}
                    onChange={(e) => setNewTalla(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Talla 2">Talla 2</option>
                    <option value="Talla 4">Talla 4</option>
                    <option value="Talla 6">Talla 6</option>
                    <option value="Talla 8">Talla 8</option>
                    <option value="Talla 10">Talla 10</option>
                    <option value="Talla 12">Talla 12</option>
                    <option value="Talla 14">Talla 14</option>
                    <option value="S">S (Adulto)</option>
                    <option value="M">M (Adulto)</option>
                    <option value="L">L (Adulto)</option>
                    <option value="XL">XL (Adulto)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Tipo de Estilo
                  </label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as VariantStyleType)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="sublimacion">Sublimación</option>
                    <option value="vinil">Vinil</option>
                    <option value="dtf">DTF</option>
                    <option value="unicolor">Unicolor Liso</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    {newTipo === 'unicolor' ? 'Color de Tela' : 'Nombre Estampa / Diseño'}
                  </label>
                  <input
                    type="text"
                    value={newNombreVar}
                    onChange={(e) => setNewNombreVar(e.target.value)}
                    placeholder={
                      newTipo === 'sublimacion'
                        ? 'Ej: Spiderman Full Color'
                        : newTipo === 'vinil'
                        ? 'Ej: Logo Vinil Dorado'
                        : newTipo === 'dtf'
                        ? 'Ej: Estampa DTF Pecho'
                        : 'Ej: Azul Marino'
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#009fe3] hover:bg-[#0082ba] text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de variantes añadidas */}
            <div className="space-y-2.5">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                Variantes en esta Prenda ({variantes.length}):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variantes.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                        style={{ backgroundColor: v.codigo_hex }}
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {v.talla} • {v.nombre_variante}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {v.tipo_variante === 'sublimacion'
                            ? 'Sublimación'
                            : v.tipo_variante === 'vinil'
                            ? 'Vinil'
                            : v.tipo_variante === 'dtf'
                            ? 'DTF'
                            : v.tipo_variante === 'unicolor'
                            ? 'Unicolor'
                            : 'Estampa'}{' '}
                          • Stock:{' '}
                          <strong className="text-slate-900 dark:text-white">{v.stock_disponible} pzs</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
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
      </main>
    </div>
  );
}
