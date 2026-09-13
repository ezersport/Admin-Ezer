import type {
  Product,
  Category,
  Order,
  PaymentMethod,
  DeliveryZone,
  AppConfig,
  ExchangeRateRecord,
  OrderStatus,
} from '../types';

// ==============================================================================
// DATOS SEMILLA REALES DE EZER SPORT
// ==============================================================================

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-ninos',
    nombre: 'Conjuntos y Ropa Infantil',
    slug: 'ninos',
    descripcion: 'Conjuntos con capucha afelpados, monos joggers estampados DTF y prendas térmicas para niños y niñas.',
    activa: true,
    icono: 'Baby',
    orden: 1,
  },
  {
    id: 'cat-chaquetas',
    nombre: 'Chaquetas & Cortavientos',
    slug: 'chaquetas',
    descripcion: 'Chaquetas impermeables con forro interior, cortavientos ligeros y abrigos deportivos.',
    activa: true,
    icono: 'Shirt',
    orden: 2,
  },
  {
    id: 'cat-pijamas',
    nombre: 'Pijamas Familiares & Térmicas',
    slug: 'pijamas',
    descripcion: 'Pijamas en algodón afelpado, combinaciones familiares y pijamas enterizas.',
    activa: true,
    icono: 'Moon',
    orden: 3,
  },
  {
    id: 'cat-monos',
    nombre: 'Monos Joggers & Pantalones',
    slug: 'monos',
    descripcion: 'Monos deportivos con puños elásticos acanalados, bolsillos profundos y tela resistente.',
    activa: true,
    icono: 'Layers',
    orden: 4,
  },
  {
    id: 'cat-combos',
    nombre: 'Combos & Promociones por Volumen',
    slug: 'combos',
    descripcion: 'Packs promocionales a partir de 3 piezas y ventas al mayor para revendedores.',
    activa: true,
    icono: 'Sparkles',
    orden: 5,
  },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm-pago-movil',
    codigo: 'pago_movil',
    nombre: 'Pago Móvil Interbancario (BDV / Mercantil)',
    banco: 'Banco de Venezuela (0102) / Mercantil (0105)',
    titular: 'Ezer Sport Taller Textil',
    cedula_rif: 'V-18.452.190',
    telefono: '0424-128-2108',
    instrucciones: 'Por favor envía el capture del comprobante con el número de referencia visible.',
    activo: true,
    orden: 1,
  },
  {
    id: 'pm-deposito-divisas',
    codigo: 'deposito_divisas',
    nombre: 'Depósito en Dólares Efectivo por Taquilla Bancaria',
    banco: 'Banco Mercantil (Cuenta Moneda Extranjera)',
    titular: 'Ezer Sport C.A.',
    cedula_rif: 'J-50123456-7',
    numero_cuenta: '0105-0123-45-6789012345',
    instrucciones: 'Puedes depositar directamente dólares en taquilla en cualquier agencia Mercantil del país sin comisiones.',
    activo: true,
    orden: 2,
  },
  {
    id: 'pm-binance',
    codigo: 'binance',
    nombre: 'Binance Pay (USDT)',
    pay_id: '584128210',
    email: 'pagos@ezersport.com',
    cedula_rif: 'V-18.452.190',
    instrucciones: 'Transfiere a nuestro Pay ID sin comisiones en USDT.',
    activo: true,
    orden: 3,
  },
  {
    id: 'pm-efectivo',
    codigo: 'efectivo',
    nombre: 'Efectivo en Dólares ($)',
    cedula_rif: 'V-18.452.190',
    instrucciones: 'Válido para retiros en Los Teques o entrega en Plaza Venezuela. Billetes en buen estado sin roturas.',
    activo: true,
    orden: 4,
  },
];

export const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'caracas-previsora',
    nombre: 'Caracas: Sábados Plaza Venezuela (Torre La Previsora)',
    zona_tipo: 'caracas_sabado',
    costo_usd: 2.00,
    monto_minimo_gratis_usd: 30.00,
    puntos_encuentro: ['Plaza Venezuela - Frente a Torre La Previsora'],
    agencias_disponibles: [],
    activa_esta_semana: true,
  },
  {
    id: 'los-teques-metro',
    nombre: 'Los Teques: Metro Independencia / Alí Primera (¡GRATIS!)',
    zona_tipo: 'teques_metro',
    costo_usd: 0.00,
    monto_minimo_gratis_usd: 0.00,
    puntos_encuentro: ['Estación Independencia', 'Estación Alí Primera'],
    agencias_disponibles: [],
    activa_esta_semana: true,
  },
  {
    id: 'san-antonio-puntos',
    nombre: 'San Antonio: Altos Mirandinos (desde 1,5 $)',
    zona_tipo: 'san_antonio',
    costo_usd: 1.50,
    monto_minimo_gratis_usd: 30.00,
    puntos_encuentro: ['La Rosaleda', 'La Casona', 'Farmatodo'],
    agencias_disponibles: [],
    activa_esta_semana: true,
  },
  {
    id: 'envios-nacionales',
    nombre: 'Envíos Nacionales: MRW / Zoom / Tealca / Domesa (COD)',
    zona_tipo: 'nacional',
    costo_usd: 0.00,
    monto_minimo_gratis_usd: 0.00,
    puntos_encuentro: ['Agencia MRW', 'Agencia Zoom', 'Agencia Tealca', 'Agencia Domesa'],
    agencias_disponibles: ['MRW', 'Zoom', 'Tealca', 'Domesa'],
    activa_esta_semana: true,
  },
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_CONFIG: AppConfig = {
  id: 'global',
  tasa_bcv: 0.00,
  tasa_actualizada_al: new Date().toISOString(),
  entregas_caracas_activas: true,
  horario_caracas: 'Sábados en Plaza Venezuela frente a Torre La Previsora',
  mensaje_anuncio: '¡Entregas los Sábados en Caracas! Plaza Venezuela',
};

// ==============================================================================
// GESTOR DE ALMACENAMIENTO (LOCALSTORAGE + FALLBACK)
// ==============================================================================

const STORAGE_KEYS = {
  PRODUCTS: 'ezer_admin_products_clean_v3',
  CATEGORIES: 'ezer_admin_categories_clean_v3',
  ORDERS: 'ezer_admin_orders_clean_v3',
  PAYMENT_METHODS: 'ezer_admin_payment_methods_clean_v3',
  ZONES: 'ezer_admin_zones_clean_v3',
  CONFIG: 'ezer_admin_config_clean_v3',
  RATES: 'ezer_admin_rates_history_clean_v3',
};

export function getStoredCategories(): Category[] {
  if (typeof window === 'undefined') return INITIAL_CATEGORIES;
  const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveStoredCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.warn('LocalStorage write failed for categories', e);
  }
}

export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!saved) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    } catch {}
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(products);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, raw);
    // Sincronización cruzada directa con la tienda web de Page Ezer
    localStorage.setItem('ezer_products_clean_v3', raw);
    localStorage.setItem('ezer_admin_products_clean_v3', raw);
  } catch (e) {
    console.warn('LocalStorage quota exceeded in saveStoredProducts, saving lightweight copy', e);
    try {
      const lightweight = products.map((p) => ({
        ...p,
        imagen_principal: p.imagen_principal?.startsWith('data:')
          ? 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80'
          : p.imagen_principal,
        imagenes_galeria: (p.imagenes_galeria || []).filter((img) => !img.startsWith('data:')),
      }));
      const serialized = JSON.stringify(lightweight);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, serialized);
      localStorage.setItem('ezer_products_clean_v3', serialized);
      localStorage.setItem('ezer_admin_products_clean_v3', serialized);
    } catch (err2) {
      console.warn('Could not save lightweight products to localStorage:', err2);
    }
  }
  window.dispatchEvent(new CustomEvent('ezer-products-updated', { detail: { products } }));
}

export function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
  if (!saved) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    } catch {}
    return INITIAL_ORDERS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveStoredOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(orders);
    localStorage.setItem(STORAGE_KEYS.ORDERS, raw);
    localStorage.setItem('ezer_orders_clean_v3', raw);
  } catch (e) {
    console.warn('LocalStorage quota exceeded for orders', e);
  }
  window.dispatchEvent(new CustomEvent('ezer-orders-updated', { detail: { orders } }));
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): Order[] {
  const orders = getStoredOrders();
  const updated = orders.map((o) =>
    o.id === orderId ? { ...o, estado: newStatus, updated_at: new Date().toISOString() } : o
  );
  saveStoredOrders(updated);
  return updated;
}

export function getStoredPaymentMethods(): PaymentMethod[] {
  if (typeof window === 'undefined') return INITIAL_PAYMENT_METHODS;
  const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(INITIAL_PAYMENT_METHODS));
    return INITIAL_PAYMENT_METHODS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_PAYMENT_METHODS;
  }
}

export function saveStoredPaymentMethods(methods: PaymentMethod[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(methods));
}

export function getStoredConfig(): AppConfig {
  if (typeof window === 'undefined') return INITIAL_CONFIG;
  const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_CONFIG));
    return INITIAL_CONFIG;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_CONFIG;
  }
}

export function saveStoredConfig(config: AppConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  localStorage.setItem('ezer_admin_config_clean_v3', JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('ezer-rate-updated', { detail: { currentRate: config.tasa_bcv } }));
}

// Función para reiniciar todos los datos locales a 0
export function resetAllDataToZero(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('ezer_products_clean_v3');
  localStorage.removeItem('ezer_orders_clean_v3');
  localStorage.removeItem('ezer_rates_clean_v3');
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_CONFIG));
}


export function getStoredDeliveryZones(): DeliveryZone[] {
  if (typeof window === 'undefined') return INITIAL_DELIVERY_ZONES;
  const saved = localStorage.getItem(STORAGE_KEYS.ZONES);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(INITIAL_DELIVERY_ZONES));
    return INITIAL_DELIVERY_ZONES;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_DELIVERY_ZONES;
  }
}

export function saveStoredDeliveryZones(zones: DeliveryZone[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(zones));
}
