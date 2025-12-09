'use client';

import useSWR from 'swr';
import type { MenuItem, Table, User } from '@/lib/types';

type AdminData = {
  menuItems: MenuItem[];
  tables: Table[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminPage() {
  const { data: dashboard } = useSWR<AdminData>('/api/dashboard', fetcher);
  const { data: users } = useSWR<{ users: User[] }>('/api/users', fetcher);

  return (
    <main className="flex flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">Manajemen Resto</h1>
        <p className="text-sm text-slate-600">Atur menu, meja, serta role pengguna.</p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded border p-3">
          <p className="text-sm text-slate-500">Menu aktif</p>
          <p className="text-2xl font-bold">{dashboard?.menuItems.length ?? 0}</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-sm text-slate-500">Jumlah meja</p>
          <p className="text-2xl font-bold">{dashboard?.tables.length ?? 0}</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-sm text-slate-500">User</p>
          <p className="text-2xl font-bold">{users?.users.length ?? 0}</p>
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">User & Role</h2>
        <p className="text-sm text-slate-600">Daftar akun demo untuk akses kasir dan admin.</p>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="border-b p-2">Email</th>
                <th className="border-b p-2">Nama</th>
                <th className="border-b p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users?.users.map((user) => (
                <tr key={user.id}>
                  <td className="border-b p-2">{user.email}</td>
                  <td className="border-b p-2">{user.name}</td>
                  <td className="border-b p-2">{user.role}</td>
                </tr>
              ))}
              {!users?.users.length && (
                <tr>
                  <td className="p-2 text-slate-500" colSpan={3}>
                    Belum ada user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">Menu (ringkas)</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {dashboard?.menuItems.map((m) => (
            <div key={m.id} className="rounded border p-2 text-sm">
              <div className="flex justify-between">
                <span>{m.name}</span>
                <span className="text-slate-500">{m.category}</span>
              </div>
            </div>
          ))}
          {!dashboard?.menuItems.length && <p className="text-sm text-slate-500">Tidak ada menu.</p>}
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">Meja</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {dashboard?.tables.map((t) => (
            <div key={t.id} className="rounded border p-2 text-sm">
              <p className="font-semibold">{t.label}</p>
              <p className="text-slate-500">Kapasitas {t.capacity}</p>
              <p className="text-xs uppercase">{t.status}</p>
            </div>
          ))}
          {!dashboard?.tables.length && <p className="text-sm text-slate-500">Belum ada data meja.</p>}
        </div>
      </section>
    </main>
  );
}
