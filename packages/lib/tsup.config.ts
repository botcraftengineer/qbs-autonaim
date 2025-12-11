import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    s3: "src/s3.ts",
    image: "src/image.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  external: [],
});
