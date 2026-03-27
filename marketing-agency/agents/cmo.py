"""
Agente CMO — el orquestador estrategico de la agencia de marketing RescueChip.
Usa el modelo mas potente. Responde preguntas estrategicas complejas.
"""
import os
import sys

# Configura UTF-8 para Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except AttributeError:
        pass

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BASE_DIR not in sys.path:
    sys.path.insert(0, _BASE_DIR)

try:
    import anthropic
except ImportError:
    print("[ERROR] Falta instalar las dependencias: pip install -r requirements.txt")
    sys.exit(1)

from dotenv import load_dotenv
from tools.file_tools import load_context_file, save_output

load_dotenv(override=True)

SYSTEM_PROMPT = """Eres el CMO de RescueChip, el primer sistema de identificacion medica
prehospitalaria para motociclistas en Mexico.

Tu trabajo: recibir objetivos de marketing de Hector (el fundador), planear la ejecucion
y entregar respuestas estrategicas concretas y listas para usar.

Siempre eres estrategico, directo y orientado a resultados medibles.
Conoces profundamente la marca, la audiencia y los productos de RescueChip.

PRIORIDAD ACTUAL: primeros 500 usuarios activados en CDMX.

Cuando recibas una pregunta o tarea:
1. Analiza el objetivo real detras de la pregunta
2. Da la respuesta mas directa y accionable posible
3. Si hay algo que Hector deba saber que no pregunto, dilo

CONTEXTO DE MARCA (siempre presente en tus respuestas):
- RescueChip no hace promesas de resultado — ofrece disponibilidad de informacion
- La frase central: "Para que no estes solo si algo pasa"
- El rider ya sabe que rodar tiene riesgo — no hay que asustarlo, hay que entenderlo
- Canal principal ahora: Facebook grupos + WhatsApp + TikTok
- Estrategia de influencers: gift-first, sin compromiso
- Metricas que importan: chips vendidos, chips activados, % referidos

PRECIOS:
- Individual: $347 MXN (envio incluido)
- Pareja: $549 MXN (envio incluido)
- Familiar: $949 MXN (envio incluido)
- B2B Starter (50u): $179/u | Growth (100u): $149/u | Premium (300u+): $119/u
"""

# Todos los archivos de contexto — el CMO tiene vision completa
CONTEXT_FILES = ["brand.md", "audience.md", "products.md", "competition.md", "performance.md"]


class CMO:
    """
    El Chief Marketing Officer de RescueChip.
    Usa claude-opus-4-5 para respuestas estrategicas de maxima calidad.
    """

    def __init__(self):
        self.model = "claude-opus-4-5"
        self.system_prompt = SYSTEM_PROMPT
        self._client = None

    @property
    def client(self):
        """Inicializa el cliente de Anthropic la primera vez que se necesita."""
        if self._client is None:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise EnvironmentError(
                    "\n[ERROR] No se encontro la API key de Anthropic.\n\n"
                    "Para solucionarlo:\n"
                    "  1. Asegurate de tener el archivo .env en marketing-agency/\n"
                    "  2. El .env debe contener: ANTHROPIC_API_KEY=tu_key_aqui\n"
                    "  3. Obten tu key en: https://console.anthropic.com\n"
                )
            self._client = anthropic.Anthropic(api_key=api_key)
        return self._client

    def _cargar_contexto_completo(self) -> str:
        """Carga todos los archivos de contexto para el CMO."""
        bloques = []
        for filename in CONTEXT_FILES:
            try:
                contenido = load_context_file(filename)
                bloques.append(f"=== {filename} ===\n{contenido}")
            except FileNotFoundError as e:
                raise FileNotFoundError(
                    f"\n[ERROR] Archivo de contexto faltante: {filename}\n"
                    "Verifica que la carpeta context/ este completa.\n"
                )
        return "\n\n".join(bloques)

    def consultar(self, pregunta: str) -> str:
        """
        Responde una pregunta estrategica de marketing de RescueChip.

        Args:
            pregunta: La consulta estrategica de Hector

        Returns:
            La respuesta del CMO, detallada y accionable
        """
        contexto = self._cargar_contexto_completo()

        prompt = f"""[CONTEXTO COMPLETO DE RESCUECHIP]
{contexto}

[CONSULTA DE HECTOR]
{pregunta}

Responde de forma directa y accionable. Si hay algo importante que Hector no pregunto
pero deberia saber en relacion a su pregunta, incluye esa informacion tambien."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=self.system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            resultado = message.content[0].text
            ruta = save_output("reports", "consulta-cmo", resultado)
            print(f"   Respuesta del CMO guardada en: {ruta}")
            return resultado

        except anthropic.AuthenticationError:
            raise EnvironmentError(
                "\n[ERROR] La API key es invalida o ha expirado.\n"
                "Verifica tu ANTHROPIC_API_KEY en el archivo .env\n"
                "Renueva tu key en: https://console.anthropic.com\n"
            )
        except anthropic.RateLimitError:
            raise RuntimeError(
                "\n[ERROR] Se alcanzo el limite de uso de la API.\n"
                "Espera unos minutos e intenta de nuevo.\n"
            )
        except anthropic.APIError as e:
            raise RuntimeError(
                f"\n[ERROR] Fallo la comunicacion con la API.\n"
                f"Detalle: {e}\n"
                "Verifica tu conexion a internet.\n"
            )
