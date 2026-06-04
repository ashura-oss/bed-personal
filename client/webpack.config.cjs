const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const clientRoot = __dirname;

module.exports = {
  entry: path.resolve(clientRoot, "src/main.js"),
  output: {
    filename: "assets/[name].[contenthash].js",
    chunkFilename: "assets/[name].[contenthash].js",
    path: path.resolve(clientRoot, "dist"),
    clean: true,
    publicPath: ""
  },
  resolve: {
    extensions: [".js"],
    fullySpecified: false
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all"
    }
  },
  experiments: {
    asyncWebAssembly: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader"
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpe?g|gif|webp|ktx2|glb|gltf|mp3|wav|ogg)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/[name].[contenthash][ext]"
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(clientRoot, "public/index.html"),
      scriptLoading: "defer"
    })
  ],
  devServer: {
    host: "127.0.0.1",
    port: 5173,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.resolve(clientRoot, "public")
    },
    client: {
      overlay: true
    },
    proxy: [
      {
        context: [
          "/health",
          "/auth",
          "/users",
          "/characters",
          "/regions",
          "/quests",
          "/abilities",
          "/combos",
          "/adventures"
        ],
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      }
    ]
  }
};
