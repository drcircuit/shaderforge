// vue.config.cjs
const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    hot: true,
    watchFiles: {
      paths: ['src/**/*', 'public/**/*'],
      options: {
        poll: 1000,
        ignored: /node_modules/,
      },
    },
  },
});
