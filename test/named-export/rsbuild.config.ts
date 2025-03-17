import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { defineConfig } from '@rsbuild/core';


export default defineConfig({
  plugins: [pluginLess(), pluginSass(), pluginTypedCSSModules(), pluginTypeCheck()],
  output: {
    cssModules: {
      namedExport: true,
    }
  },
});
