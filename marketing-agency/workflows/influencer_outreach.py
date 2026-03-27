"""
Workflow: Outreach a influencers
=================================
Agentes en secuencia: Content Creator -> Influencer Manager

Entrada:  lista de influencers (nombre, usuario IG, seguidores, descripcion)
Salida:   Mensaje personalizado por influencer + codigo de descuento + tracker
"""
from agents.content_creator import ContentCreator
from agents.influencer_manager import InfluencerManager
from tools.file_tools import save_output


def ejecutar(influencers: list) -> dict:
    """
    Ejecuta el workflow de outreach a influencers.

    Flujo:
    1. Content Creator prepara las notas internas del pitch de RescueChip
    2. Influencer Manager crea los mensajes personalizados para cada influencer

    Args:
        influencers: Lista de dicts con info de cada influencer:
            [{"nombre": "...", "usuario_ig": "...", "seguidores": "...", "descripcion": "..."}]

    Returns:
        Dict con claves: pitch, outreach, resumen_completo, ruta_resumen
    """
    if not influencers:
        print("  [ERROR] No se proporcionaron influencers.")
        return {}

    separador = "=" * 55
    num = len(influencers)
    nombres = ", ".join([inf.get("nombre", "?") for inf in influencers])

    print(f"\n{separador}")
    print(f"  GENERANDO OUTREACH A INFLUENCERS")
    print(f"  Cantidad: {num} influencer(s)")
    print(f"  Nombres:  {nombres}")
    print(f"{separador}")

    resultados = {}

    # ─────────────────────────────────────────────────────────
    # PASO 1: Content Creator prepara las notas internas del pitch
    # ─────────────────────────────────────────────────────────
    print("\n[Paso 1/2] Content Creator — preparando notas del pitch...")
    creator = ContentCreator()
    pitch = creator.crear_contenido_personalizado(
        """Prepara notas internas para guiar el outreach a influencers motociclistas de RescueChip.

Estas notas son para uso interno — no se envian a los influencers directamente.

Genera:
1. Los 3 puntos de valor mas importantes para un influencer motociclista
   (no sobre ventas -- sobre ser parte de algo autentico que viene de la comunidad)

2. Que NO decir en el primer mensaje (trampas comunes en outreach que generan rechazo)

3. Como personalizar el mensaje cuando el influencer:
   a) Hace contenido de rodadas grupales
   b) Hace reviews de equipo y accesorios
   c) Documenta sus viajes en moto

4. El argumento correcto para un influencer que pregunte "y yo que gano?"
   (debe ser honesto, sin prometer publicaciones obligatorias)

5. Como responder si un influencer dice que no hace contenido patrocinado
   (porque RescueChip no es sponsorship tradicional -- es un regalo sin compromiso)"""
    )
    resultados["pitch"] = pitch
    print("  [OK] Notas del pitch preparadas.")

    # ─────────────────────────────────────────────────────────
    # PASO 2: Influencer Manager crea los mensajes personalizados
    # ─────────────────────────────────────────────────────────
    print(f"\n[Paso 2/2] Influencer Manager — creando mensajes para {num} influencer(s)...")
    manager = InfluencerManager()
    outreach = manager.crear_outreach(influencers)
    resultados["outreach"] = outreach
    print("  [OK] Mensajes personalizados listos.")

    # ─────────────────────────────────────────────────────────
    # RESUMEN FINAL
    # ─────────────────────────────────────────────────────────
    resumen = f"""# OUTREACH DE INFLUENCERS
*Influencers: {nombres}*
*Generado por la Agencia de Marketing RescueChip*

---

## NOTAS INTERNAS DEL PITCH
*Uso interno para guiar la conversacion — no enviar a influencers*

{pitch}

---

## MENSAJES PERSONALIZADOS Y TRACKER
*Listos para copiar al DM de Instagram de cada influencer*

{outreach}
"""

    ruta_resumen = save_output("influencer_outreach", "outreach-completo", resumen)

    resultados["resumen_completo"] = resumen
    resultados["ruta_resumen"] = ruta_resumen

    print(f"\n{separador}")
    print(f"  OUTREACH COMPLETO")
    print(f"  Guardado en: {ruta_resumen}")
    print(f"{separador}")

    return resultados
