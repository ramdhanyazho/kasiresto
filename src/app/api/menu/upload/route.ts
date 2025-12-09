import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 });
  }

  const filename = formData.get('filename');
  const safeName = typeof filename === 'string' && filename.trim().length > 0 ? filename.trim() : file.name;

  const uploadPath = `menu/${Date.now()}-${safeName}`;

  const blob = await put(uploadPath, file, {
    access: 'public'
  });

  return NextResponse.json({ url: blob.url });
}
