import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { MenuItem, Order, OrderWithItems, Table } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const menu = await query<MenuItem>('SELECT * FROM menu_items ORDER BY category, name');
  const tables = await query<Table>('SELECT * FROM tables ORDER BY id');
  const ordersBase = await query<Order>('SELECT * FROM orders ORDER BY created_at DESC LIMIT 24');
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

  const todayRevenue = (
    await query<{ total: number }>(
      "SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status = 'paid' AND date(created_at) = date('now','localtime')"
    )
  ).rows[0]?.total;

  const summary = {
    openOrders: orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled').length,
    revenueToday: todayRevenue ?? 0,
    menuCount: menu.rows.length,
    availableTables: tables.rows.filter((t) => t.status === 'available').length
  };

  return NextResponse.json({
    menuItems: menu.rows,
    tables: tables.rows,
    orders,
    summary
  });
}
