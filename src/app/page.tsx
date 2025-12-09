import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-bold">Kasiresto POS</h1>
      <p className="text-slate-600">
        Demo sistem POS resto dengan mode self-order pelanggan, dashboard kasir, dan panel admin sederhana.
        Silakan login untuk melanjutkan.
      </p>
      <div className="flex gap-3">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/login">
          Masuk
        </Link>
        <Link className="rounded border px-4 py-2" href="/order/1">
          Coba Self-Order
        </Link>
      </div>
      <div className="rounded border p-4 text-sm text-slate-700">
        <p className="font-semibold">Akun contoh</p>
        <ul className="list-disc pl-5">
          <li>Admin: admin@example.com / admin123</li>
          <li>Kasir: kasir@example.com / kasir123</li>
        </ul>
      </div>
    </main>
  );
}
