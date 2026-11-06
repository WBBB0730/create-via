import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/cli.ts'],
  platform: 'node',
  dts: false,
  // CLI-only package: do not write exports["."] or overwrite bin path (npm 11 rejects ./ prefix)
  exports: false,
})
