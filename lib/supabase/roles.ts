import { createClient } from "./client";
import { SB_TABLES } from "./tables";

export type UserRole = "doctor" | "patient" | "none";

// Cache resolved roles and in-flight promises to deduplicate concurrent requests
const resolvedRoles = new Map<string, UserRole>();
const inflightRequests = new Map<string, Promise<UserRole>>();

export async function getUserRole(userId: string): Promise<UserRole> {
  // Return cached result immediately if available
  const cached = resolvedRoles.get(userId);
  if (cached) return cached;

  // If a request for this user is already in-flight, share the same promise
  const inflight = inflightRequests.get(userId);
  if (inflight) return inflight;

  // Create a single promise that all concurrent callers will share
  const promise = fetchUserRole(userId);
  inflightRequests.set(userId, promise);

  try {
    const role = await promise;
    resolvedRoles.set(userId, role);
    return role;
  } finally {
    inflightRequests.delete(userId);
  }
}

async function fetchUserRole(userId: string): Promise<UserRole> {
  const res = await fetch(`/api/get-user-role?userId=${userId}`);
  if (!res.ok) return "none";
  const data = await res.json();
  return data.role;
}

export async function getServerUserRole(supabase: any, userId: string, user?: any): Promise<UserRole> {
  // 1. Check metadata first (FASTEST)
  if (user?.user_metadata?.role) {
    return user.user_metadata.role as UserRole;
  }

  // 2. Parallelize table lookups if metadata is missing (FALLBACK)
  const [patientResult, doctorResult] = await Promise.all([
    supabase.from(SB_TABLES.user_patient).select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from(SB_TABLES.user_doctor).select("user_id").eq("user_id", userId).maybeSingle()
  ]);

  if (patientResult.data) return "patient";
  if (doctorResult.data) return "doctor";

  return "none";
}
