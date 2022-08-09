const path = require('path')
const webpack = require('webpack')
const dotenv = require('dotenv')

dotenv.config({ path: './.env' })
const nodeEnv = process.env.NODE_ENV
const nrwUrl = process.env.NRW_URL
const bingApiKey = process.env.BING_API_KEY
const inDev = nodeEnv === 'dev' || nodeEnv === 'development'

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
        include: mPath => mPath.indexOf('app/assets') > -1 || mPath.indexOf('node_modules/d3') > -1 || mPath.indexOf('node_modules/internmap') > -1 || mPath.indexOf('node_modules/ol') > -1,
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
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NRW_URL: JSON.stringify(nrwUrl),
        BING_API_KEY: JSON.stringify(bingApiKey)
      }
    })
  ],
  target: ['web', 'es5']
})
