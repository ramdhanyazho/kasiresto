'use client';

import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { MenuItem, Table } from '@/lib/types';
import { formatIDR } from '@/lib/format';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DashboardData = { menuItems: MenuItem[]; tables: Table[] };

type StatusBadgeProps = { label: string; tone?: 'emerald' | 'amber' | 'red' | 'slate' };
const StatusBadge = ({ label, tone = 'emerald' }: StatusBadgeProps) => {
  const colors: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${colors[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

const ActionButton = ({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
  </button>
);

export default function OrderPage() {
  const params = useParams<{ tableId: string }>();
  const router = useRouter();
  const { data, isLoading } = useSWR<DashboardData>('/api/dashboard', fetcher, { refreshInterval: 12000 });
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState('Tamu');
  const [isSending, setIsSending] = useState(false);

  const table = data?.tables.find((t) => t.id === Number(params.tableId));
  const activeMenu = useMemo(() => data?.menuItems.filter((m) => m.is_available) ?? [], [data?.menuItems]);

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

  const removeItem = (id: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return next;
      if (next[id] === 1) delete next[id];
      else next[id] -= 1;
      return next;
    });
  };

  const submitOrder = async () => {
    if (!Object.keys(cart).length) return;
    setIsSending(true);
    const items = Object.entries(cart).map(([menuId, quantity]) => ({
      menu_item_id: Number(menuId),
      quantity,
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
    setCart({});
    router.push('/kasir');
  };

  if (isLoading || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Self-order</p>
            <h1 className="text-2xl font-bold text-slate-800">Nadha Resto</h1>
            <p className="text-sm text-slate-600">Pilih menu favorit lalu kirimkan ke kasir.</p>
          </div>
          <StatusBadge
            label={table ? `Meja ${table.label} (${table.status})` : `Meja ${params.tableId}`}
            tone={table?.status === 'available' ? 'emerald' : table?.status === 'occupied' ? 'amber' : 'slate'}
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 pb-28">
        <div className="grid gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-emerald-100 md:grid-cols-[2fr,1fr]">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Nama pelanggan</span>
            <input
              className="rounded-xl border border-emerald-100 px-4 py-3 text-slate-800 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-white shadow-lg">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-100">Total sementara</p>
              <p className="text-xl font-semibold">{formatIDR(total)}</p>
            </div>
            <StatusBadge label={`${Object.values(cart).reduce((a, b) => a + b, 0)} item`} tone="amber" />
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Pilih menu</h2>
            <p className="text-sm text-slate-500">Tap untuk menambah, tahan - untuk mengurangi.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {activeMenu.map((menu) => (
              <div
                key={menu.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="space-y-1">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {menu.category}
                  </span>
                  <h3 className="text-base font-semibold text-slate-800">{menu.name}</h3>
                  <p className="text-sm font-medium text-emerald-700">{formatIDR(menu.price)}</p>
                  <p className="text-xs text-slate-500">Klik untuk tambah ke keranjang</p>
                </div>
                <div className="flex items-center gap-2">
                  {cart[menu.id] ? (
                    <div className="flex items-center overflow-hidden rounded-xl border border-emerald-200 shadow-sm">
                      <button
                        onClick={() => removeItem(menu.id)}
                        className="h-9 w-9 bg-emerald-50 text-lg font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        –
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-semibold text-slate-800">{cart[menu.id]}</span>
                      <button
                        onClick={() => addItem(menu.id)}
                        className="h-9 w-9 bg-emerald-600 text-lg font-bold text-white transition hover:bg-emerald-700"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItem(menu.id)}
                      className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800"
                    >
                      Pilih
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!activeMenu.length && (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                Menu belum tersedia.
              </div>
            )}
          </div>
        </section>
      </main>

      {Boolean(Object.keys(cart).length) && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-emerald-100 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">Total {formatIDR(total)}</p>
              <p className="text-xs text-slate-600">{Object.values(cart).reduce((a, b) => a + b, 0)} item dalam keranjang</p>
            </div>
            <ActionButton onClick={submitOrder} disabled={isSending}>
              {isSending ? 'Mengirim...' : 'Kirim ke kasir'}
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
