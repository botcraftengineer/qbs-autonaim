import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [
    "@qbs-autonaim/auth",
    "@qbs-autonaim/db",
    "@qbs-autonaim/jobs",
    "@qbs-autonaim/validators",
  ],
});
