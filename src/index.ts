import type { RsbuildPlugin } from '@rsbuild/core';

export type pluginTypedCSSModulesOptions = {
  foo?: string;
  bar?: boolean;
};

export const pluginTypedCSSModules = (
  options: pluginTypedCSSModulesOptions = {},
): RsbuildPlugin => ({
  name: 'plugin-example',

  setup() {
    console.log('Hello Rsbuild!', options);
  },
});
