-- ==============================================================================
-- SCHEMA SUPABASE: EZER SPORT - SISTEMA ADMINISTRATIVO & CONTROL DE PRODUCCIÓN
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: CONFIGURACIÓN GLOBAL (TASA BCV, ALERTAS, LOGÍSTICA CARACAS)
CREATE TABLE IF NOT EXISTS public.app_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  tasa_bcv NUMERIC(10, 2) NOT NULL DEFAULT 76.50,
  tasa_actualizada_al TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entregas_caracas_activas BOOLEAN NOT NULL DEFAULT TRUE,
  horario_caracas TEXT DEFAULT 'Sábados en Plaza Venezuela frente a Torre La Previsora',
  mensaje_anuncio TEXT DEFAULT '¡Entregas los Sábados en Caracas! Plaza Venezuela',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO public.app_config (id, tasa_bcv, entregas_caracas_activas, horario_caracas)
VALUES ('global', 76.50, true, 'Sábados en Plaza Venezuela frente a Torre La Previsora')
ON CONFLICT (id) DO NOTHING;

-- 3. TABLA: HISTORIAL DE TASAS BCV (AUDITORÍA FINANCIERA)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tasa NUMERIC(10, 2) NOT NULL,
  fuente TEXT DEFAULT 'bcv_oficial',
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario TEXT DEFAULT 'Administrador'
);

-- 4. TABLA: CATEGORÍAS DE ROPA
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  icono TEXT DEFAULT 'Tags',
  orden INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA: MÉTODOS DE PAGO
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  banco TEXT,
  titular TEXT,
  cedula_rif TEXT,
  telefono TEXT,
  numero_cuenta TEXT,
  pay_id TEXT,
  email TEXT,
  instrucciones TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  orden INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA: ZONAS Y RUTAS DE ENTREGA (100% EDITABLES)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  zona_tipo TEXT NOT NULL, -- 'caracas_sabado', 'teques_metro', 'san_antonio', 'nacional'
  costo_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  monto_minimo_gratis_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  puntos_encuentro JSONB DEFAULT '[]'::jsonb,
  agencias_disponibles JSONB DEFAULT '[]'::jsonb,
  activa_esta_semana BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA: PRODUCTOS DE CONFECCIÓN
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  codigo_sku TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  categoria TEXT NOT NULL,
  tela_material TEXT,
  descripcion TEXT,
  precio_detal_usd NUMERIC(10, 2) NOT NULL,       -- 1 a 2 piezas
  precio_3_piezas_usd NUMERIC(10, 2) NOT NULL,     -- A partir de 3 piezas
  precio_mayor_usd NUMERIC(10, 2) NOT NULL,        -- A partir de 6 piezas
  costo_produccion_usd NUMERIC(10, 2) NOT NULL,    -- Costo de confección en taller
  disponibilidad TEXT NOT NULL DEFAULT 'inmediato',
  dias_confeccion INT NOT NULL DEFAULT 0,
  imagen_principal TEXT NOT NULL,
  imagenes_galeria JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  destacado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA: VARIANTES DE PRODUCTO (UNICOLOR VS ESTAMPADOS & TALLAS)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  producto_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  tipo_variante TEXT NOT NULL CHECK (tipo_variante IN ('sublimacion', 'vinil', 'dtf', 'unicolor', 'estampado')),
  nombre_variante TEXT NOT NULL, -- Ej: 'Spiderman Azul', 'Vinil Dorado', 'DTF Pecho'
  color_base TEXT,
  codigo_hex TEXT,
  stock_disponible INT NOT NULL DEFAULT 0,
  stock_minimo_alerta INT NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLA: PEDIDOS (#EZ-XXXX) CON CONTROL DE ABONOS 50% vs 100%
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  numero_orden TEXT UNIQUE NOT NULL, -- Ej: '#EZ-4821'
  cedula_cliente TEXT NOT NULL,      -- Ej: 'V-19824512'
  nombre_cliente TEXT NOT NULL,
  apellido_cliente TEXT NOT NULL,
  telefono_cliente TEXT NOT NULL,
  tipo_destino TEXT NOT NULL,
  zona_entrega_id TEXT,
  zona_nombre TEXT NOT NULL,
  punto_encuentro TEXT,
  empresa_envio TEXT,
  codigo_agencia TEXT,
  estado_destino TEXT,
  ciudad_destino TEXT,
  direccion_detalle TEXT,
  metodo_pago_codigo TEXT NOT NULL,
  referencia_pago TEXT,
  tasa_cambio_snapshot NUMERIC(10, 2) NOT NULL,
  total_unidades INT NOT NULL DEFAULT 1,
  subtotal_usd NUMERIC(10, 2) NOT NULL,
  costo_delivery_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_usd NUMERIC(10, 2) NOT NULL,
  total_bs NUMERIC(14, 2) NOT NULL,
  costo_total_produccion_usd NUMERIC(10, 2) NOT NULL,
  ganancia_neta_usd NUMERIC(10, 2) NOT NULL,
  
  -- Abono y Despacho
  tipo_pago TEXT DEFAULT 'completo_100' CHECK (tipo_pago IN ('completo_100', 'abono_50')),
  monto_pagado_usd NUMERIC(10, 2),
  monto_pendiente_usd NUMERIC(10, 2),
  monto_pagado_bs NUMERIC(14, 2),
  monto_pendiente_bs NUMERIC(14, 2),
  disponibilidad_pedido TEXT DEFAULT 'stock_inmediato',

  estado TEXT NOT NULL DEFAULT 'por_confirmar',
  numero_guia_envio TEXT,
  ticket_impreso BOOLEAN NOT NULL DEFAULT FALSE,
  notas_internas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLA: ITEMS DE PEDIDO
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL,
  nombre_producto TEXT NOT NULL,
  talla TEXT NOT NULL,
  tipo_variante TEXT NOT NULL,
  nombre_variante TEXT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario_aplicado_usd NUMERIC(10, 2) NOT NULL,
  costo_unitario_usd NUMERIC(10, 2) NOT NULL,
  subtotal_venta_usd NUMERIC(10, 2) NOT NULL,
  subtotal_costo_usd NUMERIC(10, 2) NOT NULL,
  ganancia_item_usd NUMERIC(10, 2) NOT NULL
);

-- 11. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Lectura pública de config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Lectura pública de categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Lectura pública de métodos de pago" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Lectura pública de zonas de entrega" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Lectura pública de productos activos" ON public.products FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública de variantes" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Lectura pública de pedidos por código" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Lectura pública de items de pedido" ON public.order_items FOR SELECT USING (true);

-- Políticas de escritura para administradores autenticados
CREATE POLICY "Admin gestión de config" ON public.app_config FOR ALL USING (true);
CREATE POLICY "Admin gestión de tasas" ON public.exchange_rates FOR ALL USING (true);
CREATE POLICY "Admin gestión de categorias" ON public.categories FOR ALL USING (true);
CREATE POLICY "Admin gestión de métodos de pago" ON public.payment_methods FOR ALL USING (true);
CREATE POLICY "Admin gestión de zonas" ON public.delivery_zones FOR ALL USING (true);
CREATE POLICY "Admin gestión de productos" ON public.products FOR ALL USING (true);
CREATE POLICY "Admin gestión de variantes" ON public.product_variants FOR ALL USING (true);
CREATE POLICY "Admin gestión de pedidos" ON public.orders FOR ALL USING (true);
CREATE POLICY "Admin gestión de items" ON public.order_items FOR ALL USING (true);

-- 12. PERMISOS DE ESQUEMA Y ROLES DE SUPABASE (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 13. MIGRACIÓN RÁPIDA: PERMITIR SUBLIMACIÓN, VINIL Y DTF EN PRODUCT_VARIANTS
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_tipo_variante_check;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_tipo_variante_check
  CHECK (tipo_variante IN ('sublimacion', 'vinil', 'dtf', 'unicolor', 'estampado'));

