'use client';

import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { MenuItem, Table } from '@/lib/types';
import { formatIDR } from '@/lib/format';

type DashboardData = { menuItems: MenuItem[]; tables: Table[] };
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OrderPage() {
  const params = useParams<{ tableId: string }>();
  const router = useRouter();
  const { data } = useSWR<DashboardData>('/api/dashboard', fetcher, { refreshInterval: 12000 });
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState('Tamu');
  const [isSending, setIsSending] = useState(false);

  const table = data?.tables.find((t) => t.id === Number(params.tableId));
  const total = useMemo(
    () =>
      Object.entries(cart).reduce((sum, [menuId, qty]) => {
        const menu = data?.menuItems.find((m) => m.id === Number(menuId));
        return sum + (menu?.price ?? 0) * qty;
      }, 0),
    [cart, data?.menuItems]
  );

  const addItem = (id: number) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const submitOrder = async () => {
    if (!Object.keys(cart).length) return;
    setIsSending(true);
    const items = Object.entries(cart).map(([menuId, qty]) => ({
      menu_item_id: Number(menuId),
      quantity: qty,
      note: undefined
    }));

    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: Number(params.tableId),
        customer_name: customerName,
        payment_method: 'cash',
        items
      })
    });
    router.push('/kasir');
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm text-slate-500">Self-order</p>
        <h1 className="text-2xl font-semibold">Meja {table?.label ?? params.tableId}</h1>
        <p className="text-sm text-slate-600">Silakan pilih menu dan kirim ke kasir.</p>
      </div>

      <label className="flex max-w-sm flex-col gap-1 text-sm">
        <span>Nama pelanggan</span>
        <input
          className="rounded border px-3 py-2"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        {data?.menuItems.map((menu) => (
          <button
            key={menu.id}
            className="rounded border p-3 text-left"
            onClick={() => addItem(menu.id)}
          >
            <p className="text-xs uppercase text-slate-500">{menu.category}</p>
            <p className="font-semibold">{menu.name}</p>
            <p className="text-sm text-slate-700">{formatIDR(menu.price)}</p>
            <p className="text-xs text-slate-500">Tambah ke keranjang</p>
          </button>
        ))}
      </div>

      <section className="rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Keranjang</h2>
          <p className="text-sm text-slate-700">Total {formatIDR(total)}</p>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {Object.entries(cart).map(([menuId, qty]) => {
            const menu = data?.menuItems.find((m) => m.id === Number(menuId));
            if (!menu) return null;
            return (
              <li key={menuId} className="flex justify-between">
                <span>
                  {qty}x {menu.name}
                </span>
                <span>{formatIDR(menu.price * qty)}</span>
              </li>
            );
          })}
          {!Object.keys(cart).length && <li className="text-slate-500">Belum ada item.</li>}
        </ul>
        <button
          className="mt-4 w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
          disabled={!Object.keys(cart).length || isSending}
          onClick={submitOrder}
        >
          Kirim ke kasir
        </button>
      </section>
    </main>
  );
}
