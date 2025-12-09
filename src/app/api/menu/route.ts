import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { menuSchema } from '@/lib/validators';
import { z } from 'zod';
import type { MenuItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const menu = await query<MenuItem>('SELECT * FROM menu_items ORDER BY category, name');
  return NextResponse.json({ menuItems: menu.rows });
}

export async function POST(req: Request) {
  try {
    const payload = menuSchema.parse(await req.json());
    const result = await query<MenuItem>(
      `INSERT INTO menu_items (name, category, price, is_available, photo_url)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [payload.name, payload.category, payload.price, payload.is_available ? 1 : 0, payload.photo_url ?? null]
    );

    return NextResponse.json({ menuItem: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal menambah menu';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = menuSchema.extend({ id: z.number().int().positive() }).parse(await req.json());
    await query(
      `UPDATE menu_items
       SET name = ?, category = ?, price = ?, is_available = ?, photo_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payload.name, payload.category, payload.price, payload.is_available ? 1 : 0, payload.photo_url ?? null, payload.id]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal update menu';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = z.object({ id: z.number().int().positive() }).parse(await req.json());
    await query('DELETE FROM menu_items WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal menghapus menu';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
