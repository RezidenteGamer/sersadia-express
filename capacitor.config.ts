import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sersadia.express',
  appName: 'Ser Sadia Express',
  server: {
    url: 'https://sersadiaexpress.lovable.app',
    cleartext: true,
  },
};

export default config;
