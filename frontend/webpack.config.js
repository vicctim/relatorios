const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

// Suprimir erros do Watchpack relacionados a mounts inacessíveis no WSL
if (isDevelopment) {
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, encoding, fd) => {
    if (chunk && typeof chunk === 'string') {
      if (
        chunk.includes('Watchpack Error') ||
        chunk.includes('ENODEV: no such device') ||
        chunk.includes('/mnt/g') ||
        (chunk.includes('/mnt/') && !chunk.includes('/mnt/v/') && chunk.includes('lstat'))
      ) {
        // Silenciar esses erros
        return true;
      }
    }
    return originalStderrWrite(chunk, encoding, fd);
  };

  // Também interceptar console.error
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('Watchpack Error') ||
      message.includes('ENODEV: no such device') ||
      message.includes('/mnt/g') ||
      (message.includes('/mnt/') && !message.includes('/mnt/v/') && message.includes('lstat'))
    ) {
      // Silenciar esses erros
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Plugin para suprimir erros do Watchpack relacionados a mounts inacessíveis no WSL
class SuppressWatchpackErrorsPlugin {
  apply(compiler) {
    compiler.hooks.afterCompile.tap('SuppressWatchpackErrorsPlugin', (compilation) => {
      // Interceptar warnings e erros
      compilation.hooks.processAssets.tap(
        {
          name: 'SuppressWatchpackErrorsPlugin',
          stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        () => {
          // Filtrar warnings relacionados ao Watchpack
          if (compilation.warnings) {
            compilation.warnings = compilation.warnings.filter((warning) => {
              if (warning && warning.message) {
                const message = warning.message.toString();
                return !(
                  message.includes('Watchpack Error') ||
                  message.includes('ENODEV') ||
                  message.includes('no such device') ||
                  message.includes('/mnt/g') ||
                  (message.includes('/mnt/') && !message.includes('/mnt/v/'))
                );
              }
              return true;
            });
          }
        }
      );
    });

    // Interceptar erros do processo
    if (compiler.hooks.infrastructureLog) {
      compiler.hooks.infrastructureLog.tap('SuppressWatchpackErrorsPlugin', (name, type, args) => {
        if (type === 'error' && args && args.length > 0) {
          const message = args[0]?.toString() || '';
          if (
            message.includes('Watchpack Error') ||
            message.includes('ENODEV') ||
            message.includes('no such device') ||
            message.includes('/mnt/g') ||
            (message.includes('/mnt/') && !message.includes('/mnt/v/'))
          ) {
            // Suprimir este erro
            return false;
          }
        }
        return true;
      });
    }
  }
}

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/main.tsx',
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  ignoreWarnings: [
    {
      module: /node_modules\/react-datepicker/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
    // Ignorar erros do Watchpack relacionados a caminhos inacessíveis no WSL
    (warning) => {
      // Ignorar todos os erros do Watchpack relacionados a ENODEV
      if (warning.message && typeof warning.message === 'string') {
        if (
          warning.message.includes('Watchpack Error') ||
          warning.message.includes('ENODEV') ||
          warning.message.includes('no such device') ||
          warning.message.includes('/mnt/g') ||
          warning.message.includes('/mnt/') && !warning.message.includes('/mnt/v/')
        ) {
          return true;
        }
      }
      return false;
    },
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            envName: isDevelopment ? 'development' : 'production',
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.SHARE_URL': JSON.stringify(process.env.SHARE_URL || ''),
    }),
    isDevelopment && new ReactRefreshWebpackPlugin(),
    isDevelopment && new SuppressWatchpackErrorsPlugin(),
  ].filter(Boolean),
  // WSL2 compatibility - watchOptions at root level
  watchOptions: {
    poll: 1000, // Check for changes every second
    aggregateTimeout: 300, // Delay before rebuilding
    ignored: [
      '**/node_modules/**',
      // Ignorar mounts do Windows que podem não existir (glob patterns)
      '**/mnt/[a-f]/**', // Ignora /mnt/a até /mnt/f
      '**/mnt/g/**',     // Ignora /mnt/g especificamente
      '**/mnt/h/**',     // Ignora /mnt/h
      '**/mnt/i/**',     // Ignora /mnt/i
      '**/mnt/j/**',     // Ignora /mnt/j
      '**/mnt/k/**',     // Ignora /mnt/k
      '**/mnt/l/**',     // Ignora /mnt/l
      '**/mnt/m/**',     // Ignora /mnt/m
      '**/mnt/n/**',     // Ignora /mnt/n
      '**/mnt/o/**',     // Ignora /mnt/o
      '**/mnt/p/**',     // Ignora /mnt/p
      '**/mnt/q/**',     // Ignora /mnt/q
      '**/mnt/r/**',     // Ignora /mnt/r
      '**/mnt/s/**',     // Ignora /mnt/s
      '**/mnt/t/**',     // Ignora /mnt/t
      '**/mnt/u/**',     // Ignora /mnt/u
      '**/mnt/w/**',     // Ignora /mnt/w
      '**/mnt/x/**',     // Ignora /mnt/x
      '**/mnt/y/**',     // Ignora /mnt/y
      '**/mnt/z/**',     // Ignora /mnt/z
      // Ignorar outros caminhos problemáticos
      '**/tmp/**',
      '**/proc/**',
      '**/sys/**',
    ],
    // Ignorar erros de caminhos inacessíveis
    followSymlinks: false,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    hot: true,
    liveReload: true,
    historyApiFallback: true,
    // Allow connections from any host (important for WSL)
    allowedHosts: 'all',
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        usePolling: true, // Essential for WSL
        ignored: [
          '**/node_modules/**',
          // Ignorar mounts do Windows que podem não existir (glob patterns)
          '**/mnt/[a-f]/**',
          '**/mnt/g/**',
          '**/mnt/h/**',
          '**/mnt/i/**',
          '**/mnt/j/**',
          '**/mnt/k/**',
          '**/mnt/l/**',
          '**/mnt/m/**',
          '**/mnt/n/**',
          '**/mnt/o/**',
          '**/mnt/p/**',
          '**/mnt/q/**',
          '**/mnt/r/**',
          '**/mnt/s/**',
          '**/mnt/t/**',
          '**/mnt/u/**',
          '**/mnt/w/**',
          '**/mnt/x/**',
          '**/mnt/y/**',
          '**/mnt/z/**',
        ],
      },
    },
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/',
  },
};
