"""
Agente guionista de video para RescueChip.
Escribe guiones para TikTok, Instagram Reels y YouTube Shorts.
"""
from agents.base_agent import BaseAgent
from tools.file_tools import save_output

SYSTEM_PROMPT = """Eres el guionista de video de RescueChip, el primer sistema de identificacion
medica prehospitalaria para motociclistas en Mexico.

Tu trabajo: escribir guiones para TikTok, Instagram Reels y YouTube Shorts.
Los videos de RescueChip son cortos (15-60 segundos), directos y conectan
emocionalmente con el rider — de rider a rider.

ESTRUCTURA DE CADA GUION:
- Duracion estimada en segundos
- Escena por escena: descripcion visual + texto en pantalla + narracion/voz
- Hook en los primeros 3 segundos (critico — debe detener el scroll)
- Call to action al final (siempre hacia rescue-chip.com)

REGLAS DEL HOOK (primeros 3 segundos):
El hook debe hacer UNA de estas cosas:
a) Pregunta que el rider se hace a si mismo ("Y si mañana quedas inconsciente en carretera...")
b) Afirmacion sorprendente pero real ("Llevas tu tipo de sangre grabado en el casco?")
c) Escena visual poderosa que genera curiosidad inmediata
NUNCA empezar con "Hola, hoy les voy a hablar de..."

TONO:
- De rider a rider — habla como alguien de la comunidad, no como marca
- Real, no dramatico ni exagerado
- El rider no quiere ver un comercial — quiere verse a si mismo en el video
- Situaciones reconocibles: salidas a carretera, rodadas, ir al trabajo en moto

REGLAS DE MARCA (igual que siempre):
- Nunca prometer resultados garantizados
- La frase central: "Para que no estes solo si algo pasa"
- Precios si se mencionan: Individual $347 MXN, Pareja $549 MXN, Familiar $949 MXN
"""

CONTEXT_FILES = ["brand.md", "audience.md", "products.md"]


class ScriptWriter(BaseAgent):
    """
    Agente que escribe guiones para videos cortos de RescueChip.
    """

    def __init__(self):
        super().__init__(
            model="claude-sonnet-4-5",
            system_prompt=SYSTEM_PROMPT,
            context_files=CONTEXT_FILES
        )

    def escribir_guion_tiktok(self, tema: str, duracion: int = 30) -> str:
        """
        Escribe un guion completo para TikTok / Instagram Reels.

        Args:
            tema: El angulo o situacion del video (ej: "como funciona en una emergencia")
            duracion: Duracion objetivo en segundos (default: 30)

        Returns:
            Guion completo en formato estructurado
        """
        prompt = f"""Escribe un guion para TikTok / Instagram Reels de RescueChip.

Tema del video: {tema}
Duracion objetivo: {duracion} segundos

Usa este formato exacto:

================================================
GUION: [titulo descriptivo del video]
Duracion estimada: {duracion} segundos
Plataforma: TikTok / Instagram Reels
================================================

[HOOK — 0 a 3 segundos]
Visual: [que se ve en pantalla]
Texto en pantalla: [texto grande/impactante — max 5 palabras]
Narracion: [lo que dice la voz o el rider, si hay]

[ESCENA 1 — segundos 3 a X]
Visual: [descripcion de la toma]
Texto en pantalla: [texto si aplica]
Narracion: [lo que se dice]

[continua con mas escenas segun la duracion...]

[CALL TO ACTION — ultimos 3-5 segundos]
Visual: [toma final]
Texto en pantalla: [CTA claro]
Narracion: [lo que se dice]

================================================
NOTAS DE PRODUCCION:
Locacion sugerida: [donde grabar]
Equipo necesario: [moto, casco, etc.]
Estilo de grabacion: [selfie / manos / primer plano / etc.]
Quien puede grabarlo: [Hector solo / necesita ayuda / etc.]
================================================"""

        resultado = self.generate(prompt)
        tema_safe = tema[:40].replace(' ', '-')
        ruta = save_output("scripts", f"guion-tiktok-{tema_safe}", resultado)
        print(f"   Guion guardado en: {ruta}")
        return resultado

    def escribir_guion_personalizado(self, instrucciones: str) -> str:
        """
        Escribe un guion segun instrucciones especificas.

        Args:
            instrucciones: Descripcion detallada del video a crear

        Returns:
            El guion generado
        """
        resultado = self.generate(instrucciones)
        return resultado
