import path from "path";
import { Configuration } from "webpack";
import nodeExternals from "webpack-node-externals";
// Reemplazar import ES por require para plugin sin tipos completos
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config: Configuration[] = [
  // Node 
  {
    entry: "./src/index.ts",
    mode: "production",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    target: "node",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "magicfeedback-sdk.node.js",
      library: {
        name: "magicfeedback",
        type: "umd",
        export: "default",
      },
    },
    externals: [nodeExternals()],
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: path.resolve(__dirname, 'src/styles'), to: path.resolve(__dirname, 'dist/styles') }
        ]
      })
    ]
  },
  // Web
  {
    entry: "./src/index.ts",
    mode: "production",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    target: "web",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "magicfeedback-sdk.browser.js",
      library: {
        name: "magicfeedback",
        type: "umd",
        export: "default",
      },
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: path.resolve(__dirname, 'src/styles'), to: path.resolve(__dirname, 'dist/styles') }
        ]
      })
    ]
  },
];

export default config;