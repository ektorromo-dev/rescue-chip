"""
Herramientas para leer archivos de contexto y guardar outputs.
Usadas por todos los agentes de la agencia de marketing RescueChip.
"""
import os
from datetime import datetime

# Rutas base (relativas a este archivo)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTEXT_DIR = os.path.join(BASE_DIR, "context")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")


def load_context_file(filename: str) -> str:
    """
    Carga un archivo de contexto desde la carpeta context/.

    Args:
        filename: Nombre del archivo (ej: "brand.md", "audience.md")

    Returns:
        El contenido del archivo como string

    Raises:
        FileNotFoundError: Si el archivo no existe
    """
    filepath = os.path.join(CONTEXT_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Archivo de contexto no encontrado: {filename}\n"
            f"Ruta esperada: {filepath}\n"
            "Verifica que la carpeta context/ esté completa y no haya sido movida."
        )
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def save_output(category: str, name: str, content: str) -> str:
    """
    Guarda un output en outputs/[category]/[name]-[timestamp].md

    Args:
        category: Subcarpeta de outputs (ej: "content_calendar", "ad_copy")
        name: Nombre base del archivo
        content: Contenido a guardar

    Returns:
        La ruta completa del archivo guardado
    """
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output_dir = os.path.join(OUTPUTS_DIR, category)
    os.makedirs(output_dir, exist_ok=True)

    # Limpia el nombre para que sea válido como nombre de archivo
    safe_name = "".join(c if c.isalnum() or c in "-_" else "-" for c in name)
    safe_name = safe_name[:80]  # límite razonable de longitud

    filename = f"{safe_name}-{timestamp}.md"
    filepath = os.path.join(output_dir, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return filepath


def list_outputs(category: str) -> list:
    """
    Lista los archivos de output de una categoría, del más reciente al más antiguo.

    Args:
        category: Subcarpeta de outputs

    Returns:
        Lista de rutas completas de archivos .md
    """
    output_dir = os.path.join(OUTPUTS_DIR, category)
    if not os.path.exists(output_dir):
        return []
    files = sorted(os.listdir(output_dir), reverse=True)
    return [os.path.join(output_dir, f) for f in files if f.endswith(".md")]
