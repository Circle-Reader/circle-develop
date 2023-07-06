const webpackMerge = require('webpack-merge');
const common = require('./common');

module.exports = webpackMerge.merge(common, {
  mode: 'development',
});
