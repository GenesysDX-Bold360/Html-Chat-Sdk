module.exports = function() {
	'use strict';

	var ROOT_START = './';
	var DEST_START = './out/';
	var DEST_SRC = DEST_START + 'src/';
	var SRC_START = './src/';
	var JS_BASE = SRC_START + 'scripts/';

	var JS_BC_UTIL = 'bc-util.js';
	var JS_BC_CONFIG = 'bc-config.js';
	var JS_BC_SDK = 'bc-sdk-start.js';
	var JS_BC_POPUP = 'bc-popup.js';

	// all js to vet
	return {
		base: 'src'
		, all_src: SRC_START + '**/*.*'
		, dest_src: DEST_SRC
		, dest_css_src: DEST_SRC + '/**/*.scss'
		, doc_dest: './doc'
		, js_all: [JS_BASE + '**/*.js', '!**/test*', '!**/*.test.js*']
		, js_bc: [JS_BASE + '**/*.js', '!' + JS_BASE + JS_BC_CONFIG, '!' + JS_BASE + JS_BC_UTIL, '!' + JS_BASE + JS_BC_SDK, '!' + JS_BASE + JS_BC_POPUP, '!**/test.js*', '!**/*.test.js*']
		, js_start: [JS_BASE + JS_BC_UTIL, JS_BASE + JS_BC_CONFIG, JS_BASE + JS_BC_SDK]
		, js_popup_start: [JS_BASE + JS_BC_UTIL, JS_BASE + JS_BC_CONFIG, JS_BASE + JS_BC_SDK, JS_BASE + JS_BC_POPUP]
		, out_dest: DEST_START
		, root: ROOT_START
		, src: SRC_START
		, js_doc: {
			'tags': {
				'allowUnknownTags': true
			},
			'opts': {
				'destination': './doc'
			},
			'plugins': [
				'plugins/markdown'
			],
			'templates': {
				'cleverLinks': false,
				'monospaceLinks': false,
				'default': {
					'outputSourceFiles': true
				},
				'path': 'ink-docstrap',
				'theme': 'cerulean',
				'navType': 'vertical',
				'linenums': true,
				'dateFormat': 'MMMM Do YYYY, h:mm:ss a'
			}
		}
	};
};
