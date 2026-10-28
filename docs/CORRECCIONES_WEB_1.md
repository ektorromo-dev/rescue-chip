# CORRECCIONES WEB — Ronda 1 de pruebas

REPO WEB: rescue-chip

## Reglas
- Rama nueva desde main: `git checkout main && git pull && git checkout -b fix/pruebas-ronda-1`. NO merge a main.
- TypeScript estricto, prohibido `any`. `npx tsc --noEmit` y `npm run build` sin errores al final.
- Un commit por punto. Al final `git push -u origin fix/pruebas-ronda-1` y repórtame los SHA y el diff.
- Héctor ya agregó en la base de datos las columnas `profiles.fecha_nacimiento (date)`, `profiles.estado (text)` y `profiles.municipio (text)`.

## 1. Cerrar alerta cierra TODAS las alertas activas del rider (bug crítico)
Causa encontrada: cada escaneo con "ES UNA EMERGENCIA REAL" crea un incidente nuevo de 24 h. Si hubo dos escaneos, el rider cierra uno y la app sigue mostrando el otro, así que parece que "no se cierra".
- `src/app/api/incidentes/cerrar/route.ts`: el `token` del body pasa a ser OPCIONAL. Busca TODOS los perfiles del usuario (no uses `maybeSingle`: un usuario podría tener más de un perfil) y cierra TODOS sus incidentes con `expires_at > now()` y `status` distinto de 'closed' (`status 'closed', closed_at = now, expires_at = now`). Si viene token, verifica que pertenezca a sus perfiles (403 si no). Si no hay ninguno activo, responde 200 `{ ok: true, cerradas: 0 }`.
- Notifica UNA sola vez con `notificarActualizacionIncidente` (usa el token del incidente más reciente que se cerró). Respuesta `{ ok: true, cerradas: n }`.

## 2. Estado de la alerta activa del rider
- `src/app/api/incidentes/activo/route.ts`: busca entre TODOS los perfiles del usuario. Regresa el incidente activo más reciente, pero calcula `en_camino_por`, `familiar_en_camino`, `atendido`, `atendido_at` y `atendido_por` tomando el valor más reciente que exista entre TODOS los incidentes activos. Así el rider ve quién va en camino aunque el contacto haya abierto otro de los enlaces.
- Agrega a la respuesta `activos: number` (cuántos incidentes activos hay).

## 3. Fecha de nacimiento, estado y municipio (homologar datos)
Crea `src/lib/estados-mx.ts` con EXACTAMENTE estos 32 nombres, en este orden:
Aguascalientes, Baja California, Baja California Sur, Campeche, Chiapas, Chihuahua, Ciudad de México, Coahuila, Colima, Durango, Estado de México, Guanajuato, Guerrero, Hidalgo, Jalisco, Michoacán, Morelos, Nayarit, Nuevo León, Oaxaca, Puebla, Querétaro, Quintana Roo, San Luis Potosí, Sinaloa, Sonora, Tabasco, Tamaulipas, Tlaxcala, Veracruz, Yucatán, Zacatecas.

Crea `src/lib/perfil-utils.ts` con:
- `calcularEdad(fechaNacimiento: string | null): number | null` (años cumplidos a hoy).
- `normalizarMunicipio(texto: string): string` (quita espacios dobles, trim y pone mayúscula inicial en cada palabra, excepto "de", "del", "la", "las", "los", "y" cuando no son la primera palabra).
- `construirLocation(municipio: string, estado: string): string` → `"{municipio}, {estado}"`.

Cambios:
- `/api/activate/complete`: agrega `fecha_nacimiento`, `estado` y `municipio` a la lista de campos permitidos. Si vienen `municipio` y `estado`, guarda `location = construirLocation(normalizarMunicipio(municipio), estado)`. Si viene `fecha_nacimiento`, guarda también `age = calcularEdad(...)` para compatibilidad.
- `/api/profile/update` (lo usa la app): acepta y guarda los mismos tres campos con la misma lógica.
- `src/app/activate/page.tsx` y `src/app/dashboard/page.tsx`:
  - Reemplaza "Edad" por "Fecha de nacimiento" con tres selectores (día, mes con nombre, año desde el actual hacia 1930). Opcional, como hoy la edad.
  - Reemplaza "Ciudad" por dos campos obligatorios: "Estado" (selector con la lista de 32 si el país es MX; texto libre si es otro país) y "Municipio o alcaldía" (texto, normalizado con `normalizarMunicipio` al guardar).
  - Al editar un perfil viejo sin estado/municipio, deja los campos vacíos y muestra el `location` anterior como referencia ("Antes: {location}").
- Donde se muestra la edad (`ProfileViewer`, página `/emergencia/[token]`, admin): si existe `fecha_nacimiento`, muestra `calcularEdad(fecha_nacimiento)`; si no, `age` como hoy.

## 4. Reporte
Lista de archivos tocados, diff completo, resultado de tsc y build, rama y SHA de cada commit. NO merge a main.
