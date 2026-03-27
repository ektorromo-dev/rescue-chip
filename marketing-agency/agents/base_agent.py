"""
Clase base para todos los agentes de marketing de RescueChip.
Todos los agentes heredan de esta clase.
"""
import os
import sys

# Configura UTF-8 para compatibilidad con Windows (antes de cualquier print)
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except AttributeError:
        pass  # Python < 3.7, se ignora

# Asegura que el directorio raíz del proyecto esté en el path de Python
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BASE_DIR not in sys.path:
    sys.path.insert(0, _BASE_DIR)

try:
    import anthropic
except ImportError:
    print("\n[ERROR] Falta instalar las dependencias.")
    print("   Ejecuta este comando en la carpeta marketing-agency/:")
    print("   pip install -r requirements.txt\n")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except ImportError:
    print("\n[ERROR] Falta instalar las dependencias.")
    print("   Ejecuta este comando en la carpeta marketing-agency/:")
    print("   pip install -r requirements.txt\n")
    sys.exit(1)

from tools.file_tools import load_context_file


class BaseAgent:
    """
    Clase base que comparten todos los agentes de la agencia.
    Maneja la conexión con la API de Anthropic y la carga de archivos de contexto.
    """

    def __init__(self, model: str, system_prompt: str, context_files: list = None):
        """
        Args:
            model: ID del modelo de Claude a usar (ej: "claude-sonnet-4-5")
            system_prompt: Las instrucciones del sistema para este agente
            context_files: Lista de archivos de contexto a cargar (ej: ["brand.md", "products.md"])
        """
        self.model = model
        self.system_prompt = system_prompt
        self.context_files = context_files or []
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
                    "  1. Asegurate de tener el archivo .env en la carpeta marketing-agency/\n"
                    "  2. El archivo .env debe contener: ANTHROPIC_API_KEY=tu_key_aqui\n"
                    "  3. Copia .env.example, renombralo .env y llena tu key real\n"
                    "  4. Obten tu key en: https://console.anthropic.com\n"
                )
            self._client = anthropic.Anthropic(api_key=api_key)
        return self._client

    def _build_context_block(self) -> str:
        """Construye el bloque de contexto concatenando los archivos especificados."""
        if not self.context_files:
            return ""

        blocks = []
        for filename in self.context_files:
            try:
                content = load_context_file(filename)
                blocks.append(f"=== {filename} ===\n{content}")
            except FileNotFoundError as e:
                raise FileNotFoundError(
                    f"\n[ERROR] Archivo de contexto faltante.\n{e}\n\n"
                    "Este archivo es necesario para que el agente funcione.\n"
                    "Verifica que la carpeta context/ este completa."
                )

        return "\n\n".join(blocks)

    def generate(self, prompt: str, extra_context: str = "") -> str:
        """
        Genera una respuesta usando el modelo de Claude configurado.

        Args:
            prompt: El mensaje principal al agente
            extra_context: Contexto adicional opcional (ej: output de otro agente)

        Returns:
            La respuesta generada como string
        """
        # Construye el prompt completo con contexto de marca
        context_block = self._build_context_block()

        parts = []
        if context_block:
            parts.append(f"[CONTEXTO DE LA MARCA]\n{context_block}")
        if extra_context:
            parts.append(f"[CONTEXTO ADICIONAL]\n{extra_context}")
        parts.append(prompt)

        full_prompt = "\n\n".join(parts)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=self.system_prompt,
                messages=[{"role": "user", "content": full_prompt}]
            )
            return message.content[0].text

        except anthropic.AuthenticationError:
            raise EnvironmentError(
                "\n[ERROR] La API key es invalida o ha expirado.\n\n"
                "Verifica que tu ANTHROPIC_API_KEY en el archivo .env sea correcta.\n"
                "Puedes ver y renovar tu key en: https://console.anthropic.com\n"
            )
        except anthropic.RateLimitError:
            raise RuntimeError(
                "\n[ERROR] Se alcanzo el limite de uso de la API.\n\n"
                "Espera unos minutos e intenta de nuevo.\n"
                "Si el problema persiste, revisa tu plan en: https://console.anthropic.com\n"
            )
        except anthropic.APIError as e:
            raise RuntimeError(
                f"\n[ERROR] Fallo la comunicacion con la API de Anthropic.\n"
                f"Detalle: {e}\n\n"
                "Verifica tu conexion a internet e intenta de nuevo.\n"
            )
