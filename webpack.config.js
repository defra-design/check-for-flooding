const path = require('path')
const webpack = require('webpack')
const dotenv = require('dotenv')

dotenv.config({ path: './.env' })
const nodeEnv = process.env.NODE_ENV
const nrwUrl = process.env.NRW_URL
const inDev = nodeEnv === 'dev' || nodeEnv === 'development'

module.exports = (env, argv) => ({
  mode: !inDev ? 'production' : 'development',
  devtool: !inDev ? false : 'source-map',
  entry: {
    core: './app/assets/javascripts/core',
    webchat: './app/assets/javascripts/webchat',
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
        include: mPath => mPath.indexOf('app/assets') > -1 ||
          mPath.indexOf('node_modules/d3') > -1 ||
          mPath.indexOf('node_modules/internmap') > -1 ||
          mPath.indexOf('node_modules/ol') > -1,
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
        BING_API_KEY: JSON.stringify(process.env.BING_API_KEY),
        OS_API_KEY: JSON.stringify(process.env.OS_API_KEY),
        CXONE_BRANDID: JSON.stringify(process.env.CXONE_BRANDID),
        CXONE_CHANNELID: JSON.stringify(process.env.CXONE_CHANNELID),
        CXONE_ENVIRONMENT_NAME: JSON.stringify(process.env.CXONE_ENVIRONMENT_NAME)
      }
    }),
    new webpack.NormalModuleReplacementPlugin(
      /node_modules\/ol\/worker\/webgl\.js/, '../../../app/assets/javascripts/ol-worker-webgl-ie11.js'
    )
  ],
  target: ['web', 'es5']
})
