import os
import sys
import argparse
import random
import csv
from dotenv import load_dotenv
from supabase import create_client, Client

# Conjuntos de caracteres (sin vocales, sin 0 y 1)
CARACTERES = "BCDFGHJKLMNPQRSTVWXYZ23456789"
FORMATO_PREFIX = "RSC-"
LONGITUD_ALFANUMERICA = 5

def generar_folio_unico():
    sufijo = ''.join(random.choice(CARACTERES) for _ in range(LONGITUD_ALFANUMERICA))
    return f"{FORMATO_PREFIX}{sufijo}"

def principal():
    parser = argparse.ArgumentParser(description="Generar N folios únicos para chips y registrarlos en Supabase.")
    parser.add_argument('n', metavar='N', type=int, help='Número de folios a generar')
    args = parser.parse_args()

    n = args.n
    if n <= 0:
        print("El número de folios debe ser mayor a 0.")
        sys.exit(1)

    # Cargar variables de entorno
    load_dotenv('.env.local')
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("[ERROR] Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
        sys.exit(1)

    try:
        supabase: Client = create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"[ERROR] Error al conectar con Supabase: {e}")
        sys.exit(1)

    folios_generados = set()
    print(f"[GENERANDO] Generando {n} folios únicos...")
    
    while len(folios_generados) < n:
        folio = generar_folio_unico()
        folios_generados.add(folio)
    
    lista_folios = list(folios_generados)

    print("[GENERANDO] Insertando folios en Supabase...")
    # Insertar en lotes para evitar límites de tamaño de solicitud si N es muy grande
    tamano_lote = 100
    for i in range(0, len(lista_folios), tamano_lote):
        lote_actual = lista_folios[i:i+tamano_lote]
        datos_insertar = [{"folio": folio, "status": "disponible"} for folio in lote_actual]
        try:
            supabase.table("chips").insert(datos_insertar).execute()
        except Exception as e:
            print(f"[ERROR] Error al insertar el lote en Supabase: {e}")
            sys.exit(1)

    print("[OK] Inserción completa.")
    print("-" * 50)
    print("CSV DE FOLIOS GENERADOS (LISTO PARA COPIAR):")
    print("Folio")
    for folio in lista_folios:
        print(folio)
    print("-" * 50)
    print(f"Total generados: {len(lista_folios)}")

if __name__ == "__main__":
    principal()
