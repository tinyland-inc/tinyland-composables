#!/usr/bin/env node
import process from 'node:process';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

function packageRoot() {
  const target = process.env.BAZEL_TARGET ?? '';
  const match = target.match(/^@@?([^/@][^/]*)\/\//);
  const externalRoot = match ? path.join('external', match[1]) : '.';
  return externalRoot;
}

const cwd = packageRoot();
const require = createRequire(import.meta.url);
const packageJson = require.resolve('svelte-check/package.json');
const bin = path.join(path.dirname(packageJson), 'bin', 'svelte-check');
const result = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], {
  cwd,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  process.stderr.write(`run-svelte-check: failed to spawn: ${result.error.message}\n`);
}
process.exit(result.status ?? 1);
