'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import type { MenuItem, OrderWithItems, Table } from '@/lib/types';
import { formatIDR } from '@/lib/format';

type DashboardData = {
  menuItems: MenuItem[];
  tables: Table[];
  orders: OrderWithItems[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const statuses: OrderWithItems['status'][] = ['pending', 'accepted', 'preparing', 'served', 'paid', 'cancelled'];

export default function KasirPage() {
  const { data, mutate } = useSWR<DashboardData>('/api/dashboard', fetcher, { refreshInterval: 8000 });
  const [filter, setFilter] = useState<OrderWithItems['status'] | 'all'>('all');
  const [selectedTable, setSelectedTable] = useState<number | ''>('');
  const [selectedMenu, setSelectedMenu] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in');

  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    return data.orders.filter((order) => (filter === 'all' ? true : order.status === filter));
  }, [data?.orders, filter]);

  const createOrder = async () => {
    if (!selectedMenu) return;
    const body = {
      table_id: selectedTable === '' ? null : Number(selectedTable),
      customer_name: customerName,
      payment_method: 'cash',
      items: [
        {
          menu_item_id: Number(selectedMenu),
          quantity: qty,
          note: note || undefined
        }
      ]
    };

    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setNote('');
    setQty(1);
    setSelectedMenu('');
    mutate();
  };

  const updateStatus = async (id: number, status: OrderWithItems['status']) => {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    mutate();
  };

  return (
    <main className="flex flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Kasir</p>
          <h1 className="text-2xl font-semibold">Dashboard Pesanan</h1>
        </div>
        <div className="flex gap-2 text-sm">
          <select
            className="rounded border px-3 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">Semua</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="rounded border px-3" onClick={() => mutate()}>
            Refresh
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="rounded border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="rounded bg-slate-100 px-2 py-1 text-xs uppercase">{order.status}</span>
              <span>Table {order.table_id ?? '-'}</span>
            </div>
            <h3 className="mt-2 font-semibold">Order #{order.id}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.menu_name}
                  </span>
                  <span>{formatIDR(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right text-sm font-semibold">{formatIDR(order.total)}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {statuses.map((s) => (
                <button
                  key={s}
                  className={`rounded border px-2 py-1 ${order.status === s ? 'bg-black text-white' : ''}`}
                  onClick={() => updateStatus(order.id, s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!filteredOrders.length && <p className="text-sm text-slate-500">Belum ada pesanan.</p>}
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">Pesanan Baru</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Meja</span>
            <select
              className="rounded border px-3 py-2"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">- Tanpa meja -</option>
              {data?.tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.status})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Nama pelanggan</span>
            <input
              className="rounded border px-3 py-2"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Menu</span>
            <select
              className="rounded border px-3 py-2"
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Pilih menu</option>
              {data?.menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} - {formatIDR(m.price)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Qty</span>
            <input
              className="rounded border px-3 py-2"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span>Catatan</span>
            <textarea
              className="rounded border px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
        <button className="mt-3 rounded bg-black px-4 py-2 text-white" onClick={createOrder}>
          Simpan Pesanan
        </button>
      </section>
    </main>
  );
}
