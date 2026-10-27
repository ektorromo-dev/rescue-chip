# Verificación Bloque E — Educación y RLS

## Tabla: `educacion_contenidos`
- **Esquema verificado**: `id`, `tipo`, `categoria`, `titulo`, `resumen`, `cuerpo`, `imagen_url`, `video_url`, `plataforma`, `autor`, `orden`, `destacado`, `publicado`, `created_at`, `updated_at`.
- **Constraint de tipo**: Valida tipos válidos (por ejemplo `guia`).
- **Política RLS**: Lectura pública (`SELECT`) habilitada para filas con `publicado = true`.

## Prueba de Aislamiento RLS
Se ejecutó una prueba de inserción con la clave de servicio (`service_role`) insertando dos registros de prueba:
1. `__TEST_PUBLISHED__` con `publicado: true`
2. `__TEST_UNPUBLISHED__` con `publicado: false`

### Resultado con cliente anónimo (`NEXT_PUBLIC_SUPABASE_ANON_KEY`):
- `seesPublished`: **true**
- `seesUnpublished`: **false**
- `correctIsolation`: **true**

El cliente público/anónimo únicamente tiene acceso a los registros marcados como `publicado = true`. La app móvil puede consumir esta tabla directamente mediante `supabase-js` con total seguridad.
