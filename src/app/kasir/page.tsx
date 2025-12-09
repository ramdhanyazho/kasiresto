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
const statusLabels: Record<OrderWithItems['status'], { label: string; tone: string }> = {
  pending: { label: 'Menunggu', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Diterima', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  preparing: { label: 'Diproses', tone: 'bg-orange-50 text-orange-700 border-orange-200' },
  served: { label: 'Siap Saji', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paid: { label: 'Lunas', tone: 'bg-teal-50 text-teal-700 border-teal-200' },
  cancelled: { label: 'Dibatalkan', tone: 'bg-red-50 text-red-700 border-red-200' }
};

function StatusBadge({ status }: { status: OrderWithItems['status'] }) {
  const tone = statusLabels[status];
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${tone.tone}`}>{tone.label}</span>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">{children}</div>;
}

export default function KasirPage() {
  const { data, mutate } = useSWR<DashboardData>('/api/dashboard', fetcher, { refreshInterval: 8000 });
  const [selectedTable, setSelectedTable] = useState<number | ''>('');
  const [selectedMenu, setSelectedMenu] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in');

  const pending = useMemo(() => data?.orders.filter((o) => o.status === 'pending') ?? [], [data?.orders]);
  const inProgress = useMemo(
    () => data?.orders.filter((o) => ['accepted', 'preparing'].includes(o.status)) ?? [],
    [data?.orders]
  );
  const ready = useMemo(() => data?.orders.filter((o) => o.status === 'served') ?? [], [data?.orders]);
  const paid = useMemo(() => data?.orders.filter((o) => o.status === 'paid') ?? [], [data?.orders]);

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

  const renderOrderCard = (order: OrderWithItems) => (
    <Card key={order.id}>
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="font-semibold text-slate-800">Order #{order.id}</p>
          <p className="text-slate-500">Meja {order.table_id ?? '-'}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.quantity}x {item.menu_name}
            </span>
            <span className="font-medium">{formatIDR(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between text-sm">
        <p className="font-semibold text-slate-800">{formatIDR(order.total)}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {order.status === 'pending' && (
            <button
              className="rounded-lg bg-blue-50 px-3 py-1 font-semibold text-blue-700 hover:bg-blue-100"
              onClick={() => updateStatus(order.id, 'accepted')}
            >
              Terima
            </button>
          )}
          {order.status === 'accepted' && (
            <button
              className="rounded-lg bg-orange-50 px-3 py-1 font-semibold text-orange-700 hover:bg-orange-100"
              onClick={() => updateStatus(order.id, 'preparing')}
            >
              Proses
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              className="rounded-lg bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
              onClick={() => updateStatus(order.id, 'served')}
            >
              Sajikan
            </button>
          )}
          {order.status === 'served' && (
            <button
              className="rounded-lg bg-teal-600 px-3 py-1 font-semibold text-white shadow-sm hover:bg-teal-700"
              onClick={() => updateStatus(order.id, 'paid')}
            >
              Tandai Lunas
            </button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Kasir</p>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard Pesanan</h1>
            <p className="text-sm text-slate-600">Pantau alur pesanan dan buat order baru.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button className="rounded-xl border border-emerald-200 px-3 py-2 font-semibold text-emerald-700" onClick={() => mutate()}>
              Refresh
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <p className="text-sm text-slate-500">Menunggu</p>
            <p className="text-3xl font-bold text-amber-600">{pending.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Diproses</p>
            <p className="text-3xl font-bold text-blue-600">{inProgress.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Siap Saji</p>
            <p className="text-3xl font-bold text-emerald-600">{ready.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Lunas</p>
            <p className="text-3xl font-bold text-teal-600">{paid.length}</p>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <h2 className="text-lg font-semibold text-slate-800">Menunggu ({pending.length})</h2>
              </div>
              {pending.length ? (
                <div className="grid gap-3 md:grid-cols-2">{pending.map((order) => renderOrderCard(order))}</div>
              ) : (
                <Card>Semua pesanan sudah ditangani.</Card>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <h2 className="text-lg font-semibold text-slate-800">Sedang diproses ({inProgress.length})</h2>
              </div>
              {inProgress.length ? (
                <div className="grid gap-3 md:grid-cols-2">{inProgress.map((order) => renderOrderCard(order))}</div>
              ) : (
                <Card>Belum ada pesanan di dapur.</Card>
              )}
            </div>

            {ready.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h2 className="text-lg font-semibold text-slate-800">Siap disajikan ({ready.length})</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">{ready.map((order) => renderOrderCard(order))}</div>
              </div>
            )}
          </div>

          <Card>
            <h2 className="text-lg font-semibold text-slate-800">Buat pesanan langsung</h2>
            <p className="mt-1 text-sm text-slate-600">Input singkat untuk pelanggan walk-in.</p>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex flex-col gap-1">
                <span>Meja</span>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2"
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
              <label className="flex flex-col gap-1">
                <span>Nama pelanggan</span>
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Menu</span>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2"
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
              <label className="flex flex-col gap-1">
                <span>Qty</span>
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Catatan</span>
                <textarea
                  className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <button
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                onClick={createOrder}
              >
                Simpan Pesanan
              </button>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
