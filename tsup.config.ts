import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts', './src/loader.ts'],
  format: ['esm', 'cjs'],
  target: 'node18',
  dts: true,
  clean: true,
  shims: true,
});
