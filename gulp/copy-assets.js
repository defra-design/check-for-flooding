/*
  copy.js
  ===========
  copies images and javascript folders to public
*/

const gulp = require('gulp')

const config = require('./config.json')

gulp.task('copy-assets', function () {
  return gulp.src([
    `${config.paths.assets}/**`,
    `!${config.paths.assets}/sass/**`,
    `!${config.paths.assets}/javascripts/**`,
    `!${config.paths.assets}/templates/**`,
    `${config.paths.nodeModules}/govuk-frontend/govuk/all.js`
  ])
    .pipe(gulp.dest(config.paths.public))
})
