import { z } from 'zod';

export const menuSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(2, 'Nama menu terlalu pendek'),
  category: z.string().min(2, 'Kategori wajib diisi'),
  price: z.coerce.number().int().nonnegative('Harga tidak valid'),
  is_available: z.boolean().default(true),
  photo_url: z
    .string()
    .url('URL foto tidak valid')
    .or(z.literal(''))
    .optional()
    .transform((v) => (v === '' ? undefined : v))
});

export const orderSchema = z.object({
  table_id: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  customer_name: z.string().min(1).max(120).default('Walk-in'),
  payment_method: z.string().min(2).default('cash'),
  items: z
    .array(
      z.object({
        menu_item_id: z.number().int().positive(),
        quantity: z.number().int().positive().max(99),
        note: z.string().max(120).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v))
      })
    )
    .min(1, 'Minimal 1 item pesanan')
});

export const orderStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['pending', 'accepted', 'preparing', 'served', 'paid', 'cancelled'])
});

export const tableSchema = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().min(1),
  capacity: z.number().int().positive().default(2),
  status: z.enum(['available', 'occupied', 'reserved', 'dirty']).default('available'),
  note: z.string().max(140).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v))
});

export const tableUpdateSchema = tableSchema.partial().extend({
  id: z.number().int().positive()
});
