import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase Storage Configuration
// ---------------------------------------------------------------------------
// Supabase Storage replaces Cloudflare R2 for attachment uploads.
// Uses the service_role key for server-side operations (upload/delete).
// ---------------------------------------------------------------------------

const requiredVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_BUCKET_NAME",
] as const;

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.warn(`[supabase] Missing env var: ${varName} — attachment uploads will fail`);
  }
}

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder-project.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key-for-local-dev-only";
const bucketName = process.env.SUPABASE_BUCKET_NAME || "sharaspot-attachments";

export const supabase = createClient(supabaseUrl, serviceRoleKey);

export const SUPABASE_BUCKET = bucketName;

export function getSupabasePublicUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
}
