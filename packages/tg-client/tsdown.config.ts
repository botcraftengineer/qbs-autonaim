import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/sdk/client.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  outDir: "dist",
  sourcemap: false,
  minify: false,
  treeshake: true,
  external: [
    "@mtcute/bun",
    "@mtcute/dispatcher",
    "@qbs-autonaim/config",
    "@qbs-autonaim/db",
    "@qbs-autonaim/lib",
    "@qbs-autonaim/prompts",
    "hono",
    "zod",
  ],
});
