import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAuth } from '@/lib/auth';
import { inferPeriodLabel } from '@/lib/xlsxParser';

export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data');

function listXlsxFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR).filter(f => /\.xlsx?$/i.test(f)).sort();
}

export async function GET(request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
  const sheets = listXlsxFiles().map(f => ({ filename: f, label: inferPeriodLabel(f) }));
  return NextResponse.json({ sheets });
}
