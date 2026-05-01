import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.auraweather.app',
  appName: 'Aura Weather',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: true
    },
    CapacitorHttp: {
      enabled: true,
    }
  }
};

export default config;
