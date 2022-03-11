const path = require('path');
const webpack = require('webpack'); //to access built-in plugins

module.exports = {
  mode: "production",
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: "bluegenesTmCytoscape",
    libraryTarget: "var"
  },
  optimization: {
    minimize: true
  },
  module: {
    rules: [
      {
        test: /.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.html$/,
        use: ["raw-loader"]
      }
    ]
  }
};
