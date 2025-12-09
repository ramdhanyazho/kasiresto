'use client';

import useSWR from 'swr';
import type { MenuItem, Table, User } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type AdminData = {
  menuItems: MenuItem[];
  tables: Table[];
};

const statusTone: Record<Table['status'], string> = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  occupied: 'bg-amber-50 text-amber-700 border-amber-200',
  reserved: 'bg-blue-50 text-blue-700 border-blue-200',
  dirty: 'bg-red-50 text-red-700 border-red-200'
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">{children}</div>
);

export default function AdminPage() {
  const { data: dashboard } = useSWR<AdminData>('/api/dashboard', fetcher);
  const { data: users } = useSWR<{ users: User[] }>('/api/users', fetcher);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">Admin</p>
            <h1 className="text-3xl font-bold text-slate-800">Manajemen Resto</h1>
            <p className="text-sm text-slate-600">Pantau menu, meja, dan role pengguna dalam satu panel.</p>
          </div>
          <div className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-200">
            Demo dashboard
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">Menu aktif</p>
            <p className="text-3xl font-bold text-indigo-700">{dashboard?.menuItems.length ?? 0}</p>
            <p className="text-xs text-slate-500">Semua menu yang tersedia untuk dipesan.</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Jumlah meja</p>
            <p className="text-3xl font-bold text-emerald-700">{dashboard?.tables.length ?? 0}</p>
            <p className="text-xs text-slate-500">Status realtime dari meja di lantai.</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">User</p>
            <p className="text-3xl font-bold text-amber-600">{users?.users.length ?? 0}</p>
            <p className="text-xs text-slate-500">Akun demo untuk akses kasir/admin.</p>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <Card>
            <h2 className="text-lg font-semibold text-slate-800">User & Role</h2>
            <p className="text-sm text-slate-600">Daftar akun demo untuk akses kasir dan admin.</p>
            <div className="mt-3 overflow-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{user.email}</td>
                      <td className="px-3 py-2">{user.name}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase text-indigo-700">
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!users?.users.length && (
                    <tr>
                      <td className="px-3 py-4 text-center text-slate-500" colSpan={3}>
                        Belum ada user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-800">Menu ringkas</h2>
            <p className="text-sm text-slate-600">Snapshot kategori dan harga.</p>
            <div className="mt-3 space-y-2">
              {dashboard?.menuItems.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.category}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Rp{m.price.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {!dashboard?.menuItems.length && <p className="text-sm text-slate-500">Tidak ada menu.</p>}
            </div>
          </Card>
        </section>

        <Card>
          <h2 className="text-lg font-semibold text-slate-800">Meja</h2>
          <p className="text-sm text-slate-600">Cek kapasitas dan status ketersediaan.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {dashboard?.tables.map((t) => (
              <div key={t.id} className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-slate-800">{t.label}</p>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[t.status]}`}>{t.status}</span>
                </div>
                <p className="text-sm text-slate-500">Kapasitas {t.capacity} orang</p>
                {t.note && <p className="text-xs text-amber-700">Catatan: {t.note}</p>}
              </div>
            ))}
            {!dashboard?.tables.length && <p className="text-sm text-slate-500">Belum ada data meja.</p>}
          </div>
        </Card>
      </div>
    </main>
  );
}
