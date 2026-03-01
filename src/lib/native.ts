/**
 * Native Capacitor utilities with dynamic imports.
 * All functions are safe to call in browser — they silently no-op when plugins aren't available.
 */

import { toast } from 'sonner';

export async function configureStatusBar() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setBackgroundColor({ color: '#16a34a' });
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // Not running in native shell
  }
}

export async function shareContent(title: string, text: string, url?: string) {
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({ title, text, url, dialogTitle: title });
  } catch {
    if (navigator.share) {
      await navigator.share({ title, text, url });
    }
  }
}

export async function openExternalUrl(url: string) {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch {
    window.open(url, '_blank');
  }
}

export async function hapticSuccess() {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Not native
  }
}

export async function hapticWarning() {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // Not native
  }
}

export async function hapticLight() {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Not native
  }
}

export async function copyToClipboard(text: string, label?: string) {
  try {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
  } catch {
    // Fallback to browser API
    await navigator.clipboard.writeText(text);
  }
  toast.success(label ? `${label} copiado!` : 'Copiado!');
  await hapticLight();
}
