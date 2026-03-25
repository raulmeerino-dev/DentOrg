import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dentorg.app",
  appName: "DentOrg",
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    cleartext: true,
    androidScheme: "https"
  }
};

export default config;
