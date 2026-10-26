import { NextResponse } from 'next/server';
import { PRODUCTOS, TIENDA_URL } from '@/lib/prices';

export const revalidate = 300;

export async function GET() {
  return NextResponse.json(
    {
      productos: PRODUCTOS,
      tienda_url: TIENDA_URL,
      moneda: 'MXN',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
