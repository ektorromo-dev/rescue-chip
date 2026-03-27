"""
Agente manager de publicidad pagada para RescueChip.
Crea textos para Facebook Ads e Instagram Ads con variantes para A/B testing.
"""
from agents.base_agent import BaseAgent
from tools.file_tools import save_output

SYSTEM_PROMPT = """Eres el manager de publicidad pagada de RescueChip, el primer sistema de
identificacion medica prehospitalaria para motociclistas en Mexico.

Tu trabajo: crear textos para anuncios en Facebook Ads e Instagram Ads, definir la
segmentacion y sugerir el presupuesto.

REGLA PRINCIPAL: Siempre produces 3 variantes de cada anuncio para probar cual funciona mejor.

ESTRUCTURA DE CADA VARIANTE:
- Titular (max 40 caracteres — lo mas importante)
- Texto principal (max 125 chars para preview, hasta 300 para completo)
- Call to action (boton: Comprar ahora / Mas informacion / Ver producto)
- Segmentacion sugerida (ubicacion, edad, genero, intereses)
- Presupuesto diario sugerido

PRINCIPIOS PARA ANUNCIOS DE RESCUECHIP:
1. El titular es lo que detiene el scroll — debe ser especifico y resonar con el rider
2. Habla de situaciones reales: salidas a carretera, rodadas, ir al trabajo en moto
3. No asustar — reconocer el riesgo y ofrecer algo concreto
4. Segmentacion: hombres 28-42, CDMX/Monterrey/GDL, intereses en motocicletas/motos

NUNCA USES en anuncios:
- "Garantizamos" o "te protege 100%"
- "!Oferta!" o "!Aprovecha!" o urgencia falsa
- "Plataforma tecnologica avanzada" o lenguaje corporativo
- "!Sin RescueChip puedes morir!" — no manipular con miedo

PRECIOS CORRECTOS:
- Individual: $347 MXN (envio incluido)
- Pareja: $549 MXN (envio incluido)
- Familiar: $949 MXN (envio incluido)

Al final de cada campana, incluye instrucciones simples de como hacer A/B testing
en Facebook Ads Manager.
"""

CONTEXT_FILES = ["brand.md", "audience.md", "products.md", "competition.md"]


class AdsManager(BaseAgent):
    """
    Agente que crea campanas de publicidad pagada para RescueChip.
    """

    def __init__(self):
        super().__init__(
            model="claude-sonnet-4-5",
            system_prompt=SYSTEM_PROMPT,
            context_files=CONTEXT_FILES
        )

    def crear_campana(self, producto: str, objetivo: str, presupuesto: str) -> str:
        """
        Crea una campana completa con 3 variantes de anuncio.

        Args:
            producto: Producto a anunciar (ej: "Individual $347 MXN")
            objetivo: Objetivo de la campana (ej: "primeras ventas en CDMX")
            presupuesto: Presupuesto disponible (ej: "$200 MXN diarios")

        Returns:
            Las 3 variantes de anuncio en formato estructurado
        """
        prompt = f"""Crea una campana de Facebook Ads / Instagram Ads para RescueChip.

Producto a anunciar: {producto}
Objetivo de la campana: {objetivo}
Presupuesto disponible: {presupuesto}

Produce 3 variantes de anuncio. Para cada una usa este formato:

================================================
VARIANTE [numero]: [nombre descriptivo — ej: "El rider solo en carretera"]
================================================

TITULAR (max 40 caracteres):
[texto]

TEXTO PRINCIPAL:
[Version corta — max 125 chars para el preview]

[Version completa — hasta 300 chars, para quien hace clic en "ver mas"]

CALL TO ACTION: [Comprar ahora / Mas informacion / Ver producto]

SEGMENTACION SUGERIDA:
- Ubicacion: [ciudades especificas]
- Edad: [rango]
- Genero: []
- Intereses: [lista de intereses de Facebook]
- Comportamientos: [si aplica]
- Excluir: [audiencias a excluir si aplica]

PRESUPUESTO DIARIO SUGERIDO: $[X] MXN

POR QUE ESTA VARIANTE: [1-2 oraciones explicando el angulo y por que puede funcionar]

================================================

Luego incluye una seccion final:

HOW TO: COMO HACER A/B TESTING EN FACEBOOK ADS MANAGER
[Instrucciones en pasos simples — asume que Hector no es experto en ads]"""

        resultado = self.generate(prompt)
        nombre_archivo = f"campana-{producto[:20].replace(' ', '-')}-{objetivo[:20].replace(' ', '-')}"
        ruta = save_output("ad_copy", nombre_archivo, resultado)
        print(f"   Campana guardada en: {ruta}")
        return resultado
