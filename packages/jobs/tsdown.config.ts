import { defineConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  minify: isProduction,
  external: [
    "react",
    "react-dom",
    "@qbs-autonaim/config",
    "@qbs-autonaim/emails",
    "@qbs-autonaim/db",
    "@qbs-autonaim/lib",
    "@qbs-autonaim/prompts",
    "@qbs-autonaim/tg-client",
  ],
});
