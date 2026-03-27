"""
Prueba rápida del Content Creator.
Ejecutar desde la carpeta marketing-agency/:
    python test_content_creator.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=== PRUEBA: Content Creator ===\n")

try:
    from agents.content_creator import ContentCreator
    print("✅ Importación exitosa")

    creator = ContentCreator()
    print("✅ Agente inicializado")

    print("\nGenerando 1 post de prueba (puede tomar 20-30 segundos)...\n")
    resultado = creator.crear_contenido_personalizado(
        "Crea UN solo post corto para Instagram de RescueChip. "
        "Tema: qué hace RescueChip cuando alguien escanea el chip en una emergencia. "
        "Tono: de rider a rider, real, no comercial. Máximo 4 líneas de texto."
    )

    print("--- RESULTADO ---")
    print(resultado)
    print("\n✅ Content Creator funciona correctamente.")

except EnvironmentError as e:
    print(e)
    sys.exit(1)
except Exception as e:
    print(f"\n❌ ERROR inesperado: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
