'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { PlusCircle, MinusCircle, ShoppingCart, AlertCircle, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIDR } from '@/lib/format';
import type { MenuItem, Table as TableType, Order } from '@/lib/types';

// --- Types ---
type CartItem = { id: number; name: string; price: number; quantity: number };
type MenuApiResponse = { menuItems: MenuItem[] };
type TablesApiResponse = { tables: TableType[] };

// --- SWR Fetcher ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Main Order Page Component ---
export default function OrderPage() {
  const router = useRouter();
  const params = useParams<{ tableId: string }>();
  const tableId = Number(params.tableId);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  // --- Data Fetching ---
  const { data: menuData, error: menuError } = useSWR<MenuApiResponse>('/api/menu', fetcher);
  const { data: tablesData, error: tablesError } = useSWR<TablesApiResponse>('/api/tables', fetcher);
  
  const menuItems = menuData?.menuItems ?? [];
  const tables = tablesData?.tables ?? [];
  
  const menuCategories = useMemo(() => [...new Set(menuItems.map(item => item.category))], [menuItems]);
  
  const isLoading = !menuData && !menuError;
  const error = menuError || tablesError;

  // --- Cart Logic ---
  const addToCart = (item: MenuItem) => setCart(prev => {
    const existing = prev.find(i => i.id === item.id);
    if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
    return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
  });

  const updateQuantity = (id: number, amount: number) => setCart(prev => 
    prev.map(i => i.id === id ? { ...i, quantity: i.quantity + amount } : i).filter(i => i.quantity > 0)
  );
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- Event Handlers ---
  const handleTableChange = (value: string) => router.push(`/order/${value}`);
  
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const payload = {
      table_id: tableId,
      payment_method: 'qris',
      items: cart.map(item => ({ menu_item_id: item.id, quantity: item.quantity })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal membuat pesanan');
      
      const { order } = await res.json();
      setSubmittedOrder(order);
      setCart([]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen text-destructive">
      <AlertCircle className="h-10 w-10 mb-2"/>
      <p className="font-semibold">Gagal memuat data</p>
      <p className="text-sm">{error.message}</p>
    </div>
  );
  
  // After order is submitted, show a thank you screen
  if (submittedOrder) return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit mb-2">
            <PartyPopper className="h-10 w-10 text-green-500 dark:text-green-400"/>
          </div>
          <h1 className="text-2xl font-bold">Pesanan Diterima!</h1>
          <p className="text-muted-foreground">Terima kasih, pesanan Anda sedang diproses.</p>
        </CardHeader>
        <CardContent>
            <p className="font-semibold">Nomor Pesanan Anda: ORD-{String(submittedOrder.id).padStart(3, '0')}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => setSubmittedOrder(null)}>Buat Pesanan Baru</Button>
        </CardFooter>
      </Card>
    </main>
  );

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Selamat Datang</h1>
            <p className="text-muted-foreground">Silakan pilih menu yang Anda inginkan.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold">Meja:</span>
            <Select onValueChange={handleTableChange} defaultValue={String(tableId)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tables.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>

        {isLoading ? <MenuGridSkeleton /> : (
          <Tabs defaultValue={menuCategories[0]} className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              {menuCategories.map(cat => <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>)}
            </TabsList>
            {menuCategories.map(cat => (
              <TabsContent key={cat} value={cat} className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {menuItems.filter(i => i.category === cat && i.is_available).map(item => (
                    <Card key={item.id} className="overflow-hidden flex flex-col">
                      <CardHeader className="p-0"><img src={item.photo_url ?? ''} alt={item.name} className="w-full h-32 object-cover"/></CardHeader>
                      <CardContent className="p-3 flex-1">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatIDR(item.price)}</p>
                      </CardContent>
                      <CardFooter className="p-3 pt-0"><Button className="w-full" size="sm" onClick={() => addToCart(item)}><PlusCircle className="mr-2 h-4 w-4" /> Tambah</Button></CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      {/* Cart Sidebar */}
      <aside className="w-96 bg-background border-l flex flex-col">
        <div className="p-6"><h2 className="text-2xl font-bold flex items-center"><ShoppingCart className="mr-3 h-6 w-6" />Pesanan Anda</h2></div>
        <Separator />
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!cart.length ? <p className="text-muted-foreground text-center mt-10">Keranjang masih kosong.</p> : cart.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground">{formatIDR(item.price)}</p></div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}><MinusCircle className="h-4 w-4" /></Button>
                <span className="font-bold w-4 text-center">{item.quantity}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}><PlusCircle className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
        <Separator />
        <div className="p-6 space-y-4 bg-muted/20">
            <div className="flex justify-between items-center font-bold text-lg"><span>Total</span><span>{formatIDR(total)}</span></div>
            <Button className="w-full text-lg" onClick={handleSubmitOrder} disabled={!cart.length || isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Pesan Sekarang'}
            </Button>
        </div>
      </aside>
    </div>
  );
}

const MenuGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i}><CardHeader><Skeleton className="w-full h-32" /></CardHeader><CardContent className="p-3"><Skeleton className="h-5 w-3/4" /></CardContent><CardFooter><Skeleton className="h-9 w-full" /></CardFooter></Card>
      ))}
    </div>
);