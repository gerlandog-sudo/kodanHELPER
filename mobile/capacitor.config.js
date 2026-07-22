import { defineConfig } from '@capacitor/cli';

export default defineConfig({
  appId: 'software.kodan.helper',
  appName: 'kodanHELPER',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
});
