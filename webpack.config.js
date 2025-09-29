const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: ['./src/main.ts', './src/js/index.js'], // removed './src/bundle.js'
  mode: 'development',

  // Enable proper source maps for debugging (creates bundle.js.map)
  devtool: 'source-map',

  output: {
    filename: 'bundle.js', // use the classic name for clarity
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
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
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
      index: '/index.html',
    },
  },
};
