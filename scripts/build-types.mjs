// Bundles the public type declarations into one self-contained file and writes
// it as both dist/index.d.mts (for import) and dist/index.d.cts (for require).
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(import.meta.url);
const cli = require.resolve('dts-bundle-generator/dist/bin/dts-bundle-generator.js');

execFileSync(
  process.execPath,
  [cli, '--no-banner', '--export-referenced-types=false', '-o', 'dist/index.d.mts', 'src/index.ts'],
  { stdio: 'inherit' },
);
copyFileSync('dist/index.d.mts', 'dist/index.d.cts');
