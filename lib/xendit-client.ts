/**
 * Xendit Client Configuration
 * Uses environment variables injected by Yapi at runtime
 * 
 * Note: Environment variables are checked at runtime (not build time)
 * to prevent build errors when env vars are not available during build.
 */

/**
 * Get authorization headers for Xendit API requests
 * Validates XENDIT_SECRET_KEY at runtime to avoid build-time errors
 */
export function getXenditHeaders() {
  const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
  const XENDIT_SUBACCOUNT_ID = process.env.XENDIT_SUBACCOUNT_ID;

  // Validate at runtime (not build time) to prevent build errors
  if (!XENDIT_SECRET_KEY) {
    throw new Error("XENDIT_SECRET_KEY environment variable is required");
  }

  const headers: Record<string, string> = {
    "Authorization": `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };

  // Include sub-account ID to scope operations to user's account
  if (XENDIT_SUBACCOUNT_ID) {
    headers["for-user-id"] = XENDIT_SUBACCOUNT_ID;
  }

  return headers;
}

/**
 * Verify webhook authenticity using callback token
 */
export function verifyWebhookToken(receivedToken: string | null): boolean {
  const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;

  if (!XENDIT_WEBHOOK_TOKEN) {
    console.warn("[Xendit] XENDIT_WEBHOOK_TOKEN not configured, skipping verification");
    return true; // Allow if not configured
  }

  return receivedToken === XENDIT_WEBHOOK_TOKEN;
}

export const XENDIT_API_BASE = "https://api.xendit.co";
