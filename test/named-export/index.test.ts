import fs from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginTypedCSSModules } from '../../dist';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = __dirname;

const generatorTempDir = async (testDir: string) => {
  fs.rmSync(testDir, { recursive: true, force: true });
  await fs.promises.cp(join(fixtures, 'src'), testDir, { recursive: true });

  return () => fs.promises.rm(testDir, { force: true, recursive: true });
};

test('generator TS declaration for namedExport true', async () => {
  const testDir = join(fixtures, 'test-temp-src-1');
  const clear = await generatorTempDir(testDir);

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginLess(), pluginSass(), pluginTypedCSSModules()],
      source: {
        entry: { index: resolve(testDir, 'index.js') },
      },
      output: {
        cssModules: {
          namedExport: true,
        },
      },
    },
  });

  await rsbuild.build();

  expect(fs.existsSync(join(testDir, './a.css.d.ts'))).toBeFalsy();
  expect(fs.existsSync(join(testDir, './b.module.scss.d.ts'))).toBeTruthy();
  expect(fs.existsSync(join(testDir, './c.module.less.d.ts'))).toBeTruthy();
  expect(fs.existsSync(join(testDir, './d.global.less.d.ts'))).toBeFalsy();

  const bContent = fs.readFileSync(join(testDir, './b.module.scss.d.ts'), {
    encoding: 'utf-8',
  });

  expect(bContent).toEqual(`// This file is automatically generated.
// Please do not change this file!
export const _default: string;
export const _underline: string;
export const btn: string;
export const primary: string;
export const theBClass: string;
export const underline: string;
`);

  const cContent = fs.readFileSync(join(testDir, './c.module.less.d.ts'), {
    encoding: 'utf-8',
  });

  expect(cContent).toEqual(`// This file is automatically generated.
// Please do not change this file!
export const theCClass: string;
`);

  await clear();
});

test('generator TS declaration for namedExport true and `asIs` convention', async () => {
  const testDir = join(fixtures, 'test-temp-src-4');
  const clear = await generatorTempDir(testDir);

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginLess(), pluginSass(), pluginTypedCSSModules()],
      source: {
        entry: { index: resolve(testDir, 'index.js') },
      },
      output: {
        cssModules: {
          namedExport: true,
          exportLocalsConvention: 'asIs',
        },
      },
    },
  });

  await rsbuild.build();

  expect(fs.existsSync(join(testDir, './b.module.scss.d.ts'))).toBeTruthy();
  expect(fs.existsSync(join(testDir, './c.module.less.d.ts'))).toBeTruthy();

  const bContent = fs.readFileSync(join(testDir, './b.module.scss.d.ts'), {
    encoding: 'utf-8',
  });
  const cContent = fs.readFileSync(join(testDir, './c.module.less.d.ts'), {
    encoding: 'utf-8',
  });

  expect(bContent).toEqual(`// This file is automatically generated.
// Please do not change this file!
export const _default: string;
export const _underline: string;
export const btn: string;
export const primary: string;
export const theBClass: string;
`);

  expect(cContent).toEqual(`// This file is automatically generated.
// Please do not change this file!
export const theCClass: string;
`);

  await clear();
});
