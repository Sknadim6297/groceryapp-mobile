/**
 * Runs offline unit scripts under scripts/*.test.ts
 * Skips live-* network fixtures (those need API credentials / connectivity).
 *
 * Usage: npm test
 *        npm run test:unit
 *        npm run test:live   (live API fixtures only)
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mode = process.argv[2] === 'live' ? 'live' : 'unit';

const files = readdirSync(__dirname)
  .filter((name) => name.endsWith('.test.ts'))
  .filter((name) => (mode === 'live' ? name.startsWith('live-') : !name.startsWith('live-')))
  .sort();

if (files.length === 0) {
  console.error(`No ${mode} test files found.`);
  process.exit(1);
}

let failed = 0;
const failures = [];

console.log(`Running ${files.length} ${mode} test file(s)…\n`);

for (const file of files) {
  const full = path.join(__dirname, file);
  const relative = path.relative(root, full);
  process.stdout.write(`• ${relative} … `);
  const result = spawnSync('npx', ['--yes', 'tsx', full], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
  });
  if (result.status === 0) {
    console.log('ok');
  } else {
    failed += 1;
    failures.push(relative);
    console.log('FAIL');
    if (result.stdout?.trim()) {
      console.log(result.stdout.trim());
    }
    if (result.stderr?.trim()) {
      console.error(result.stderr.trim());
    }
  }
}

console.log('');
if (failed > 0) {
  console.error(`${failed} failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}

console.log(`All ${files.length} ${mode} tests passed.`);
