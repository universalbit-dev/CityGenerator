const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  entry: ['./src/index.ts', './src/js/deepqlearn.js', './src/js/convnet.js', './digibyte.js','./dist/bundle.js'],
  mode: 'development',
  plugins: [
    new ModuleFederationPlugin({
      name: 'fabcity',
      filename: 'remoteEntry.js',
      exposes: {'./Module': './src/index',},

      shared: {
        lodash: { singleton: true },
        convnetjs: { singleton: true },
        '@types/jsts': { singleton: true, eager: true },
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
    extensions: ['.tsx', '.ts', '.js' ,'.json','.d.ts','.dt.ts'],
    byDependency: {
      commonjs: { aliasFields: ['browser'] },
      url: { preferRelative: true },
    },
  },
  output: {
    filename: 'web3.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
