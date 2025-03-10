/**
 * The following code is modified based on
 * https://github.com/seek-oss/css-modules-typescript-loader
 *
 * only generator .d.ts for css modules file
 *
 * MIT Licensed
 * Author mattcompiles
 * Copyright 2018 SEEK
 * https://github.com/seek-oss/css-modules-typescript-loader/blob/master/LICENSE
 */
import fs from 'node:fs';
import path from 'node:path';
import type { CSSModules, Rspack } from '@rsbuild/core';
import LineDiff from 'line-diff';

export type CssLoaderModules =
  | boolean
  | string
  | Required<Pick<CSSModules, 'auto' | 'namedExport'>>;

const NODE_MODULES_REGEX: RegExp = /[\\/]node_modules[\\/]/;
const isInNodeModules = (path: string) => NODE_MODULES_REGEX.test(path);

const CSS_MODULES_REGEX = /\.module\.\w+$/i;

const getNoDeclarationFileError = ({ filename }: { filename: string }) =>
  new Error(
    `Generated type declaration does not exist. Run Rsbuild and commit the type declaration for '${filename}'`,
  );

export const isCSSModules = ({
  resourcePath,
  resourceQuery,
  resourceFragment,
  modules,
}: {
  resourcePath: string;
  resourceQuery: string;
  resourceFragment: string;
  modules: CssLoaderModules;
}): boolean => {
  if (typeof modules === 'boolean') {
    return modules;
  }

  // Same as the `mode` option
  // https://github.com/webpack-contrib/css-loader?tab=readme-ov-file#mode
  if (typeof modules === 'string') {
    // CSS Modules will be disabled if mode is 'global'
    return modules !== 'global';
  }

  const { auto } = modules;

  if (typeof auto === 'boolean') {
    return auto && CSS_MODULES_REGEX.test(resourcePath);
  }
  if (auto instanceof RegExp) {
    return auto.test(resourcePath);
  }
  if (typeof auto === 'function') {
    return auto(resourcePath, resourceQuery, resourceFragment);
  }
  return true;
};

const isNamedExport = (modules: CssLoaderModules) => {
  if (typeof modules === 'boolean' || typeof modules === 'string') {
    return false;
  }
  return modules.namedExport;
};

const getTypeMismatchError = ({
  filename,
  expected,
  actual,
}: {
  filename: string;
  expected: string;
  actual: string;
}) => {
  const diff = new LineDiff(
    enforceLFLineSeparators(actual) || '',
    expected,
  ).toString();

  return new Error(
    `Generated type declaration file is outdated. Run Rsbuild and commit the updated type declaration for '${filename}'\n\n${diff}`,
  );
};

export function wrapQuotes(key: string): string {
  // Check if key is a valid identifier
  const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
  if (isValidIdentifier) {
    return key;
  }

  return `'${key}'`;
}

const cssModuleToNamedExports = (cssModuleKeys: string[]) => {
  return cssModuleKeys
    .sort()
    .map((key) => `export const ${key}: string;`)
    .join('\n');
};

const cssModuleToInterface = (cssModulesKeys: string[]) => {
  const interfaceFields = cssModulesKeys
    .sort()
    .map((key) => `  ${wrapQuotes(key)}: string;`)
    .join('\n');

  return `interface CssExports {\n${interfaceFields}\n}`;
};

const filenameToTypingsFilename = (filename: string) => {
  const dirName = path.dirname(filename);
  const baseName = path.basename(filename);
  return path.join(dirName, `${baseName}.d.ts`);
};

const enforceLFLineSeparators = (text?: string) => {
  if (text) {
    // replace all CRLFs (Windows) by LFs (Unix)
    return text.replace(/\r\n/g, '\n');
  }
  return text;
};

const compareText = (contentA: string, contentB: string) => {
  return (
    enforceLFLineSeparators(contentA) === enforceLFLineSeparators(contentB)
  );
};

const validModes = ['emit', 'verify'];

const isFileNotFound = (err?: { code: string }) => err && err.code === 'ENOENT';

const makeDoneHandlers = (
  callback: (...args: any[]) => void,
  content: string,
  rest: any[],
) => ({
  failed: (e: Error) => callback(e),
  success: () => callback(null, content, ...rest),
});

const makeFileHandlers = (filename: string) => ({
  read: (handler: (...args: any[]) => void) =>
    fs.readFile(filename, { encoding: 'utf-8' }, handler),
  write: (content: string, handler: (...args: any[]) => void) =>
    fs.writeFile(filename, content, { encoding: 'utf-8' }, handler),
});

const extractLocalExports = (content: string) => {
  let localExports = content.split('exports.locals')[1];
  if (!localExports) {
    localExports = content.split('___CSS_LOADER_EXPORT___.locals')[1];
  }
  return localExports;
};

const getCSSModulesKeys = (content: string, namedExport: boolean): string[] => {
  const keys = new Set<string>();

  if (namedExport) {
    const exportsRegex = /export\s+var\s+(\w+)\s*=/g;

    let match: RegExpExecArray | null = exportsRegex.exec(content);

    while (match !== null) {
      keys.add(match[1]);
      match = exportsRegex.exec(content);
    }

    return Array.from(keys);
  }

  const localExports = extractLocalExports(content);

  const keyRegex = /"([^\\"]+)":/g;
  let match = keyRegex.exec(localExports);

  while (match !== null) {
    keys.add(match[1]);
    match = keyRegex.exec(localExports);
  }

  return Array.from(keys);
};

function codegen(keys: string[], namedExport: boolean) {
  const bannerMessage =
    '// This file is automatically generated.\n// Please do not change this file!';
  if (namedExport) {
    return `${bannerMessage}\n${cssModuleToNamedExports(keys)}\n`;
  }

  const cssModuleExport =
    'declare const cssExports: CssExports;\nexport default cssExports;\n';
  return `${bannerMessage}\n${cssModuleToInterface(keys)}\n${cssModuleExport}`;
}

export default function (
  this: Rspack.LoaderContext<{
    mode: string;
    modules: CssLoaderModules;
  }>,
  content: string,
  ...rest: any[]
): void {
  const { failed, success } = makeDoneHandlers(this.async(), content, rest);

  const { resourcePath, resourceQuery, resourceFragment } = this;
  const { mode = 'emit', modules = true } = this.getOptions() || {};

  if (!validModes.includes(mode)) {
    failed(new Error(`Invalid mode option: ${mode}`));
    return;
  }

  if (
    !isCSSModules({ resourcePath, resourceQuery, resourceFragment, modules }) ||
    isInNodeModules(resourcePath)
  ) {
    success();
    return;
  }

  const cssModuleInterfaceFilename = filenameToTypingsFilename(resourcePath);
  const { read, write } = makeFileHandlers(cssModuleInterfaceFilename);

  const namedExport = isNamedExport(modules);
  const cssModulesKeys = getCSSModulesKeys(content, namedExport);
  const cssModulesCode = codegen(cssModulesKeys, namedExport);

  if (mode === 'verify') {
    read((err, fileContents) => {
      if (isFileNotFound(err)) {
        return failed(
          getNoDeclarationFileError({
            filename: cssModuleInterfaceFilename,
          }),
        );
      }

      if (err) {
        return failed(err);
      }

      if (!compareText(cssModulesCode, fileContents)) {
        return failed(
          getTypeMismatchError({
            filename: cssModuleInterfaceFilename,
            expected: cssModulesCode,
            actual: fileContents,
          }),
        );
      }

      return success();
    });
  } else {
    read((_, fileContents) => {
      if (!compareText(cssModulesCode, fileContents)) {
        write(cssModulesCode, (err) => {
          if (err) {
            failed(err);
          } else {
            success();
          }
        });
      } else {
        success();
      }
    });
  }
}
