"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

// Export commonly used auth methods
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  sendVerificationEmail,
  verifyEmail,
} = authClient;
