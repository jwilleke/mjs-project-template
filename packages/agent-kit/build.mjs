#!/usr/bin/env node
// build.mjs — assemble the publishable package from the kit sources.
//
// The kit is authored at the repo root (`.claude/commands/`, `templates/`,
// `kit-files.tsv`, `bin/kit.mjs`) and used from there by install-kit.sh and by
// this repo's own agents. Copying at pack time means the published package can
// never disagree with the sources it was cut from — there is one authored copy,
// and the package is a build artifact.
//
// Run automatically by `npm pack` / `npm publish` via the prepack script.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const copied = [];

function copy(from, to) {
  const source = join(root, from);
  if (!existsSync(source)) throw new Error(`kit source missing: ${from}`);

  const destination = join(here, to);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
  copied.push(to);
}

// Generated directories are rebuilt from scratch, so a file deleted upstream
// cannot survive in the package as a stale leftover.
for (const stale of ['bin', 'commands', 'templates', 'kit-files.tsv', 'kit-version.txt']) {
  rmSync(join(here, stale), { recursive: true, force: true });
}

copy('bin/kit.mjs', 'bin/kit.mjs');
copy('kit-files.tsv', 'kit-files.tsv');
copy('templates', 'templates');

// The command set comes from the manifest rather than a second hand-written
// list — same reason install-kit.sh and the checker share it.
const manifest = readFileSync(join(root, 'kit-files.tsv'), 'utf8');
const commands = manifest
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => line.split('\t'))
  .filter(([behavior, path]) => behavior === 'overwrite' && path.startsWith('.claude/commands/'))
  .map(([, path]) => path);

if (!commands.length) throw new Error('no commands found in kit-files.tsv');

for (const path of commands) {
  copy(path, path.replace('.claude/commands/', 'commands/'));
}

// A published package has no git history. Without this stamp the checker would
// fall back to the latest release tag and report every consumer as ahead.
const version = execFileSync('git', ['-C', root, 'describe', '--tags', '--long'], {
  encoding: 'utf8'
}).trim();

writeFileSync(join(here, 'kit-version.txt'), `${version}\n`);

console.log(`packed kit ${version}`);
for (const path of copied) console.log(`  ${path}`);
