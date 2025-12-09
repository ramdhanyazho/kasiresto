export type MenuItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  is_available: number;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Table = {
  id: number;
  label: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'dirty';
  note?: string | null;
  updated_at?: string;
};

export type Order = {
  id: number;
  table_id: number | null;
  customer_name: string | null;
  status: 'pending' | 'accepted' | 'preparing' | 'served' | 'paid' | 'cancelled';
  total: number;
  payment_method: string | null;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  note?: string | null;
};

export type OrderWithItems = Order & {
  items: Array<
    OrderItem & {
      menu_name?: string;
      menu_category?: string;
    }
  >;
};

export type Staff = {
  id: number;
  name: string;
  role: 'admin' | 'cashier' | 'kitchen' | 'waiter';
  pin?: string | null;
};

export type InventoryItem = {
  id: number;
  name: string;
  stock: number;
  unit: string;
  threshold: number;
  updated_at?: string;
};
