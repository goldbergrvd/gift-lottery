var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('clean', () => {
  del('dist');
});

gulp.task('move-and-babelify-js', () => {
  gulp.src('src/*.js')
      .pipe(babel({
        presets: ['es2015']
      }))
//      .pipe(uglify())
      .pipe(gulp.dest('dist/js'));
});

gulp.task('move-html', () => {
  gulp.src('src/*.html')
      .pipe(gulp.dest('dist'));
});

gulp.task('browserify-main', ['move-and-babelify-js', 'move-html'], () => {
  browserify({ entries: ["./dist/js/main.js"] })
    .bundle()
    .pipe(source('main.js'))
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('watch', function() {
  gulp.watch(['src/*.js', 'src/*.html'], ['browserify-main']);
});
