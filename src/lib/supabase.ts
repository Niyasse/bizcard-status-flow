import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read Supabase environment variables from Vite or Next.js style
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("<project-ref>")
  );
};

export const isProd = import.meta.env.PROD;
export const isDev = !isProd;

export function isValidUuid(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

export const MOCK_ID_TO_UUID: Record<string, string> = {
  b1: "b1a2c3d4-0001-0001-0001-000000000001",
  b2: "b1a2c3d4-0002-0002-0002-000000000002",
  b3: "b1a2c3d4-0003-0003-0003-000000000003",
  b4: "b1a2c3d4-0004-0004-0004-000000000004",
  b5: "b1a2c3d4-0005-0005-0005-000000000005",
  b6: "b1a2c3d4-0006-0006-0006-000000000006",
  b7: "b1a2c3d4-0007-0007-0007-000000000007",
  b8: "b1a2c3d4-0008-0008-0008-000000000008",
  b9: "b1a2c3d4-0009-0009-0009-000000000009",
};

export const UUID_TO_MOCK_ID: Record<string, string> = Object.fromEntries(
  Object.entries(MOCK_ID_TO_UUID).map(([mockId, uuid]) => [uuid, mockId])
);

export function toDbUuid(id: string): string {
  if (isValidUuid(id)) return id;
  return MOCK_ID_TO_UUID[id] || id;
}

// Singleton client instance or dummy client
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Upload a logo file (base64 Data URL or Blob) to Supabase Storage `logos` bucket.
 * Returns the public URL or storage path.
 */
export async function uploadBusinessLogo(
  businessId: string,
  logoDataUrlOrUrl: string
): Promise<string> {
  if (!isSupabaseConfigured()) return logoDataUrlOrUrl;
  if (!logoDataUrlOrUrl || !logoDataUrlOrUrl.startsWith("data:image/")) {
    return logoDataUrlOrUrl;
  }

  try {
    const match = logoDataUrlOrUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) return logoDataUrlOrUrl;

    const mimeExt = match[1] === "jpeg" ? "jpg" : match[1];
    const base64Data = match[2];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${match[1]}` });

    const filePath = `${businessId}/logo-${Date.now()}.${mimeExt}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, blob, {
        upsert: true,
        contentType: `image/${match[1]}`,
      });

    if (uploadError) {
      console.warn("Supabase logo upload failed, using local logo data:", uploadError.message);
      return logoDataUrlOrUrl;
    }

    const { data: publicUrlData } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || filePath;
  } catch (err) {
    console.warn("Error processing logo upload:", err);
    return logoDataUrlOrUrl;
  }
}

