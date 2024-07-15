import { defineConfig } from '@rsbuild/core';
import { pluginTypedCSSModules } from '../src';

export default defineConfig({
  plugins: [pluginTypedCSSModules()],
});
