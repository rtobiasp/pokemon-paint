import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pintadex.app",
  appName: "PintaDex",
  webDir: "www",
  backgroundColor: "#f4f3ec",
  android: {
    backgroundColor: "#f4f3ec",
    allowMixedContent: false,
  },
};

export default config;