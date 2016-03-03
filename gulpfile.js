/*eslint-env node*/
'use strict';

//Various Arguments that can used i.e. gulp {--verbose --prod --minhtml}:
//	--verbose = print out the files affected by each task
//	--prod = create concatenated versions of the js/css files and have the html reference those files
// 	--min = used in conjuction with the --prod argument to further minify those js/css files and have the html reference accordingly
//  --minhtml = minify the html

var nameJsIndexStart = 'bc-sdk-start';
var nameJsPopupStart = nameJsIndexStart + '-popup';
var nameJsBoldchat = 'boldchat';
var fs = require('fs');
var gulp = require('gulp');
var argv = require('yargs').argv;
var req = require('gulp-load-plugins')({lazy: true});	//lazy loads the gulp- plugins when invoked
var config = require('./gulpfile.config')();
var del = require('del');
var karma = require('karma').server;
var path = require('path');
var rmvEmptyDirs = require('remove-empty-directories');
var runSequence = require('run-sequence');
var mangle = true;
var beautify = false;

function log(msg) {
	if(typeof(msg) === 'object') {
		for(var i in msg) {
			if(msg.hasOwnProperty(i)) {
				req.util.log(req.util.colors.blue(msg[i]));
			}
		}
	} else {
		req.util.log(req.util.colors.blue(msg));
	}
}

function clean(path, cb) {
	log('Cleaning: ' + req.util.colors.blue(path));
	return del(path, cb);
}

//***** Begin Gulp Tasks *****//

gulp.task('clean', function(cb) {
	return clean(config.out_dest, cb);
});

gulp.task('clean-sass', function(cb) {
	return clean(config.css_dest, cb);
});

gulp.task('sass', ['clean-sass'], function() {
	log('Compiling SCSS and minifying css result');

	return gulp.src(config.css_src, {base: config.base})
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(req.if(argv.min, req.sourcemaps.init()))
		.pipe(req.sass({outputStyle: 'expanded'}))
		.pipe(req.if(!argv.min, gulp.dest(config.out_dest)))
		.pipe(req.if(argv.min, req.minifyCss()))
		.pipe(req.if(argv.min, req.rename({suffix: '.min'})))
		.pipe(req.if(argv.min, req.sourcemaps.write('./')))
		.pipe(req.if(argv.min, gulp.dest(config.out_dest)));
});

gulp.task('sass-dev', function() {
	gulp.src(config.css_src)
		.pipe(req.sass({outputStyle: 'expanded'}))
		.pipe(gulp.dest('./src/'));
});

gulp.task('clean-fonts', function(cb) {
	return clean(config.font_dest, cb);
});

gulp.task('fonts', function() {
	log('Copying font files');

	return gulp.src(config.font_src, {base: config.base})
		.pipe(req.newer(config.out_dest))
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(gulp.dest(config.out_dest));
});

gulp.task('clean-images', function(cb) {
	return clean(config.image_dest, cb);
});

gulp.task('images', function() {
	log('Copying and optimizing images');

	return gulp.src(config.image_src, {base: config.base})
		.pipe(req.newer(config.out_dest))
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(req.imagemin({optimizationLevel: 3}))
		.pipe(gulp.dest(config.out_dest));
});

gulp.task('clean-videos', function(cb) {
	return clean(config.video_dest, cb);
});

gulp.task('videos', function() {
	log('Copying and optimizing videos');

	return gulp.src(config.video_src, {base: config.base})
		.pipe(req.newer(config.out_dest))
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(gulp.dest(config.out_dest));
});

gulp.task('clean-recipes', function(cb) {
	return clean(config.recipe_dest, cb);
});

gulp.task('recipes', function() {
	log('Copying recipe files');

	return gulp.src(config.recipe_src, {base: config.base})
		.pipe(req.newer(config.out_dest))
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(gulp.dest(config.out_dest));
});

gulp.task('clean-start-js', function(cb) {
	var startJs = config.js_start_dest_src;
	startJs.push(config.js_dest + nameJsIndexStart + '*');
	startJs.push('!' + config.js_dest + nameJsPopupStart + '*');
	return clean(startJs, cb);
});

function getStartJsSource(fileType) {
	return gulp.src(fileType && fileType === 'popup' ? config.js_popup_start : config.js_start)
		.pipe(req.if(argv.verbose, req.print()));
}

gulp.task('minify-start-js', ['clean-start-js'], function() {
	log('Minifying, concatenating and uglifying start js files');

	if(argv.prod || argv.min) {
		return getStartJsSource()
			.pipe(req.if(argv.min, req.sourcemaps.init()))
			.pipe(req.concat(nameJsIndexStart + '.js'))
			.pipe(req.if(!argv.min, gulp.dest(config.js_dest)))
			.pipe(req.if(argv.min, req.uglify({mangle: mangle, output: {beautify: beautify}})))
			.pipe(req.if(argv.min, req.rename({suffix: '.min'})))
			.pipe(req.if(argv.min, req.sourcemaps.write('./')))
			.pipe(req.if(argv.min, gulp.dest(config.js_dest)));
	} else {
		return getStartJsSource()
			.pipe(gulp.dest(config.js_dest));
	}
});

gulp.task('clean-boldchat-js', function(cb) {
	var bcJs = config.js_bc_dest_src;
	bcJs.push(config.js_dest + nameJsBoldchat + '*');
	return clean(bcJs, cb);
});

function getBoldchatJsSource() {
	return gulp.src(config.js_bc)
		.pipe(req.if(argv.verbose, req.print()));
}

gulp.task('minify-boldchat-js', ['clean-boldchat-js'], function() {
	log('Minifying, concatenating and uglifying boldchat js files');

	if(argv.prod || argv.min) {
		return getBoldchatJsSource()
			.pipe(req.if(argv.min, req.sourcemaps.init()))
			.pipe(req.concat(nameJsBoldchat + '.js'))
			.pipe(req.if(!argv.min, gulp.dest(config.js_dest)))
			.pipe(req.if(argv.min, req.uglify({mangle: mangle, output: {beautify: beautify}})))
			.pipe(req.if(argv.min, req.rename({suffix: '.min'})))
			.pipe(req.if(argv.min, req.sourcemaps.write('./')))
			.pipe(req.if(argv.min, gulp.dest(config.js_dest)));
	} else {
		return getBoldchatJsSource()
			.pipe(gulp.dest(config.js_dest));
	}
});

gulp.task('clean-popup-js', function(cb) {
	var startPopupJs = config.js_popup_dest_src;
	startPopupJs.push(config.js_dest + nameJsPopupStart + '*');
	return clean(startPopupJs, cb);
});

gulp.task('minify-popup-js', ['clean-popup-js'], function() {
	log('Minifying, concatenating and uglifying popup js file');

	if(argv.prod || argv.min) {
		return getStartJsSource('popup')
			.pipe(req.if(argv.min, req.sourcemaps.init()))
			.pipe(req.concat(nameJsPopupStart + '.js'))
			.pipe(req.if(!argv.min, gulp.dest(config.js_dest)))
			.pipe(req.if(argv.min, req.uglify({mangle: mangle, output: {beautify: beautify}})))
			.pipe(req.if(argv.min, req.rename({suffix: '.min'})))
			.pipe(req.if(argv.min, req.sourcemaps.write('./')))
			.pipe(req.if(argv.min, gulp.dest(config.js_dest)));
	} else {
		return getStartJsSource('popup')
			.pipe(gulp.dest(config.js_dest));
	}
});

gulp.task('clean-theme-js', function(cb) {
	return clean(config.js_theme_dest + 'themes/**/*.js*', cb);
});

gulp.task('minify-theme-js', ['clean-theme-js'], function() {
	log('Minifying, concatenating and uglifying js files');

	return gulp.src(config.js_theme_src, {base: config.base})
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(req.if(argv.min, req.sourcemaps.init()))
		.pipe(req.if(!argv.min, gulp.dest(config.js_theme_dest)))
		.pipe(req.if(argv.min, req.uglify({mangle: mangle, output: {beautify: beautify}})))
		.pipe(req.if(argv.min, req.rename({suffix: '.min'})))
		.pipe(req.if(argv.min, req.sourcemaps.write('./')))
		.pipe(req.if(argv.min, gulp.dest(config.js_theme_dest)));
});

function getIndexBodyContent(templatePath) {
	var indexFileName = templatePath.replace('popup', 'index');
	log('Getting index file: ' + indexFileName);
	var indexContent = fs.readFileSync(indexFileName, 'utf8');
	var bodyContent = indexContent.substr(indexContent.indexOf('<div id="bc-chat">'));

	return {bodyContent: bodyContent};
}

gulp.task('clean-js-doc', function(cb) {
	return clean(config.doc_dest, cb);
});

gulp.task('js-doc', ['clean-js-doc'], function() {
	log('Creating JSDocs');

	return gulp.src(config.js_all)
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(req.jsdoc(config.doc_dest));
});

gulp.task('test', function(done) {
	karma.start({
		configFile: path.join(__dirname, '/karma.conf.js'),
		singleRun: true
	}, done);
});

gulp.task('nightwatch:chrome', function() {
	fs.mkdir('.logs', function() {
	});
	fs.mkdir('.reports', function() {
	});
	var stream = gulp.src('src')
		.pipe(req.webserver({
			port: 8888
		}))
		.pipe(req.nightwatch({
			configFile: 'ui-tests/nightwatch.json'
		}));
	stream.emit('kill');
	stream.pipe(req.exit());
});

gulp.task('webserver-dev', ['sass-dev'], function() {
	gulp.src('src')
		.pipe(req.webserver({port: 8888}));
});

gulp.task('webserver', ['clean', 'default'], function() {
	gulp.src('out')
		.pipe(req.webserver({port: 8888}));
});

gulp.task('clean-zips', function(cb) {
	return clean(config.out_dest + '**/*.zip', cb);
});

function getFolders(dir) {
	return fs.readdirSync(dir)
		.filter(function(folder) {
			if(folder === 'bubbles') {
				return false;
			}
			return fs.statSync(path.join(dir, folder)).isDirectory();
		});
}

gulp.task('zip-files', function() {
	log('Creating zip files');

	var folders = getFolders(config.theme_src);
	var zipSrc = config.zip_src;
	var zipSrcIniLen = zipSrc.length;
	folders.map(function(folder) {
		log('folder: ' + folder);
		if(zipSrc.length > zipSrcIniLen) {
			zipSrc[zipSrcIniLen] = config.out_dest + 'themes/' + folder + '/**/*.*';
		} else {
			zipSrc.push(config.out_dest + 'themes/' + folder + '/**/*.*');
		}

		return gulp.src(zipSrc, {base: config.out_dest})
			.pipe(req.if(argv.verbose, req.print()))
			.pipe(req.zip(folder + ((argv.prod) ? '_min' : '') + '.zip'))
			.pipe(gulp.dest(config.out_dest + 'themes/' + folder));
	});
});

function getJsStartSrc(fileType) {
	return getStartJsSource(fileType)
		.pipe(req.if(argv.prod || argv.min, req.concat((fileType === 'popup' ? nameJsPopupStart : nameJsIndexStart) + '.js')))
		.pipe(req.if(argv.min, req.rename({suffix: '.min'})));
}

function getJsBoldchatSrc() {
	return getBoldchatJsSource()
		.pipe(req.if(argv.prod || argv.min, req.concat(nameJsBoldchat + '.js')))
		.pipe(req.if(argv.min, req.rename({suffix: '.min'})));
}

function getThemeName(themePath) {
	var themeId = 'theme';
	var idxOfTheme = themePath.path.indexOf(themeId);
	var themeNameStart = idxOfTheme + themeId.length + 1;
	var themeNameEnd = themePath.path.indexOf(path.sep, themeNameStart + 1);
	return themePath.path.substr(themeNameStart + 1, themeNameEnd - themeNameStart - 1);
}

function getThemeSrc(path, fileSuffix, isProd, isMin, verbose) {
	var themeName = getThemeName(path);
	var src = config.out_dest + 'themes/' + themeName + '/**/*.' + fileSuffix;
	if(verbose) {
		log('Getting ' + themeName + ' ' + fileSuffix + ' files located at: ' + src);
	}
	return gulp.src(src, {read: isProd})	//if read is set to false then concat won't work
		.pipe(req.if(verbose, req.print(function(fp) {
			return 'Using file: ' + fp;
		})));
}

function getInjectStartOptions(addRootSlash, relative) {
	return {
		starttag: '<!-- inject:bcStart:{{ext}} -->',
		relative: relative || false,
		addRootSlash: addRootSlash || false,
		ignorePath: 'src/'
	};
}

function getInjectBoldChatOptions(addRootSlash, relative) {
	return {
		starttag: '<!-- inject:boldchat:{{ext}} -->',
		relative: relative || false,
		addRootSlash: addRootSlash || false,
		ignorePath: 'src/'
	};
}

function getInjectThemeOptions(addRootSlash, relative, prefix) {
	return {
		starttag: '<!-- inject:themeSpecific:{{ext}} -->',
		relative: relative || false,
		addRootSlash: addRootSlash || false,
		addPrefix: prefix,
		ignorePath: ['src/', 'out/']
	};
}

function injectFiles(fileType, addRootSlash, relative, themeSpecificRelative, prefix) {
	var startOptions = getInjectStartOptions(addRootSlash, relative);
	var boldchatOptions = getInjectBoldChatOptions(addRootSlash, relative);
	var themeOptions = getInjectThemeOptions(addRootSlash, typeof themeSpecificRelative === 'undefined' ? relative : themeSpecificRelative, prefix);

	var localProd = argv.prod;
	var localMin = argv.min;
	var verbose = argv.verbose;
	return gulp
		.src([config.src + '**/' + fileType + '.html', '!' + config.src + '/old/**'], {base: config.base})
		.pipe(req.inject(getJsStartSrc(fileType), startOptions))
		.pipe(req.inject(getJsBoldchatSrc(), boldchatOptions))
		.pipe(req.foreach(function(stream, file) {
			log('file: ' + file.path);
			return stream
				.pipe(req.if(fileType === 'popup', req.template(getIndexBodyContent(file.path))))
				.pipe(req.inject(getThemeSrc(file, 'js', localProd, localMin, verbose), themeOptions))
				.pipe(req.inject(getThemeSrc(file, 'css', localProd, localMin, verbose), themeOptions));
		}))
		.pipe(req.if(argv.minhtml, req.minifyHtml()))
		.pipe(gulp.dest(config.out_dest));
}

gulp.task('clean-index-html', function(cb) {
	return clean([config.out_dest + '**/*.html', '!' + config.out_dest + '**/popup.html'], cb);
});

gulp.task('inject-index-html', ['clean-index-html'], function() {
	log('Injecting JS and CSS for index files');

	return injectFiles('index', false, false);
});

gulp.task('clean-popup-html', function(cb) {
	return clean(config.out_dest + '**/popup.html', cb);
});

gulp.task('inject-popup-html', ['clean-popup-html'], function() {
	log('Injecting JS and CSS for popup files');

	return injectFiles('popup', false, true, false, '../..');
});

gulp.task('clean-build-files', ['clean-images', 'clean-fonts', 'clean-videos', 'clean-sass', 'clean-recipes', 'clean-boldchat-js', 'clean-popup-js', 'clean-start-js', 'clean-theme-js', 'clean-index-html', 'clean-popup-html'], function(cb) {
	rmvEmptyDirs(config.out_dest);
});

gulp.task('create-final-build', function() {
	log('Cleaning all remaining build files, leaving the zips only');

	gulp.src([config.root + 'package.json', config.root + 'gulpfile.*', config.root + 'Version.txt', config.root + 'BoldChat SDK Terms 7-9-14_dcc.pdf'])
		.pipe(req.newer(config.out_dest))
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(gulp.dest(config.out_dest));

	return gulp.src([config.src + '**/*.*', '!' + config.src + 'old/**/*.*', '!' + config.src + 'index*.html', '!' + config.src + 'themes/**/*.css{,.map}'])
		.pipe(req.newer(config.out_dest))
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(gulp.dest(config.out_dest + 'src/'));
});

gulp.task('integration', ['nightwatch:chrome']);

gulp.task('build-basics', ['fonts', 'images', 'videos', 'recipes']);
gulp.task('minify-all-js', ['minify-theme-js', 'minify-boldchat-js', 'minify-start-js', 'minify-popup-js']);
gulp.task('build-html-requirements', ['sass', 'minify-all-js']);
gulp.task('build-html-files', function(cb) {
	runSequence('build-html-requirements', ['inject-index-html', 'inject-popup-html'], cb);
});

gulp.task('default', ['build-basics', 'build-html-files']);