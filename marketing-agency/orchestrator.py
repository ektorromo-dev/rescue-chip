#!/usr/bin/env python3
"""
AGENCIA DE MARKETING RESCUECHIP
================================
Este es el unico archivo que necesitas ejecutar.

Uso:
    python orchestrator.py

Requisitos previos:
    1. pip install -r requirements.txt
    2. Crear archivo .env con tu ANTHROPIC_API_KEY
       (copia .env.example y llena tu key)
"""
import os
import sys

# ─── Configuracion de encoding para Windows ──────────────────────────────────
# Necesario para que los caracteres especiales funcionen correctamente
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ─── Verificacion de Python 3.10+ ────────────────────────────────────────────
if sys.version_info < (3, 10):
    print("\n[ERROR] Se necesita Python 3.10 o mayor.")
    print(f"  Tienes instalado: Python {sys.version_info.major}.{sys.version_info.minor}")
    print("  Descarga la version mas reciente en: https://www.python.org/downloads/\n")
    sys.exit(1)

# ─── Agrega el directorio actual al path de Python ───────────────────────────
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if _BASE_DIR not in sys.path:
    sys.path.insert(0, _BASE_DIR)

# ─── Verifica que las dependencias esten instaladas ──────────────────────────
try:
    from dotenv import load_dotenv
    import anthropic  # noqa: F401
except ImportError:
    print("\n[ERROR] Faltan dependencias. Ejecuta:")
    print("   pip install -r requirements.txt\n")
    sys.exit(1)

# ─── Carga las variables de entorno ──────────────────────────────────────────
# override=True asegura que .env sobreescribe cualquier variable vacia del sistema
load_dotenv(override=True)

# ─── Verifica que la API key este configurada ─────────────────────────────────
if not os.getenv("ANTHROPIC_API_KEY"):
    print("\n" + "=" * 55)
    print("[ERROR] No se encontro tu API key de Anthropic.")
    print("=" * 55)
    print()
    print("Para solucionarlo:")
    print("  1. Copia el archivo .env.example")
    print("  2. Renombralo como .env (sin .example)")
    print("  3. Abrelo con cualquier editor de texto")
    print("  4. Cambia 'tu_api_key_de_anthropic_aqui' por tu key real")
    print("  5. Guarda el archivo")
    print("  6. Vuelve a ejecutar: python orchestrator.py")
    print()
    print("Obtener tu API key: https://console.anthropic.com")
    print()
    sys.exit(1)


# =============================================================================
# FUNCIONES DEL MENU
# =============================================================================

def mostrar_menu():
    """Muestra el menu principal de la agencia."""
    print()
    print("=" * 55)
    print("   AGENCIA DE MARKETING RESCUECHIP")
    print("=" * 55)
    print()
    print("  Que necesitas hoy?")
    print()
    print("  1. Contenido de la semana")
    print("     (posts + calendario + guion TikTok)")
    print()
    print("  2. Campana de anuncios")
    print("     (Facebook Ads / Instagram Ads)")
    print()
    print("  3. Contactar influencers")
    print("     (mensajes personalizados + codigos + tracker)")
    print()
    print("  4. Reporte del mes")
    print("     (analisis de performance + recomendaciones)")
    print()
    print("  5. Pregunta libre al CMO")
    print("     (estrategia, dudas, decision de marketing)")
    print()
    print("  0. Salir")
    print()


def opcion_1_contenido_semanal():
    """Workflow: genera el contenido completo para una semana."""
    print()
    print("-" * 55)
    print("  CONTENIDO DE LA SEMANA")
    print("-" * 55)
    print()
    print("Escribe la semana para la que quieres generar contenido.")
    print("Ejemplo: semana del 24 al 30 de marzo de 2026")
    print()

    semana = input("  Semana: ").strip()

    if not semana:
        print()
        print("  [!] No ingresaste la semana. Regresando al menu.")
        return

    print()
    print(f"  Generando contenido para: {semana}")
    print("  (Esto puede tomar 2-4 minutos — hay 3 agentes trabajando)")
    print()

    try:
        from workflows import weekly_content
        resultado = weekly_content.ejecutar(semana)

        print()
        print("=" * 55)
        print("  LISTO. Tu contenido semanal esta en:")
        print(f"  {resultado.get('ruta_resumen', 'carpeta outputs/content_calendar/')}")
        print("=" * 55)

    except EnvironmentError as e:
        print(f"\n{e}")
    except FileNotFoundError as e:
        print(f"\n{e}")
    except RuntimeError as e:
        print(f"\n{e}")
    except Exception as e:
        print(f"\n[ERROR inesperado] {type(e).__name__}: {e}")
        print("Si el error persiste, verifica tu conexion a internet y tu API key.")


def opcion_2_campana_anuncios():
    """Workflow: genera una campana de anuncios pagados."""
    print()
    print("-" * 55)
    print("  CAMPANA DE ANUNCIOS")
    print("-" * 55)
    print()
    print("  Que producto quieres anunciar?")
    print()
    print("  1. Individual  ($347 MXN)")
    print("  2. Pareja      ($549 MXN)")
    print("  3. Familiar    ($949 MXN)")
    print("  4. B2B         (para talleres y distribuidores)")
    print()

    opcion = input("  Elige (1-4): ").strip()
    productos = {
        "1": "Individual -- $347 MXN (envio incluido)",
        "2": "Pareja -- $549 MXN (envio incluido)",
        "3": "Familiar -- $949 MXN (envio incluido)",
        "4": "B2B para talleres y distribuidores"
    }
    producto = productos.get(opcion, "Individual -- $347 MXN (envio incluido)")

    print()
    print("  Cual es el objetivo de la campana?")
    print("  Ejemplo: 'primeras ventas en CDMX', 'awareness entre riders 28-35',")
    print("           'recuperar carritos abandonados', 'temporada de vacaciones'")
    print()
    objetivo = input("  Objetivo: ").strip()
    if not objetivo:
        objetivo = "generar las primeras ventas en CDMX"

    print()
    print("  Cuanto presupuesto tienes disponible?")
    print("  Ejemplo: '$200 MXN diarios durante 2 semanas', '$3,000 MXN totales'")
    print()
    presupuesto = input("  Presupuesto: ").strip()
    if not presupuesto:
        presupuesto = "presupuesto inicial pequeno (menos de $300 MXN diarios)"

    print()
    print(f"  Generando campana para: {producto}")
    print("  (Esto puede tomar 2-3 minutos)")
    print()

    try:
        from workflows import ad_campaign
        resultado = ad_campaign.ejecutar(producto, objetivo, presupuesto)

        print()
        print("=" * 55)
        print("  LISTO. Tu campana esta en:")
        print(f"  {resultado.get('ruta_resumen', 'carpeta outputs/ad_copy/')}")
        print("=" * 55)

    except EnvironmentError as e:
        print(f"\n{e}")
    except FileNotFoundError as e:
        print(f"\n{e}")
    except RuntimeError as e:
        print(f"\n{e}")
    except Exception as e:
        print(f"\n[ERROR inesperado] {type(e).__name__}: {e}")


def opcion_3_influencers():
    """Workflow: genera outreach personalizado para influencers."""
    print()
    print("-" * 55)
    print("  CONTACTAR INFLUENCERS")
    print("-" * 55)
    print()
    print("  Ingresa la informacion de cada influencer.")
    print("  Cuando termines de agregar todos, escribe 'listo'.")
    print()

    influencers = []
    contador = 1

    while True:
        print(f"  --- Influencer {contador} ---")
        nombre = input("  Nombre (o 'listo' para terminar): ").strip()

        if nombre.lower() in ("listo", "fin", "done", "salir", "0"):
            break

        if not nombre:
            print("  [!] El nombre no puede estar vacio. Intenta de nuevo.")
            continue

        usuario_ig = input("  Usuario de Instagram (sin @): ").strip()
        seguidores = input("  Seguidores aproximados (ej: 12K, 8000): ").strip()
        descripcion = input("  Descripcion breve (que tipo de contenido hace): ").strip()

        influencers.append({
            "nombre": nombre,
            "usuario_ig": usuario_ig or "sin_usuario",
            "seguidores": seguidores or "desconocido",
            "descripcion": descripcion or "Creador de contenido motociclista"
        })

        print(f"  [OK] {nombre} agregado.")
        print()
        contador += 1

    if not influencers:
        print()
        print("  [!] No ingresaste ningun influencer. Regresando al menu.")
        return

    print()
    print(f"  Generando mensajes para {len(influencers)} influencer(s)...")
    print("  (Esto puede tomar 2-3 minutos)")
    print()

    try:
        from workflows import influencer_outreach
        resultado = influencer_outreach.ejecutar(influencers)

        print()
        print("=" * 55)
        print("  LISTO. Tu outreach esta en:")
        print(f"  {resultado.get('ruta_resumen', 'carpeta outputs/influencer_outreach/')}")
        print("=" * 55)

    except EnvironmentError as e:
        print(f"\n{e}")
    except FileNotFoundError as e:
        print(f"\n{e}")
    except RuntimeError as e:
        print(f"\n{e}")
    except Exception as e:
        print(f"\n[ERROR inesperado] {type(e).__name__}: {e}")


def opcion_4_reporte_mensual():
    """Workflow: genera el reporte mensual de performance."""
    print()
    print("-" * 55)
    print("  REPORTE DEL MES")
    print("-" * 55)
    print()
    print("  Puedes ingresar datos del mes para enriquecer el analisis.")
    print("  (Deja en blanco y presiona Enter para usar solo los datos del sistema)")
    print()
    print("  Ejemplo de datos utiles:")
    print("  'Vendimos 12 chips. Se activaron 9. Publicamos 20 posts.")
    print("   Un TikTok tuvo 50K vistas. Un influencer nos menciono.'")
    print()

    datos = input("  Datos del mes: ").strip()

    print()
    print("  Generando reporte mensual...")
    print("  (Esto puede tomar 1-2 minutos)")
    print()

    try:
        from workflows import monthly_report
        monthly_report.ejecutar(datos_del_mes=datos)

        print()
        print("=" * 55)
        print("  LISTO. Tu reporte esta en la carpeta:")
        print("  outputs/reports/")
        print("=" * 55)

    except EnvironmentError as e:
        print(f"\n{e}")
    except FileNotFoundError as e:
        print(f"\n{e}")
    except RuntimeError as e:
        print(f"\n{e}")
    except Exception as e:
        print(f"\n[ERROR inesperado] {type(e).__name__}: {e}")


def opcion_5_consulta_cmo():
    """Consulta libre al CMO estrategico."""
    print()
    print("-" * 55)
    print("  CONSULTA AL CMO")
    print("-" * 55)
    print()
    print("  Hazle cualquier pregunta estrategica a tu CMO de IA.")
    print()
    print("  Ejemplos:")
    print("  - Como priorizo mis primeros 30 dias de marketing?")
    print("  - Que canal me conviene mas para las primeras 50 ventas?")
    print("  - Como respondo a un cliente que pregunta si RescueChip garantiza algo?")
    print("  - Que tan importante es el precio para el rider vs el valor?")
    print("  - Deberia enfocarme en B2B o B2C primero?")
    print()

    pregunta = input("  Tu pregunta al CMO: ").strip()

    if not pregunta:
        print()
        print("  [!] No ingresaste una pregunta. Regresando al menu.")
        return

    print()
    print("  El CMO esta analizando tu pregunta...")
    print("  (Esto puede tomar 1-3 minutos — usa el modelo mas potente)")
    print()

    try:
        from agents.cmo import CMO
        cmo = CMO()
        respuesta = cmo.consultar(pregunta)

        print()
        print("=" * 55)
        print("  RESPUESTA DEL CMO:")
        print("=" * 55)
        print()
        print(respuesta)
        print()
        print("=" * 55)
        print("  (La respuesta tambien fue guardada en outputs/reports/)")
        print("=" * 55)

    except EnvironmentError as e:
        print(f"\n{e}")
    except FileNotFoundError as e:
        print(f"\n{e}")
    except RuntimeError as e:
        print(f"\n{e}")
    except Exception as e:
        print(f"\n[ERROR inesperado] {type(e).__name__}: {e}")


# =============================================================================
# PUNTO DE ENTRADA
# =============================================================================

def main():
    """Bucle principal del menu interactivo."""
    print()
    print("Bienvenido a la Agencia de Marketing de RescueChip.")
    print("Sistema cargado correctamente.")

    while True:
        mostrar_menu()

        opcion = input("  Elige una opcion (1-5, o 0 para salir): ").strip()

        if opcion == "0":
            print()
            print("  Hasta luego, Hector.")
            print()
            break
        elif opcion == "1":
            opcion_1_contenido_semanal()
        elif opcion == "2":
            opcion_2_campana_anuncios()
        elif opcion == "3":
            opcion_3_influencers()
        elif opcion == "4":
            opcion_4_reporte_mensual()
        elif opcion == "5":
            opcion_5_consulta_cmo()
        else:
            print()
            print("  [!] Opcion no valida. Elige un numero del 0 al 5.")

        print()
        input("  Presiona Enter para continuar...")


if __name__ == "__main__":
    main()
