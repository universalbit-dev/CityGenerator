const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    // Ensure index.js (CSS + UI wiring) runs before main.ts to avoid FOUC/layout races
    entry: ['./src/js/index.js', './src/main.ts'],
    // Use production mode in CI for smaller builds; otherwise development for local debugging
    mode: process.env.CI ? 'production' : 'development',

    // Enable proper source maps for debugging (creates bundle.js.map)
    devtool: 'source-map',

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        publicPath: process.env.NODE_ENV === 'production' ? '/CityGenerator/' : '/',
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: {
            '@cityManagers': path.resolve(__dirname, 'src/js/cityManagers'),
            'lodash$': path.resolve(__dirname, 'src/js/lodash.js'),
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
            {
                test: /\.(png|jpg|jpeg|gif|svg|woff2?|eot|ttf)$/,
                type: 'asset/resource',
            },
        ],
    },

    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'CityGenerator',
            template: './src/html/index.html',
            filename: 'index.html',
            inject: 'body',
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
                'jdenticon': { singleton: true, eager: false, requiredVersion: false },
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

    optimization: {
        splitChunks: {
            chunks: 'async'
        }
    }
};
