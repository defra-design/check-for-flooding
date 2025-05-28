/*
  copy-assets.js
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
    `${config.paths.nodeModules}/govuk-frontend/dist/govuk/all.mjs`
  ])
  .pipe(gulp.dest(config.paths.public))
})

gulp.task('copy-map-js', function () {
  return gulp.src([
    `${config.paths.nodeModules}/@defra/flood-map/dist/js/**`
  ])
  .pipe(gulp.dest(`${config.paths.public}/javascripts`))
})

gulp.task('copy-map-css', function () {
  return gulp.src([
    `${config.paths.nodeModules}/@defra/flood-map/dist/css/**`
  ])
  .pipe(gulp.dest(`${config.paths.public}/stylesheets`))
})
