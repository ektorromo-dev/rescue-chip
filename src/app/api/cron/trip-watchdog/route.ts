import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { intentarPushPorPerfil } from "@/lib/push-notify";

export const dynamic = "force-dynamic";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY requerido en /api/cron/trip-watchdog");
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface RiderLocationRow {
  profile_id: string;
  last_moved_at: string | null;
  trip_prompted_at: string | null;
}

type ProcessResult = "skipped_incident" | "prompted" | "stopped" | "no_action";

export async function GET(req: NextRequest) {
  try {
    // 1. Verificación de autorización
    const authHeader = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Consultar riders con trip_active = true
    const { data: riders, error: ridersError } = await supabaseAdmin
      .from("rider_locations")
      .select("profile_id, last_moved_at, trip_prompted_at")
      .eq("trip_active", true);

    if (ridersError) {
      console.error("[trip-watchdog] Error al consultar rider_locations:", ridersError);
      throw ridersError;
    }

    const rows: RiderLocationRow[] = (riders as RiderLocationRow[]) || [];
    const now = new Date();
    const nowIso = now.toISOString();
    const nowMs = now.getTime();

    // 3. Procesar cada fila usando Promise.allSettled
    const results = await Promise.allSettled(
      rows.map(async (row): Promise<ProcessResult> => {
        if (!row.profile_id) {
          return "no_action";
        }

        // a. Consultar si tiene un incidente vigente
        const { data: incidentes, error: incError } = await supabaseAdmin
          .from("incidentes")
          .select("id")
          .eq("profile_id", row.profile_id)
          .gt("expires_at", nowIso)
          .limit(1);

        if (incError) {
          console.error(
            `[trip-watchdog] Error consultando incidentes para ${row.profile_id}:`,
            incError
          );
          throw incError;
        }

        if (incidentes && incidentes.length > 0) {
          return "skipped_incident";
        }

        // b. Calcular minutos transcurridos desde last_moved_at
        const lastMovedMs = row.last_moved_at
          ? new Date(row.last_moved_at).getTime()
          : NaN;
        const minutesSinceMoved = !isNaN(lastMovedMs)
          ? (nowMs - lastMovedMs) / (1000 * 60)
          : 0;

        // c. Si han pasado 120 minutos o más Y trip_prompted_at es null
        if (row.trip_prompted_at === null) {
          if (minutesSinceMoved >= 120) {
            await intentarPushPorPerfil(row.profile_id, {
              tipo: "trip_check_prompt",
            });

            const { error: updateError } = await supabaseAdmin
              .from("rider_locations")
              .update({ trip_prompted_at: nowIso })
              .eq("profile_id", row.profile_id);

            if (updateError) {
              console.error(
                `[trip-watchdog] Error actualizando trip_prompted_at para ${row.profile_id}:`,
                updateError
              );
              throw updateError;
            }

            return "prompted";
          }
          return "no_action";
        }

        // d. Si trip_prompted_at NO es null Y han pasado 30 minutos o más desde trip_prompted_at
        const promptedMs = new Date(row.trip_prompted_at).getTime();
        const minutesSincePrompted = !isNaN(promptedMs)
          ? (nowMs - promptedMs) / (1000 * 60)
          : 0;

        if (minutesSincePrompted >= 30) {
          await intentarPushPorPerfil(row.profile_id, {
            tipo: "auto_stop_trip",
          });

          const { error: updateError } = await supabaseAdmin
            .from("rider_locations")
            .update({
              trip_active: false,
              trip_prompted_at: null,
            })
            .eq("profile_id", row.profile_id);

          if (updateError) {
            console.error(
              `[trip-watchdog] Error apagando trip para ${row.profile_id}:`,
              updateError
            );
            throw updateError;
          }

          return "stopped";
        }

        return "no_action";
      })
    );

    // 4. Calcular resumen
    let saltadosIncidente = 0;
    let preguntados = 0;
    let apagados = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        switch (result.value) {
          case "skipped_incident":
            saltadosIncidente++;
            break;
          case "prompted":
            preguntados++;
            break;
          case "stopped":
            apagados++;
            break;
          case "no_action":
            break;
        }
      } else {
        console.error(
          "[trip-watchdog] Error procesando rider:",
          result.reason
        );
      }
    }

    return NextResponse.json({
      revisados: rows.length,
      saltados_incidente: saltadosIncidente,
      preguntados,
      apagados,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("[trip-watchdog] Error en /api/cron/trip-watchdog:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
