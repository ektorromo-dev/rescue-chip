"""
Workflow: Contenido semanal completo
====================================
Agentes en secuencia: Content Creator -> Social Media Manager -> Script Writer

Entrada:  semana (ej: "semana del 17 al 23 de marzo de 2026")
Salida:   Calendario completo con posts listos + 1 guion de TikTok
"""
from agents.content_creator import ContentCreator
from agents.social_media_manager import SocialMediaManager
from agents.script_writer import ScriptWriter
from tools.file_tools import save_output


def ejecutar(semana: str) -> dict:
    """
    Ejecuta el workflow de contenido semanal completo.

    Flujo:
    1. Content Creator genera 5 posts con voz correcta de RescueChip
    2. Social Media Manager organiza los posts en calendario accionable
    3. Script Writer crea 1 guion de TikTok para la semana

    Args:
        semana: Descripcion de la semana (ej: "semana del 17 al 23 de marzo de 2026")

    Returns:
        Dict con claves: posts, calendario, guion_tiktok, resumen_completo, ruta_resumen
    """
    separador = "=" * 55

    print(f"\n{separador}")
    print(f"  GENERANDO CONTENIDO SEMANAL")
    print(f"  Semana: {semana}")
    print(f"{separador}")

    resultados = {}

    # ─────────────────────────────────────────────────────────
    # PASO 1: Content Creator genera los posts
    # ─────────────────────────────────────────────────────────
    print("\n[Paso 1/3] Content Creator — creando 5 posts...")
    creator = ContentCreator()
    posts = creator.crear_posts_semanales(semana, num_posts=5)
    resultados["posts"] = posts
    print("  [OK] Posts generados.")

    # ─────────────────────────────────────────────────────────
    # PASO 2: Social Media Manager organiza el calendario
    # ─────────────────────────────────────────────────────────
    print("\n[Paso 2/3] Social Media Manager — organizando calendario...")
    smm = SocialMediaManager()
    calendario = smm.crear_calendario(semana, posts)
    resultados["calendario"] = calendario
    print("  [OK] Calendario organizado.")

    # ─────────────────────────────────────────────────────────
    # PASO 3: Script Writer crea el guion de TikTok
    # ─────────────────────────────────────────────────────────
    print("\n[Paso 3/3] Script Writer — escribiendo guion de TikTok...")
    writer = ScriptWriter()
    guion = writer.escribir_guion_tiktok(
        tema="como funciona RescueChip cuando alguien escanea el chip en una emergencia",
        duracion=30
    )
    resultados["guion_tiktok"] = guion
    print("  [OK] Guion de TikTok listo.")

    # ─────────────────────────────────────────────────────────
    # RESUMEN FINAL — todo junto en un archivo
    # ─────────────────────────────────────────────────────────
    resumen = f"""# CONTENIDO SEMANAL COMPLETO — {semana.upper()}
*Generado por la Agencia de Marketing RescueChip*

---

## POSTS DE LA SEMANA
*Creados por el Content Creator — listos para copiar y publicar*

{posts}

---

## CALENDARIO DE PUBLICACION
*Organizado por el Social Media Manager*

{calendario}

---

## GUION DE TIKTOK
*Escrito por el Script Writer*

{guion}
"""

    semana_safe = semana.replace(' ', '-')[:60]
    ruta_resumen = save_output(
        "content_calendar",
        f"semana-completa-{semana_safe}",
        resumen
    )

    resultados["resumen_completo"] = resumen
    resultados["ruta_resumen"] = ruta_resumen

    print(f"\n{separador}")
    print(f"  CONTENIDO SEMANAL COMPLETO")
    print(f"  Resumen guardado en:")
    print(f"  {ruta_resumen}")
    print(f"{separador}")

    return resultados
