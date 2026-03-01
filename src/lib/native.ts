/**
 * Native Capacitor utilities with dynamic imports.
 * All functions are safe to call in browser — they silently no-op when plugins aren't available.
 */

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
    // Fallback: try Web Share API
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
