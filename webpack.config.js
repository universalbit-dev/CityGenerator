const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  entry: ['./src/index.ts', './src/js/deepqlearn.js', './src/js/convnet.js', './digibyte.js'],
  mode: 'development',
  plugins: [
    new ModuleFederationPlugin({
      name: 'fab_city',
      filename: 'remoteEntry.js',
      exposes: {
        './Module': './src/index', // Adjust according to your exposed modules
      },
      shared: {
        lodash: { singleton: true },
        convnetjs: { singleton: true },
        jsts: { singleton: true, eager: true },
        '@types/jsts': { singleton: true },
        'digibyte-js': { singleton: true },
        browserify: { singleton: true },
      },
    }),
  ],
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        //exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    byDependency: {
      commonjs: { aliasFields: ['browser'] },
      url: { preferRelative: true },
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
