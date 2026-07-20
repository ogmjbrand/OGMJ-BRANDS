/**
 * OGMJ BRANDS — Resend Email Client (server-only)
 */

import { Resend } from "resend";

let client: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "OGMJ BRANDS <notifications@ogmjbrands.com>";
