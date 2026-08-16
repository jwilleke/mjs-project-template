import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

import {
  isValidVersion,
  serialize,
  setLockfileVersion,
  setPackageVersion
} from './set-version.mjs';

const lockfileV3 = {
  name: 'project-template',
  version: '1.0.0',
  lockfileVersion: 3,
  requires: true,
  packages: {
    '': {
      name: 'project-template',
      version: '1.0.0',
      license: 'ISC',
      devDependencies: { vitest: '^4.1.4' },
      engines: { node: '>=20.0.0' }
    },
    'node_modules/vitest': {
      version: '4.1.4',
      resolved: 'https://registry.npmjs.org/vitest/-/vitest-4.1.4.tgz',
      integrity: 'sha512-fake'
    }
  }
};

describe('setLockfileVersion', () => {
  it('updates the project version in both places it appears', () => {
    const next = setLockfileVersion(lockfileV3, '1.1.0');

    expect(next.version).toBe('1.1.0');
    expect(next.packages[''].version).toBe('1.1.0');
  });

  it('never touches dependency entries', () => {
    const next = setLockfileVersion(lockfileV3, '1.1.0');

    expect(next.packages['node_modules/vitest']).toEqual(lockfileV3.packages['node_modules/vitest']);
  });

  it('preserves the other fields of the root package entry', () => {
    const next = setLockfileVersion(lockfileV3, '1.1.0');

    expect(next.packages['']).toEqual({ ...lockfileV3.packages[''], version: '1.1.0' });
    expect(next.lockfileVersion).toBe(3);
    expect(next.requires).toBe(true);
  });

  it('handles lockfileVersion 1, which has no packages map', () => {
    const v1 = {
      name: 'project-template',
      version: '1.0.0',
      lockfileVersion: 1,
      dependencies: { vitest: { version: '4.1.4' } }
    };

    const next = setLockfileVersion(v1, '1.1.0');

    expect(next.version).toBe('1.1.0');
    expect(next.packages).toBeUndefined();
    expect(next.dependencies).toEqual(v1.dependencies);
  });

  it('does not mutate its input', () => {
    const before = JSON.stringify(lockfileV3);
    setLockfileVersion(lockfileV3, '9.9.9');

    expect(JSON.stringify(lockfileV3)).toBe(before);
  });
});

describe('setPackageVersion', () => {
  it('sets the version and preserves everything else', () => {
    const pkg = { name: 'project-template', version: '1.0.0', scripts: { test: 'vitest run' } };
    const next = setPackageVersion(pkg, '1.1.0');

    expect(next).toEqual({ ...pkg, version: '1.1.0' });
    expect(pkg.version).toBe('1.0.0');
  });
});

describe('serialize', () => {
  it('round-trips this repo\'s real package-lock.json byte-for-byte', () => {
    const raw = readFileSync('package-lock.json', 'utf8');

    expect(serialize(JSON.parse(raw))).toBe(raw);
  });

  it('changes exactly two lines when bumping the real lockfile', () => {
    const raw = readFileSync('package-lock.json', 'utf8');
    const lock = JSON.parse(raw);
    const bumped = serialize(setLockfileVersion(lock, '99.99.99'));

    const before = raw.split('\n');
    const after = bumped.split('\n');

    expect(after).toHaveLength(before.length);

    const differing = before.map((line, i) => [i, line, after[i]]).filter(([, a, b]) => a !== b);

    expect(differing).toHaveLength(2);
    expect(differing.every(([, , line]) => line.includes('99.99.99'))).toBe(true);
  });
});

describe('isValidVersion', () => {
  it.each(['1.0.0', '0.2.1', '10.20.30', '1.0.0-rc.1', '1.0.0+build.5'])('accepts %s', (v) => {
    expect(isValidVersion(v)).toBe(true);
  });

  it.each(['v1.0.0', '1.0', '', 'patch', undefined])('rejects %s', (v) => {
    expect(isValidVersion(v)).toBe(false);
  });
});
