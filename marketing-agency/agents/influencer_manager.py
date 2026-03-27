"""
Agente manager de influencers para RescueChip.
Redacta mensajes personalizados para contactar creadores de contenido motociclista.
"""
from agents.base_agent import BaseAgent
from tools.file_tools import save_output

SYSTEM_PROMPT = """Eres el manager de influencers de RescueChip, el primer sistema de identificacion
medica prehospitalaria para motociclistas en Mexico.

Tu trabajo: redactar mensajes personalizados para contactar creadores de contenido
motociclista, y llevar el registro de cada conversacion.

ESTRATEGIA DE INFLUENCERS DE RESCUECHIP:
- Empezar con micro-influencers (5K-30K seguidores motociclistas en Mexico)
- Approach: regalar el producto primero, sin pedir nada a cambio
- Nunca copiar-pegar el mismo mensaje a todos — siempre personalizar
- Cada influencer recibe un codigo de descuento unico para medir sus conversiones
- El objetivo inicial es prueba social, no ventas directas

POR QUE ESTE APPROACH FUNCIONA:
Un influencer que recibe algo sin compromiso y le gusta, lo comparte de forma autentica.
Eso vale mucho mas que un post patrocinado forzado.

TONO DEL MENSAJE:
- De rider a rider — Hector habla como alguien de la comunidad, no como marca
- Transparente: "te queremos regalar el chip, sin compromiso de publicacion"
- Breve: el primer mensaje no puede tener mas de 5-6 oraciones
- Especifico: mencionar algo real del influencer (un video suyo, una rodada, algo que poste)
- No presionar nunca

PARA CADA INFLUENCER PRODUCES:
1. Mensaje de primer contacto (para DM de Instagram) — personalizado
2. Codigo de descuento sugerido (formato: RIDER + iniciales + numero, ej: RIDERJC01)
3. Mensaje de seguimiento a 7 dias si no responde (breve, no insistente)
4. Tabla tracker para llevar el registro

NUNCA uses en los mensajes:
- "Me gusto mucho tu contenido" (muy generico y falso)
- "Estamos buscando embajadores de marca" (suena a corporativo)
- "Podriamos ofrecerte..." con condicional de publicacion
- Presion o urgencia
"""

CONTEXT_FILES = ["brand.md", "products.md"]


class InfluencerManager(BaseAgent):
    """
    Agente que gestiona el outreach a influencers motociclistas.
    """

    def __init__(self):
        super().__init__(
            model="claude-sonnet-4-5",
            system_prompt=SYSTEM_PROMPT,
            context_files=CONTEXT_FILES
        )

    def crear_outreach(self, influencers: list) -> str:
        """
        Crea mensajes personalizados para una lista de influencers.

        Args:
            influencers: Lista de dicts con info del influencer:
                [{"nombre": "...", "usuario_ig": "...", "seguidores": "...", "descripcion": "..."}]

        Returns:
            Mensajes personalizados + codigos + tracker para cada influencer
        """
        if not influencers:
            return "No se proporcionaron influencers para procesar."

        # Formatea la lista de influencers
        lista_texto = "\n".join([
            f"{i+1}. Nombre: {inf.get('nombre', 'Sin nombre')} | "
            f"Instagram: @{inf.get('usuario_ig', 'sin_usuario')} | "
            f"Seguidores: {inf.get('seguidores', 'desconocido')} | "
            f"Descripcion: {inf.get('descripcion', 'Sin descripcion')}"
            for i, inf in enumerate(influencers)
        ])

        prompt = f"""Crea los mensajes de outreach personalizados para estos influencers motociclistas:

{lista_texto}

Para CADA influencer produce lo siguiente con este formato exacto:

================================================
INFLUENCER: [nombre] | @[usuario_ig]
================================================

MENSAJE DE PRIMER CONTACTO (DM de Instagram):
[El mensaje personalizado. De 4-6 oraciones. Escrito por Hector, de rider a rider.
Debe mencionar algo especifico de este influencer basado en su descripcion.
Transparente sobre el regalo sin compromiso.]

CODIGO DE DESCUENTO SUGERIDO: [formato RIDER + iniciales en mayusculas + 2 digitos]

SEGUIMIENTO A 7 DIAS (si no responde):
[Mensaje breve de seguimiento. Max 2-3 oraciones. No insistente.]

TRACKER:
| Campo | Valor |
|-------|-------|
| Fecha de primer contacto | [por llenar] |
| Estado | Por enviar |
| Fecha de respuesta | - |
| Enviamos el chip | No |
| Publico algo | No |
| Ventas generadas con su codigo | 0 |
| Notas | - |

================================================

Al final de todos los influencers, agrega una seccion:
RECOMENDACIONES DE SEGUIMIENTO
[Consejos practicos para mantener la relacion con los influencers que respondan positivamente]"""

        resultado = self.generate(prompt)
        ruta = save_output("influencer_outreach", "outreach-influencers", resultado)
        print(f"   Outreach guardado en: {ruta}")
        return resultado
