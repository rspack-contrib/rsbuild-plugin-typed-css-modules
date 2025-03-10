import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CSSLoaderOptions, RsbuildPlugin } from '@rsbuild/core';

export const PLUGIN_TYPED_CSS_MODULES_NAME = 'rsbuild:typed-css-modules';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pluginTypedCSSModules = (): RsbuildPlugin => ({
  name: PLUGIN_TYPED_CSS_MODULES_NAME,

  setup(api) {
    api.modifyBundlerChain({
      order: 'post',
      handler: async (chain, { target, CHAIN_ID }) => {
        if (target === 'web') {
          const ruleIds = [
            CHAIN_ID.RULE.CSS,
            CHAIN_ID.RULE.SASS,
            CHAIN_ID.RULE.LESS,
            CHAIN_ID.RULE.STYLUS,
          ];

          for (const ruleId of ruleIds) {
            if (!chain.module.rules.has(ruleId)) {
              continue;
            }

            const rule = chain.module.rule(ruleId);

            if (!rule.uses.has(CHAIN_ID.USE.CSS)) {
              continue;
            }

            const cssLoaderOptions: CSSLoaderOptions = rule
              .use(CHAIN_ID.USE.CSS)
              .get('options');

            if (
              !cssLoaderOptions.modules ||
              (typeof cssLoaderOptions.modules === 'object' &&
                cssLoaderOptions.modules.auto === false)
            ) {
              continue;
            }

            rule
              .use(CHAIN_ID.USE.CSS_MODULES_TS)
              .loader(path.resolve(__dirname, './loader.cjs'))
              .options({
                modules: cssLoaderOptions.modules,
              })
              .before(CHAIN_ID.USE.CSS);
          }
        }
      },
    });
  },
});
