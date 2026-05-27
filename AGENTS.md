# RescueChip — Instrucciones del Agente

Stack: Next.js 14 App Router + Supabase + Vercel + Stripe + Twilio + TypeScript

## Reglas obligatorias
- TypeScript estricto — nunca usar `any`
- Siempre App Router, nunca Pages Router
- Nunca hardcodear credenciales — siempre variables de entorno
- Después de cada cambio: git add + git commit + git push origin main
- Verificar siempre que el push llegó a GitHub antes de asumir que está en producción

## Flujo de trabajo
1. Primero diagnóstico (solo lectura, sin cambios)
2. Reportar hallazgos
3. Solo después proponer y aplicar cambios

## Si algo se rompe en producción
PRIMERO Vercel rollback → DESPUÉS debuggear. Nunca al revés.

## Contexto del producto
- rescue-chip.com — sistema de identificación médica prehospitalaria para motociclistas
- Stripe en LIVE con usuarios reales — cualquier cambio en checkout requiere aprobación explícita
- /profile/[id] es ruta de emergencia médica — NUNCA agregar rate limiting aquí
- El chip NFC y sticker QR van SIEMPRE en el exterior del casco
