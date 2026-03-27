# RescueChip — Performance de Campañas
*Base de conocimiento para el Analytics Agent*

---

## Estado actual

**Fecha de primer lanzamiento de marketing:** Pendiente
**Chips vendidos:** 0
**Chips activados:** 0
**Seguidores @ek.rider93:** ~4,000

RescueChip no ha lanzado campañas formales todavía. Este archivo se llenará con datos reales conforme inicien las primeras acciones de marketing.

---

## Las 3 métricas que más importan

Estas son las únicas métricas que determinan si RescueChip está creciendo bien. Todo lo demás es secundario.

| Métrica | Por qué importa | Dónde se mide |
|---|---|---|
| **Chips vendidos** | Ingreso real | Stripe |
| **Chips activados** | Un chip sin activar no protege a nadie y no genera referidos | Supabase |
| **% de referidos** | Riders que compraron porque otro rider los recomendó — indica que el producto funciona y que la comunidad lo adopta | Pregunta directa al cliente o código de descuento por influencer |

**Tasa de activación = chips activados / chips vendidos**
Meta inicial: 80% o más. Si esta cifra baja, hay un problema en el proceso de onboarding, no en las ventas.

---

## Métricas secundarias por canal

### Instagram (@ek.rider93)
- Alcance por post
- Interacciones (comentarios + guardados — más valiosos que likes)
- Visitas al perfil desde posts de RescueChip
- Clicks al link en bio

### Facebook (grupos motociclistas)
- Reacciones y comentarios por publicación
- Mensajes directos recibidos
- Conversiones directas (personas que compraron desde un post en grupo)

### TikTok
- Vistas por video
- % de retención (cuánto ven del video)
- Seguidores nuevos por video
- Clicks a rescue-chip.com

### Influencers
- Ventas por código de descuento único por creador
- Costo por venta por influencer
- Tasa de activación de chips vendidos vía influencer

### Email / SMS (post-compra)
- Tasa de activación después de recibir el chip
- Tiempo entre compra y activación

---

## Estructura de aprendizajes — llenar después de cada campaña

### Plantilla por campaña:

```
Campaña: [nombre]
Fecha: [dd/mm/yyyy]
Canal: [Instagram / Facebook / TikTok / Influencer / otro]
Objetivo: [awareness / ventas / activaciones]

Resultados:
- Alcance: 
- Interacciones: 
- Ventas generadas: 
- Chips activados de esa campaña: 

Qué funcionó:
- 

Qué no funcionó:
- 

Qué probar la próxima vez:
- 
```

---

## Benchmarks de referencia (metas iniciales)

Estas son metas conservadoras para los primeros 90 días. Se ajustan con datos reales.

| Indicador | Meta 30 días | Meta 60 días | Meta 90 días |
|---|---|---|---|
| Chips vendidos | 10 | 35 | 80 |
| Chips activados | 8 | 28 | 65 |
| Tasa de activación | 80% | 80% | 80% |
| Seguidores nuevos IG | +200 | +500 | +1,000 |
| Influencers activos | 1 | 3 | 6 |

---

## Señales de alerta — cuándo algo está mal

El Analytics Agent debe notificar a Héctor si detecta cualquiera de estas situaciones:

- 🚨 Tasa de activación cae por debajo del 60% — problema en onboarding
- 🚨 Cero ventas en 7 días seguidos con campañas activas — problema en el mensaje o el canal
- 🚨 Alto alcance pero cero clicks a rescue-chip.com — el contenido no convierte, solo entretiene
- ⚠️ Un influencer genera muchas vistas pero cero ventas — audiencia desalineada con el perfil de El Rider
- ⚠️ Muchos mensajes directos pero pocas compras — hay una objeción no resuelta en la conversación

---

## Historial de campañas

*Sin datos todavía. El Analytics Agent llenará esta sección después de cada campaña.*

---

*Archivo mantenido por el Analytics Agent con supervisión de Héctor Romo. Actualizar después de cada campaña o cada semana con datos reales.*
