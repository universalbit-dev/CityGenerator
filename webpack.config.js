const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: ['./src/main.ts', './src/bundle.js'],
  mode: 'development',
  devtool: 'inline-source-map',

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      // Optional: add alias for easier imports
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.json$/,
        type: 'json',
      },
      // Add support for CSS, images, etc., if needed in the future
    ],
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'CityGenerator',
      template: './src/html/index.html',
      filename: 'index.html',
    }),
    new ModuleFederationPlugin({
      name: 'fabcity',
      filename: 'remoteEntry.js',
      exposes: {
        './Module': './src/main',
      },
      shared: {
        'underscore': { singleton: true },
        'jszip': { singleton: true, eager: true },
        'convnetjs': { singleton: true },
        '@types/jsts': { singleton: true, eager: true },
        'digibyte-js': { singleton: true },
        'browserify': { singleton: true },
        'flatbush': { singleton: true },
      },
    }),
  ],

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 8002,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: {
      index: '/index.html', // Always serve dist/index.html (useful for SPAs)
    },
  },
};
