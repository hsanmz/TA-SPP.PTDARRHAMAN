import { db } from "@/lib/db/client";
import { auditLogs } from "../../../drizzle/schema";

export async function logAudit(
  userId: string | null,
  action: string,
  entityType?: string | null,
  entityId?: string | null,
  details?: unknown,
): Promise<void> {
  await db.insert(auditLogs).values({
    user_id: userId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    details: details === undefined ? null : JSON.stringify(details),
  });
}
