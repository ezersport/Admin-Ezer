export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatBs(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' Bs';
}

export const formatBS = formatBs;

export function formatCedula(cedula: string): string {
  if (!cedula) return '';
  const clean = cedula.trim().toUpperCase();
  if (clean.startsWith('V-') || clean.startsWith('E-') || clean.startsWith('J-')) {
    return clean;
  }
  return `V-${clean.replace(/\D/g, '')}`;
}

export function generateOrderNumber(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `#EZ-${randomNum}`;
}

export function getStatusLabel(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'por_confirmar':
      return { label: 'Por Confirmar', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'pago_confirmado':
      return { label: 'Pago Confirmado', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'en_confeccion':
      return { label: 'En Confección', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'listo_para_entrega':
      return { label: 'Listo para Entrega', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' };
    case 'programado_caracas':
      return { label: 'Programado Caracas (Sáb)', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
    case 'en_camino_delivery':
      return { label: 'En Camino Delivery', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'despachado_agencia':
      return { label: 'Despachado en Agencia', bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' };
    case 'entregado':
      return { label: 'Entregado con Éxito', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'cancelado':
      return { label: 'Cancelado', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' };
    default:
      return { label: status, bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}
