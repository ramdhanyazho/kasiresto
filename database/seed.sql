-- Data awal untuk development / demo
INSERT INTO menu_items (name, category, price, is_available, photo_url) VALUES
  ('Nasi Goreng Spesial', 'Makanan', 25000, 1, NULL),
  ('Ayam Bakar Madu', 'Makanan', 32000, 1, NULL),
  ('Mie Tektek', 'Makanan', 18000, 1, NULL),
  ('Es Teh Manis', 'Minuman', 6000, 1, NULL),
  ('Kopi Susu Aren', 'Minuman', 16000, 1, NULL),
  ('Es Jeruk', 'Minuman', 8000, 1, NULL);

INSERT INTO tables (label, capacity, status) VALUES
  ('A1', 2, 'available'),
  ('A2', 2, 'available'),
  ('B1', 4, 'reserved'),
  ('B2', 4, 'occupied'),
  ('VIP', 6, 'available');

INSERT INTO staff (name, role, pin) VALUES
  ('Admin Utama', 'admin', '1234'),
  ('Kasir 1', 'cashier', '2222'),
  ('Chef Dapur', 'kitchen', NULL),
  ('Waiter 1', 'waiter', NULL);

INSERT INTO inventory (name, stock, unit, threshold) VALUES
  ('Beras', 50, 'kg', 20),
  ('Ayam', 30, 'kg', 10),
  ('Telur', 200, 'butir', 80),
  ('Gula', 25, 'kg', 10);
