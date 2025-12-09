'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Login gagal');
      setIsLoading(false);
      return;
    }

    const role = data.user?.role;
    if (role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/kasir');
    }
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm text-slate-500">Kasiresto POS</p>
        <h1 className="text-2xl font-semibold">Masuk</h1>
      </div>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm">
          <span>Email</span>
          <input
            className="rounded border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Password</span>
          <input
            className="rounded border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {isLoading ? 'Memproses...' : 'Login'}
        </button>
      </form>
      <div className="rounded border p-3 text-xs text-slate-600">
        <p>Demo role:</p>
        <ul className="list-disc pl-4">
          <li>Admin: admin@example.com / admin123</li>
          <li>Kasir: kasir@example.com / kasir123</li>
        </ul>
      </div>
    </main>
  );
}
