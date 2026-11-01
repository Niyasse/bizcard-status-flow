// Centralized public URL resolution for sharing, QR codes, and custom domain migration.

/**
 * Resolves the public canonical base URL of the Bizapp deployment.
 * Priority:
 * 1. Explicitly configured VITE_PUBLIC_APP_URL environment variable
 * 2. window.location.origin (when running in a browser)
 * 3. Default fallback production origin
 */
export function getPublicBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_PUBLIC_APP_URL || "").trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://bizapp.in";
}

/**
 * Permanent canonical profile link for a business.
 * Uses stable UUID identifiers so URLs remain functional through custom domain migration.
 */
export function profileUrl(businessId: string): string {
  return `${getPublicBaseUrl()}/profile/${encodeURIComponent(businessId)}`;
}

/**
 * Permanent QR scan link with the ?src=qr tracking tag.
 */
export function qrUrl(businessId: string): string {
  return `${getPublicBaseUrl()}/profile/${encodeURIComponent(businessId)}?src=qr`;
}
