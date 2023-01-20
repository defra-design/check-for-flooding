/*
  nunjucks.js
  ===========
  Precompile nunjucks templates
*/

const gulp = require('gulp')
const concat = require('gulp-concat')
const nunjucks = require('gulp-nunjucks')
const path = require('path')

gulp.task('nunjucks', function () {
  return gulp.src(path.join('app/assets/templates/*.html'))
    .pipe(nunjucks.precompile())
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('app/assets/javascripts/build/'))
})
