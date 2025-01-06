import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'], // Output both ESM and CommonJS
  dts: true,             // Generate .d.ts files
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node16'       // Ensure Node.js compatibility
});