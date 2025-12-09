import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { tableSchema, tableUpdateSchema } from '@/lib/validators';
import { z } from 'zod';
import type { Table } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tables = await query<Table>('SELECT * FROM tables ORDER BY id');
  return NextResponse.json({ tables: tables.rows });
}

export async function POST(req: Request) {
  try {
    const payload = tableSchema.parse(await req.json());
    const result = await query<Table>(
      `INSERT INTO tables (label, capacity, status, note)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
      [payload.label, payload.capacity, payload.status, payload.note ?? null]
    );
    return NextResponse.json({ table: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal menambah meja';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = tableUpdateSchema.parse(await req.json());
    await query(
      `UPDATE tables
       SET label = COALESCE(?, label),
           capacity = COALESCE(?, capacity),
           status = COALESCE(?, status),
           note = COALESCE(?, note),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payload.label ?? null, payload.capacity ?? null, payload.status ?? null, payload.note ?? null, payload.id]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal update meja';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
