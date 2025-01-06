import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // Entry point for your source code
  format: ["esm", "cjs"], // Output both ESM and CommonJS formats
  dts: true, // Generate TypeScript declaration files
  splitting: false,
  sourcemap: true,
  minify: true,
  clean: true,
  target: "node16", // Ensure compatibility with Node.js 16
  external: [], // Include external dependencies by default
  noExternal: ["ws"], // Force 'ws' to be bundled in the build
});
