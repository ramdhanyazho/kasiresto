import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { orderSchema, orderStatusSchema } from '@/lib/validators';
import { z } from 'zod';
import type { MenuItem, Order, OrderWithItems } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ordersBase = await query<Order>('SELECT * FROM orders ORDER BY created_at DESC LIMIT 30');
  const orderIds = ordersBase.rows.map((o) => o.id);

  let items: Array<
    {
      menu_name?: string;
      menu_category?: string;
    } & { id: number; order_id: number; menu_item_id: number; quantity: number; price: number }
  > = [];

  if (orderIds.length) {
    const placeholders = orderIds.map(() => '?').join(',');
    items =
      (
        await query(
          `SELECT oi.*, m.name as menu_name, m.category as menu_category
           FROM order_items oi
           LEFT JOIN menu_items m ON m.id = oi.menu_item_id
           WHERE oi.order_id IN (${placeholders})`,
          orderIds
        )
      ).rows ?? [];
  }

  const orders: OrderWithItems[] = ordersBase.rows.map((order) => ({
    ...order,
    items: items.filter((i) => i.order_id === order.id)
  }));

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  try {
    const payload = orderSchema.parse(await req.json());
    const menuIds = payload.items.map((i) => i.menu_item_id);
    const placeholders = menuIds.map(() => '?').join(',');
    const menus = await query<MenuItem>(`SELECT id, price FROM menu_items WHERE id IN (${placeholders})`, menuIds);
    const menuMap = new Map(menus.rows.map((m) => [m.id, m.price]));

    if (menus.rows.length !== menuIds.length) {
      return NextResponse.json({ error: 'Ada menu yang tidak ditemukan' }, { status: 400 });
    }

    const total = payload.items.reduce((sum, item) => sum + (menuMap.get(item.menu_item_id) ?? 0) * item.quantity, 0);

    const orderResult = await query<Order>(
      `INSERT INTO orders (table_id, customer_name, status, total, payment_method)
       VALUES (?, ?, 'pending', ?, ?)
       RETURNING *`,
      [payload.table_id, payload.customer_name, total, payload.payment_method]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of payload.items) {
      await query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price, note)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.menu_item_id, item.quantity, menuMap.get(item.menu_item_id) ?? 0, item.note ?? null]
      );
    }

    if (payload.table_id) {
      await query("UPDATE tables SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [payload.table_id]);
    }

    return NextResponse.json({ order: orderResult.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal membuat pesanan';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = orderStatusSchema.parse(await req.json());
    await query('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [payload.status, payload.id]);

    if (payload.status === 'paid') {
      const table = await query<{ table_id: number | null }>('SELECT table_id FROM orders WHERE id = ?', [payload.id]);
      const tableId = table.rows[0]?.table_id;
      if (tableId) {
        await query("UPDATE tables SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [tableId]);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(', ') : 'Gagal update status pesanan';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
