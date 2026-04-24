import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sersadia.express',
  appName: 'Ser Sadia Express',
  webDir: 'dist',
  server: {
    url: 'https://sersadiaexpress.lovable.app',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      backgroundColor: '#16a34a',
      style: 'LIGHT',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    GoogleAuth: {
      // Substitua pelo seu Web Client ID do Google Cloud Console (tipo: Web application).
      // Deve ser o MESMO ID usado em VITE_GOOGLE_WEB_CLIENT_ID no .env e no strings.xml do Android.
      scopes: ['profile', 'email'],
      serverClientId: 'COLOQUE_SEU_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
