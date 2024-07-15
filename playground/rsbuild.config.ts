import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { pluginTypedCSSModules } from '../dist';

export default defineConfig({
  plugins: [
    pluginLess(),
    pluginSass(),
    pluginStylus(),
    pluginTypedCSSModules(),
  ],
});
