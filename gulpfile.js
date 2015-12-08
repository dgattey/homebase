var gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    gsass       = require('gulp-sass'),
    watch       = require('gulp-watch'),
    minifyHtml  = require('gulp-minify-html'),
    concat      = require('gulp-concat'),
    uglify      = require('gulp-uglify'),
    csso        = require('gulp-csso'),
    del         = require('del'),
    replacer    = require('gulp-replace'),
    jshint      = require('gulp-jshint'),
    stylish     = require('jshint-stylish'),

    // Meta
    merge       = require('merge-stream'),
    addsrc      = require('gulp-add-src'),
    connect     = require('gulp-connect'),
    bump        = require('gulp-bump'),
    sort        = require('gulp-sort'),
    semver      = require('semver'),

    // Config
    cfg         = require('./build.config.js'),
    pkg         = require(cfg.pkg);

/////////////////////////////////////////////////////////////

// Other configuration - makes sure that vendor files work as globs
cfg.vendor.js = prefixVendor(cfg.vendor.js);
cfg.vendor.html = prefixVendor(cfg.vendor.html);
cfg.vendor.css = prefixVendor(cfg.vendor.css);

// Prefixes vendor files with their actual location
function prefixVendor(globArray) {
  var prefix = function(a){return cfg.vendor.src + '/**/' + a; };
  return globArray.map(prefix);
}

// Sets production status to true
function setPro() {
  cfg.production = true;
  gutil.log('Production status is true');
}

// Deletes build directory
function clean() {
  return del([cfg.build+'**/*', cfg.build]);
}

// Compiles vendor and app sass together into one file in build dir
function sass(){
  gulp.src(cfg.app.rootSass)
    .pipe(gsass({style: 'compressed'}))
    .on('error', function(err){
      gutil.log('\x1b[31msass error\x1b[39m:\n'+err.messageFormatted);
    })
    .pipe(cfg.production ? csso() : gutil.noop())
    .pipe(cfg.production ? concat(cfg.min.css) : gutil.noop())
    .pipe(gulp.dest(cfg.build+cfg.dest.css))
    .pipe(connect.reload());
  return gulp.src(cfg.vendor.css)
    .pipe(concat(cfg.min.vendorCSS))
    .pipe(gulp.dest(cfg.build+cfg.dest.css))
    .pipe(connect.reload());
}

// Copies js files into build dir
function js(){
  return gulp.src(cfg.app.js)
    .pipe(cfg.production ? gutil.noop() : jshint())
    .pipe(cfg.production ? gutil.noop() : jshint.reporter(stylish))
    .pipe(cfg.production ? uglify() : gutil.noop())
    .pipe(cfg.production ? concat(cfg.min.js) : gutil.noop())
    .pipe(gulp.dest(cfg.build+cfg.dest.js))
    .pipe(connect.reload());
}

// Copies vendor js files into build dir
function vendorJS(){
  return gulp.src(cfg.vendor.js)
    .pipe(cfg.production ? concat(cfg.min.vendorJS) : gutil.noop())
    .pipe(gulp.dest(cfg.build+cfg.dest.js))
    .pipe(connect.reload());
}

// Copies vendor HTML into build dir
function vendorHTML(){
  return gulp.src(cfg.vendor.html)
    .pipe(gulp.dest(cfg.build+cfg.dest.html))
    .pipe(connect.reload());
}

// Copies assets into build dir
function assets() {
  return gulp.src(cfg.app.assets)
    .pipe(gulp.dest(cfg.build+cfg.dest.assets))
    .pipe(connect.reload());
}

// Copies vendor fonts into build dir
function fonts() {
  return gulp.src(cfg.vendor.fonts)
    .pipe(gulp.dest(cfg.build+cfg.dest.fonts))
    .pipe(connect.reload());
}

// Injects js and css files into the root HTML file
function html() {
  var js = gulp.src(cfg.compiled.js, {read: false, root: cfg.build});
  var css = gulp.src(cfg.compiled.css, {read: false, root: cfg.build});
  var combo = merge(js, css)
    .pipe(addsrc.append(cfg.build+'/**/'+cfg.dest.html+'/**/*'))
    .pipe(addsrc.append(cfg.build+'/**/'+cfg.min.vendorJS))
    .pipe(addsrc.append(cfg.build+'/**/'+cfg.min.vendorCSS))
    .pipe(sort({
        // Makes sure app.js appears at the very end
        comparator: function(file1, file2) {
            // Make sure app is last
            if (file1.path.indexOf('app.js') > -1) {
                return 1;
            }
            if (file2.path.indexOf('app.js') > -1) {
                return -1;
            }

            // Make sure main leapjs is first
            if (file1.path.indexOf('leapjs/') > -1) {
                return -1;
            }
            if (file2.path.indexOf('leapjs/') > -1) {
                return 1;
            }
            return 0;
        }
    }));
  return gulp.src(cfg.app.rootHtml)
    .pipe(cfg.production ? minifyHtml({
        empty: true,
        spare: true,
        quotes: true
    }) : gutil.noop())
    .pipe(gulp.dest(cfg.build))
    .pipe(connect.reload());
}

// Bumps the version numbers in bower and package JSON files
// Requires type, one of patch, minor, or major
function doBump(type){

  // Determines type of bump
  var v = pkg.version;
  if (!type) {
    var dot = v.indexOf('.');
    var major = parseInt(v.slice(0, dot));
    var minor = parseInt(v.slice(dot+1).slice(0, dot));
    var patch = parseInt(v.slice(dot+1).slice(dot+1));
    var type = patch<=10 ? 'patch' : minor<=10 ? 'minor' : 'major';
  }

  var newVer = semver.inc(v);
  return gulp.src([cfg.bower, cfg.pkg])
    .pipe(bump({version: newVer, type: type}))
    .pipe(gulp.dest('.'));
}


// Used in watch - prints that watch is running the function
function go(name, func) {
  gutil.log('Watch triggered for \''+gutil.colors.green(name)+'\'');
  func();
}

// Used in watch - quits with strong message
function quit() {
  var message = 'Exiting Gulp: metafile (gulpfile or config) was changed';
  gutil.log(gutil.colors.red(message));
  process.exit(1);
}

// Tasks
gulp.task('production', setPro);
gulp.task('clean', clean);
gulp.task('sass', ['clean', 'vendorJS', 'vendorHTML'], sass);
gulp.task('js', ['clean', 'vendorJS', 'vendorHTML'], js);
gulp.task('vendorJS', ['clean'], vendorJS);
gulp.task('vendorHTML', ['clean'], vendorHTML);
gulp.task('assets', ['clean', 'vendorJS', 'vendorHTML'], assets);
gulp.task('html', ['vendorJS', 'vendorHTML', 'js', 'sass', 'assets'], html);
gulp.task('watch', ['build'], function () {
  connect.server({
    root: cfg.build,
    livereload: true,
    port: 8888
  });
  watch(cfg.app.sass, function(){go('sass', sass);});
  watch(cfg.app.js, function(){go('js', js);});
  watch(cfg.app.rootHtml, function(){go('html', html);});
  watch(cfg.app.assets, function(){go('assets', assets);});
  watch(cfg.config, quit);
});

// Versioning
gulp.task('bump', doBump);
gulp.task('bump-patch', function(){ return doBump('patch'); });
gulp.task('bump-minor', function(){ return doBump('minor'); });
gulp.task('bump-major', function(){ return doBump('major'); });

// Metatasks
gulp.task('build', ['clean', 'html']);
gulp.task('dev', ['build', 'watch']);
gulp.task('dist', ['production', 'build']);
gulp.task('default', ['dev']);
