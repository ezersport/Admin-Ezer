export type CategoryType = string;

export interface Category {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  activa: boolean;
  icono?: string;
  orden?: number;
}

export type ProductAvailability = 'inmediato' | 'bajo_pedido';

export type VariantStyleType = 'sublimacion' | 'vinil' | 'dtf' | 'unicolor' | 'estampado' | string;

export interface ProductVariant {
  id: string;
  producto_id?: string;
  talla: string; // 'Talla 1', 'Talla 2-4', 'Talla 6-8', 'Talla 10-14', 'S', 'M', 'L', 'XL'
  tipo_variante: VariantStyleType; // 'unicolor' | 'estampado'
  nombre_variante: string; // Ej: 'Spiderman Azul', 'Spiderman Blanca', 'Negro Clásico', 'Vinotinto'
  color_base: string; // Ej: 'Azul Eléctrico', 'Blanco Óptico', 'Negro'
  codigo_hex: string;
  imagen_variante_url?: string;
  stock_disponible: number;
  stock_minimo_alerta: number;
}

export interface Product {
  id: string;
  codigo_sku: string;
  nombre: string;
  slug: string;
  categoria: CategoryType;
  tela_material: string;
  descripcion: string;
  
  // Escala de Precios
  precio_detal_usd: number;        // 1 a 2 piezas (ej. $10.00)
  precio_3_piezas_usd: number;      // A partir de 3 piezas (ej. $9.00 -> 3 = $27)
  precio_mayor_usd: number;        // Desde 6 piezas (ej. $7.50)
  
  // Costo Real de Confección
  costo_produccion_usd: number;    // Para calcular ganancia neta exacta
  
  disponibilidad: ProductAvailability;
  dias_confeccion: number;
  imagen_principal: string;
  imagenes_galeria: string[];
  activo: boolean;
  destacado: boolean;
  variantes: ProductVariant[];
  created_at?: string;
}

export type DestinationType = 'caracas_sabado' | 'teques_metro' | 'san_antonio' | 'nacional';

export interface Customer {
  id: string;
  cedula: string; // Ej: 'V-18452190'
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  tipo_destino_frecuente: DestinationType;
  estado?: string;
  ciudad?: string;
  empresa_envio_preferida?: string; // 'MRW' | 'Zoom' | 'Tealca' | 'Domesa'
  codigo_agencia_frecuente?: string;
  direccion_frecuente?: string;
  total_compras_usd: number;
  created_at?: string;
}

export type PaymentMethodCode = 'pago_movil' | 'deposito_divisas' | 'binance' | 'zinli' | 'efectivo' | 'custom' | string;

export interface PaymentMethod {
  id: string;
  codigo: PaymentMethodCode;
  nombre: string;
  banco?: string;
  titular?: string;
  cedula_rif: string;
  telefono?: string;
  numero_cuenta?: string; // 20 dígitos o cuenta custodia en divisas
  email?: string;
  pay_id?: string;
  instrucciones?: string;
  activo: boolean;
  orden: number;
}

export interface DeliveryZone {
  id: string;
  nombre: string;
  zona_tipo: DestinationType;
  costo_usd: number;
  monto_minimo_gratis_usd: number;
  puntos_encuentro: string[];
  agencias_disponibles?: string[];
  activa_esta_semana: boolean;
}

export type OrderStatus =
  | 'por_confirmar'
  | 'pago_confirmado'
  | 'en_confeccion'
  | 'listo_para_entrega'
  | 'programado_caracas'
  | 'en_camino_delivery'
  | 'despachado_agencia'
  | 'entregado'
  | 'cancelado';

export interface OrderItem {
  id: string;
  pedido_id?: string;
  producto_id: string;
  variante_id?: string;
  nombre_producto: string;
  talla: string;
  tipo_variante: VariantStyleType;
  nombre_variante: string; // Ej: 'Spiderman Azul'
  cantidad: number;
  precio_unitario_aplicado_usd: number;
  costo_unitario_usd: number;
  subtotal_venta_usd: number;
  subtotal_costo_usd: number;
  ganancia_item_usd: number;
}

export interface Order {
  id: string;
  numero_orden: string; // Ej: '#EZ-4821'
  
  // Cliente
  cliente_id?: string;
  cedula_cliente: string;
  nombre_cliente: string;
  apellido_cliente: string;
  telefono_cliente: string;
  
  // Logística y Entrega
  tipo_destino: DestinationType;
  zona_entrega_id: string;
  zona_nombre: string;
  punto_encuentro?: string;
  direccion_detalle?: string;
  estado_destino?: string;
  ciudad_destino?: string;
  empresa_envio?: string; // 'MRW' | 'Zoom' | 'Tealca' | 'Domesa'
  codigo_agencia?: string;
  
  // Financiero & Abonos
  metodo_pago_codigo: PaymentMethodCode;
  referencia_pago?: string;
  comprobante_url?: string;
  tasa_cambio_snapshot: number;
  total_unidades: number;
  
  // Totales y Ganancias
  subtotal_usd: number;
  costo_delivery_usd: number;
  total_usd: number;
  total_bs: number;
  costo_total_produccion_usd: number;
  ganancia_neta_usd: number;

  // Lógica de Abono 50% vs Pago Completo 100%
  tipo_pago?: 'completo_100' | 'abono_50';
  monto_pagado_usd?: number;
  monto_pendiente_usd?: number;
  monto_pagado_bs?: number;
  monto_pendiente_bs?: number;
  disponibilidad_pedido?: 'stock_inmediato' | 'bajo_pedido_confeccion';
  
  // Pipeline de Estados
  estado: OrderStatus;
  numero_guia_envio?: string;
  fecha_entrega_programada?: string;
  ticket_impreso: boolean;
  notas_internas?: string;
  
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface AppConfig {
  id: string;
  tasa_bcv: number;
  tasa_actualizada_al: string;
  entregas_caracas_activas: boolean;
  horario_caracas: string;
  mensaje_anuncio: string;
}

export interface ExchangeRateRecord {
  id: string;
  tasa: number;
  fuente?: string;
  nota?: string;
  fecha?: string;
  usuario?: string;
  creado_por?: string;
  created_at?: string;
}
