import { src, dest, watch, parallel, series } from 'gulp';
import sass from 'gulp-sass';
import * as sassCompiler from 'sass';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import browserSync from 'browser-sync';
import autoprefixer from 'gulp-autoprefixer';
import clean from 'gulp-clean';
import webp from 'gulp-webp';
import imagemin from 'gulp-imagemin';
import newer from 'gulp-newer';
import avif from 'gulp-avif';
import ttf2woff2 from 'gulp-ttf2woff2';
import svgSprite from 'gulp-svg-sprite';
import include from 'gulp-include';
import cleanCSS from 'gulp-clean-css';

const scss = sass(sassCompiler);

function pages() {
  return src('app/pages/*.html')
    .pipe(include({
      includePaths: 'app/components'
    }))
    .pipe(dest('app'))
    .pipe(browserSync.stream())
}


function fonts() {
  return src('app/fonts/src/*.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('app/fonts'));
}


function images() {
  // Обрабатываем все изображения (кроме SVG) и конвертируем в WebP
  src(['app/images/src/*.*', '!app/images/src/*.svg'], { encoding: false })
    .pipe(newer('app/images'))
    .pipe(webp())
    .pipe(dest('app/images'));

  // Обрабатываем все изображения (кроме SVG) и конвертируем в AVIF
  src(['app/images/src/*.*', '!app/images/src/*.svg'], { encoding: false })
    .pipe(newer('app/images'))
    .pipe(avif({ quality: 50 }))
    .pipe(dest('app/images'));

  // Обрабатываем все изображения (включая SVG) с использованием imagemin
  return src('app/images/src/*.*', { encoding: false })
    .pipe(newer('app/images'))
    .pipe(imagemin())
    .pipe(dest('app/images'));
}


function sprite() {
  return src('app/images/*.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: '../sprite.svg',
          example: true
        }
      }
    }))
    .pipe(dest('app/images'))
}


function scripts() {
  return src([
    'app/js/main.js',
  ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}


function styles() {
  return src('app/scss/main.scss')
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 version'] }))
    .pipe(concat('style.min.css'))
    .pipe(scss())
    .pipe(cleanCSS())
    .pipe(dest('app/css'))
    .pipe(browserSync.stream());
}


function watching() {
  browserSync.init({
    server: {
      baseDir: "app/"
    }
  });
  watch(['app/scss/**/*.scss'], styles)
  watch(['app/images/src'], images)
  watch(['app/js/main.js'], scripts)
  watch(['app/components/*', 'app/pages/*'], pages)
  watch(['app/*.html']).on('change', browserSync.reload);
}


function cleanDist() {
  return src('dist')
    .pipe(clean())
}


function building() {
  return src([
    'app/css/style.min.css',
    '!app/images/**/*.html',
    'app/images/*.*',
    '!app/images/*.svg',
    'app/images/sprite.svg',
    'app/fonts/*.*',
    'app/js/main.min.js',
    'app/**/*.html'
  ], { base: 'app' })
    .pipe(dest('dist'))
}


export { styles, images, fonts, pages, building, sprite, scripts, watching };
export const build = series(cleanDist, building);
export default parallel(styles, images, scripts, pages, watching);
