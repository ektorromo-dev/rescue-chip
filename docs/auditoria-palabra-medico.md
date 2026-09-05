# Auditoría de Texto — Raíz "Médic/a" (Evaluación de Riesgo Regulatorio COFEPRIS)

> **Tipo de documento:** Auditoría diagnóstica de texto y copy (Solo Lectura)  
> **Fecha de ejecución:** 14 de Agosto de 2026  
> **Objetivo:** Mapear el 100% de las apariciones de la raíz léxica `médic` / `medic` (médico, médica, médicos, médicas, medicina, medicamento, medicamentos, etc.) a lo largo de todo el código fuente de RescueChip para diagnosticar la exposición regulatoria ante COFEPRIS (Comisión Federal para la Protección contra Riesgos Sanitarios).  
> **Estado:** Diagnóstico puro — Ningún archivo de código ha sido modificado.

---

## 1. Resumen Ejecutivo de la Auditoría

- **Archivos escaneados:** Todo el árbol de `src/` y `public/` (`.tsx`, `.ts`, `.json`, `.md`).
- **Total de líneas con coincidencia:** `217`
- **Archivos con coincidencias:** `25 archivos`

### Distribución por Pantalla / Escenario

| Pantalla / Escenario | Ocurrencias | Contexto principal |
| :--- | :--- | :--- |
| **Landing** (`src/app/page.tsx`) | **10** | Copy promocional, hero, features, propuesta de valor |
| **Metadata** (`src/app/layout.tsx`, etc.) | **2** | Tags OpenGraph, descripción y títulos SEO |
| **Dashboard / Activación** (`src/app/dashboard/`, `activate/`, `medical-systems.ts`, `admin/`) | **102** | Formularios de captura, configuración de seguro y salud, labels de inputs |
| **Familiares** (`src/app/emergencia/[token]/`, `EmergencyFamilyClient.tsx`) | **21** | Ficha de alerta compartida con contactos de emergencia |
| **Paramédico / Escaneo** (`src/app/profile/[id]/`, `ProfileViewer.tsx`, `FirstAidBanner.tsx`) | **41** | Ficha prehospitalaria mostrada al escanear el chip |
| **Legal** (`terminos/`, `privacidad/`, `terms/`, `privacy/`) | **33** | Términos de servicio, deslindes de responsabilidad médica, privacidad LFPDPPP |
| **API / Backend / Código Interno** (`actions/`, `api/`, `login/`, etc.) | **8** | Sanitizadores, comentarios de código y rutas backend |

### Distribución por Tipo de Texto

| Tipo | Ocurrencias | Nivel de Riesgo Regulatorio Típico |
| :--- | :--- | :--- |
| **Copy de marketing** | **12** | 🔴 **ALTO** (Público, sujeto a vigilancia de publicidad COFEPRIS) |
| **Etiqueta de UI** | **94** | 🟡 **MEDIO** (Visible para usuarios/paramédicos) |
| **Descriptor de dato de usuario** | **59** | 🟢 **BAJO** (Nombres de variables/campos de entrada) |
| **Texto legal** | **41** | 🛡️ **PROTECTOR / OBLIGATORIO** (Cláusulas de exclusión y deslinde) |
| **Comentario interno** | **11** | ⚪ **NULO** (No visible al usuario) |

---

## 2. Hallazgos Críticos por Área para Revisión COFEPRIS

### A. Landing Page (`src/app/page.tsx`)
Las frases que prometen o describen "información médica", "datos médicos", o "atención médica" en páginas públicas son las más sensibles ante la Ley General de Salud en materia de Publicidad:
1. *"Tu perfil médico de emergencia en el casco"* $ightarrow$ Posible sugerencia de dispositivo médico o expediente clínico.
2. *"Acceso instantáneo a tu información médica vital"* $ightarrow$ Sugiere registro/expediente.
3. *"Comparte tus datos médicos solo cuando sea necesario"* $ightarrow$ Descriptor de privacidad.

### B. Pantalla de Paramédico / Escaneo (`ProfileViewer.tsx`)
1. **Disclaimers existentes (Muy positivos para defensa legal):**  
   - `RESCUECHIP es un sistema de identificación médica. No es un servicio médico ni de emergencia.`
   - `En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional.`
2. **Botón de consentimiento:**  
   - `SOLO CONSULTAR DATOS MÉDICOS`
3. **Secciones:**  
   - `Condiciones Médicas`, `Medicamentos Importantes`, `Información de Seguro Médico`.

### C. Textos Legales (`src/app/terminos/page.tsx`)
El término legal contiene los descargos necesarios de no responsabilidad médica:
- *"RESCUECHIP no proporciona asesoramiento médico, diagnóstico ni tratamiento..."*
- *"No somos un proveedor de servicios médicos ni de salud..."*

---

## 3. Matriz Completa de Ocurrencias

| Archivo | Línea | Frase completa | Pantalla/escenario | Tipo |
| :--- | :--- | :--- | :--- | :--- |
| `src/app/actions/sanitize.ts` | 82 | `if (data.medications !== undefined) cleanData.medications = cleanAndTruncate(data.medications, 500);` | Comentario de código | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 14 | `import { getMedicalConfig, PROFILE_COUNTRIES, getPhoneCountryFromProfileCountry } from '@/lib/medical-systems';` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 46 | `const [medicalSystem, setMedicalSystem] = useState("");` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 59 | `const medicalConfig = getMedicalConfig(profileCountry);` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 353 | `medical_conditions: formData.get("medicalConditions") as string,` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 354 | `important_medications: formData.get("importantMedications") as string,` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 539 | `Detectamos que el correo <strong style={{ color: '#F4F0EB' }}>{pendingAuthData?.email}</strong> ya tiene un perfil médico activo.` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 545 | `Si es para ti, compartirá la misma información médica. Si es para otra persona, deberás usar un correo distinto.` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 635 | `La información que proporciones aquí será accesible únicamente al escanear físicamente el chip NFC asociado a este folio. Por favor revisa que tus datos sean correctos para asegurar la mejor atención médica posible en caso de emergencia.` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 718 | `// Reset seguro médico al cambiar país` | Dashboard | comentario interno |
| `src/app/activate/page.tsx` | 752 | `Selecciona el país donde usarás tu RescueChip. Esto adapta los campos médicos y legales a tu región.` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 779 | `<p style={{ fontSize: "12px", color: "#9E9A95", fontWeight: 500 }}>Sube o toma una foto clara de tu rostro.<br />Establece tu identidad rápidamente ante los paramédicos.</p>` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1140 | `{/* INFORMACIÓN MÉDICA */}` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1144 | `Información Médica` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1171 | `<label htmlFor="medicalConditions" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Condiciones Médicas (Opcional)</label>` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1172 | `<textarea id="medicalConditions" name="medicalConditions" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none...` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1175 | `<label htmlFor="importantMedications" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Medicamentos Importantes (Opcional)</label>` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1176 | `<textarea id="importantMedications" name="importantMedications" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline:...` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1181 | `{/* SEGURO MÉDICO (UNIFIED) */}` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1185 | `Mi Seguro Médico <span style={{ color: "#9E9A95", fontSize: "14px", marginLeft: "8px" }}>(Opcional)</span>` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1189 | `<label htmlFor="medicalSystem" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1192 | `<select id="medicalSystem" name="medicalSystem" value={medicalSystem}` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1196 | `<option value="Seguro Privado">{medicalConfig.privateSystemLabel}</option>` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1200 | `<option value="Sin seguro médico">Sin seguro médico</option>` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1205 | `{medicalSystem === "Seguro Privado" && (` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1207 | `{medicalConfig.privateGeneric ? (` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1225 | `{medicalConfig.privateInsurers.map(ins => (` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1273 | `{medicalConfig.publicSystems.map(sys => sys.value === medicalSystem && (` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1296 | `{sys.clinicaLabel \|\| 'Unidad médica asignada'} (Opcional)` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1315 | `{medicalSystem === "Sin seguro médico" && (` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1318 | `{medicalConfig.noneWarning}` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1355 | `Tu perfil mostrará una alerta para los paramédicos pidiendo "NO RETIRAR EL CASCO" si no hay personal médico capacitado.` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1363 | `<textarea id="additionalNotes" name="additionalNotes" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', b...` | Dashboard | etiqueta de UI |
| `src/app/activate/page.tsx` | 1391 | `En caso de emergencia, el personal médico determinará el hospital más adecuado. Este dato es solo una referencia.` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1413 | `<li>Entiendo que RESCUECHIP es un sistema de identificación médica, NO un servicio médico ni de emergencia. No garantiza resultados médicos favorables.</li>` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1415 | `<li>Me comprometo a proporcionar información médica veraz y mantenerla actualizada. La exactitud de mis datos es mi responsabilidad exclusiva.</li>` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1416 | `<li>Entiendo que la efectividad del sistema depende de terceros (paramédicos, testigos, red celular, estado del chip), y que RESCUECHIP no controla ni garantiza estos factores.</li>` | Dashboard | descriptor de dato de usuario |
| `src/app/activate/page.tsx` | 1477 | `Crea tu perfil médico de emergencia en minutos.` | Dashboard | descriptor de dato de usuario |
| `src/app/admin/page.tsx` | 11 | `const OUTCOMES = ['Chip escaneado por paramédico', 'Contacto de emergencia notificado', 'Información médica utilizada', 'Solo chip leído', 'No confirmado']` | Dashboard | etiqueta de UI |
| `src/app/admin/page.tsx` | 118 | `const [accForm, setAccForm] = useState({ incident_date: new Date().toISOString().split('T')[0], incident_time: '', estado: 'CDMX', municipio: '', tipo: TIPOS_ACC[0], severidad: 'moderado', chip_folio: '', chip_scanned: false, outcome: OUTCOMES[0],...` | Dashboard | etiqueta de UI |
| `src/app/admin/page.tsx` | 204 | `setAccForm({ incident_date: new Date().toISOString().split('T')[0], incident_time: '', estado: 'CDMX', municipio: '', tipo: TIPOS_ACC[0], severidad: 'moderado', chip_folio: '', chip_scanned: false, outcome: OUTCOMES[0], medical_info_used: false, f...` | Dashboard | etiqueta de UI |
| `src/app/admin/page.tsx` | 709 | `{[['chip_scanned', 'Chip escaneado'], ['medical_info_used', 'Info médica usada'], ['family_notified', 'Familia notificada'], ['hospital_notified', 'Hospital notificado'], ['media_worthy', 'Mediático'], ['b2b_case_study', 'Caso B2B']].map(([k, l]) ...` | Dashboard | etiqueta de UI |
| `src/app/api/activate/complete/route.ts` | 45 | `error: profileInsertError.message \|\| "Fallo al guardar el perfil médico.",` | Comentario de código | descriptor de dato de usuario |
| `src/app/api/checkout/route.ts` | 64 | `priceData.product_data.description = "Llavero NFC + QR de identificación médica de emergencia";` | Comentario de código | descriptor de dato de usuario |
| `src/app/api/log-access/route.ts` | 193 | `Ver instrucciones y datos médicos` | Comentario de código | descriptor de dato de usuario |
| `src/app/api/request-device-verification/route.ts` | 98 | `<p style="font-size: 16px; color: #333; line-height: 1.5;">Hemos bloqueado temporalmente un intento de acceso a tu cuenta médica desde un dispositivo nuevo.</p>` | Comentario de código | descriptor de dato de usuario |
| `src/app/api/webhook/route.ts` | 189 | `<p style="color: #555; font-size: 16px;">Una vez que recibas tus chips, ingresa a <a href="https://rescue-chip.com/activate" style="color: #e11d48; font-weight: bold;">rescue-chip.com/activate</a> para crear tu perfil médico de emergencia.</p>` | Comentario de código | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 13 | `import { getMedicalConfig, PROFILE_COUNTRIES, getPhoneCountryFromProfileCountry } from '@/lib/medical-systems';` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 41 | `const [medicalConditions, setMedicalConditions] = useState("");` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 42 | `const [importantMedications, setImportantMedications] = useState("");` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 45 | `const [medicalSystem, setMedicalSystem] = useState("");` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 249 | `throw new Error("No se encontró un perfil médico asociado a esta cuenta. Si acabas de adquirir tu Chip NFC o Pulsera, actívalo ahora.");` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 292 | `setMedicalConditions(profile.medical_conditions \|\| "");` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 293 | `setImportantMedications(profile.important_medications \|\| "");` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 296 | `setMedicalSystem(profile.medical_system \|\| "");` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 381 | `medical_conditions: null,` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 382 | `important_medications: null,` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 386 | `medical_system: null,` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 472 | `medical_conditions: medicalConditions,` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 473 | `important_medications: importantMedications,` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 476 | `medical_system: medicalSystem,` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 519 | `medical_system: null,` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 536 | `setMedicalSystem("");` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 560 | `const medicalConfig = getMedicalConfig(profileCountry);` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 609 | `🏍️ Mi Perfil Médico` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 612 | `Actualiza tu información médica en cualquier momento.` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 632 | `<p style={{ color: "#9E9A95", fontSize: "18px" }}>No tienes un perfil médico vinculado todavía.</p>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 646 | `<p style={{ fontSize: "14px", color: "#9E9A95", marginTop: "4px" }}>Este es el enlace al que accederán los paramédicos al escanear uno de tus chips.</p>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 683 | `setMedicalSystem('');` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 716 | `Selecciona el país donde usarás tu RescueChip. Esto adapta los campos médicos y legales a tu región.` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 899 | `{/* INFORMACIÓN MÉDICA */}` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 903 | `Información Médica` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 933 | `<label htmlFor="medicalConditions" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Condiciones Médicas</label>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 934 | `<textarea id="medicalConditions" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} onInput={(e) => {` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 941 | `<label htmlFor="importantMedications" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Medicamentos Importantes</label>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 942 | `<textarea id="importantMedications" value={importantMedications} onChange={(e) => setImportantMedications(e.target.value)} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", width: "100%", display: "flex", borderRadius:...` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 951 | `<span>Mi Seguro Médico</span>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 953 | `{(medicalSystem \|\| currentPolizaUrl) && (` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 961 | `<label htmlFor="medicalSystem" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 965 | `<select id="medicalSystem" value={medicalSystem}` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 966 | `onChange={(e) => { setMedicalSystem(e.target.value); setAseguradora(''); }}` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 970 | `<option value="Seguro Privado">{medicalConfig.privateSystemLabel}</option>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 974 | `<option value="Sin seguro médico">Sin seguro médico</option>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 981 | `{medicalSystem === "Seguro Privado" && (` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 983 | `{medicalConfig.privateGeneric ? (` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 1001 | `{medicalConfig.privateInsurers.map(ins => (` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 1051 | `<p style={{ fontSize: "12px", color: "#9E9A95" }}>Sube el extracto de tu póliza (máx 5MB). Se mostrará a paramédicos.</p>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 1087 | `{medicalConfig.publicSystems.map(sys => sys.value === medicalSystem && (` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 1110 | `{sys.clinicaLabel \|\| 'Unidad médica asignada'} (Opcional)` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 1128 | `{medicalSystem === "Sin seguro médico" && (` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 1131 | `{medicalConfig.noneWarning}` | Dashboard | descriptor de dato de usuario |
| `src/app/dashboard/page.tsx` | 1166 | `<p style={{ fontSize: "12px", color: "#9E9A95" }}>En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo una referencia.</p>` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 1272 | `Al eliminar tus datos, tu perfil médico quedará completamente en blanco. Los paramédicos que escaneen tu chip o código QR no podrán ver nombre, tipo de sangre, alergias, contactos de emergencia, ni ninguna otra información crítica. Esta acción es ...` | Dashboard | etiqueta de UI |
| `src/app/dashboard/page.tsx` | 1301 | `Esto borrará permanentemente tu nombre, contactos de emergencia, alergias y toda tu historia médica de RescueChip. Tu chip quedará en blanco.` | Dashboard | etiqueta de UI |
| `src/app/emergencia/demo/page.tsx` | 25 | `medicalConditions: null,` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 19 | `medicalConditions: string \| null;` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 147 | `detail: 'INE/identificación de la persona (si la tienes), tu propia INE, póliza de seguro médico si aplica, efectivo o tarjeta, y cargador de celular.',` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 152 | `detail: 'Lleva los documentos de arriba. Al llegar, di que la persona tiene perfil médico digital en RescueChip — los paramédicos ya tienen acceso a los datos.',` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 159 | `'Póliza de seguro médico (si existe)',` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 190 | `Abajo encontrarás toda la información que necesitas: ubicación, datos médicos, y pasos exactos de qué hacer.` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 233 | `{/* ── DATOS MÉDICOS ── */}` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 237 | `🏥 Datos médicos de {firstName}` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 240 | `Si llegas al hospital, confirma esta información con el personal médico.` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 278 | `{profile.medicalConditions && (` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 280 | `<div style={labelStyle}>Condiciones médicas</div>` | Familiares | etiqueta de UI |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 281 | `<div style={{ fontSize: '14px' }}>{profile.medicalConditions}</div>` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 284 | `{profile.importantMedications && (` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 286 | `<div style={labelStyle}>Medicamentos</div>` | Familiares | etiqueta de UI |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 287 | `<div style={{ fontSize: '14px' }}>{profile.importantMedications}</div>` | Familiares | etiqueta de UI |
| `src/app/emergencia/[token]/EmergencyFamilyClient.tsx` | 437 | `<strong style={{ color: "#9E9A95" }}>RESCUECHIP</strong> es un sistema de identificación médica. No sustituye servicios de emergencia. Llame al <strong style={{ color: "#E8231A", fontSize: "12px" }}>911</strong> ante cualquier emergencia. La infor...` | Familiares | etiqueta de UI |
| `src/app/emergencia/[token]/page.tsx` | 40 | `medicalConditions: 'Asma leve controlada',` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/page.tsx` | 111 | `// 3. Cargar perfil médico` | Familiares | comentario interno |
| `src/app/emergencia/[token]/page.tsx` | 116 | `.select('full_name, blood_type, medical_conditions, important_medications, allergies, emergency_contacts, sexo, age, location')` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/page.tsx` | 144 | `medicalConditions: profileData.medical_conditions \|\| null,` | Familiares | descriptor de dato de usuario |
| `src/app/emergencia/[token]/page.tsx` | 145 | `importantMedications: profileData.important_medications \|\| null,` | Familiares | descriptor de dato de usuario |
| `src/app/layout.tsx` | 22 | `title: "RescueChip \| Tu perfil médico en tu casco",` | Metadata | copy de marketing |
| `src/app/layout.tsx` | 23 | `description: "Plataforma de activación de chips NFC para emergencias médicas en motociclistas.",` | Metadata | copy de marketing |
| `src/app/login/page.tsx` | 83 | `Accede a tu panel para gestionar tu perfil médico.` | Comentario de código | comentario interno |
| `src/app/page.tsx` | 479 | `<li><Link href="/dashboard" className="nav-cta">Mi perfil médico</Link></li>` | Landing | copy de marketing |
| `src/app/page.tsx` | 501 | `<li><Link href="/dashboard" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>Mi perfil médico</Link></li>` | Landing | copy de marketing |
| `src/app/page.tsx` | 514 | `<div className="hero-badge">Alineado con NOM-034-SSA3-2013 · Identificación Médica</div>` | Landing | copy de marketing |
| `src/app/page.tsx` | 516 | `<p className="hero-sub">Un chip NFC y un Código QR en tu casco que permite a los paramédicos o testigos acceder a tu perfil médico y alertar a tu familia con tu ubicación exacta. Sin app. Sin registro previo. En segundos. Además de una tarjeta méd...` | Landing | copy de marketing |
| `src/app/page.tsx` | 521 | `🩺 Lo que el paramédico ve` | Landing | copy de marketing |
| `src/app/page.tsx` | 632 | `<p>Un testigo o paramédico acerca su celular al chip o escanea el QR. Sin app, sin registro. Tu perfil médico aparece en segundos.</p>` | Landing | copy de marketing |
| `src/app/page.tsx` | 656 | `<p>Alertas SMS + email automáticos con tu ubicación GPS exacta al momento que un paramédico o testigo lo escanean. No necesitas hacer nada, RescueChip habla por ti.</p>` | Landing | copy de marketing |
| `src/app/page.tsx` | 664 | `<p>Edita tu perfil médico, contactos de emergencia y datos personales desde tu dashboard en cualquier momento. Tú decides qué información compartes.</p>` | Landing | copy de marketing |
| `src/app/page.tsx` | 680 | `<p>Ofrece seguridad médica como valor agregado a tus clientes y mejora la experiencia de compra en tu negocio.</p>` | Landing | copy de marketing |
| `src/app/page.tsx` | 688 | `<li>Perfil médico completo por chip</li><li>Alertas automáticas SMS + email al escanear</li><li>Soporte por WhatsApp durante la implementación</li><li>Factura electrónica CFDI 4.0</li>` | Landing | copy de marketing |
| `src/app/privacidad/page.tsx` | 51 | `<li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de salud (SENSIBLES):</span> Tipo de sangre, alergias, enfermedades crónicas, medicamentos en uso, condiciones médicas relevantes.</li>` | Legal | texto legal |
| `src/app/privacidad/page.tsx` | 65 | `<li>Almacenar y mostrar el perfil médico de emergencia del titular al ser escaneado el chip NFC o código QR.</li>` | Legal | texto legal |
| `src/app/privacidad/page.tsx` | 90 | `<span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> recaba y trata datos personales sensibles relativos al estado de salud del titular (tipo de sangre, alergias, enfermedades, medicamentos). Estos datos son estrictamente necesari...` | Legal | texto legal |
| `src/app/privacidad/page.tsx` | 102 | `El titular reconoce y acepta que el perfil médico de emergencia será accesible <span style={{ color: "#F4F0EB", fontWeight: 600 }}>PÚBLICAMENTE</span> al escanear el chip NFC o código QR, sin necesidad de autenticación por parte del tercero que re...` | Legal | texto legal |
| `src/app/privacidad/page.tsx` | 105 | `El perfil muestra únicamente: nombre corto (primer nombre y primer apellido), sexo, tipo de sangre, alergias, enfermedades crónicas, medicamentos, y nombre y teléfono de contactos de emergencia.` | Legal | texto legal |
| `src/app/privacy/page.tsx` | 21 | `En RescueChip, nos tomamos muy en serio la privacidad y protección de sus datos médicos y personales, cumpliendo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) en México.` | Legal | texto legal |
| `src/app/privacy/page.tsx` | 27 | `content: 'Recopilamos la información que usted proporciona voluntariamente al activar su dispositivo NFC, la cual incluye pero no se limita a: nombre completo, edad, tipo de sangre, alergias, condiciones médicas, medicamentos, información de segur...` | Legal | texto legal |
| `src/app/privacy/page.tsx` | 34 | `'Proporcionar información vital a paramédicos, primeros respondientes y personal de salud exclusivamente en caso de accidente o emergencia médica.',` | Legal | texto legal |
| `src/app/privacy/page.tsx` | 40 | `content: 'Su información solo es accesible de forma pública a través del escaneo físico del chip NFC mediante un dispositivo móvil, o ingresando la URL pública exacta asociada a su número de folio. El usuario asume que, debido a la naturaleza vita...` | Legal | texto legal |
| `src/app/privacy/page.tsx` | 44 | `content: 'RescueChip no venderá, alquilará ni compartirá su información con terceros para fines de marketing, publicidad o análisis de datos. Sus datos están alojados en servidores seguros y solo se comparten en la circunstancia de una emergencia ...` | Legal | texto legal |
| `src/app/privacy/page.tsx` | 48 | `content: 'Usted tiene en todo momento el derecho de Acceder, Rectificar, Cancelar u Oponerse (Derechos ARCO) al tratamiento de su información. Si desea eliminar permanentemente su perfil médico o actualizar sus datos, puede solicitarlo enviando un...` | Legal | texto legal |
| `src/app/privacy/page.tsx` | 56 | `content: 'Al activar su chip NFC o código QR RescueChip, el titular otorga consentimiento expreso para que su perfil de emergencia —incluyendo tipo de sangre, alergias, padecimientos, medicamentos críticos y contactos de emergencia— sea accesible ...` | Legal | texto legal |
| `src/app/profile/[id]/page.tsx` | 37 | `medical_conditions: 'Asma leve', important_medications: 'Salbutamol (inhalador de rescate)',` | Paramédico | descriptor de dato de usuario |
| `src/app/profile/[id]/page.tsx` | 38 | `additional_notes: 'Usa lentes de contacto', medical_system: 'Seguro Privado (Gastos Médicos Mayores)',` | Paramédico | descriptor de dato de usuario |
| `src/app/profile/[id]/page.tsx` | 96 | `if (!profile) return <div>Error al cargar el perfil médico.</div>;` | Paramédico | etiqueta de UI |
| `src/app/profile/[id]/page.tsx` | 173 | `if (pError \|\| !profile) return <div>Error al cargar el perfil médico.</div>;` | Paramédico | etiqueta de UI |
| `src/app/terminos/page.tsx` | 55 | `<span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> es un sistema de identificación médica prehospitalaria de 3 capas compuesto por:` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 60 | `<li>Una tarjeta médica de cartera con información básica de emergencia y acceso al perfil digital.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 61 | `<li>Una plataforma digital accesible en rescue-chip.com que almacena el perfil médico del Usuario.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 68 | `<span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP ES UN SISTEMA DE IDENTIFICACIÓN, NO UN SERVICIO MÉDICO NI DE EMERGENCIA.</span> El sistema tiene como único propósito facilitar la identificación del Usuario y el acceso a sus datos mé...` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 74 | `<li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> no es un dispositivo médico regulado por COFEPRIS. No diagnostica, trata, monitorea ni cura enfermedades o condiciones médicas.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 75 | `<li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> no sustituye al Sistema de Atención Médica de Urgencias (SAMU), al número de emergencias 911, ni a ningún servicio de emergencia público o privado.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 76 | `<li>La efectividad del sistema depende de factores fuera del control del Proveedor, incluyendo: la acción de terceros (paramédicos, testigos), la disponibilidad de red celular e internet en el lugar del incidente, el estado físico del Chip y del s...` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 78 | `<li>La exactitud de la información médica contenida en el perfil es responsabilidad exclusiva del Usuario, quien se obliga a mantenerla actualizada.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 120 | `Una vez recibido el producto, el Usuario deberá activar su chip ingresando a rescue-chip.com/activate e introduciendo el folio RSC-XXXXX impreso en su sticker. Durante este proceso, el Usuario proporcionará sus datos médicos y de contacto de emerg...` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 127 | `Al activar el Chip, el Usuario otorga su consentimiento expreso e informado para que la información médica registrada sea accesible de forma <span style={{ color: "#F4F0EB", fontWeight: 600 }}>PÚBLICA</span> a través del escaneo NFC o QR, sin nece...` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 130 | `El Usuario podrá revocar este consentimiento en cualquier momento eliminando sus datos médicos desde el panel de control (dashboard) en rescue-chip.com. La eliminación de datos es permanente e irreversible.` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 140 | `<li>Proporcionar información médica veraz, completa y actualizada.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 141 | `<li>Mantener actualizados sus datos médicos y contactos de emergencia.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 156 | `<span style={{ color: "#F4F0EB", fontWeight: 600 }}>EL PROVEEDOR NO GARANTIZA QUE EL SISTEMA RESCUECHIP PRODUCIRÁ UN RESULTADO MÉDICO FAVORABLE, SALVARÁ VIDAS O EVITARÁ DAÑOS PERSONALES.</span> El sistema es una herramienta de identificación cuya ...` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 170 | `<li>Información médica incorrecta, incompleta o desactualizada proporcionada por el Usuario.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 173 | `<li>Uso del sistema para finalidades distintas a la identificación médica prehospitalaria.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 205 | `<li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de salud (sensibles):</span> tipo de sangre, alergias, enfermedades crónicas, medicamentos.</li>` | Legal | texto legal |
| `src/app/terminos/page.tsx` | 214 | `El Usuario acepta expresamente que su perfil médico será accesible <span style={{ color: "#F4F0EB", fontWeight: 600 }}>SIN AUTENTICACIÓN</span> al ser escaneado el chip NFC o el código QR. Esta accesibilidad pública es una condición esencial del s...` | Legal | texto legal |
| `src/app/terms/page.tsx` | 27 | `content: 'RescueChip provee una etiqueta NFC que redirige a un perfil web con información médica de emergencia. Nuestro servicio no sustituye de ninguna forma la atención, consejo, diagnóstico o tratamiento de un profesional médico certificado.'` | Legal | texto legal |
| `src/app/terms/page.tsx` | 31 | `content: 'Es entera y exclusiva responsabilidad del usuario proporcionar información veraz, precisa y actualizada en su perfil médico. RescueChip no valida, audita ni verifica médicamente los datos proporcionados (tipo de sangre, alergias, medicam...` | Legal | texto legal |
| `src/app/terms/page.tsx` | 35 | `content: 'Aunque el chip NFC es pasivo y no requiere batería, el escaneo exitoso del mismo requiere de un dispositivo móvil (smartphone) compatible, configurado correctamente (NFC encendido) y con acceso a internet. RescueChip no garantiza que tod...` | Legal | texto legal |
| `src/app/update-password/page.tsx` | 110 | `Crea una nueva contraseña para acceder a tu perfil médico.` | Comentario de código | comentario interno |
| `src/components/FirstAidBanner.tsx` | 39 | `¿No eres paramédico?` | Paramédico | etiqueta de UI |
| `src/components/FirstAidBanner.tsx` | 74 | `No muevas al motociclista. Espera a los paramédicos.` | Paramédico | etiqueta de UI |
| `src/components/FirstAidBanner.tsx` | 142 | `Muestra este perfil al paramédico` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer.tsx` | 7 | `import { getMedicalConfig } from '@/lib/medical-systems';` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer.tsx` | 23 | `const medicalConfig = getMedicalConfig(profile?.country \|\| 'MX');` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer.tsx` | 324 | `{isLoadingConsent ? "PROCESANDO..." : <>SOLO CONSULTAR DATOS MÉDICOS</>}` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer.tsx` | 566 | `{/* MEDICAL DETAILS */}` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer.tsx` | 584 | `{(profile.medical_conditions \|\| profile.important_medications) && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 587 | `{profile.medical_conditions && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 589 | `<h4 style={{ color: C.amber, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>Condiciones Médicas</h4>` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer.tsx` | 590 | `<p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.6, backgroundColor: C.bgCard, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: C.textMain }}>{profile.medical_conditions}</p>` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 593 | `{profile.important_medications && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 595 | `<h4 style={{ color: C.amber, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>Medicamentos Importantes</h4>` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer.tsx` | 596 | `<p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.6, backgroundColor: C.bgCard, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: C.textMain }}>{profile.important_medications}</p>` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 603 | `{(profile.medical_system \|\| profile.aseguradora \|\| profile.numero_poliza) && profile.medical_system !== "Sin seguro médico" && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 611 | `{(!profile.medical_system \|\| profile.medical_system.includes("Privado") \|\| profile.medical_system === "Otro") && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 635 | `{profile.medical_system && !profile.medical_system.includes("Privado") && profile.medical_system !== "Otro" && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 639 | `<p style={{ fontWeight: 900, fontSize: '16px', color: C.textMain }}>{isEmergency ? profile.medical_system : (profile.medical_system ? profile.medical_system.substring(0, 3) + '***' : '')}</p>` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 660 | `const sys = profile.medical_system;` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer.tsx` | 764 | `<p style={{ fontSize: '10px', color: C.textMuted, marginTop: '12px', lineHeight: 1.4, opacity: 0.8 }}>En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo...` | Paramédico | texto legal |
| `src/components/ProfileViewer.tsx` | 779 | `<strong style={{ color: "#9E9A95" }}>RESCUECHIP</strong> es un sistema de identificación médica. No es un servicio médico ni de emergencia. La información mostrada fue proporcionada por el usuario y puede no estar actualizada. En caso de emergenci...` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer_mod.tsx` | 311 | `{/* MEDICAL DETAILS */}` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer_mod.tsx` | 312 | `{(allergiesArray.length > 0 \|\| profile.medical_conditions \|\| profile.important_medications) && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 315 | `<FileText size={18} className="text-primary" /> Historial Médico` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer_mod.tsx` | 334 | `{profile.medical_conditions && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 336 | `<h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Condiciones Médicas</h4>` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer_mod.tsx` | 337 | `<p className="text-sm font-medium leading-relaxed bg-background p-3 rounded-xl border border-border">{profile.medical_conditions}</p>` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 340 | `{profile.important_medications && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 342 | `<h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Medicamentos Importantes</h4>` | Paramédico | etiqueta de UI |
| `src/components/ProfileViewer_mod.tsx` | 343 | `<p className="text-sm font-medium leading-relaxed bg-background p-3 rounded-xl border border-border">{profile.important_medications}</p>` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 351 | `{(profile.medical_system \|\| profile.aseguradora \|\| profile.numero_poliza) && profile.medical_system !== "Sin seguro médico" && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 359 | `{(!profile.medical_system \|\| profile.medical_system.includes("Privado") \|\| profile.medical_system === "Otro") && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 383 | `{profile.medical_system && !profile.medical_system.includes("Privado") && profile.medical_system !== "Otro" && (` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 387 | `<p className="font-black text-lg">{profile.medical_system}</p>` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 408 | `const sys = profile.medical_system;` | Paramédico | descriptor de dato de usuario |
| `src/components/ProfileViewer_mod.tsx` | 499 | `<p className="text-[10px] text-muted-foreground mt-3 leading-tight pointer-events-none opacity-80">En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo un...` | Paramédico | texto legal |
| `src/components/ProfileViewer_mod.tsx` | 514 | `Este sistema no sustituye atención médica profesional.` | Paramédico | texto legal |
| `src/lib/medical-systems.ts` | 27 | `export const MEDICAL_SYSTEMS: Record<string, InsuranceConfig> = {` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 56 | `clinicaLabel: 'Unidad médica asignada',` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 63 | `clinicaLabel: 'Unidad médica asignada'` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 67 | `privateSystemLabel: 'Seguro Privado (Gastos Médicos Mayores)',` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 69 | `noneWarning: 'En caso de emergencia serás atendido en el hospital público más cercano. Te recomendamos considerar un seguro de gastos médicos mayores.',` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 125 | `clinicaLabel: 'IPS / Centro médico asignado',` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 136 | `privateSystemLabel: 'Medicina Prepagada / Seguro Privado',` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 151 | `privateInsurers: ['Isapre Banmédica', 'Isapre Cruz Blanca', 'Isapre Consalud', 'Isapre Colmena', 'Isapre Vida Tres'],` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 183 | `value: 'Medicare', label: 'Medicare',` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 185 | `nssLabel: 'Medicare Beneficiary ID (MBI)'` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 188 | `value: 'Medicaid', label: 'Medicaid',` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 190 | `nssLabel: 'Medicaid ID Number'` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 223 | `noneWarning: 'En caso de emergencia, serás atendido en el centro médico más cercano.',` | Dashboard | etiqueta de UI |
| `src/lib/medical-systems.ts` | 227 | `export function getMedicalConfig(countryCode: string): InsuranceConfig {` | Dashboard | etiqueta de UI |
