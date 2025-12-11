import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { User } from '@/lib/types';
import { userCreateSchema, userUpdateSchema } from '@/lib/validators';
import { z } from 'zod';

export async function GET() {
  const users = await query<User>('SELECT id, email, name, role FROM users ORDER BY id');
  return NextResponse.json({ users: users.rows });
}

export async function POST(req: Request) {
  try {
    const payload = userCreateSchema.parse(await req.json());
    const result = await query<User>(
      `INSERT INTO users (name, email, role, password)
       VALUES (?, ?, ?, ?)
       RETURNING id, name, email, role`,
      [payload.name, payload.email, payload.role, payload.password]
    );

    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal menambah pengguna';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = userUpdateSchema.parse(await req.json());

    const fields = [payload.name, payload.email, payload.role];
    let updateSql = 'UPDATE users SET name = ?, email = ?, role = ?';

    if (payload.password) {
      updateSql += ', password = ?';
      fields.push(payload.password);
    }

    updateSql += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    fields.push(payload.id);

    await query(updateSql, fields);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal memperbarui pengguna';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = z.object({ id: z.number().int().positive() }).parse(await req.json());
    await query('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal menghapus pengguna';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
