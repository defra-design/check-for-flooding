const path = require('path')
const env = process.env.NODE_ENV
const inDev = env === 'dev' || env === 'development'

module.exports = (env, argv) => ({
  mode: !inDev ? 'production' : 'development',
  devtool: !inDev ? false : 'source-map',
  entry: {
    core: './app/assets/javascripts/core',
    levels: './app/assets/javascripts/pages/levels',
    warnings: './app/assets/javascripts/pages/warnings',
    'target-area': './app/assets/javascripts/pages/target-area',
    location: './app/assets/javascripts/pages/location',
    national: './app/assets/javascripts/pages/national',
    station: './app/assets/javascripts/pages/station',
    rainfall: './app/assets/javascripts/pages/rainfall'
  },
  output: {
    path: path.resolve(__dirname, 'public/javascripts')
  },
  module: {
    rules: [
      {
        // Default exclude removes all node_modules but d3 is now distributed es6 so include d3 (& our own src) in transpile
        include: mPath => mPath.indexOf('app/assets') > -1 || mPath.indexOf('node_modules/d3') > -1 || mPath.indexOf('node_modules/ol') > -1,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3
                }
              ]
            ]
          }
        }
      }
    ]
  },
  target: ['web', 'es5']
})
