const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;

  module.exports = {
    entry: ['./src/index.ts','./src/js/deepqlearn.js','./src/js/convnet.js','./digibyte.js'],
    mode: 'development',
    plugins: [new ModuleFederationPlugin({
    runtime: 'fab-city',
    shared: ['lodash','convnetjs','jsts','@types/jsts','digibyte-js','browserify'],
    }),],

  devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,use:'raw-loader',
          use: 'ts-loader',
          //exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
      byDependency: {
      commonjs: { aliasFields: ['browser'], },
      url: { preferRelative: true, },
      },
    },
    output: {filename: 'bundle.js',path: path.resolve(__dirname, 'dist'),},
};
