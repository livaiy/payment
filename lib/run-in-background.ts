import "server-only";

export function runInBackground(promise: Promise<unknown>) {
  // For Next.js dev environment, just run the promise
  // In production, this would use platform-specific background handlers
  void promise.catch((err) => console.error("[bg task failed]", err));
}
