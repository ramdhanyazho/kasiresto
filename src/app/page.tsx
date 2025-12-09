'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { formatDate, formatIDR } from '@/lib/format';
import type { MenuItem, OrderWithItems, Table } from '@/lib/types';

type DashboardData = {
  menuItems: MenuItem[];
  tables: Table[];
  orders: OrderWithItems[];
  summary: {
    openOrders: number;
    revenueToday: number;
    menuCount: number;
    availableTables: number;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type NewOrderItem = { menu_item_id: number; quantity: number; note?: string };

const pageHighlights = {
  admin: [
    'Input menu, harga, dan ketersediaan dari satu tempat',
    'Catat identitas pelanggan agar kasir tahu pemilik pesanan',
    'Sinkron Turso sehingga data aman dan rapi'
  ],
  kasir: [
    'Tiket pesanan kasir terpisah dari input admin',
    'Pilih meja, metode bayar, dan kirim ke printer Bluetooth POS',
    'Pantau status: diterima, dimasak, diantar, dibayar'
  ],
  pelanggan: [
    'URL khusus per meja untuk QR scan',
    'Order mandiri tanpa bercampur panel kasir',
    'Nomor meja otomatis tersimpan saat checkout'
  ]
};

export default function Page() {
  const { data, isLoading, mutate } = useSWR<DashboardData>('/api/dashboard', fetcher, {
    refreshInterval: 12_000
  });
  const [orderForm, setOrderForm] = useState<{
    table_id: number | null;
    customer_name: string;
    payment_method: string;
    items: NewOrderItem[];
  }>({
    table_id: null,
    customer_name: 'Walk-in',
    payment_method: 'cash',
    items: []
  });
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Umum',
    price: 0,
    is_available: true,
    photo_url: ''
  });
  const [menuPhoto, setMenuPhoto] = useState<File | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    note: ''
  });
  const [printReceipt, setPrintReceipt] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const menuLookup = useMemo(() => {
    const map = new Map<number, MenuItem>();
    data?.menuItems.forEach((m) => map.set(m.id, m));
    return map;
  }, [data?.menuItems]);

  const knownCustomers = useMemo(() => {
    const names = new Set<string>();
    (data?.orders ?? []).forEach((order) => {
      if (order.customer_name) {
        names.add(order.customer_name);
      }
    });
    return Array.from(names);
  }, [data?.orders]);

  const addOrderItem = (menuId: number) => {
    setOrderForm((prev) => {
      const existing = prev.items.find((i) => i.menu_item_id === menuId);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.menu_item_id === menuId ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i
          )
        };
      }
      return { ...prev, items: [...prev.items, { menu_item_id: menuId, quantity: 1 }] };
    });
  };

  const updateOrderItem = (menuId: number, qty: number) => {
    setOrderForm((prev) => ({
      ...prev,
      items:
        qty <= 0 ? prev.items.filter((i) => i.menu_item_id !== menuId) : prev.items.map((i) => (i.menu_item_id === menuId ? { ...i, quantity: qty } : i))
    }));
  };

  const resetOrderForm = () => {
    setOrderForm({
      table_id: null,
      customer_name: 'Walk-in',
      payment_method: 'cash',
      items: []
    });
  };

  const submitOrder = async () => {
    if (!orderForm.items.length) {
      setMessage('Tambah minimal satu item sebelum simpan pesanan.');
      return;
    }
    const payload = {
      ...orderForm,
      customer_name: orderForm.customer_name.trim() || 'Walk-in'
    };
    setMessage('Menyimpan pesanan...');
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setMessage(err?.error ?? 'Gagal membuat pesanan');
      return;
    }
    resetOrderForm();
    setMessage(printReceipt ? 'Pesanan tersimpan & siap dicetak via POS Bluetooth' : 'Pesanan tersimpan');
    mutate();
  };

  const updateOrderStatus = async (id: number, status: OrderWithItems['status']) => {
    setMessage(`Update status pesanan #${id} -> ${status}`);
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    mutate();
  };

  const saveCustomer = () => {
    if (customerForm.name.trim().length < 2) {
      setMessage('Nama pelanggan wajib diisi.');
      return;
    }
    setMessage(`Data pelanggan ${customerForm.name} dicatat untuk kasir.`);
    setCustomerForm({ name: '', phone: '', note: '' });
  };

  const tableUrl = (table: Table) => `https://kasiresto.app/order?table=${table.id}`;

  const uploadMenuPhoto = async () => {
    if (!menuPhoto) return undefined;

    const formData = new FormData();
    formData.append('file', menuPhoto);
    formData.append('filename', menuPhoto.name);

    const upload = await fetch('/api/menu/upload', {
      method: 'POST',
      body: formData
    });

    if (!upload.ok) {
      const err = await upload.json().catch(() => null);
      throw new Error(err?.error ?? 'Gagal mengunggah foto');
    }

    const data = (await upload.json()) as { url?: string };
    return data.url;
  };

  const submitMenu = async () => {
    if (menuForm.name.trim().length < 2) {
      setMessage('Nama menu minimal 2 karakter');
      return;
    }
    setMessage('Menyimpan menu...');
    let photoUrl = menuForm.photo_url?.trim() || undefined;

    try {
      const uploadedUrl = await uploadMenuPhoto();
      photoUrl = uploadedUrl ?? photoUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload foto gagal';
      setMessage(message);
      return;
    }
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...menuForm, photo_url: photoUrl ?? null })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setMessage(err?.error ?? 'Gagal menyimpan menu');
      return;
    }
    setMenuForm({ name: '', category: 'Umum', price: 0, is_available: true, photo_url: '' });
    setMenuPhoto(null);
    setMessage('Menu baru ditambahkan');
    mutate();
  };

  const toggleTable = async (table: Table) => {
    const next =
      table.status === 'available'
        ? 'occupied'
        : table.status === 'occupied'
          ? 'dirty'
          : 'available';
    setMessage(`Ubah status meja ${table.label} -> ${next}`);
    await fetch('/api/tables', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: table.id, status: next })
    });
    mutate();
  };

  const orderTotal = orderForm.items.reduce((sum, item) => {
    const menu = menuLookup.get(item.menu_item_id);
    return sum + (menu?.price ?? 0) * item.quantity;
  }, 0);

  const statusToBadge = (status: OrderWithItems['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'served':
        return 'info';
      case 'preparing':
      case 'accepted':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <main className="grid gap-14">
      <section className="grid grid-cols-3">
        <div className="card">
          <div className="flex space-between align-center" style={{ marginBottom: 8 }}>
            <h3>Panel Admin</h3>
            <span className="tag">Menu & pelanggan</span>
          </div>
          <div className="list">
            {pageHighlights.admin.map((item) => (
              <div className="list-item" key={item}>
                <div className="feature-dot" />
                <div>{item}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex space-between align-center" style={{ marginBottom: 8 }}>
            <h3>Kasir & Transaksi</h3>
            <span className="tag">Bluetooth POS</span>
          </div>
          <div className="list">
            {pageHighlights.kasir.map((item) => (
              <div className="list-item" key={item}>
                <div className="feature-dot" />
                <div>{item}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex space-between align-center" style={{ marginBottom: 8 }}>
            <h3>Halaman Pelanggan</h3>
            <span className="tag">QR tiap meja</span>
          </div>
          <div className="list">
            {pageHighlights.pelanggan.map((item) => (
              <div className="list-item" key={item}>
                <div className="feature-dot" />
                <div>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3">
        <div className="card">
          <div className="stat">
            <div>
              <p className="muted">Antrian aktif</p>
              <div className="value">{data?.summary.openOrders ?? 0}</div>
            </div>
            <span className="pill info">Kasir</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div>
              <p className="muted">Pendapatan hari ini</p>
              <div className="value">{formatIDR(data?.summary.revenueToday ?? 0)}</div>
            </div>
            <span className="pill success">Paid</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div>
              <p className="muted">Meja tersedia</p>
              <div className="value">
                {data?.summary.availableTables ?? 0}/{data?.tables.length ?? 0}
              </div>
            </div>
            <span className="pill">{data?.summary.menuCount ?? 0} menu</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2">
        <div className="card">
          <div className="flex space-between align-center">
            <h3>Pesanan aktif (Kasir)</h3>
            <span className="tag">{data?.orders.length ?? 0} tiket</span>
          </div>
          <div className="order-grid">
            {isLoading && <p className="muted">Memuat data...</p>}
            {data?.orders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="flex space-between align-center">
                  <div>
                    <strong>#{order.id}</strong>{' '}
                    <span className="muted">{order.customer_name ?? 'Walk-in'}</span>
                    <div className="small-text">{formatDate(order.created_at ?? '')}</div>
                  </div>
                  <span className={`pill ${statusToBadge(order.status)}`}>{order.status}</span>
                </div>
                <div className="order-items">
                  {order.items.map((item) => (
                    <div className="row" key={item.id}>
                      <span>
                        {item.quantity}x {item.menu_name ?? 'Menu'}{' '}
                        <span className="small-text">({item.menu_category ?? '-'})</span>
                      </span>
                      <span>{formatIDR(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="divider" />
                <div className="flex space-between align-center">
                  <span className="muted">Total</span>
                  <strong>{formatIDR(order.total)}</strong>
                </div>
                <div className="badge-row">
                  {order.status !== 'paid' && order.status !== 'cancelled' && (
                    <>
                      <button className="button" onClick={() => updateOrderStatus(order.id, 'accepted')}>
                        Terima
                      </button>
                      <button className="button" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                        Masak
                      </button>
                      <button className="button" onClick={() => updateOrderStatus(order.id, 'served')}>
                        Antar
                      </button>
                      <button className="button primary" onClick={() => updateOrderStatus(order.id, 'paid')}>
                        Bayar
                      </button>
                      <button className="button ghost" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                        Batal
                      </button>
                    </>
                  )}
                  {(order.status === 'paid' || order.status === 'cancelled') && <span className="muted">Tiket selesai</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex space-between align-center">
            <h3>Transaksi kasir</h3>
            <span className="tag">Pisah dari admin</span>
          </div>
          <div className="form">
            <label>
              Nama pelanggan
              <input
                value={orderForm.customer_name}
                onChange={(e) => setOrderForm((p) => ({ ...p, customer_name: e.target.value }))}
                placeholder="Walk-in / nama pelanggan"
              />
            </label>
            <label>
              Meja
              <select
                value={orderForm.table_id ?? ''}
                onChange={(e) =>
                  setOrderForm((p) => ({
                    ...p,
                    table_id: e.target.value === '' ? null : Number(e.target.value)
                  }))
                }
              >
                <option value="">Tanpa meja</option>
                {data?.tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.label} · {table.status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pembayaran
              <select value={orderForm.payment_method} onChange={(e) => setOrderForm((p) => ({ ...p, payment_method: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
                <option value="card">Kartu</option>
              </select>
            </label>
            <label className="flex align-center gap-8">
              <input type="checkbox" checked={printReceipt} onChange={(e) => setPrintReceipt(e.target.checked)} />
              Kirim struk ke printer Bluetooth POS
            </label>
            <div className="divider" />
            <div>
              <div className="flex space-between align-center">
                <p className="muted">Tambahkan menu</p>
                <span className="pill info">{orderForm.items.length} item</span>
              </div>
              <div className="list">
                {data?.menuItems.map((menu) => (
                  <div className="list-item" key={menu.id}>
                    <div>
                      <strong>{menu.name}</strong>
                      <div className="small-text">
                        {menu.category} · {formatIDR(menu.price)}
                      </div>
                    </div>
                    <div className="badge-row">
                      <span className="pill">{menu.is_available ? 'Ready' : 'Habis'}</span>
                      <button className="button" onClick={() => addOrderItem(menu.id)}>
                        Tambah
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {orderForm.items.length > 0 && (
              <div className="card" style={{ borderColor: 'var(--line)' }}>
                <div className="flex space-between align-center">
                  <strong>Keranjang</strong>
                  <span className="pill">{formatIDR(orderTotal)}</span>
                </div>
                <div className="list">
                  {orderForm.items.map((item) => (
                    <div className="list-item" key={item.menu_item_id}>
                      <div>
                        <div>{menuLookup.get(item.menu_item_id)?.name ?? 'Menu'}</div>
                        <div className="small-text">{formatIDR(menuLookup.get(item.menu_item_id)?.price ?? 0)}</div>
                      </div>
                      <div className="badge-row">
                        <input
                          style={{ width: 64 }}
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(item.menu_item_id, Number(e.target.value))}
                        />
                        <button className="button ghost" onClick={() => updateOrderItem(item.menu_item_id, 0)}>
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="button primary" onClick={submitOrder}>
              Simpan pesanan ({formatIDR(orderTotal)})
            </button>
            {message && <p className="small-text">{message}</p>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2">
        <div className="card">
          <div className="flex space-between align-center">
            <h3>Panel Admin: menu & pelanggan</h3>
            <span className="tag">Tidak tercampur kasir</span>
          </div>
          <div className="list">
            {data?.menuItems.map((menu) => (
              <div className="list-item" key={menu.id}>
                <div>
                  <strong>{menu.name}</strong>
                  <div className="small-text">
                    {menu.category} · {formatIDR(menu.price)}
                  </div>
                </div>
                <div className="menu-tags">
                  <span className={`pill ${menu.is_available ? 'success' : 'danger'}`}>{menu.is_available ? 'Ready' : 'Habis'}</span>
                  {menu.photo_url && <span className="pill info">Foto</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="divider" style={{ margin: '12px 0' }} />
          <div className="form">
            <label>
              Nama menu
              <input value={menuForm.name} onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: Nasi Goreng" />
            </label>
            <label>
              Kategori
              <input value={menuForm.category} onChange={(e) => setMenuForm((p) => ({ ...p, category: e.target.value }))} placeholder="Makanan / Minuman" />
            </label>
            <label>
              Harga (IDR)
              <input
                type="number"
                min={0}
                value={menuForm.price}
                onChange={(e) => setMenuForm((p) => ({ ...p, price: Number(e.target.value) }))}
                placeholder="20000"
              />
            </label>
            <label>
              Foto menu (opsional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMenuPhoto(e.target.files?.[0] ?? null)}
              />
              {menuPhoto && <span className="small-text">{menuPhoto.name}</span>}
            </label>
            <label>
              URL foto (jika sudah ada)
              <input
                value={menuForm.photo_url}
                onChange={(e) => setMenuForm((p) => ({ ...p, photo_url: e.target.value }))}
                placeholder="https://..."
              />
            </label>
            <label className="flex align-center gap-8">
              <input type="checkbox" checked={menuForm.is_available} onChange={(e) => setMenuForm((p) => ({ ...p, is_available: e.target.checked }))} />
              Tersedia
            </label>
            <button className="button primary" onClick={submitMenu}>
              Tambah menu
            </button>
          </div>
        </div>
        <div className="card">
          <div className="flex space-between align-center">
            <h3>Data pelanggan</h3>
            <span className="tag">Terpisah dari kasir</span>
          </div>
          <div className="form">
            <label>
              Nama pelanggan
              <input
                value={customerForm.name}
                onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama pemesan"
              />
            </label>
            <label>
              Nomor kontak
              <input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="08xxxxxxxx"
              />
            </label>
            <label>
              Catatan preferensi
              <textarea
                rows={3}
                value={customerForm.note}
                onChange={(e) => setCustomerForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Allergen / permintaan khusus"
              />
            </label>
            <button className="button" onClick={saveCustomer}>
              Simpan pelanggan
            </button>
            {!!knownCustomers.length && (
              <small>Terdaftar: {knownCustomers.join(', ')}</small>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2">
        <div className="card">
          <div className="flex space-between align-center">
            <h3>Halaman pelanggan per meja</h3>
            <span className="tag">Self service</span>
          </div>
          <div className="table-grid">
            {data?.tables.map((table) => (
              <div className="table-card" key={table.id}>
                <div className="flex space-between align-center">
                  <strong>{table.label}</strong>
                  <span className={`pill ${table.status === 'available' ? 'success' : table.status === 'reserved' ? 'warning' : 'danger'}`}>{table.status}</span>
                </div>
                <div className="small-text">Kapasitas {table.capacity} orang</div>
                <div className="small-text" style={{ margin: '6px 0' }}>
                  URL meja: <code>{tableUrl(table)}</code>
                </div>
                <button className="button" onClick={() => toggleTable(table)}>
                  Tandai {table.status === 'available' ? 'dipakai' : 'selesai'}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex space-between align-center">
            <h3>Panduan alur terpisah</h3>
            <span className="tag">QRIS + POS</span>
          </div>
          <div className="list">
            <div className="list-item">
              <div>
                <strong>Admin</strong>
                <div className="small-text">Kelola menu, harga, stok, dan data pelanggan</div>
              </div>
              <span className="pill info">/admin</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Kasir</strong>
                <div className="small-text">Input pesanan lalu cetak ke printer Bluetooth</div>
              </div>
              <span className="pill info">/transaksi</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Pelanggan</strong>
                <div className="small-text">Scan QR meja, order mandiri, bayar QRIS</div>
              </div>
              <span className="pill info">/order?table=xx</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
