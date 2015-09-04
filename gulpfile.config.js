module.exports = function() {
	'use strict';

	var ROOT_START = './';
	var DEST_START = './out/';
	var SRC_START = './src/';
	var JS_BASE = SRC_START + 'scripts/';

	var JS_BC_UTIL = 'bc-util.js';
	var JS_BC_CONFIG = 'bc-config.js';
	var JS_BC_SDK = 'bc-sdk-start.js';
	var JS_BC_POPUP = 'bc-popup.js';

	// all js to vet
	var config = {
		base: 'src'
		, css_src: [SRC_START + '/scss/*.scss', SRC_START + '/themes/**/*.scss']
		, css_dest: [DEST_START + '**/css/*.css*', DEST_START + '**/themes/**/*.css*']
		, doc_dest: './doc'
		, font_src: SRC_START + '**/fonts/**/*.*'
		, font_dest: DEST_START + '**/fonts/**/*.*'
		, image_src: SRC_START + '**/images/**/*.*'
		, image_dest: DEST_START + '**/images/**/*.*'
		, js_all: [JS_BASE + '**/*.js', '!**/test*', '!**/*.test.js*']
		, js_theme_src: SRC_START + 'themes/**/*.js'
		, js_theme_dest: DEST_START
		, js_bc_dest_src: [DEST_START + '**/*.js', '!' + JS_BC_CONFIG, '!' + DEST_START + 'scripts/' + JS_BC_UTIL, '!' + DEST_START + 'scripts/' + JS_BC_SDK, '!' + DEST_START + 'scripts/' + JS_BC_POPUP, '!' + DEST_START + 'scripts/' + JS_BC_UTIL, '!' + DEST_START + 'scripts/' + JS_BC_CONFIG, '!' + DEST_START + 'scripts/' + JS_BC_SDK]
		, js_bc: [JS_BASE + '**/*.js', '!' + JS_BASE + JS_BC_CONFIG, '!' + JS_BASE + JS_BC_UTIL, '!' + JS_BASE + JS_BC_SDK, '!' + JS_BASE + JS_BC_POPUP, '!**/test.js*', '!**/*.test.js*']
		, js_start_dest_src: [DEST_START + 'scripts/' + JS_BC_UTIL, DEST_START + 'scripts/' + JS_BC_CONFIG, DEST_START + 'scripts/' + JS_BC_SDK]
		, js_start: [JS_BASE + JS_BC_UTIL, JS_BASE + JS_BC_CONFIG, JS_BASE + JS_BC_SDK]
		, js_dest: DEST_START + 'scripts/'
		, js_popup_dest_src: [DEST_START + 'scripts/' + JS_BC_UTIL, DEST_START + 'scripts/' + JS_BC_CONFIG, DEST_START + 'scripts/' + JS_BC_SDK, DEST_START + 'scripts/' + JS_BC_POPUP]
		, js_popup_start: [JS_BASE + JS_BC_UTIL, JS_BASE + JS_BC_CONFIG, JS_BASE + JS_BC_SDK, JS_BASE + JS_BC_POPUP]
		, out_dest: DEST_START
		, recipe_src: [SRC_START + 'recipes/**/*.*', SRC_START + '**/recipes/**/*.*']
		, recipe_dest: [DEST_START+ 'recipes/**/*.*', DEST_START + '**/recipes/**/*.*']
		, root: ROOT_START
		, src: SRC_START
		, theme_src: SRC_START + 'themes/'
		, video_src: [SRC_START + 'videos/**/*.*', SRC_START + '**/videos/**/*.*']
		, video_dest: [DEST_START+ 'videos/**/*.*', DEST_START + '**/videos/**/*.*']
		, zip_src: [DEST_START + 'index.html', DEST_START + 'fonts/**/*.*', DEST_START + 'videos/**/*.*', DEST_START + 'images/**/*.*', DEST_START + 'scripts/**/*.*', '!' + DEST_START + 'themes/bubbles/**/*.*', '!' + DEST_START + 'themes/**/*.zip']
	};

	return config;
};
