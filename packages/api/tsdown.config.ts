import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    "@qbs-autonaim/auth",
    "@qbs-autonaim/db",
    "@qbs-autonaim/jobs",
    "@qbs-autonaim/lib",
    "@qbs-autonaim/validators",
  ],
});
