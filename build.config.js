/**
 * This file/module contains all configuration for the build process.
 */
module.exports = {
  build: 'build/',
  config: './*.js',

  // JSON config files
  pkg: './package.json',
  bower: './bower.json',

  // File patterns for app code
  app: {
    js: ['src/**/*.js', '!src/assets/**/*.js'],
    assets: ['src/assets/**/*.*'],
    rootHtml: 'src/index.html',
    sass: ['src/**/*.scss'],
    rootSass: 'src/app.scss'
  },

  // Folders to build into
  dest: {
    js: 'js/',
    css: 'css/',
    assets: 'assets/',
    fonts: 'fonts/',
    html: 'includes/'
  },

  // The minimized versions of files
  min: {
    js: 'app.min.js',
    css: 'app.min.css',
    vendorCSS: 'vendor.css',
    vendorJS: 'vendor.js'
  },

  // The files as they exist in the build dir (all globs)
  compiled: {
    js: ['/**/*.js', '!/**/vendor.js'],
    css: ['/**/*.css', '!/**/vendor.css']
  },

  // Vendor code for build process (Angular + Bootstrap + more)
  vendor: {
    src: 'bower_components',
    html: [
    ],
    js: [
      'leapjs/leap-*.min.js',
      'leapjs-plugins/**/leap-plugins-*.min.js',
      'fabric.js/**/fabric.min.js',
      'spotify-web-api-js/**/spotify-web-api.js'
    ],
    css:[
    ]
  }
};
