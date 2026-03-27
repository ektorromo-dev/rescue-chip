"""
Workflow: Reporte mensual de performance
==========================================
Agente: Analytics Agent

Entrada:  datos del mes (opcional — ventas, activaciones, posts publicados, resultados)
Salida:   Reporte del mes + recomendaciones para el siguiente mes
"""
from agents.analytics_agent import AnalyticsAgent
from tools.file_tools import save_output


def ejecutar(datos_del_mes: str = "") -> dict:
    """
    Ejecuta el workflow del reporte mensual.

    Flujo:
    1. Analytics Agent lee performance.md + datos adicionales
    2. Genera el reporte con analisis y recomendaciones accionables

    Args:
        datos_del_mes: Datos del mes que Hector quiera incluir
                       (ej: "Vendimos 12 chips, 9 activados, publicamos 20 posts,
                        tuvimos 1 rodada donde repartimos tarjetas")

    Returns:
        Dict con claves: reporte, ruta_resumen
    """
    separador = "=" * 55

    print(f"\n{separador}")
    print(f"  GENERANDO REPORTE MENSUAL")
    print(f"{separador}")

    if datos_del_mes:
        print(f"  Datos adicionales recibidos: {len(datos_del_mes)} caracteres")
    else:
        print(f"  Sin datos adicionales -- usando solo performance.md")

    resultados = {}

    # ─────────────────────────────────────────────────────────
    # Analytics Agent genera el reporte completo
    # ─────────────────────────────────────────────────────────
    print("\n[Paso 1/1] Analytics Agent — analizando datos y generando reporte...")
    analytics = AnalyticsAgent()
    reporte = analytics.generar_reporte_mensual(datos_adicionales=datos_del_mes)
    resultados["reporte"] = reporte
    print("  [OK] Reporte generado.")

    resultados["ruta_resumen"] = None  # el agente ya guarda el archivo y reporta la ruta

    print(f"\n{separador}")
    print(f"  REPORTE MENSUAL LISTO")
    print(f"  Revisa la carpeta outputs/reports/")
    print(f"{separador}")

    return resultados
