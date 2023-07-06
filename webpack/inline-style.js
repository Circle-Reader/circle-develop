const { RawSource } = require('webpack-sources');
const webpack = require('webpack');

class InlineCss {
  apply(compiler) {
    compiler.hooks.compilation.tap('inline-css', (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        {
          name: 'inline-css-assets',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        (_, callback) => {
          const { assets } = compilation;
          Object.keys(assets).forEach((key) => {
            if (!key.endsWith('.js')) {
              return;
            }
            const value = assets[key];
            if (!value) {
              return;
            }
            const plugin = value.source();
            if (!/\window\.inlineStyle/.test(plugin)) {
              return;
            }
            const styleKey = key.replace(/\.js/, '.css');
            if (!assets[styleKey]) {
              return;
            }
            const style = assets[styleKey].source();
            delete compilation.assets[styleKey];
            assets[key] = new RawSource(
              plugin.replace('window.inlineStyle', '`' + style + '`')
            );
          });
          callback();
        }
      );
    });
  }
}

module.exports = InlineCss;
