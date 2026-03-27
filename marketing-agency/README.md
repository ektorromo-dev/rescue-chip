# Agencia de Marketing RescueChip

Sistema de agentes de IA que genera contenido, calendarios, anuncios, guiones
y estrategias de marketing para RescueChip — sin servidores, sin base de datos,
todo desde tu terminal.

---

## Instalacion (una sola vez)

### Paso 1 — Instalar Python

Necesitas Python 3.10 o mayor.

Descargalo desde: https://www.python.org/downloads/

Para verificar que tienes la version correcta:
```
python --version
```
Debe mostrar algo como: `Python 3.10.x` o superior.

---

### Paso 2 — Instalar las dependencias

Abre una terminal, navega a esta carpeta y ejecuta:

```
pip install -r requirements.txt
```

---

### Paso 3 — Configurar tu API key de Anthropic

1. Copia el archivo `.env.example`
2. Renombra la copia como `.env` (sin la parte `.example`)
3. Abre el archivo `.env` con cualquier editor de texto (Notepad, VS Code, etc.)
4. Reemplaza `tu_api_key_de_anthropic_aqui` con tu API key real
5. Guarda el archivo

Si no tienes una API key, puedes obtenerla en: https://console.anthropic.com

El archivo `.env` debe verse asi:
```
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXX...
```

---

## Uso

Abre una terminal en esta carpeta y ejecuta:

```
python orchestrator.py
```

Aparecera este menu:

```
=======================================================
   AGENCIA DE MARKETING RESCUECHIP
=======================================================

  Que necesitas hoy?

  1. Contenido de la semana
     (posts + calendario + guion TikTok)

  2. Campana de anuncios
     (Facebook Ads / Instagram Ads)

  3. Contactar influencers
     (mensajes personalizados + codigos + tracker)

  4. Reporte del mes
     (analisis de performance + recomendaciones)

  5. Pregunta libre al CMO
     (estrategia, dudas, decision de marketing)

  0. Salir
```

---

## Que genera cada opcion

### Opcion 1 — Contenido de la semana

**Que hacer:** Escribe la semana (ej: "semana del 24 al 30 de marzo de 2026")

**Que genera:**
- 5 posts listos para copiar y publicar (Facebook, Instagram, TikTok)
- Calendario con dia, plataforma, horario y objetivo de cada post
- 1 guion de TikTok/Reels listo para grabar

**Donde se guarda:** `outputs/content_calendar/`

**Tiempo aproximado:** 3-5 minutos

---

### Opcion 2 — Campana de anuncios

**Que hacer:** Elige el producto, describe el objetivo y el presupuesto

**Que genera:**
- Analisis del angulo creativo de la campana
- 3 variantes de anuncio con titular, texto, segmentacion y presupuesto sugerido
- Instrucciones de como hacer A/B testing en Facebook Ads Manager

**Donde se guarda:** `outputs/ad_copy/`

**Tiempo aproximado:** 3-4 minutos

---

### Opcion 3 — Contactar influencers

**Que hacer:** Ingresa el nombre, usuario de IG, seguidores y descripcion de cada influencer

**Que genera:**
- Mensaje de primer contacto personalizado para cada influencer (listo para copiar al DM)
- Codigo de descuento unico para cada influencer
- Mensaje de seguimiento si no responde en 7 dias
- Tabla tracker para llevar el registro de cada conversacion

**Donde se guarda:** `outputs/influencer_outreach/`

**Tiempo aproximado:** 2-3 minutos

---

### Opcion 4 — Reporte del mes

**Que hacer:** Opcionalmente ingresa datos del mes (ventas, activaciones, posts publicados)

**Que genera:**
- Resumen ejecutivo del mes
- Que esta funcionando (con datos)
- Que no esta funcionando (con datos)
- 3 a 5 acciones concretas para el proximo mes
- Alertas si hay algo que requiere atencion inmediata

**Donde se guarda:** `outputs/reports/`

**Tiempo aproximado:** 1-2 minutos

---

### Opcion 5 — Consulta libre al CMO

**Que hacer:** Escribe cualquier pregunta estrategica de marketing

**Que genera:**
- Respuesta estrategica detallada del CMO de IA
- Basada en el contexto completo de RescueChip (marca, audiencia, productos, competencia)

**Donde se guarda:** `outputs/reports/`

**Tiempo aproximado:** 1-3 minutos

---

## Donde encuentro los resultados

Todos los outputs se guardan en la carpeta `outputs/` con la fecha y hora de generacion:

```
outputs/
├── content_calendar/    <- Posts, calendarios, semanas completas
├── ad_copy/             <- Campanas de anuncios
├── scripts/             <- Guiones de TikTok y video
├── influencer_outreach/ <- Mensajes y tracker de influencers
└── reports/             <- Reportes mensuales y respuestas del CMO
```

Cada archivo tiene el nombre del contenido + fecha + hora.
Ejemplo: `semana-completa-semana-del-24-al-30-20260324-143022.md`

---

## Errores comunes y como resolverlos

**"No se encontro la API key"**
→ Verifica que el archivo `.env` existe en esta carpeta y tiene tu key correcta.

**"Falta instalar las dependencias"**
→ Ejecuta: `pip install -r requirements.txt`

**"La API key es invalida o ha expirado"**
→ Verifica tu key en https://console.anthropic.com

**"Se alcanzo el limite de uso de la API"**
→ Espera unos minutos. Si tienes cuenta gratuita, puede haber un limite por hora.

**El programa tarda mucho**
→ Es normal. La IA esta generando el contenido. Los workflows de 3 agentes
  pueden tomar hasta 5 minutos. No cierres la terminal.

---

## Estructura del proyecto

```
marketing-agency/
├── orchestrator.py          <- El archivo que ejecutas (ESTE)
├── requirements.txt         <- Dependencias de Python
├── .env.example             <- Plantilla para configurar tu API key
├── .env                     <- Tu API key (crealo copiando .env.example)
├── agents/
│   ├── base_agent.py        <- Clase base compartida por todos los agentes
│   ├── cmo.py               <- CMO estrategico (usa el modelo mas potente)
│   ├── content_creator.py   <- Redactor de contenido
│   ├── social_media_manager.py <- Manager de redes sociales
│   ├── script_writer.py     <- Guionista de video
│   ├── ads_manager.py       <- Manager de publicidad pagada
│   ├── influencer_manager.py <- Manager de influencers
│   └── analytics_agent.py   <- Agente de analisis
├── workflows/
│   ├── weekly_content.py    <- Contenido semanal completo
│   ├── ad_campaign.py       <- Campana de anuncios
│   ├── influencer_outreach.py <- Outreach a influencers
│   └── monthly_report.py    <- Reporte mensual
├── tools/
│   └── file_tools.py        <- Utilidades para cargar contexto y guardar outputs
├── context/                 <- Base de conocimiento de RescueChip (NO MODIFICAR)
│   ├── brand.md
│   ├── audience.md
│   ├── products.md
│   ├── competition.md
│   └── performance.md
└── outputs/                 <- Aqui se guardan todos los resultados generados
    ├── content_calendar/
    ├── ad_copy/
    ├── scripts/
    ├── influencer_outreach/
    └── reports/
```

---

## Nota importante sobre la carpeta context/

Los archivos en `context/` son la base de conocimiento de RescueChip.
Contienen la voz de la marca, precios, audiencia, competencia y performance.

**No modifiques esos archivos** — los agentes los leen cada vez que generan contenido
y los usan para respetar la voz de la marca.

Si cambian los precios, la estrategia o aprendes algo nuevo de las campanas,
actualiza `context/brand.md` o `context/performance.md` segun corresponda
(esos archivos tienen instrucciones al final de como mantenerlos actualizados).

---

*Agencia de Marketing RescueChip — construida para Hector Romo*
