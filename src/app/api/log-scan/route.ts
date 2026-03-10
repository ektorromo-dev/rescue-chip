import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { chip_folio, tipo, latitud, longitud } = await req.json();
        if (!chip_folio || !tipo) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const supabase = await createClient();
        const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
        const user_agent = req.headers.get('user-agent') || null;
        const { error } = await supabase.from('chip_accesos').insert({
            chip_folio,
            tipo,
            latitud: latitud || null,
            longitud: longitud || null,
            ip_address,
            user_agent,
        });
        if (error) {
            console.error('Error logging scan:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('log-scan error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
