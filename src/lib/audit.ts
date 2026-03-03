import { createClient } from "@supabase/supabase-js";

export type AuditAction = 'profile_view' | 'profile_update' | 'emergency_access' | 'login' | 'logout';

interface AuditLogPayload {
    userId?: string;
    action: AuditAction;
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

export async function logAuditEvent(payload: AuditLogPayload) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabaseAdmin
            .from('audit_logs')
            .insert({
                user_id: payload.userId || null,
                action: payload.action,
                entity_type: payload.entityType || null,
                entity_id: payload.entityId || null,
                ip_address: payload.ipAddress || null,
                user_agent: payload.userAgent || null,
                metadata: payload.metadata || {}
            });

        if (error) {
            console.error("Error inserting audit log:", error);
        }
    } catch (e) {
        console.error("Exception in logAuditEvent:", e);
    }
}
