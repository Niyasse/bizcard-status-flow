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
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
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

