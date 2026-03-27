"""
Workflow: Campana de anuncios pagados
======================================
Agentes en secuencia: Content Creator -> Ads Manager

Entrada:  producto, objetivo de campana, presupuesto disponible
Salida:   3 variantes de anuncio listas para subir a Facebook/Instagram Ads
"""
from agents.content_creator import ContentCreator
from agents.ads_manager import AdsManager
from tools.file_tools import save_output


def ejecutar(producto: str, objetivo: str, presupuesto: str) -> dict:
    """
    Ejecuta el workflow de campana de anuncios.

    Flujo:
    1. Content Creator define el angulo creativo de la campana
    2. Ads Manager produce 3 variantes de anuncio con segmentacion y presupuesto

    Args:
        producto: Producto a anunciar (ej: "Individual -- $347 MXN")
        objetivo: Objetivo de la campana (ej: "primeras ventas en CDMX")
        presupuesto: Presupuesto disponible (ej: "$200 MXN diarios durante 2 semanas")

    Returns:
        Dict con claves: angulo, campana, resumen_completo, ruta_resumen
    """
    separador = "=" * 55

    print(f"\n{separador}")
    print(f"  GENERANDO CAMPANA DE ANUNCIOS")
    print(f"  Producto:    {producto}")
    print(f"  Objetivo:    {objetivo}")
    print(f"  Presupuesto: {presupuesto}")
    print(f"{separador}")

    resultados = {}

    # ─────────────────────────────────────────────────────────
    # PASO 1: Content Creator define el angulo creativo
    # ─────────────────────────────────────────────────────────
    print("\n[Paso 1/2] Content Creator — definiendo angulo creativo...")
    creator = ContentCreator()
    angulo = creator.crear_contenido_personalizado(
        f"""Define el angulo creativo para una campana de anuncios pagados de RescueChip.

Producto: {producto}
Objetivo de la campana: {objetivo}
Presupuesto disponible: {presupuesto}

Produce un analisis creativo breve con:
1. El insight del rider que esta campana debe aprovechar
   (una verdad sobre como piensa el rider que hace que el mensaje resuene)
2. El mensaje central de la campana (una sola oracion)
3. Tres posibles hooks para el titular del anuncio
4. Lo que esta campana NO debe hacer (segun las reglas de marca de RescueChip)
5. El mejor momento del dia para mostrar este anuncio y por que

Este analisis guiara al Ads Manager en la creacion de las variantes finales."""
    )
    resultados["angulo"] = angulo
    print("  [OK] Angulo creativo definido.")

    # ─────────────────────────────────────────────────────────
    # PASO 2: Ads Manager crea las 3 variantes de anuncio
    # ─────────────────────────────────────────────────────────
    print("\n[Paso 2/2] Ads Manager — creando 3 variantes de anuncio...")
    ads = AdsManager()
    campana = ads.crear_campana(producto, objetivo, presupuesto)
    resultados["campana"] = campana
    print("  [OK] 3 variantes de anuncio creadas.")

    # ─────────────────────────────────────────────────────────
    # RESUMEN FINAL
    # ─────────────────────────────────────────────────────────
    resumen = f"""# CAMPANA DE ANUNCIOS — {producto.upper()}
*Objetivo: {objetivo}*
*Presupuesto: {presupuesto}*
*Generado por la Agencia de Marketing RescueChip*

---

## ANGULO CREATIVO
*Analisis del Content Creator — base para las variantes de anuncio*

{angulo}

---

## VARIANTES DE ANUNCIO
*3 variantes listas para subir a Facebook Ads Manager / Instagram Ads*

{campana}
"""

    nombre_archivo = (
        f"campana-completa-{producto[:20].replace(' ', '-')}"
        f"-{objetivo[:20].replace(' ', '-')}"
    )
    ruta_resumen = save_output("ad_copy", nombre_archivo, resumen)

    resultados["resumen_completo"] = resumen
    resultados["ruta_resumen"] = ruta_resumen

    print(f"\n{separador}")
    print(f"  CAMPANA COMPLETA LISTA")
    print(f"  Guardada en: {ruta_resumen}")
    print(f"{separador}")

    return resultados
