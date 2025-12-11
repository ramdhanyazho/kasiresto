import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Selamat Datang di Kasiresto POS
          </CardTitle>
          <CardDescription className="pt-2">
            Sistem Point of Sale modern untuk restoran Anda.
            <br />
            Silakan masuk untuk melanjutkan atau coba mode Self-Order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <h4 className="mb-2 font-semibold">Akun Demo</h4>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Admin:</span> admin@example.com / admin123
              </li>
              <li>
                <span className="font-medium text-foreground">Kasir:</span> kasir@example.com / kasir123
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/login" className="w-full">
            <Button className="w-full text-lg">
              <LogIn className="mr-2 h-5 w-5" />
              Masuk
            </Button>
          </Link>
          <Link href="/order/1" className="w-full">
            <Button variant="outline" className="w-full">
              Coba Self-Order
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}