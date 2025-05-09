const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
module.exports = {
  entry: [
    './src/main.ts',
    './src/index.ts',
    './src/js/deepqlearn.js',
    './src/js/convnet.js',
    './src/js/vis.js',  
    './digibyte.js',
    './src/ts/model_generator.ts',
    './src/ts/util.ts',
    './src/ts/vector.ts',
    './src/ts/impl/basis_field.ts',
    './src/ts/impl/graph.ts',
    './src/ts/impl/grid_storage.ts',
    './src/ts/impl/integrator.ts',
    './src/ts/impl/polygon_finder.ts',
    './src/ts/impl/polygon_util.ts',
    './src/ts/impl/streamlines.ts',
    './src/ts/impl/tensor.ts',
    './src/ts/impl/tensor_field.ts',
    './src/ts/impl/water_generator.ts',
    './src/ts/ui/buildings.ts',
    './src/ts/ui/canvas_wrapper.ts',
    './src/ts/ui/domain_controller.ts',
    './src/ts/ui/drag_controller.ts',
    './src/ts/ui/main_gui.ts',
    './src/ts/ui/road_gui.ts',
    './src/ts/ui/style.ts',
    './src/ts/ui/tensor_field_gui.ts',
    './src/ts/ui/water_gui.ts',
    './geodesic_dome/geodesicDome.ts',
    './src/bundle.js'
  ],
  mode: 'development',
  plugins: [
    new CleanWebpackPlugin(),
    new ModuleFederationPlugin({
      name: 'fabcity',
      filename: 'remoteEntry.js',
      exposes: {'./Module': './src/index',},

      shared: {
        'underscore': { singleton: true },
        'jszip':{singleton: true, eager: true},
        'cities.json':{singleton: true, eager: true},
        'convnetjs': { singleton: true },
        '@types/jsts': { singleton: true, eager: true },
        'digibyte-js': { singleton: true },
        'browserify': { singleton: true },
      },
    }),
    new HtmlWebpackPlugin({
      title: 'CityGenerator',
      template: './src/html/index.html', // Path to your HTML template file
      filename: 'index.html', // Output file name
    }),
  ],
  devtool: 'inline-source-map',
  
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
    }
  ]
},

  resolve: {
    extensions: ['.ts', '.js' ,'.json','.d.ts','.dt.ts'],
    byDependency: {
      commonjs: { aliasFields: ['browser'] },
      url: { preferRelative: true },
    },
     
  },
 
  output: {
  filename: 'bundle.js',
  path: path.resolve(__dirname, 'dist'),
  clean: true // Cleans the output directory before emit
  },
};
