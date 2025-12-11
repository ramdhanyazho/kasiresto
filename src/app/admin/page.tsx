'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIDR } from '@/lib/format';
import type { MenuItem, OrderWithItems, Table as TableType, User } from '@/lib/types';
import { Utensils, BookOpen, User as UserIcon, PlusCircle, MoreHorizontal, AlertCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DashboardData = {
  menuItems: MenuItem[];
  tables: TableType[];
  orders: OrderWithItems[];
  summary: {
    openOrders: number;
    revenueToday: number;
    menuCount: number;
    availableTables: number;
  };
};

export default function AdminPage() {
  const { data: dashboard, error: dashboardError } = useSWR<DashboardData>('/api/dashboard', fetcher);
  const { data: usersData, error: usersError } = useSWR<{ users: User[] }>('/api/users', fetcher);
  
  const isLoading = !dashboard && !dashboardError;
  const error = dashboardError || usersError;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-destructive">
        <AlertCircle className="h-10 w-10 mb-2"/>
        <p className="font-semibold">Gagal memuat data admin</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="tables">Meja</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-32"/>) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
                    <span className="text-2xl">Rp</span>
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold">{formatIDR(dashboard?.summary.revenueToday ?? 0)}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pesanan Aktif</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold">{dashboard?.summary.openOrders}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jumlah Menu</CardTitle>
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold">{dashboard?.summary.menuCount}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold">{usersData?.users.length ?? 0}</div></CardContent>
                </Card>
              </>
            )}
          </div>
          {/* We can add recent orders here */}
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Manajemen Menu</h2>
              <p className="text-muted-foreground">Tambah, ubah, dan kelola semua item menu Anda.</p>
            </div>
            <Button><PlusCircle className="mr-2 h-4 w-4"/> Tambah Menu</Button>
          </div>
          <Card>
            {isLoading ? <Skeleton className="h-96 w-full"/> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead><span className="sr-only">Aksi</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard?.menuItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{formatIDR(item.price)}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_available ? 'default' : 'destructive'}>
                          {item.is_available ? 'Tersedia' : 'Habis'}
                        </Badge>
                      </TableCell>
                      <TableCell><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
           <h2 className="text-2xl font-bold tracking-tight">Manajemen Meja</h2>
           {isLoading ? <Skeleton className="h-64 w-full"/> : (
             <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {dashboard?.tables.map(table => (
                    <Card key={table.id}>
                        <CardHeader><CardTitle>{table.label}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm">Kapasitas: {table.capacity}</p>
                            <Badge variant={table.status === 'available' ? 'default' : 'secondary'}>{table.status}</Badge>
                        </CardContent>
                    </Card>
                ))}
             </div>
           )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h2>
            <Card>
              {isLoading ? <Skeleton className="h-64 w-full"/> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}