import type { Product, OrderItem } from '../types';

/**
 * Calcula el precio unitario exacto según el volumen:
 * - 1 o 2 piezas: Precio Detal
 * - 3 a 5 piezas: Precio a partir de 3 piezas (Tier 3+)
 * - 6 o más piezas: Precio Mayorista de Fábrica
 */
export function getTierUnitPrice(product: Product, quantity: number): number {
  if (quantity >= 6) {
    return product.precio_mayor_usd;
  }
  if (quantity >= 3) {
    return product.precio_3_piezas_usd;
  }
  return product.precio_detal_usd;
}

/**
 * Genera un OrderItem completo calculando venta, costo y ganancia neta.
 */
export function createOrderItem(
  product: Product,
  variantName: string,
  talla: string,
  tipoVariante: 'unicolor' | 'estampado',
  quantity: number,
  customUnitCost?: number
): OrderItem {
  const unitPrice = getTierUnitPrice(product, quantity);
  const unitCost = customUnitCost ?? product.costo_produccion_usd;

  const subtotalVenta = Number((unitPrice * quantity).toFixed(2));
  const subtotalCosto = Number((unitCost * quantity).toFixed(2));
  const ganancia = Number((subtotalVenta - subtotalCosto).toFixed(2));

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    producto_id: product.id,
    nombre_producto: product.nombre,
    talla,
    tipo_variante: tipoVariante,
    nombre_variante: variantName,
    cantidad: quantity,
    precio_unitario_aplicado_usd: unitPrice,
    costo_unitario_usd: unitCost,
    subtotal_venta_usd: subtotalVenta,
    subtotal_costo_usd: subtotalCosto,
    ganancia_item_usd: ganancia,
  };
}

/**
 * Calcula los totales financieros de un conjunto de ítems de pedido:
 * - Subtotal venta
 * - Costo total de producción
 * - Ganancia neta total
 * - Margen porcentual de ganancia
 * - Total en Bolívares según tasa
 */
export function calculateOrderFinancials(
  items: OrderItem[],
  deliveryCostUSD: number = 0,
  exchangeRate: number = 76.50
) {
  const totalUnidades = items.reduce((acc, item) => acc + item.cantidad, 0);
  const subtotalUSD = Number(
    items.reduce((acc, item) => acc + item.subtotal_venta_usd, 0).toFixed(2)
  );
  const costoTotalUSD = Number(
    items.reduce((acc, item) => acc + item.subtotal_costo_usd, 0).toFixed(2)
  );
  const totalUSD = Number((subtotalUSD + deliveryCostUSD).toFixed(2));
  const gananciaNetaUSD = Number((subtotalUSD - costoTotalUSD).toFixed(2));
  
  const margenPorcentaje = subtotalUSD > 0
    ? Number(((gananciaNetaUSD / subtotalUSD) * 100).toFixed(1))
    : 0;

  const totalBs = Number((totalUSD * exchangeRate).toFixed(2));

  return {
    totalUnidades,
    subtotalUSD,
    costoTotalUSD,
    deliveryCostUSD,
    totalUSD,
    totalBs,
    gananciaNetaUSD,
    margenPorcentaje,
  };
}
