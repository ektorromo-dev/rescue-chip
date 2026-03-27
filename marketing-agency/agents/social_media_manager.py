"""
Agente manager de redes sociales de RescueChip.
Organiza el contenido en calendarios concretos y accionables.
"""
from agents.base_agent import BaseAgent
from tools.file_tools import save_output

SYSTEM_PROMPT = """Eres el manager de redes sociales de RescueChip, el primer sistema de
identificacion medica prehospitalaria para motociclistas en Mexico.

Tu trabajo: organizar el contenido en calendarios concretos — que se publica, en que
plataforma, que dia, a que hora y con que objetivo.

PLATAFORMAS PRIORITARIAS (en este orden):
1. Facebook (grupos de motociclistas) + WhatsApp — mayor conversion directa
2. Instagram + TikTok — awareness y credibilidad
3. YouTube — contenido largo cuando haya recursos

HORARIOS OPTIMOS para el rider mexicano:
- Facebook grupos: 7-8am (antes del trabajo), 12-1pm (hora de comida), 8-9pm (noche)
- Instagram: 7-9am, 12-2pm, 6-8pm
- TikTok: 6-8pm, 9-10pm (cuando estan relajados, en casa)
- WhatsApp grupos: 8-9pm

REGLAS DEL CALENDARIO:
- Siempre incluye al menos 1 post orientado a conversion (click a rescue-chip.com) por semana
- No publiques mas de 1 vez al dia en la misma plataforma
- Los posts de Facebook en grupos deben sonar organicos, no como publicidad
- El calendario debe ser tan claro que Hector pueda abrirlo y publicar sin pensar
- Incluye notas de contexto cuando sea relevante (eventos moteros, fechas especiales)

Formato de entrega: tabla Markdown clara + seccion de NOTAS DE LA SEMANA.
"""

CONTEXT_FILES = ["brand.md", "audience.md"]


class SocialMediaManager(BaseAgent):
    """
    Agente que organiza el contenido en calendarios de publicacion concretos.
    """

    def __init__(self):
        super().__init__(
            model="claude-sonnet-4-5",
            system_prompt=SYSTEM_PROMPT,
            context_files=CONTEXT_FILES
        )

    def crear_calendario(self, semana: str, posts_generados: str) -> str:
        """
        Crea un calendario semanal de publicacion basado en posts ya generados.

        Args:
            semana: La semana objetivo (ej: "semana del 17 al 23 de marzo de 2026")
            posts_generados: El contenido creado por el Content Creator

        Returns:
            Calendario en formato tabla Markdown
        """
        prompt = f"""Organiza los posts generados en un calendario de publicacion concreto para la {semana}.

Posts disponibles para distribuir:
---
{posts_generados}
---

Produce:

1. CALENDARIO SEMANAL en formato tabla:
| Dia | Plataforma | Tipo de post | Descripcion breve | Horario sugerido | Objetivo |

Usa los dias de la semana exacta: lunes, martes, etc.
No publiques todos los dias si no hay contenido suficiente — es mejor publicar menos y bien.

2. NOTAS DE LA SEMANA (seccion separada):
- 3 a 5 recomendaciones especificas para esta semana
- Que reforzar, que evitar
- Si hay eventos, rodadas o fechas relevantes para la comunidad motera en estas fechas

El calendario debe ser accionable: Hector debe poder abrirlo, leerlo en 2 minutos
y saber exactamente que publicar, donde y cuando."""

        resultado = self.generate(prompt, extra_context=posts_generados)
        ruta = save_output(
            "content_calendar",
            f"calendario-{semana.replace(' ', '-')}",
            resultado
        )
        print(f"   Calendario guardado en: {ruta}")
        return resultado
