# Contrato de Activación de Dispositivos (API Web ↔ App Móvil)

Este documento especifica los contratos de comunicación HTTP para los endpoints de activación de RescueChip, consumidos tanto por la aplicación web como por la aplicación móvil MVP.

---

## 1. POST `/api/activate/complete`

Registra o asocia un perfil médico y activa el chip NFC con el folio indicado.

### Autenticación
- **Header obligatorio**: `Authorization: Bearer <access_token>`
- El `userId` del usuario se toma exclusivamente del token JWT validado en Supabase Auth.

---

### Request Body (JSON)

```json
{
  "folio": "RSC-25H4L",
  "origen": "app",
  "consentIp": "189.200.10.5",
  "consentDatosSalud": true,
  "profileData": {
    "full_name": "Carlos Martínez",
    "phone": "+525512345678",
    "country": "MX",
    "blood_type": "O+",
    "sexo": "masculino",
    "age": "32",
    "location": "Ciudad de México",
    "is_motorcyclist": true,
    "photo_url": "https://xyz.supabase.co/storage/v1/object/public/profile-photos/...",
    "allergies": "Penicilina",
    "medical_conditions": "Asma leve",
    "important_medications": "Salbutamol",
    "organ_donor": true,
    "medical_system": "IMSS",
    "sistema_medico": "IMSS",
    "nss": "12345678901",
    "clinica_asignada": "UMF 28",
    "curp_seguro": "MARC920101HDFRRL01",
    "aseguradora": "GNP",
    "numero_poliza": "POL-987654",
    "poliza_url": "https://xyz.supabase.co/storage/v1/object/public/...",
    "emergency_contacts": [
      {
        "name": "María Martínez",
        "phone": "+525598765432",
        "email": "maria@example.com"
      }
    ],
    "consent_timestamp": "2026-10-26T20:00:00.000Z"
  }
}
```

---

### Descripción Detallada de Campos

#### Nivel Raíz

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `folio` | `string` | **Sí** | Folio del chip a activar (ej. `"RSC-25H4L"`). |
| `profileData` | `object` | **Sí** | Objeto con los datos del perfil médico (ver desglose abajo). |
| `origen` | `string` | No | Si se envía `"app"`, se guarda `consent_version = 'v2.0-app'`. |
| `consentIp` | `string` | No | Dirección IP de aceptación. Si se omite, el servidor toma la IP de los headers HTTP (`x-forwarded-for` o `x-real-ip`). |
| `consentDatosSalud` | `boolean` | No | Si es `true`, guarda la fecha y hora de aceptación en `profiles.consent_datos_salud_at`. |

---

#### Objeto `profileData`

| Campo | Tipo | Obligatorio | Valores Permitidos / Formato |
|---|---|---|---|
| `full_name` | `string` | **Sí** | Nombre completo del usuario. |
| `phone` | `string` | **Sí** | Teléfono del usuario en formato E.164 (ej. `+525512345678`) o al menos 10 dígitos locales si es MX. |
| `country` | `string` | **Sí** | Código ISO de 2 letras del país de residencia/uso: `"MX"`, `"CR"`, `"DO"`, `"CO"`, `"CL"`, `"ES"`, `"US"`, `"CA"`, `"AR"`, `"PE"`, `"EC"`, `"GT"`, `"PA"`, `"VE"`, `"OTHER"`. |
| `sexo` | `string` | **Sí** | `"masculino"`, `"femenino"`, o `"otro"`. |
| `blood_type` | `string` | No | `"O+"`, `"O-"`, `"A+"`, `"A-"`, `"B+"`, `"B-"`, `"AB+"`, `"AB-"` o `""`. |
| `age` | `string` | No | Edad en años (ej. `"32"`). |
| `location` | `string` | No | Ciudad o estado de residencia. |
| `is_motorcyclist` | `boolean` | No | `true` si es motociclista, `false` en caso contrario. |
| `photo_url` | `string` | No | URL pública de la fotografía de perfil previamente subida al bucket de Storage. El servidor guarda la URL tal cual. |
| `allergies` | `string` | No | Alergias conocidas o texto libre descriptivo. |
| `medical_conditions` | `string` | No | Padecimientos preexistentes (diabetes, hipertensión, etc.). |
| `important_medications` | `string` | No | Medicamentos de uso regular. |
| `organ_donor` | `boolean` | No | Declaración de donador de órganos. |
| `medical_system` | `string` | No | Sistema médico público o privado según país. Ejemplos para México: `"IMSS"`, `"ISSSTE"`, `"IMSS-BIENESTAR"`, `"PEMEX"`, `"SEDENA / SEMAR"`, `"Seguro Privado (Gastos Médicos Mayores)"`, `"Ninguno"`. |
| `sistema_medico` | `string` | No | Equivalente en español a `medical_system`. |
| `nss` | `string` | No | Número de Seguridad Social (si aplica). |
| `clinica_asignada` | `string` | No | Clínica o UMF asignada. |
| `curp_seguro` | `string` | No | Identificación nacional / CURP ligada al seguro. |
| `aseguradora` | `string` | No | Nombre de la aseguradora privada (ej. `"AXA"`, `"GNP"`, etc.). |
| `numero_poliza` | `string` | No | Número de póliza de seguro médico. |
| `poliza_url` | `string` | No | URL pública del documento o carátula de póliza subido al Storage. |
| `emergency_contacts` | `array` | **Sí** | Lista de 1 a 3 contactos de emergencia. Formato detallado abajo. |
| `consent_timestamp` | `string` | No | Timestamp ISO de aceptación de términos y privacidad. |

---

#### Formato de `emergency_contacts`

Arreglo de objetos JSON con máximo 3 contactos:

```json
[
  {
    "name": "María Martínez",
    "phone": "+525598765432",
    "email": "maria@example.com"
  }
]
```

- Cada contacto completo debe incluir:
  - `name`: Nombre del contacto.
  - `phone`: Teléfono (mínimo 10 dígitos para México, 8 dígitos para otros países).
  - `email`: Correo electrónico con formato válido (obligatorio para permitir invitaciones de emergencia).
- Al menos **1 contacto completo** es estrictamente obligatorio.

---

### Respuestas de `/api/activate/complete`

#### `200 OK` (Activación Exitosa)
```json
{
  "success": true,
  "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

#### `400 Bad Request`
- Faltan `folio` o `profileData`.
- Contactos de emergencia inválidos (ej. teléfono incompleto, correo no válido o menos de 1 contacto).
```json
{
  "success": false,
  "error": "Contacto 1: el teléfono debe tener al menos 10 dígitos."
}
```

#### `401 Unauthorized`
- Token Bearer ausente, inválido o expirado.
```json
{
  "success": false,
  "error": "No autorizado"
}
```

#### `404 Not Found`
- El chip con el folio indicado no existe en la base de datos.
```json
{
  "success": false,
  "error": "Este folio no existe."
}
```

#### `409 Conflict`
- El chip ya está activado (`activated: true` o `status: 'activado'`).
```json
{
  "success": false,
  "error": "El chip no está disponible para activación."
}
```

#### `500 Internal Server Error`
- Error inesperado al escribir en la base de datos.
```json
{
  "success": false,
  "error": "Error interno del servidor."
}
```

---

## 2. POST `/api/activate/link-to-mine`

Permite a un usuario autenticado que ya posee un perfil médico activar un chip secundario/extra y vincularlo a su perfil existente sin tener que capturar nuevamente su ficha médica.

### Autenticación
- **Header obligatorio**: `Authorization: Bearer <access_token>`

### Request Body (JSON)
```json
{
  "folio": "RSC-33C97",
  "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `folio` | `string` | **Sí** | Folio del chip secundario que se desea activar. |
| `profileId` | `string` (UUID) | **Sí** | ID del perfil existente perteneciente al usuario autenticado. |

---

### Respuestas de `/api/activate/link-to-mine`

#### `200 OK`
```json
{
  "success": true
}
```

#### `400 Bad Request`
- Faltan `folio` o `profileId`, o el chip ya fue activado previamente.
```json
{
  "success": false,
  "error": "Este folio ya fue activado."
}
```

#### `401 Unauthorized`
- Token Bearer ausente o inválido.
```json
{
  "success": false,
  "error": "No autorizado"
}
```

#### `403 Forbidden`
- El `profileId` no pertenece al usuario autenticado en el token Bearer.
```json
{
  "success": false,
  "error": "No tienes permiso sobre este perfil."
}
```

#### `404 Not Found`
- El folio del chip no existe en el catálogo.
```json
{
  "success": false,
  "error": "Folio no encontrado."
}
```

#### `500 Internal Server Error`
- Error al actualizar el registro del chip en la base de datos.
```json
{
  "success": false,
  "error": "Error interno del servidor."
}
```
