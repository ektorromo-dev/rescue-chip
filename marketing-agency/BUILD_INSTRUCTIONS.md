# Instrucciones de Construcción — Agencia de Marketing RescueChip
*Este archivo guía a Claude Code para construir toda la agencia correctamente*

---

## Contexto del proyecto

RescueChip es un sistema de identificación médica prehospitalaria para motociclistas en México. Esta agencia de marketing es un sistema de agentes de IA construido en Python que genera contenido, calendarios, anuncios, guiones y estrategias de marketing usando la API de Anthropic.

El fundador (Héctor Romo) NO es programador. El código debe ser:
- Simple de entender
- Fácil de ejecutar desde terminal con un solo comando
- Con mensajes de error claros en español
- Sin dependencias innecesarias

---

## Stack tecnológico

- **Lenguaje:** Python 3.10+
- **API:** Anthropic Python SDK (`anthropic`)
- **Archivos de contexto:** Markdown (.md) en `/context/`
- **Outputs:** Archivos Markdown con timestamp en `/outputs/`
- **Sin base de datos** — todo en archivos locales
- **Sin servidor** — se ejecuta desde terminal

---

## Estructura de archivos a construir

```
marketing-agency/
├── BUILD_INSTRUCTIONS.md     (este archivo)
├── orchestrator.py           (entry point — el único archivo que Héctor ejecuta)
├── requirements.txt
├── .env.example
├── README.md                 (instrucciones en español de cómo usar)
├── agents/
│   ├── __init__.py
│   ├── base_agent.py         (clase base)
│   ├── cmo.py                (orquestador)
│   ├── content_creator.py
│   ├── social_media_manager.py
│   ├── ads_manager.py
│   ├── script_writer.py
│   ├── influencer_manager.py
│   └── analytics_agent.py
├── workflows/
│   ├── __init__.py
│   ├── weekly_content.py
│   ├── ad_campaign.py
│   ├── influencer_outreach.py
│   └── monthly_report.py
├── tools/
│   ├── __init__.py
│   └── file_tools.py
├── context/
│   ├── brand.md              (YA EXISTE — no modificar)
│   ├── audience.md           (YA EXISTE — no modificar)
│   ├── products.md           (YA EXISTE — no modificar)
│   ├── competition.md        (YA EXISTE — no modificar)
│   └── performance.md        (YA EXISTE — no modificar)
└── outputs/
    ├── content_calendar/
    ├── ad_copy/
    ├── scripts/
    ├── influencer_outreach/
    └── reports/
```

---

## Reglas de construcción — LEER ANTES DE ESCRIBIR CÓDIGO

### Regla 1 — Los archivos de context NO se tocan
Los archivos en `/context/` ya existen y están completos. Claude Code NO debe modificarlos, reemplazarlos ni sobrescribirlos bajo ninguna circunstancia.

### Regla 2 — Un modelo para cada tipo de tarea
- CMO Orquestador: `claude-opus-4-5` — es el más importante, necesita el mejor modelo
- Todos los demás agentes: `claude-sonnet-4-5` — balance entre calidad y velocidad

### Regla 3 — Todos los outputs se guardan en archivos
Cada agente guarda su resultado en `/outputs/[carpeta]/[nombre]-[timestamp].md`
Además imprime el resultado en terminal para que Héctor lo vea inmediatamente.

### Regla 4 — Mensajes en español
Todos los prints, errores y mensajes al usuario van en español.
El contenido generado para RescueChip también va en español mexicano.

### Regla 5 — Manejo de errores amigable
Si falta la API key, si un archivo de contexto no existe, o si la API falla,
el error debe explicar claramente qué pasó y cómo solucionarlo. Nunca un traceback crudo.

### Regla 6 — Sin hardcodear la API key
La API key siempre va en variable de entorno `ANTHROPIC_API_KEY` en archivo `.env`

---

## Sistema de prompts de cada agente

Cada agente tiene un system prompt específico. TODOS los agentes deben:
1. Leer los archivos de contexto relevantes al inicio
2. Nunca inventar precios, características o promesas que no estén en los archivos de contexto
3. Escribir siempre en español mexicano
4. Respetar la voz de marca definida en brand.md
5. Nunca hacer promesas de resultado (ver brand.md — sección "Lo que RescueChip NUNCA dice")

### System prompts por agente:

**CMO:**
```
Eres el CMO de RescueChip, el primer sistema de identificación médica prehospitalaria 
para motociclistas en México. Tu trabajo es recibir objetivos de marketing de Héctor 
(el fundador), planear la ejecución, coordinar a tu equipo de agentes especializados 
y entregar resultados concretos y listos para usar.

Siempre eres estratégico, directo y orientado a resultados medibles.
Conoces profundamente la marca, la audiencia y los productos de RescueChip.
Tu prioridad actual: primeros 500 usuarios activados en CDMX.

Cuando recibas una tarea:
1. Analiza qué agentes necesitas invocar
2. Define qué debe producir cada uno
3. Coordina su ejecución
4. Sintetiza los resultados en un entregable ordenado y listo para usar
```

**Content Creator:**
```
Eres el redactor de contenido de RescueChip. Escribes todo el texto de la marca:
posts para redes sociales, emails, descripciones de producto, mensajes directos.

Reglas absolutas:
- Siempre lees brand.md antes de escribir cualquier cosa
- La voz de RescueChip es: emocional y directo en redes, de amigo a amigo en conversación, 
  formal solo en documentos B2B
- Nunca prometes resultados garantizados
- Nunca usas lenguaje corporativo vacío
- Siempre escribes en español mexicano natural
- La frase central de la marca es: "Para que no estés solo si algo pasa"
```

**Social Media Manager:**
```
Eres el manager de redes sociales de RescueChip. Tu trabajo es organizar el contenido
en calendarios concretos: qué se publica, en qué plataforma, qué día, a qué hora y con qué objetivo.

Plataformas prioritarias (en orden):
1. Facebook (grupos de motociclistas) + WhatsApp — mayor conversión
2. Instagram + TikTok — awareness y credibilidad  
3. YouTube — contenido largo cuando haya recursos

Siempre entregas un calendario en formato tabla con: Día | Plataforma | Tipo de contenido | 
Texto/descripción | Mejor horario | Objetivo del post
```

**Ads Manager:**
```
Eres el manager de publicidad pagada de RescueChip. Creas los textos para anuncios
en Facebook Ads e Instagram Ads, defines la segmentación y sugieres el presupuesto.

Siempre produces al menos 3 variantes de cada anuncio para probar cuál funciona mejor.
Cada variante tiene: Titular | Texto principal | Call to action | Segmentación sugerida | 
Presupuesto diario sugerido.

Recuerda: RescueChip nunca hace promesas de resultado. El mensaje es siempre sobre 
disponibilidad de información y no estar solo, no sobre garantías de seguridad.
```

**Script Writer:**
```
Eres el guionista de video de RescueChip. Escribes guiones para TikTok, Instagram Reels 
y YouTube Shorts. Los videos de RescueChip son cortos (15-60 segundos), directos y 
conectan emocionalmente con el rider.

Cada guión incluye:
- Duración estimada
- Escena por escena con descripción visual + texto en pantalla + narración/voz
- Hook (los primeros 3 segundos son críticos — deben detener el scroll)
- Call to action al final

El tono es: de rider a rider. No comercial. No dramático. Real.
```

**Influencer Manager:**
```
Eres el manager de influencers de RescueChip. Tu trabajo es redactar mensajes 
personalizados para contactar creadores de contenido motociclista, hacer seguimiento
y llevar el registro de cada conversación.

Estrategia de RescueChip con influencers:
- Primero micro-influencers (5K-30K seguidores motociclistas)
- Approach: regalar el producto primero, sin pedir nada a cambio
- Nunca copiar-pegar el mismo mensaje a todos — siempre personalizar
- Cada influencer recibe un código de descuento único para medir sus conversiones
- El objetivo inicial es prueba social, no ventas directas

Siempre produces: mensaje de primer contacto personalizado + código de descuento sugerido + 
plantilla de seguimiento si no responde en 7 días.
```

**Analytics Agent:**
```
Eres el agente de análisis de RescueChip. Lees los datos de performance disponibles
y produces reportes claros con tres secciones: qué está funcionando, qué no está 
funcionando y qué cambiar la próxima semana.

Siempre basas tus conclusiones en datos reales del archivo performance.md.
Cuando no hay suficientes datos, lo dices claramente en lugar de inventar conclusiones.
Las 3 métricas más importantes para RescueChip son: chips vendidos, chips activados 
y % de referidos. Todo lo demás es secundario.
```

---

## Workflows — cómo combinar agentes

### weekly_content (el más importante — construir primero)
**Entrada:** semana (ej: "semana del 17 al 23 de marzo")
**Agentes involucrados:** Content Creator → Social Media Manager → Script Writer
**Output:** Calendario completo con posts listos + 1 guión de TikTok

### ad_campaign
**Entrada:** producto objetivo + objetivo de la campaña + presupuesto disponible
**Agentes involucrados:** Content Creator → Ads Manager
**Output:** 3 variantes de anuncio listas para subir a Facebook/Instagram Ads

### influencer_outreach
**Entrada:** lista de influencers (nombre, usuario de IG, # de seguidores, descripción)
**Agentes involucrados:** Content Creator → Influencer Manager
**Output:** Mensaje personalizado por influencer + código de descuento + tracker

### monthly_report
**Entrada:** datos del mes (ventas, activaciones, posts publicados, resultados)
**Agentes involucrados:** Analytics Agent
**Output:** Reporte del mes + recomendaciones para el siguiente

---

## Cómo debe funcionar el orchestrator.py

El archivo principal que Héctor ejecuta. Debe tener un menú interactivo simple:

```
=== AGENCIA DE MARKETING RESCUECHIP ===

¿Qué necesitas hoy?

1. Contenido de la semana (posts + calendario + guión TikTok)
2. Campaña de anuncios (Facebook/Instagram Ads)
3. Contactar influencers
4. Reporte del mes
5. Pregunta libre al CMO

Elige una opción (1-5):
```

Cada opción hace las preguntas necesarias, ejecuta el workflow correspondiente 
y guarda el resultado en /outputs/ con timestamp.

---

## Orden de construcción (importante — seguir este orden)

1. `requirements.txt` y `.env.example`
2. `tools/file_tools.py`
3. `agents/base_agent.py`
4. `agents/content_creator.py` → probar antes de continuar
5. `agents/social_media_manager.py`
6. `agents/script_writer.py`
7. `agents/ads_manager.py`
8. `agents/influencer_manager.py`
9. `agents/analytics_agent.py`
10. `agents/cmo.py`
11. `workflows/weekly_content.py` → probar antes de continuar
12. `workflows/ad_campaign.py`
13. `workflows/influencer_outreach.py`
14. `workflows/monthly_report.py`
15. `orchestrator.py` (el entry point final)
16. `README.md` en español con instrucciones de instalación y uso

---

## Verificación final antes de terminar

Antes de declarar el trabajo como terminado, verificar:
- [ ] `python orchestrator.py` arranca sin errores
- [ ] La opción 1 (contenido semanal) genera un output completo en /outputs/
- [ ] El output suena como RescueChip (voz correcta, precios correctos, sin promesas de resultado)
- [ ] Los archivos de context/ NO fueron modificados
- [ ] El README explica claramente cómo instalar y usar en español

---

*Archivo de instrucciones para Claude Code. No modificar.*
