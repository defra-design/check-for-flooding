/*
  nunjucks.js
  ===========
  Precompile nunjucks templates
*/

const gulp = require('gulp')
const concat = require('gulp-concat')
const nunjucks = require('gulp-nunjucks')
const path = require('path')

gulp.task('nunjucks', function (done) {
  gulp.src(path.join('app/assets/templates/*.html'))
    .pipe(nunjucks.precompile())
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('public/javascripts/'))
  done()
})
