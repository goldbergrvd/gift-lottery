var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var del = require('del');

gulp.task('clean', () => {
  return del(['dist']);
});

gulp.task('babelify-main', ['clean'], () => {
  return gulp.src('src/public/js/**/*.js')
             .pipe(babel({
               presets: ['es2015'],
               ignore: 'src/public/js/lib/*.*'
             }))
//             .pipe(uglify())
             .pipe(gulp.dest('dist/public/js'));
});

gulp.task('frontend-lib', ['clean'], () => {
  return gulp.src('src/public/js/lib/*')
             .pipe(gulp.dest('dist/public/js/lib'));
});

gulp.task('backend-js', ['clean'], () => {
  return gulp.src('src/index.js')
             .pipe(gulp.dest('dist'));
});

gulp.task('html', ['clean'], () => {
  return gulp.src('src/public/*.html')
             .pipe(gulp.dest('dist/public'));
});

gulp.task('browserify-main', ['babelify-main'], () => {
  browserify({ entries: ["dist/public/js/main.js"] })
    .bundle()
    .pipe(source('main.js'))
    .pipe(gulp.dest('dist/public/js'));
});

gulp.task('build', ['browserify-main', 'frontend-lib', 'backend-js', 'html']);

gulp.task('watch', function() {
  gulp.watch(['src/**/*'], ['build']);
});
