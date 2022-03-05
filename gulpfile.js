'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const csso = require('gulp-csso');
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const gcmq = require('gulp-group-css-media-queries');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const webpack = require('webpack-stream');
const browserSync = require('browser-sync').create(); 
const del = require('del');

sass.compiler = require('node-sass');

gulp.task('sass', function () {
  return gulp.src('./src/assets/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(gcmq())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(csso())
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./src/assets/css'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('img', function () {
  return gulp.src('./src/assets/img/**/*')
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({quality: 75, progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
          plugins: [
              {removeViewBox: true},
              {cleanupIDs: false}
          ]
      })
  ]))
    .pipe(gulp.dest('./dist/assets/img'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('js', function () {
	return gulp 
  .src(['src/assets/js/**/*.js', '!src/assets/js/*.min.js'])
		.pipe(webpack({
			mode: 'production',
			performance: { hints: false },
			module: {
				rules: [
					{
						test: /\.(js)$/,
						exclude: /(node_modules)/,
						loader: 'babel-loader',
						query: {
							presets: ['@babel/env'],
							plugins: ['babel-plugin-root-import']
						}
					}
				]
			}
		})).on('error', function handleError() {
			this.emit('end')
		})
		.pipe(rename('app.min.js'))
		.pipe(gulp.dest('src/assets/js'))
		.pipe(browserSync.stream())
});

gulp.task("browser-sync", function () {
  browserSync.init({
    server: {
      baseDir: "src",
    },
    // notify:false,
    // tunnel: true,
  });
});

gulp.task('clean', async function () {
  return del.sync('./dist')
});

gulp.task('checkupdate', function () {
  gulp.watch('./src/assets/scss/**/*.scss', gulp.parallel('sass'));
  gulp.watch('./src/*.html').on('change', browserSync.reload);
  gulp.watch("./src/assets/img/**/*").on('change', browserSync.reload);
  gulp.watch(['src/assets/js/**/*.js', '!src/assets/js/*.min.js'],gulp.parallel('js'));
  });

gulp.task('prebuild',async function () {
  gulp.src('./src/assets/css/*.min.css').pipe(gulp.dest('./dist/assets/css'));
  gulp.src('./src/assets/fonts/**/*').pipe(gulp.dest('./dist/assets/fonts'));
  gulp.src('./src/assets/js/*.min.js').pipe(gulp.dest('./dist/assets/js'));
  gulp.src(['./src/*', '!./src/assets']).pipe(gulp.dest('./dist'));

});

gulp.task('watch', gulp.parallel('sass','js','checkupdate','browser-sync'));

gulp.task('build', gulp.series('clean', gulp.parallel('img', 'sass', 'js' ), 'prebuild'));


