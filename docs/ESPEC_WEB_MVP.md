# ESPECIFICACIÓN WEB — Servicios para la app MVP (Fases 6, 7, 8 y 9)

REPO WEB: rescue-chip

## Reglas obligatorias
- Trabaja en una rama nueva: `git checkout -b feature/app-mvp-web`. NO hagas merge a main.
- TypeScript estricto, prohibido `any`. App Router. Sin credenciales en el código.
- Reutiliza lo que ya existe: `getUserFromRequest` (src/lib/auth-request.ts), `createAdminClient` (src/lib/supabase/admin), el transporter de nodemailer, `intentarPush` (src/lib/push-notify.ts), `escapeHtml` (src/lib/escape-html.ts), `syncContactInvitations` y `sendInvitationEmail` (src/lib/contact-invitations.ts), `validateEmergencyContacts`, `formatStoredPhone`, el rate limit de Upstash (src/lib/ratelimit.ts).
- Todos los endpoints nuevos viven bajo `src/app/api/app/...` salvo que se indique otra ruta.
- Todas las respuestas de error son JSON con la forma `{ "error": "codigo_corto", "mensaje": "Texto en español para mostrar al usuario" }`.
- Los correos llevan remitente `RescueChip <contacto@rescue-chip.com>`, texto plano + HTML simple, y todo dato de usuario dentro del HTML pasa por `escapeHtml`.
- Los códigos de 6 dígitos se generan con `crypto.randomInt(0, 1000000)` rellenados a 6 cifras y se guardan SOLO como hash SHA-256 (nunca en claro).
- Al terminar cada bloque ejecuta `npx tsc --noEmit`. Al final ejecuta `npm run build`.
- Haz un commit por bloque (A, B, C, D, E, F) en la rama y al final `git push -u origin feature/app-mvp-web`. NO merge.

Las tablas nuevas (`app_email_codes`, `vinculo_qr_tokens`, `educacion_contenidos`) y la columna `profiles.consent_datos_salud_at` YA existen en la base de datos (las crea Héctor con SQL antes de que empieces).

---

## BLOQUE A — Estado del chip para la app

`GET /api/app/chip/estado?folio=RSC-XXXXX`
- Bearer OPCIONAL.
- Valida el formato del folio con el mismo validador que usa /activate. Formato inválido → 400 `folio_invalido`.
- Rate limit: 20 por hora por IP → 429 `demasiados_intentos`.
- Respuesta 200:
  `{ "folio": "RSC-XXXXX", "existe": boolean, "activado": boolean, "es_mio": boolean }`
  - `activado` = misma regla que /api/activate/complete (activated true o status 'activado').
  - `es_mio` = true solo si viene Bearer válido y el chip pertenece a un perfil con user_id del token.

## BLOQUE B — Activación desde la app (ajustes a endpoints existentes)

1. `/api/activate/complete`:
   - Si el body NO trae `consentIp`, toma la IP del request (`x-forwarded-for`, primer valor). Si tampoco hay, usa null.
   - Si el body trae `consentDatosSalud: true`, guarda `profiles.consent_datos_salud_at = now()`.
   - Si el body trae `origen: "app"`, guarda `consent_version = 'v2.0-app'`; si no, deja el valor actual.
   - No cambies nada más del comportamiento web.
2. Crea `docs/CONTRATO_ACTIVACION.md` describiendo EXACTAMENTE el body que espera `/api/activate/complete` (`folio`, `profileData` con cada campo, tipo, si es obligatorio y valores permitidos de `blood_type`, `sexo`, `medical_system`, formato de `emergency_contacts` y de `phone`), las respuestas posibles (200, 400, 401, 404, 409, 500) y el body y las respuestas de `/api/activate/link-to-mine`. Este documento se copiará al repo móvil.
3. Confirma en tu reporte qué hace `/api/activate/complete` con `profileData.photo_url` (la app subirá la foto antes y mandará la URL).

## BLOQUE C — Cuenta: registro con código, dispositivo y eliminar cuenta

Tabla `app_email_codes` (ya existe): `id uuid, email text, user_id uuid null, proposito text ('registro'|'dispositivo'), code_hash text, device_id text null, intentos int default 0, expires_at timestamptz, used_at timestamptz null, created_at timestamptz`.

1. `POST /api/app/registro/solicitar-codigo` body `{ email }`
   - Normaliza el email (trim + minúsculas). Rate limit 5 por hora por email y 10 por hora por IP.
   - Si ya existe un usuario con ese email (usa la RPC `get_user_id_by_email`) → 409 `ya_existe` con mensaje "Este correo ya tiene cuenta. Inicia sesión."
   - Crea registro con proposito 'registro', expira en 10 minutos, invalida (used_at = now) los códigos anteriores sin usar de ese email y propósito.
   - Envía correo. Asunto: "Tu código de RescueChip: 123456". Cuerpo: "Tu código para crear tu cuenta es 123456. Vence en 10 minutos. Si no lo pediste, ignora este correo."
   - 200 `{ ok: true }`.

2. `POST /api/app/registro/verificar` body `{ email, codigo?, invitacionToken?, password, nombre, telefono, pais, deviceId }`
   - Debe venir `codigo` O `invitacionToken`.
   - Con `codigo`: busca el código vigente de proposito 'registro' para ese email; si no existe o venció → 400 `codigo_vencido`. Si el hash no coincide → incrementa intentos y responde 400 `codigo_incorrecto`; al llegar a 5 intentos márcalo usado y responde 400 `codigo_bloqueado` ("Pide un código nuevo").
   - Con `invitacionToken`: busca `contact_invitations` por token con status 'pending', vigente, y `contact_email` igual al email (sin distinguir mayúsculas). Si no cumple → 400 `invitacion_invalida`. (Abrir el enlace del correo demuestra que el correo es suyo, por eso no pide código.)
   - Password mínimo 8 caracteres → 400 `password_corta`.
   - Valida `telefono` con libphonenumber según `pais` → 400 `telefono_invalido`.
   - Crea el usuario con `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre, telefono, pais } })`. Si ya existe → 409 `ya_existe`.
   - Inserta en `user_sessions`: `{ user_id, device_id: deviceId, device_info: 'app-android', status: 'verified' }`.
   - Marca el código como usado.
   - Ejecuta la misma lógica que el endpoint del punto 7 (aceptar invitaciones pendientes para ese email).
   - 200 `{ ok: true }`. La app iniciará sesión después con signInWithPassword.

3. `POST /api/app/dispositivo/estado` (Bearer obligatorio) body `{ deviceId }`
   - 200 `{ verificado: boolean }`: true si existe `user_sessions` con ese user_id, device_id y status 'verified'.
   - Si existe con status 'revoked' → `{ verificado: false, revocado: true }`.

4. `POST /api/app/dispositivo/solicitar-codigo` (Bearer) body `{ deviceId }`
   - Rate limit 5 por hora por usuario. Crea código proposito 'dispositivo' (10 min) ligado a user_id y device_id, invalida anteriores. Envía correo al email del usuario. Asunto: "Código para entrar en un dispositivo nuevo: 123456". Cuerpo: "Alguien inició sesión en tu cuenta de RescueChip desde un celular nuevo. Si fuiste tú, tu código es 123456 (vence en 10 minutos). Si no fuiste tú, cambia tu contraseña de inmediato."
   - 200 `{ ok: true }`.

5. `POST /api/app/dispositivo/verificar` (Bearer) body `{ deviceId, codigo }`
   - Mismas reglas de vencimiento e intentos que el registro.
   - Upsert en `user_sessions` (user_id + device_id) con status 'verified', device_info 'app-android', last_seen now.
   - 200 `{ ok: true }`.

6. `POST /api/app/cuenta/eliminar` (Bearer) body `{ confirmacion: "ELIMINAR" }`
   - Si confirmacion no es exactamente "ELIMINAR" → 400.
   - Para el usuario del token:
     a) Su(s) perfil(es) en `profiles`: chips con owner_profile_id de esos perfiles → `owner_profile_id = null, activated = false, status = 'disponible', activated_by = null, activated_at = null, perfil_compartido = null` (el chip físico podrá activarse de nuevo).
     b) `incidentes` de esos perfiles → `profile_id = null` (se conserva el historial anónimo).
     c) Borra `rider_locations`, `contact_invitations` donde `inviter_profile_id` sea suyo, y la foto y la póliza del Storage si existen (usa service role).
     d) `contact_invitations` donde `linked_user_id` = usuario → status 'cancelled', linked_user_id null.
     e) Borra `user_push_tokens` y `user_sessions` del usuario.
     f) Borra las filas de `profiles` del usuario.
     g) `supabaseAdmin.auth.admin.deleteUser(userId)`.
     h) Registra en `audit_logs` la acción 'cuenta_eliminada' (sin datos médicos).
   - Si algún paso falla, responde 500 y registra el error. Reporta en tu resumen si alguna llave foránea impide el orden anterior y cómo lo resolviste.
   - 200 `{ ok: true }`.

7. `POST /api/app/vinculos/sincronizar` (Bearer)
   - Busca `contact_invitations` con status 'pending', vigentes, cuyo `contact_email` sea igual al email del usuario (sin distinguir mayúsculas) y cuyo `inviter_profile_id` NO sea un perfil del propio usuario.
   - Las marca `status 'accepted', linked_user_id = usuario, accepted_at = now()`.
   - 200 `{ aceptadas: number }`.

## BLOQUE D — Vinculación por QR

Tabla `vinculo_qr_tokens` (ya existe): `id uuid, rider_profile_id uuid, token text unique, created_at, expires_at, reservado_device_id text null, reservado_hasta timestamptz null, usado_at timestamptz null, usado_por uuid null, invitation_id uuid null`.

URL del QR: `https://www.rescue-chip.com/vincular/qr/{token}`.

1. `POST /api/app/vinculo-qr/generar` (Bearer, el usuario debe tener perfil de rider)
   - Token `randomBytes(16).toString('hex')`, expira en 10 minutos.
   - Marca como vencidos (expires_at = now) los tokens anteriores sin usar de ese perfil.
   - 200 `{ token, expires_at, url }`.

2. `GET /api/app/vinculo-qr/{token}` (público, rate limit 30 por hora por IP)
   - 200 `{ estado: 'vigente'|'reservado'|'usado'|'vencido', rider: { primer_nombre, photo_url } }`.
   - Si viene Bearer y es el dueño del token, agrega `usado_por_nombre` cuando esté usado (nombre del contacto) e `invitation_id`.

3. `POST /api/app/vinculo-qr/reservar` (público) body `{ token, deviceId }`
   - Solo si está vigente o ya reservado por el mismo deviceId: `reservado_device_id = deviceId, reservado_hasta = now + 30 min`.
   - 200 `{ ok: true, reservado_hasta }`. Si no → 410 `qr_vencido` ("Este código ya venció. Pídele al rider que genere uno nuevo.").

4. `POST /api/app/vinculo-qr/usar` (Bearer del contacto) body `{ token, deviceId? }`
   - Válido si no está usado y (expires_at > now, o reservado_hasta > now con el mismo deviceId). Si no → 410 `qr_vencido`.
   - Si el usuario es el dueño del perfil del rider → 400 `mismo_usuario` ("No puedes ser tu propio contacto.").
   - Si ya existe `contact_invitations` aceptada para ese rider y ese usuario → marca el token como usado y responde 200 `{ ok: true, ya_vinculado: true, rider_nombre }`.
   - Datos del contacto: nombre y teléfono desde `user_metadata` (nombre, telefono). Si no hay, usa el perfil propio si existe. Email del token.
   - LÍMITE: revisa cuántos contactos admite hoy el formulario del dashboard web. Si el rider ya tiene ese máximo en `profiles.emergency_contacts` → 409 `limite_contactos` ("{Rider} ya tiene el máximo de contactos de emergencia."). Repórtame cuál es el máximo.
   - Agrega al contacto al final de `profiles.emergency_contacts` del rider (`{ name, phone, email }`) si no está ya (compara email o teléfono). Es OBLIGATORIO: sin esto, el contacto no recibiría SMS ni correo en una emergencia, y `syncContactInvitations` cancelaría el vínculo la próxima vez que el rider edite su perfil.
   - Crea `contact_invitations` con `inviter_profile_id`, contact_name, contact_phone, contact_email, token nuevo aleatorio, `status 'accepted'`, `linked_user_id`, `accepted_at = now()`, `expires_at = now()`.
   - Marca el token `usado_at, usado_por, invitation_id`.
   - Notifica al rider con `intentarPush` (por su email): título "✅ {primer nombre del contacto} es tu contacto de emergencia", cuerpo "Ya recibirá tus alertas. Puedes deshacerlo en la pestaña QR." data `{ tipo: 'contacto_vinculado' }`.
   - 200 `{ ok: true, rider_nombre, rider_photo_url }`.

5. `POST /api/app/vinculos/cancelar` (Bearer del rider) body `{ invitationId }`
   - Verifica que la invitación sea de un perfil del usuario. Marca status 'cancelled'.
   - Quita a ese contacto de `profiles.emergency_contacts` SOLO si la invitación se creó por QR (existe `vinculo_qr_tokens` con ese `invitation_id`). Las invitaciones por correo no tocan la lista de contactos.
   - 200 `{ ok: true }`.

6. `GET /api/app/invitacion/{token}` (público, rate limit 30 por hora por IP)
   - Para el enlace de invitación por correo. 200 `{ estado: 'pending'|'accepted'|'expired'|'cancelled', rider: { primer_nombre, photo_url }, contact_email, contact_name }`. 404 si no existe.

7. `POST /api/app/invitacion/aceptar` (Bearer) body `{ token }`
   - Igual que la acción `aceptarInvitacion` de /vincular pero con el usuario del Bearer. Solo si está pending y vigente.
   - 200 `{ ok: true, rider_nombre }`.

8. Página web `src/app/vincular/qr/[token]/page.tsx` (para quien escanea el QR con la cámara normal, sin app)
   - Mismo estilo que /vincular/[token]. Muestra "{Rider} te invita a ser su contacto de emergencia" y la foto del rider.
   - Formulario: nombre, celular (+52 por defecto), correo y contraseña, con "¿Olvidaste tu contraseña?". Botón "Aceptar desde la web".
   - Al enviar: si el correo no existe, crea la cuenta (signUp + signIn como /vincular, guardando nombre y teléfono en user_metadata); si existe, inicia sesión. Después llama a la lógica del punto 4 (puedes extraerla a una función compartida en src/lib/vinculo-qr.ts).
   - Estados: vencido ("Este código ya venció. Pídele a {Rider} que genere uno nuevo."), ya usado, éxito ("Listo. Ya eres contacto de emergencia de {Rider}.").

## BLOQUE E — Educación

Tabla `educacion_contenidos` (ya existe) con RLS de lectura pública para `publicado = true`. La app la lee directo con supabase-js, así que aquí solo:
- Confirma en tu reporte que, con la clave pública (anon), un select de `educacion_contenidos` regresa solo filas publicadas.

## BLOQUE F — Verificaciones para Google Play

- Confirma si existe la página pública de aviso de privacidad (busca rutas como /privacidad o /aviso-de-privacidad) y su URL exacta. Google Play la exige. Si no existe, NO la crees: repórtalo.
- Confirma la URL de términos (/terminos).

## Reporte final
1. Lista de archivos creados y modificados, por bloque.
2. Contenido íntegro de cada archivo nuevo.
3. Diff de los archivos modificados.
4. `docs/CONTRATO_ACTIVACION.md` completo.
5. Respuestas a: foto en /activate/complete (B3), máximo de contactos (D4), llaves foráneas al eliminar cuenta (C6), lectura pública de educación (E), URLs de privacidad y términos (F).
6. Resultado de `npx tsc --noEmit` y `npm run build`.
7. Nombre de la rama y SHA de cada commit. NO merge a main.
