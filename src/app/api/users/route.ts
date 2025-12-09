import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { User } from '@/lib/types';

export async function GET() {
  const users = await query<User>('SELECT id, email, name, role FROM users ORDER BY id');
  return NextResponse.json({ users: users.rows });
}
