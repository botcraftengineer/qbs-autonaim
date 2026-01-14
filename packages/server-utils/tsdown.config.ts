import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: ["esm"],
  dts: true,
  outDir: "dist",
  sourcemap: false,
  clean: true,
});
