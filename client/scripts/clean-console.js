// craco.config.js - CRA ilovasi uchun
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === 'production') {
        // Terser plugin topish
        const terserPlugin = webpackConfig.optimization.minimizer.find(
          plugin => plugin.constructor.name === 'TerserPlugin'
        );
        
        if (terserPlugin) {
          terserPlugin.options.terserOptions = {
            ...terserPlugin.options.terserOptions,
            compress: {
              ...terserPlugin.options.terserOptions?.compress,
              drop_console: true,     // Barcha console.*
              drop_debugger: true,    // debugger
              pure_funcs: [
                'console.log',
                'console.info',
                'console.debug',
                'console.warn',
                'console.error',
                'console.table',
                'console.time',
                'console.timeEnd',
                'console.trace'
              ]
            }
          };
        }
        
        // SourceMap o'chirish
        webpackConfig.devtool = false;
      }
      return webpackConfig;
    }
  }
};