/**
 * Native Google Sign-In helper.
 * - In Capacitor (Android/iOS): uses @codetrix-studio/capacitor-google-auth (native account picker, no browser redirect).
 * - In web: returns { native: false } so caller can fall back to the existing OAuth web flow.
 *
 * To enable on Android, set VITE_GOOGLE_WEB_CLIENT_ID in the build (or replace the constant below)
 * and configure the same Web Client ID in capacitor.config.ts plugins.GoogleAuth.serverClientId.
 */

import { supabase } from '@/integrations/supabase/client';

const WEB_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined) ?? '';

export type NativeGoogleResult =
  | { native: false }
  | { native: true; ok: true }
  | { native: true; ok: false; error: string };

function isNativePlatform(): boolean {
  // Lightweight check that avoids a hard dependency at module load time.
  // @ts-ignore - Capacitor global is injected at runtime in the native shell.
  const cap = (globalThis as any).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export async function signInWithGoogleNative(): Promise<NativeGoogleResult> {
  if (!isNativePlatform()) {
    return { native: false };
  }

  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

    // initialize is idempotent — safe to call before every sign-in.
    try {
      await GoogleAuth.initialize({
        clientId: WEB_CLIENT_ID,
        scopes: ['email', 'profile', 'openid'],
        grantOfflineAccess: false,
      });
    } catch {
      // Already initialized — ignore.
    }

    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser?.authentication?.idToken;
    if (!idToken) {
      return { native: true, ok: false, error: 'Google não retornou idToken' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      return { native: true, ok: false, error: error.message };
    }
    return { native: true, ok: true };
  } catch (err: any) {
    const msg = err?.message || String(err);
    // User cancelled the native dialog — treat as a soft cancel, not an error toast.
    if (/cancel|12501/i.test(msg)) {
      return { native: true, ok: false, error: 'cancelled' };
    }
    return { native: true, ok: false, error: msg };
  }
}
