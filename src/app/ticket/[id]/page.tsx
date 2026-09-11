'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { getStoredOrders } from '../../../lib/store';
import { OrderPackingTicket } from '../../../components/OrderPackingTicket';
import type { Order } from '../../../types';

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = params?.id as string;
    if (orderId) {
      const orders = getStoredOrders();
      const found = orders.find((o) => o.id === orderId || o.numero_orden === orderId);
      if (found) {
        setOrder(found);
      }
    }
    setLoading(false);
  }, [params]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        Cargando ticket de despacho...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-base text-slate-300 font-bold">
          No se encontró la orden solicitada.
        </p>
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#009fe3] text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Pedidos</span>
        </Link>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-4 sm:p-8 max-w-4xl mx-auto w-full">
      {/* Barra de navegación superior (oculta al imprimir) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado</span>
        </button>

        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Comanda Oficial de Taller • {order.numero_orden}
        </span>
      </div>

      {/* Ticket imprimible */}
      <OrderPackingTicket order={order} />
    </main>
  );
}
