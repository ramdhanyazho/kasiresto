import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User } from './types';

export type Session = Pick<User, 'id' | 'email' | 'name' | 'role'>;

const SESSION_COOKIE = 'ksr_session';

export function getSession(): Session | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (parsed && parsed.email && parsed.role) {
      return parsed;
    }
  } catch (error) {
    console.error('Invalid session cookie', error);
  }
  return null;
}

export function setSessionCookie(res: NextResponse, session: Session) {
  res.cookies.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}
