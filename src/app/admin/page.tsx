'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatIDR } from '@/lib/format';
import type { MenuItem, OrderWithItems, Table as TableType, User } from '@/lib/types';
import { menuSchema, userUpdateSchema } from '@/lib/validators';
import { Utensils, BookOpen, User as UserIcon, PlusCircle, MoreHorizontal, AlertCircle, LogOut } from 'lucide-react';
import { z } from 'zod';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const userFormSchema = userUpdateSchema
  .extend({
    id: userUpdateSchema.shape.id.optional()
  })
  .superRefine((value, ctx) => {
    if (!value.id && !value.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password wajib diisi untuk pengguna baru',
        path: ['password']
      });
    }
  });

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

type MenuFormValues = z.input<typeof menuSchema>;
type UserFormValues = z.infer<typeof userFormSchema>;

const defaultMenuValues: MenuFormValues = {
  name: '',
  category: '',
  price: 0,
  is_available: true,
  photo_url: ''
};

const defaultUserValues: UserFormValues = {
  id: undefined,
  name: '',
  email: '',
  role: 'KASIR',
  password: ''
};

export default function AdminPage() {
  const router = useRouter();
  const { data: dashboard, error: dashboardError, mutate: mutateDashboard } = useSWR<DashboardData>('/api/dashboard', fetcher);
  const { data: usersData, error: usersError, mutate: mutateUsers } = useSWR<{ users: User[] }>('/api/users', fetcher);

  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [userSheetOpen, setUserSheetOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const menuForm = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: defaultMenuValues
  });

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultUserValues
  });

  useEffect(() => {
    if (editingMenu) {
      menuForm.reset({
        ...editingMenu,
        is_available: Boolean(editingMenu.is_available),
        photo_url: editingMenu.photo_url ?? ''
      });
    } else {
      menuForm.reset(defaultMenuValues);
    }
  }, [editingMenu, menuForm]);

  useEffect(() => {
    if (editingUser) {
      userForm.reset({
        ...editingUser,
        password: ''
      });
    } else {
      userForm.reset(defaultUserValues);
    }
  }, [editingUser, userForm]);

  const isLoading = !dashboard && !dashboardError;
  const error = dashboardError || usersError;

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/login');
  };

  const handleSubmitMenu = async (values: MenuFormValues) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const payload = {
        ...values,
        price: Number(values.price),
        is_available: Boolean(values.is_available)
      };

      const res = await fetch('/api/menu', {
        method: editingMenu ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMenu ? { ...payload, id: editingMenu.id } : payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan menu');

      await mutateDashboard();
      setMenuSheetOpen(false);
      setEditingMenu(null);
    } catch (err: any) {
      setActionError(err.message ?? 'Gagal menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm('Hapus menu ini?')) return;
    setActionError(null);
    try {
      const res = await fetch('/api/menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal menghapus menu');
      await mutateDashboard();
    } catch (err: any) {
      setActionError(err.message ?? 'Gagal menghapus menu');
    }
  };

  const handleSubmitUser = async (values: UserFormValues) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const { id: _formId, ...rest } = values;
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { ...rest, id: editingUser.id } : rest;

      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan pengguna');

      await mutateUsers();
      setUserSheetOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      setActionError(err.message ?? 'Gagal menyimpan pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Hapus pengguna ini?')) return;
    setActionError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal menghapus pengguna');
      await mutateUsers();
    } catch (err: any) {
      setActionError(err.message ?? 'Gagal menghapus pengguna');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-destructive">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p className="font-semibold">Gagal memuat data admin</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="tables">Meja</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
                    <span className="text-2xl">Rp</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatIDR(dashboard?.summary.revenueToday ?? 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pesanan Aktif</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard?.summary.openOrders}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jumlah Menu</CardTitle>
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard?.summary.menuCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usersData?.users.length ?? 0}</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Manajemen Menu</h2>
              <p className="text-muted-foreground">Tambah, ubah, dan kelola semua item menu Anda.</p>
            </div>
            <Button
              onClick={() => {
                setEditingMenu(null);
                setMenuSheetOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Menu
            </Button>
          </div>
          <Card>
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard?.menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{formatIDR(item.price)}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_available ? 'default' : 'destructive'}>
                          {item.is_available ? 'Tersedia' : 'Habis'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingMenu(item);
                                setMenuSheetOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteMenu(item.id)}>
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Meja</h2>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {dashboard?.tables.map((table) => (
                <Card key={table.id}>
                  <CardHeader>
                    <CardTitle>{table.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">Kapasitas: {table.capacity}</p>
                    <Badge variant={table.status === 'available' ? 'default' : 'secondary'}>{table.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h2>
            <Button
              onClick={() => {
                setEditingUser(null);
                setUserSheetOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna
            </Button>
          </div>
          <Card>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingUser(user);
                                setUserSheetOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteUser(user.id)}>
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {actionError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <Sheet open={menuSheetOpen} onOpenChange={setMenuSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingMenu ? 'Edit Menu' : 'Tambah Menu'}</SheetTitle>
          </SheetHeader>
          <Form {...menuForm}>
            <form onSubmit={menuForm.handleSubmit(handleSubmitMenu)} className="space-y-4 mt-6">
              <FormField
                control={menuForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Menu</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Nasi Goreng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={menuForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <FormControl>
                      <Input placeholder="Makanan / Minuman" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={menuForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={1000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={menuForm.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Foto (opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={menuForm.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tersedia</FormLabel>
                      <p className="text-sm text-muted-foreground">Nonaktifkan jika menu sedang habis.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <SheetFooter className="gap-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <Sheet open={userSheetOpen} onOpenChange={setUserSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</SheetTitle>
          </SheetHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(handleSubmitUser)} className="space-y-4 mt-6">
              <FormField
                control={userForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="KASIR">KASIR</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editingUser ? 'Password baru (opsional)' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={editingUser ? 'Kosongkan jika tidak diganti' : 'Minimal 4 karakter'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SheetFooter className="gap-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </main>
  );
}
