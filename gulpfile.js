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
var runSequence = require('run-sequence');

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

//***** Begin Inject HTML Gulp Tasks *****//
function getStartJsSource(fileType) {
	return gulp.src(fileType && fileType === 'popup' ? config.js_popup_start : config.js_start)
		.pipe(req.if(argv.verbose, req.print()));
}

function getBoldchatJsSource() {
	return gulp.src(config.js_bc)
		.pipe(req.if(argv.verbose, req.print()));
}

function getIndexBodyContent(templatePath) {
	var indexFileName = templatePath.replace('popup', 'index');
	log('Getting index file: ' + indexFileName);
	var indexContent = fs.readFileSync(indexFileName, 'utf8');
	var bodyContent = indexContent.substr(indexContent.indexOf('<div id="bc-chat">'));
	// console.log('bodyContent', bodyContent);

	return {bodyContent: bodyContent};
}

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
	var src = config.dest_src + 'themes/' + themeName + '/**/*.' + fileSuffix;
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
		ignorePath: ['out/', 'src/']
	};
}

function injectFiles(fileType, addRootSlash, relative, themeSpecificRelative, prefix) {
	var startOptions = getInjectStartOptions(addRootSlash, relative);
	var boldchatOptions = getInjectBoldChatOptions(addRootSlash, relative);
	var themeOptions = getInjectThemeOptions(addRootSlash, typeof themeSpecificRelative === 'undefined' ? relative : themeSpecificRelative, prefix);
	console.log('themeOptions', themeOptions);

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
		.pipe(gulp.dest(config.dest_src));
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


//***** Begin Gulp Tasks *****//

gulp.task('clean', function(cb) {
	return clean(config.out_dest, cb);
});

gulp.task('scss', function() {
	log('Compiling SCSS and minifying css result if applicable');

	return gulp.src(config.dest_css_src)
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(req.if(argv.min, req.sourcemaps.init()))
		.pipe(req.sass({outputStyle: 'expanded'}))
		.pipe(req.if(!argv.min, gulp.dest(config.dest_src)))
		.pipe(req.if(argv.min, req.cleanCss()))
		.pipe(req.if(argv.min, req.rename({suffix: '.min'})))
		.pipe(req.if(argv.min, req.sourcemaps.write('./')))
		.pipe(req.if(argv.min, gulp.dest(config.dest_src)));
});

gulp.task('clean-js-doc', function(cb) {
	return clean(config.doc_dest, cb);
});

gulp.task('js-doc', ['clean-js-doc'], function(cb) {
	log('Creating JSDocs');

	return gulp.src(config.js_all)
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(req.jsdoc3(config.js_doc, cb));
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

gulp.task('webserver', ['create-final-build'], function() {
	gulp.src('out')
		.pipe(req.webserver({port: 8888}));
});

gulp.task('copy-source', function() {
	log('Copying src folder');

	return gulp.src(config.all_src, {base: config.base})
		.pipe(req.if(argv.verbose, req.print()))
		.pipe(gulp.dest(config.dest_src));
});

gulp.task('copy-root-files', function() {
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

gulp.task('create-final-build', function(cb) {
	runSequence('clean', 'copy-source', ['scss', 'copy-root-files'], cb);
});
