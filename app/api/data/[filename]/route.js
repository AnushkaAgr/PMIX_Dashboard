import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAuth } from '@/lib/auth';
import { parseFile } from '@/lib/xlsxParser';

export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data');
const cache = new Map();

export async function GET(request, { params }) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const filename = decodeURIComponent(params.filename);
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    if (!cache.has(filename)) {
      cache.set(filename, parseFile(filePath, filename));
    }
    return NextResponse.json(cache.get(filename));
  } catch (err) {
    console.error('Parse error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
