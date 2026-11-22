import { createServerFn } from "@tanstack/react-start";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userRoles, users } from "../../../drizzle/schema";
import { requireSuperadmin } from "@/lib/backend/auth";

export const listStaff = createServerFn({ method: "GET" }).handler(async () => {
  await requireSuperadmin();
  const roles = await db
    .select()
    .from(userRoles)
    .where(inArray(userRoles.role, ["admin", "superadmin"]))
    .all();
  if (roles.length === 0) return [];
  const ids = [...new Set(roles.map((r) => r.user_id))];
  const profiles = await db
    .select({
      id: users.id,
      username: users.username,
      full_name: users.full_name,
      is_active: users.is_active,
    })
    .from(users)
    .where(inArray(users.id, ids))
    .all();
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return roles
    .map((r) => ({
      user_id: r.user_id,
      role: r.role as "admin" | "superadmin",
      username: byId.get(r.user_id)?.username ?? null,
      full_name: byId.get(r.user_id)?.full_name ?? null,
      is_active: byId.get(r.user_id)?.is_active ?? true,
    }))
    .sort((a, b) =>
      a.role === b.role
        ? (a.username ?? "").localeCompare(b.username ?? "")
        : a.role < b.role
          ? -1
          : 1,
    );
});
