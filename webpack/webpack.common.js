const webpack = require('webpack');
const commonPaths = require('./paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin');
var FlowtypePlugin = require('flowtype-loader/plugin');
const FlowWebpackPlugin = require('flow-webpack-plugin')
const path = require('path');

module.exports = {
  entry: commonPaths.entryPath,
  module: {
    rules: [
      // {
      //   enforce: 'pre',
      //   test: /\.(js|jsx)$/,
      //   loader: 'eslint-loader',
      //   exclude: /(node_modules)/,
      //   options: {
      //     emitWarning: process.env.NODE_ENV !== 'production',
      //   },
      // },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /(node_modules)/,
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: commonPaths.imagesFolder,
            },
          },
        ],
      },
      {
        test: /\.(woff2|ttf|woff|eot)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: commonPaths.fontsFolder,
            },
          },
        ],
      },
      {
        test: /\.(md)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: commonPaths.mdFolder,
            },
          },
        ],  
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    //new FlowBabelWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: commonPaths.templatePath,
      favicon: path.resolve(__dirname, '../', 'public/favicon.ico')
    }),
  ],
};
