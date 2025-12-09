import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'ksr_session';

function parseSession(req: NextRequest) {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { role?: string };
  } catch (error) {
    console.error('Invalid session cookie', error);
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/kasir')) {
    const session = parseSession(req);
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = session.role;
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/kasir', req.url));
    }
    if (pathname.startsWith('/kasir') && !['ADMIN', 'KASIR'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/kasir/:path*']
};
