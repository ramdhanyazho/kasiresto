import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { loginSchema } from '@/lib/validators';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth';
import type { User } from '@/lib/types';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const payload = loginSchema.parse(await req.json());
    const result = await query<User>(
      'SELECT id, email, name, role, password FROM users WHERE email = ? LIMIT 1',
      [payload.email]
    );

    const user = result.rows[0];
    if (!user || user.password !== payload.password) {
      return NextResponse.json({ error: 'Email atau password tidak valid' }, { status: 401 });
    }

    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    setSessionCookie(res, { id: user.id, email: user.email, name: user.name, role: user.role });
    return res;
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Format login tidak valid' : 'Gagal login';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
