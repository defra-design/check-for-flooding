/*
  webpack.js
  ===========
  Runs webpack and copy compiled javascripts to public folder
*/

const gulp = require('gulp')
const webpack = require('webpack')
const webpackConfig = require('../webpack.config.js')

gulp.task('webpack', function () {
  return new Promise((resolve, reject) => {
    webpack(webpackConfig(), (err, stats) => {
      if (err) {
        return reject(err)
      }
      if (stats.hasErrors()) {
        return reject(new Error(stats.compilation.errors.join('\n')))
      }
      resolve()
    })
  })
})
