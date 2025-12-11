'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { PlusCircle, MinusCircle, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIDR } from '@/lib/format';
import type { MenuItem } from '@/lib/types';

// --- Types ---
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};
type MenuApiResponse = {
  menuItems: MenuItem[];
};

// --- SWR Fetcher ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Skeleton Component for Loading State ---
const MenuGridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <CardHeader className="p-0">
          <Skeleton className="w-full h-32" />
        </CardHeader>
        <CardContent className="p-3">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

// --- Main Kasir Page Component ---
export default function KasirPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data, error, isLoading } = useSWR<MenuApiResponse>('/api/menu', fetcher);

  const menuItems = data?.menuItems ?? [];
  const menuCategories = useMemo(() => {
    const categories = menuItems.map(item => item.category);
    return [...new Set(categories)];
  }, [menuItems]);

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prevCart, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, amount: number) => {
    setCart((prevCart) => 
      prevCart
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + amount } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const payload = {
      payment_method: 'qris', // Hardcoded for now
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal membuat pesanan');
      }
      alert(`Pesanan berhasil dibuat dengan total ${formatIDR(total)}`);
      setCart([]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderMenuGrid = (category: string) => {
    const items = menuItems.filter(item => item.category === category && item.is_available);
    if (!items.length) {
      return <p className="text-muted-foreground text-center col-span-full">Tidak ada item di kategori ini.</p>
    }
    return items.map((item) => (
      <Card key={item.id} className="overflow-hidden flex flex-col">
        <CardHeader className="p-0">
          <img src={item.photo_url ?? 'https://via.placeholder.com/300'} alt={item.name} className="w-full h-32 object-cover"/>
        </CardHeader>
        <CardContent className="p-3 flex-1">
          <h3 className="font-semibold truncate">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{formatIDR(item.price)}</p>
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <Button className="w-full" size="sm" onClick={() => addToCart(item)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah
          </Button>
        </CardFooter>
      </Card>
    ));
  }

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Main Content: Menu */}
      <main className="flex-1 flex flex-col p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">Pilih item dari menu untuk membuat pesanan.</p>
        </header>
        <Tabs defaultValue={menuCategories[0]} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            {menuCategories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <AlertCircle className="h-10 w-10 mb-2"/>
              <p className="font-semibold">Gagal memuat menu</p>
              <p className="text-sm">{error.message}</p>
            </div>
          )}

          {isLoading && (
            <TabsContent value="loading" className="flex-1 overflow-y-auto">
              <MenuGridSkeleton />
            </TabsContent>
          )}

          {!isLoading && !error && menuCategories.map(category => (
             <TabsContent key={category} value={category} className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {renderMenuGrid(category)}
                </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Right Sidebar: Current Order */}
      <aside className="w-96 bg-background border-l flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold flex items-center"><ShoppingCart className="mr-3 h-6 w-6" />Pesanan Saat Ini</h2>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground mt-10">
              <p>Keranjang masih kosong.</p>
              <p className="text-sm">Silakan pilih item dari menu.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatIDR(item.price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}><MinusCircle className="h-4 w-4" /></Button>
                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}><PlusCircle className="h-4 w-4" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
        <Separator />
        <div className="p-6 space-y-4 bg-muted/20">
            <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>{formatIDR(total)}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setCart([])} disabled={cart.length === 0 || isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4"/> Bersihkan
                </Button>
                <Button className="w-full" onClick={handleSubmitOrder} disabled={cart.length === 0 || isSubmitting}>
                    {isSubmitting ? 'Memproses...' : 'Buat Pesanan'}
                </Button>
            </div>
        </div>
      </aside>
    </div>
  );
}
