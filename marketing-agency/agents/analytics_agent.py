"""
Agente de analisis de datos para RescueChip.
Lee el archivo de performance y produce reportes claros con insights accionables.
"""
from agents.base_agent import BaseAgent
from tools.file_tools import save_output

SYSTEM_PROMPT = """Eres el agente de analisis de RescueChip, el primer sistema de identificacion
medica prehospitalaria para motociclistas en Mexico.

Tu trabajo: leer los datos de performance disponibles y producir reportes claros con:
1. Que esta funcionando
2. Que NO esta funcionando
3. Que cambiar la proxima semana o mes

REGLA MAS IMPORTANTE: Siempre basas tus conclusiones en datos reales del archivo performance.md.
Cuando no hay suficientes datos, lo dices claramente en lugar de inventar conclusiones.

LAS 3 METRICAS QUE MAS IMPORTAN (en orden):
1. Chips vendidos — ingreso real
2. Chips activados — un chip sin activar no protege a nadie y no genera referidos
3. % de referidos — indica que el producto funciona y la comunidad lo adopta

TODO LO DEMAS ES SECUNDARIO.

ALERTAS QUE DEBES REPORTAR SIEMPRE SI LAS DETECTAS:
[ALERTA CRITICA] Tasa de activacion menor al 60% — problema en onboarding
[ALERTA CRITICA] Cero ventas en 7 dias con campanas activas — problema en mensaje o canal
[ALERTA CRITICA] Alto alcance pero cero clicks a rescue-chip.com — contenido no convierte
[ADVERTENCIA] Influencer con muchas vistas pero cero ventas — audiencia desalineada
[ADVERTENCIA] Muchos DMs pero pocas compras — hay una objecion no resuelta

TONO DEL REPORTE:
- Directo y honesto. No suavices los problemas.
- Hector prefiere saber la verdad que recibir un reporte que se ve bien pero no dice nada.
- Si no hay datos suficientes para un analisis real, dilo claramente y explica que datos
  se necesitan empezar a recolectar.
"""

CONTEXT_FILES = ["performance.md"]


class AnalyticsAgent(BaseAgent):
    """
    Agente que analiza datos de performance y genera reportes con insights accionables.
    """

    def __init__(self):
        super().__init__(
            model="claude-sonnet-4-5",
            system_prompt=SYSTEM_PROMPT,
            context_files=CONTEXT_FILES
        )

    def generar_reporte_mensual(self, datos_adicionales: str = "") -> str:
        """
        Genera el reporte mensual de performance.

        Args:
            datos_adicionales: Datos del mes que Hector quiera incluir
                               (ventas, activaciones, posts publicados, etc.)

        Returns:
            Reporte completo con analisis y recomendaciones
        """
        contexto_extra = (
            f"Datos adicionales proporcionados por Hector:\n{datos_adicionales}"
            if datos_adicionales
            else "Hector no proporciono datos adicionales — basar el analisis en performance.md."
        )

        prompt = f"""Genera el reporte mensual de RescueChip.

{contexto_extra}

Estructura el reporte con exactamente estas secciones:

# REPORTE MENSUAL — RESCUECHIP
Fecha de generacion: [fecha actual aproximada]

---

## RESUMEN EJECUTIVO
[3 puntos maximo — las cosas mas importantes del mes]

---

## LAS 3 METRICAS QUE IMPORTAN

| Metrica | Valor actual | Meta | Estado |
|---------|-------------|------|--------|
| Chips vendidos | | | |
| Chips activados | | | |
| Tasa de activacion | | 80%+ | |
| % de referidos | | | |

---

## QUE ESTA FUNCIONANDO
[Con datos concretos. Si no hay datos, decirlo.]

---

## QUE NO ESTA FUNCIONANDO
[Con datos concretos. Ser directo, no suavizar.]

---

## QUE CAMBIAR EL PROXIMO MES
[3 a 5 acciones concretas, en orden de impacto esperado.
Cada accion debe ser especifica y ejecutable por Hector.]

---

## ALERTAS
[Si hay senales de alerta, listarlas aqui con prioridad.
Si no hay alertas, escribir "Sin alertas en este periodo."]

---

## DATOS QUE SE NECESITAN RECOLECTAR
[Que datos concretos deberia Hector empezar a registrar para tener mejores reportes
el mes que viene. Maximo 3 puntos.]"""

        resultado = self.generate(prompt, extra_context=datos_adicionales)
        ruta = save_output("reports", "reporte-mensual", resultado)
        print(f"   Reporte guardado en: {ruta}")
        return resultado
