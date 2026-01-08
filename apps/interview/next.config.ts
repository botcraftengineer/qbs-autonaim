import { createJiti } from "jiti";
import { NextConfig } from "next";

export default async function createNextConfig(): Promise<NextConfig> {
  const jiti = createJiti(import.meta.url);

  await jiti.import("./src/env");

  const config: NextConfig = {
    output: "standalone",

    transpilePackages: [
      "@qbs-autonaim/api",
      "@qbs-autonaim/auth",
      "@qbs-autonaim/config",
      "@qbs-autonaim/db",
      "@qbs-autonaim/ui",
    ],

    typescript: { ignoreBuildErrors: true },
  };

  return config;
}
