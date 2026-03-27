"""
Agente redactor de contenido para RescueChip.
Escribe posts, emails, descripciones y mensajes con la voz correcta de la marca.
"""
from agents.base_agent import BaseAgent
from tools.file_tools import save_output

SYSTEM_PROMPT = """Eres el redactor de contenido de RescueChip, el primer sistema de identificación
médica prehospitalaria para motociclistas en México.

Tu trabajo: escribir todo el texto de la marca — posts para redes sociales, emails,
descripciones de producto, mensajes directos — con la voz exacta de RescueChip.

REGLAS ABSOLUTAS (nunca las rompas):

1. Voz por contexto:
   - Redes sociales: emocional, directo, para el scroll — habla de situaciones reales
   - Conversación directa: de amigo a amigo, sin tecnicismos, cercano y honesto
   - B2B / documentos: formal y profesional

2. La frase central de la marca es: "Para que no estés solo si algo pasa"

3. Nunca uses:
   - "cuates" o "compas" → usa "amigos"
   - "RescueChip te protege" o "garantizamos" → usa "RescueChip hace que la información esté disponible"
   - "producto innovador de última generación" → sin jerga corporativa
   - "¡Aprovecha!" o urgencia falsa → sin tácticas de tianguis
   - "¡Sin RescueChip puedes morir!" → no asustes, reconoce y ofrece algo concreto

4. Precios exactos (siempre correctos):
   - Individual: $347 MXN (envío incluido)
   - Pareja: $549 MXN (envío incluido)
   - Familiar: $949 MXN (envío incluido)

5. El rider ya sabe que rodar tiene riesgo. No se lo recuerdes con drama.
   Reconócelo y ofrece algo concreto y real.

6. Siempre en español mexicano natural — no en español neutro ni en traducción forzada.

7. Vocabulario permitido: rider, moto, rodar, rodada, carretera, amigos, familia, accidente, emergencia.
"""

CONTEXT_FILES = ["brand.md", "audience.md", "products.md"]


class ContentCreator(BaseAgent):
    """
    Agente que crea contenido escrito para RescueChip con la voz correcta de la marca.
    """

    def __init__(self):
        super().__init__(
            model="claude-sonnet-4-5",
            system_prompt=SYSTEM_PROMPT,
            context_files=CONTEXT_FILES
        )

    def crear_posts_semanales(self, semana: str, num_posts: int = 5) -> str:
        """
        Crea posts para redes sociales para una semana específica.

        Args:
            semana: Descripción de la semana (ej: "semana del 17 al 23 de marzo de 2026")
            num_posts: Número de posts a crear (default: 5)

        Returns:
            String con todos los posts generados
        """
        prompt = f"""Crea {num_posts} posts para redes sociales de RescueChip para la {semana}.

Para cada post incluye:
- Plataforma objetivo (Facebook / Instagram / TikTok)
- Texto completo del post (listo para copiar y publicar)
- Emojis apropiados (sin exagerar — máximo 3-4 por post)
- Hashtags relevantes (máximo 5 por post)
- Objetivo del post: awareness / consideración / conversión

Varía los ángulos — que ningún post repita el mismo enfoque:
- Un post sobre cómo funciona RescueChip en una emergencia real
- Un post sobre el rider y su comunidad (sin mencionar el producto directamente)
- Un post sobre la historia de Héctor y por qué construyó esto
- Un post de producto con precio claro
- Un post que hable a la pareja o familia del rider

Cada post debe sonar como RescueChip — no como publicidad genérica.
El rider que lo lea debe sentir que lo entienden, no que le están vendiendo algo."""

        resultado = self.generate(prompt)
        ruta = save_output(
            "content_calendar",
            f"posts-{semana.replace(' ', '-')}",
            resultado
        )
        print(f"   📄 Posts guardados en: {ruta}")
        return resultado

    def crear_contenido_personalizado(self, instrucciones: str) -> str:
        """
        Crea cualquier tipo de contenido según las instrucciones dadas.

        Args:
            instrucciones: Descripción detallada de qué crear

        Returns:
            El contenido generado
        """
        resultado = self.generate(instrucciones)
        return resultado
