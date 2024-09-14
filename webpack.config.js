const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;

  module.exports = {
    entry: './src/index.ts',
    mode: 'development',
    plugins: [new ModuleFederationPlugin({
    runtime: 'fab-city',
    shared: ['lodash','convnetjs','jsts','@types/jsts'],
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
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },

  };
