const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { SRC, UI, BUILD, PORT } = require('./constants');

module.exports = {
    target: 'web',
    mode: 'development',
    devtool: 'source-map',
    entry: {
        indexUI: [`${UI}/index.ts`],
        index: [`${SRC}/index.ts`],
    },
    output: {
        filename: '[name].js',
        path: BUILD,
    },
    stats: {
        children: true,
    },
    devServer: {
        static: {
            directory: UI,
        },
        hot: false,
        https: false,
        port: PORT,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: { configFile: 'tsconfig.lib.json' },
                },
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        fallback: {},
    },
    performance: {
        hints: false,
    },
    plugins: [
        new HtmlWebpackPlugin({
            // chunks: ['indexUI'],
            template: `${UI}/index.html`,
            filename: 'index.html',
            // inject: true,
        }),
    ],
    optimization: {
        emitOnErrors: true,
        moduleIds: 'named',
    },
};
