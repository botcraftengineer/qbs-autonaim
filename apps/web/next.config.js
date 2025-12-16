import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  /** Enables hot reloading for local packages without a build step */
  output: "standalone",

  transpilePackages: [
    "@qbs-autonaim/auth",
    "@qbs-autonaim/db",
    "@qbs-autonaim/lib",
    "@qbs-autonaim/ui",
    "@qbs-autonaim/validators",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    // other stuff
    config.resolve.alias = {
      ...config.resolve.alias,
      effect: false,
      "@valibot/to-json-schema": false,
    };

    return config;
  },
};

export default config;
