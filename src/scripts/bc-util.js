var bc = window.bc = (window.bc || {});
bc.util = bc.util || {};

/**
 * Creates a cookie in the root path.
 * @param {string} name - The name of the cookie
 * @param {string} value - The cookie value
 * @param {number} days - The number of days the cookie is valid for.
 * @returns {boolean} - Indicates if the cookie was created successfully.
 */
bc.util.createCookie = function(name, value, days) {
	var expires;

	if(name === undefined || name.length === 0) {
		return false;
	}

	if(typeof value === 'undefined' || value === '') {
		days = -1;
	}

	value = value || '';

	if(days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = '; expires=' + date.toGMTString();
	} else {
		expires = '';
	}
	document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + expires + '; path=/';
	return true;
};

/**
 * Gets the value of a cookie by name
 * @param {string} name - The name of the cookie to retrieve
 * @returns {string} - The value of the cookie
 */
bc.util.readCookie = function(name) {
	var value = bc.util.readRawCookie(name);
	return value ? decodeURIComponent(value) : null;
};

/**
 * Gets the raw value of a cookie by name
 * @param {string} name - The name of the cookie to retrieve
 * @returns {string} - The raw value of the cookie
 */
bc.util.readRawCookie = function(name) {
	var nameEQ = encodeURIComponent(name) + '=';
	var ca = document.cookie.split(';');
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while(c.charAt(0) === ' ') {
			c = c.substring(1, c.length);
		}
		if(c.indexOf(nameEQ) === 0) {
			return c.substring(nameEQ.length, c.length);
		}
	}
	return null;
};

/**
 * Deletes a cookie
 * @param {string} name - The name of the cookie
 * @returns {boolean} - true if the cookie was deleted, false otherwise.
 */
bc.util.eraseCookie = function(name) {
	return this.createCookie(name, '', -1);
};

/**
 * Determines if debugging is currently enabled
 * @returns {boolean} true if enabled, false otherwise
 */
bc.util.isDebugEnabled = function() {
	return bc.config.debug === undefined ? true : bc.config.debug;
};

/**
 * Logs a message to console.log (if available).  If debugging is disabled it will only log if isError is true.
 * @param {string|object} message The message to log.
 * @param {boolean} [isError] The message indicated should always be logged reguardless of debug being enabled.
 * @param {object} [obj] The object you would like to log
 */
bc.util.log = function(message, isError, obj) {
	if(bc.util.isDebugEnabled() || !!isError) {
		if(window.console) {
			if(obj) {
				window.console.log(message, obj);
			} else {
				window.console.log(message);
			}
		}
		if(isError && window.console && window.console.trace) {
			window.console.trace();
		}
	}
};

/**
 * Creates a DOM element with the given name, attributes and value
 * @param {string} elementName
 * @param {object} [attributes]
 * @param {string} [textValue]
 */
bc.util.createElement = function(elementName, attributes, textValue) {
	attributes = attributes || {};
	textValue = textValue || '';
	var element = document.createElement(elementName);
	for(var key in attributes) {
		if(attributes.hasOwnProperty(key)) {
			element.setAttribute(key, attributes[key]);
		}
	}
	var textNode = document.createTextNode(textValue);
	element.appendChild(textNode);
	return element;
};


/**
 * Translate relative paths to absolute paths.
 * @param {string} winLocation - The location of the current window that you want to relate the relative path to. i.e. window.location.
 * @param {string} relativePath - The path that you want to translate
 * @returns {string} The absolute path
 */
bc.util.getAbsPathFromRelative = function(winLocation, relativePath) {
	var nUpLn, sDir = "", sPath = winLocation.pathname.replace(/[^\/]*$/, relativePath.replace(/(\/|^)(?:\.?\/+)+/g, "$1"));
	for(var nEnd, nStart = 0; nEnd = sPath.indexOf("/../", nStart), nEnd > -1; nStart = nEnd + nUpLn) {
		nUpLn = /^\/(?:\.\.\/)*/.exec(sPath.slice(nEnd))[0].length;
		sDir = (sDir + sPath.substring(nStart, nEnd)).replace(new RegExp("(?:\\\/+[^\\\/]*){0," + ((nUpLn - 1) / 3) + "}$"), "/");
	}
	return sDir + sPath.substr(nStart);
};


/**
 * Re-creates all the script tags found in the element so the javascript will execute.  This is used to run javascript included in injected HTML.
 * @param {element} element The element to search for script tags.
 * @param {function} callback The method to be called after all javascript is loaded.
 * @param [string] winLocation - The location of the current window that you want to relate the relative path to. i.e. window.location.
 */
bc.util.loadJavascript = function(element, callback) {
	bc.util.log('loadJavascript');
	var counter = 0;
	var totalScripts = 0;

	var attemptCallback = function() {
		if(counter === totalScripts && callback && typeof callback === 'function') {
			callback();
		}
	};

	var handleLoad = function() {
		if(!this.done) {
			bc.util.log(counter + ' - ' + this.src);
			this.done = true;
			counter++;
			attemptCallback();
		}
	};

	var handleReadyStateChange = function() {
		var state;

		if(!this.done) {
			state = this.readyState;
			if(state === 'complete') {
				handleLoad();
			}
		}
	};

	var handleError = function() {
		if(!this.done) {
			this.done = true;

			counter++;
			attemptCallback();
		}
	};

	var newScripts = [];
	var scripts = element.getElementsByTagName('script');
	while(scripts.length > 0) {
		var scriptTag = document.createElement('script');
		scriptTag.setAttribute('type', 'text/javascript');
		if(scripts[0].getAttribute('src')) {
			scriptTag.setAttribute('src', scripts[0].getAttribute('src'));
		}
		bc.util.log(scripts[0].src + scripts[0].innerHTML);
		scriptTag.innerHTML = scripts[0].innerHTML;
		scriptTag.onload = handleLoad;
		scriptTag.onreadystatechange = handleReadyStateChange;
		scriptTag.onerror = handleError;

		scripts[0].parentNode.removeChild(scripts[0]);
		newScripts.push(scriptTag);
	}
	for(var i = 0; i < newScripts.length; i++) {
		element.appendChild(newScripts[i]);
	}
	totalScripts = newScripts.length;
};


/**
 * Generates a new BoldChat id value.
 * @param {string} [accountId] - The BoldChat Account ID
 * @returns {string} - The new ID
 */
bc.util.getId = function(accountId) {
	// max Long value is: 9223372036854775807
	var highValue = Math.floor(Math.random() * 9223372037);
	return ((highValue === 0) ? '' : highValue) + '' + Math.floor(Math.random() * ((highValue === 9223372036) ? 854775808 : 1000000000));
};

bc.util._base64 = {};
bc.util._base64.PADCHAR = '=';
bc.util._base64.ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Convert string to base64 encoded string with compatibility for IE 9 which does not support btoa
 * @param s The string to base64 encode.
 * @returns {string} The base64 encoded string.
 */
bc.util.base64 = function(s) {
	if(window.btoa) {
		return window.btoa(s);
	} else { // For IE 9
		if(arguments.length !== 1) {
			throw new SyntaxError('Not enough arguments');
		}
		var padchar = bc.util._base64.PADCHAR;
		var alpha = bc.util._base64.ALPHA;
		var getbyte = bc.util._getbyte;

		var i, b10;
		var x = [];

		// convert to string
		s = '' + s;

		var imax = s.length - s.length % 3;

		if(s.length === 0) {
			return s;
		}
		for(i = 0; i < imax; i += 3) {
			b10 = (getbyte(s, i) << 16) | (getbyte(s, i + 1) << 8) | getbyte(s, i + 2);
			x.push(alpha.charAt(b10 >> 18));
			x.push(alpha.charAt((b10 >> 12) & 0x3F));
			x.push(alpha.charAt((b10 >> 6) & 0x3f));
			x.push(alpha.charAt(b10 & 0x3f));
		}
		switch(s.length - imax) {
			case 1:
				b10 = getbyte(s, i) << 16;
				x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
					padchar + padchar);
				break;
			case 2:
				b10 = (getbyte(s, i) << 16) | (getbyte(s, i + 1) << 8);
				x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
					alpha.charAt((b10 >> 6) & 0x3f) + padchar);
				break;
		}
		return x.join('');
	}
};

/**
 * Helper function for bc.util.base64
 * @param s
 * @param i
 * @returns {Number}
 * @private
 */
bc.util._getbyte = function(s, i) {
	var x = s.charCodeAt(i);
	if(x > 255) {
		throw 'Invalid byte';
	}
	return x;
};

/**
 * Detects if an object is a node list.
 * @param {Node|NodeList} nodes
 * @returns {boolean} true if a node list, false otherwise
 */
bc.util.isNodeList = function(nodes) {
	var stringRepr = Object.prototype.toString.call(nodes);

	return typeof nodes === 'object' &&
		/^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr) &&
		typeof nodes.length !== 'undefined' &&
		(nodes.length === 0 || (typeof nodes[0] === 'object' && nodes[0].nodeType > 0));
};

/**
 * @param {Node|NodeList} element
 * @param {string} className
 */
bc.util.addClass = function(element, className) {
	'use strict';

	if(element) {
		if(className && className.length > 0) {
			if(bc.util.isNodeList(element)) {
				for(var i = 0; i < element.length; i++) {
					bc.util.addClass(element[i], className);
				}
			} else {
				var classList = element.className;
				if(classList.indexOf(className) !== -1) {
					return;
				}
				if(classList !== '') {
					className = ' ' + className;
				}
				element.className = classList + className;
			}
		}
	}
};

bc.util._leadingSpacesPattern = new RegExp('^\\s*', 'g');
/**
 * @param {Node|NodeList} element
 * @param {string} className
 */
bc.util.removeClass = function(element, className) {
	'use strict';

	if(element) {
		if(bc.util.isNodeList(element)) {
			for(var i = 0; i < element.length; i++) {
				bc.util.removeClass(element[i], className);
			}
		} else {
			var classList = element.className;
			var pattern = new RegExp('\\s?\\b' + className + '\\b', 'g');
			classList = classList.replace(pattern, '');
			classList = classList.replace(bc.util._leadingSpacesPattern, '');
			element.className = classList;
		}
	}
};

/**
 * @param {Node|NodeList} element
 * @param {string} className
 */
bc.util.hasClass = function(element, className) {
	'use strict';

	if(element) {
		return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
	}
};

/**
 * @param {Node} element
 * @param {boolean} show - optional parameter
 */
bc.util.toggleVisibility = function(element, show) {
	'use strict';

	if(element) {
		var tmpElement = (bc.util.isNodeList(element) ? element[0] : element);
		if(typeof show === 'boolean') {
			tmpElement.style.display = show ? '' : 'none';
			return;
		}

		if(tmpElement.style.display && tmpElement.style.display === 'none') {
			tmpElement.style.display = '';
		} else {
			tmpElement.style.display = 'none';
		}
	}
};

/**
 * @param {Node} element
 * @param {string} className
 * @param {boolean} state - A boolean value to determine whether the class should be added or removed
 * @param {boolean} [forceClassName] - Optional boolean, mainly just for testing, to force using the className instead of the classList property
 */
bc.util.toggleClass = function(element, className, state, forceClassName) {
	'use strict';

	forceClassName = forceClassName || false;
	if(!forceClassName && element.classList) {
		if(typeof state === 'boolean') {
			if(state) {
				if(!element.classList.contains(className)) {
					element.classList.add(className);
				}
			} else {
				if(element.classList.contains(className)) {
					element.classList.remove(className);
				}
			}
		} else {
			element.classList.toggle(className);
		}
	} else {
		var classes = element.className.split(' ');
		var existingIndex = classes.indexOf(className);

		if(typeof state === 'boolean') {
			if(state) {
				if(existingIndex === -1) {
					classes.push(className);
				}
			} else {
				if(existingIndex !== -1) {
					classes.splice(existingIndex, 1);
				}
			}
		} else {
			if(existingIndex >= 0) {
				classes.splice(existingIndex, 1);
			} else {
				classes.push(className);
			}
		}

		element.className = classes.join(' ');
	}
};


/**
 * @param element
 * @param selector
 * @returns {*}
 */
bc.util.closest = function(element, selector) {
	var matchesFn;

	// find vendor prefix
	['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function(fn) {
		if(typeof document.body[fn] === 'function') {
			matchesFn = fn;
			return true;
		}
		return false;
	});

	// traverse parents
	var parent;
	while(element !== null) {
		parent = element.parentElement;
		if(parent !== null && parent[matchesFn](selector)) {
			return parent;
		}
		element = parent;
	}

	return null;
};

bc.util._forEachElement = function(element, action) {
	if(bc.util.isNodeList(element)) {
		for(var i = 0; i < element.length; i++) {
			action(element[i]);
		}
	} else {
		action(element);
	}
};


/**
 * @param {Node|NodeList} element
 * @param eventName
 * @param callBack
 */
bc.util.addEventListener = function(element, eventName, callBack) {
	bc.util._forEachElement(element, function(node) {
		node.addEventListener(eventName, callBack);
	});
};


/**
 * @param {Node|NodeList} element
 */
bc.util.removeElement = function(element) {
	if(bc.util.isNodeList(element)) {
		while(element.length) {
			bc.util.removeElement(element[0]);
		}
	} else if(element && element.parentNode) {
		element.parentNode.removeChild(element);
	}
};

/**
 * Gets the bounding height of an element
 * @param {Node} element
 * @returns {Number}
 */
bc.util.getHeight = function(element) {
	if(bc.util.isNodeList(element) && element.length > 0) {
		return bc.util.getHeight(element[0]);
	} else {
		var rect = element.getBoundingClientRect();
		return rect.height;
	}
};

/**
 * Does the same as element.textContent, but allows node lists.
 * @param element
 * @param textValue
 */
bc.util.setText = function(element, textValue) {
	if(element) {
		bc.util._forEachElement(element, function(node) {
			node.textContent = textValue;
		});
	}
};

/**
 * Does the same as element.innerHTML, but allows node lists
 * @param element
 * @param htmlValue
 */
bc.util.setHtml = function(element, htmlValue) {
	if(element) {
		bc.util._forEachElement(element, function(node) {
			node.innerHTML = htmlValue;
		});
	}
};

/**
 * Does the same as element.setAttribute, but allows node lists
 * @param element
 * @param attributeName
 * @param attributeValue
 */
bc.util.setAttribute = function(element, attributeName, attributeValue) {
	if(element) {
		bc.util._forEachElement(element, function(node) {
			node.setAttribute(attributeName, attributeValue);
		});
	}
};

/**
 * Does the same as element.setAttribute, but allows node lists
 * @param element
 * @param attributeName
 * @param attributeValue
 */
bc.util.setStyle = function(element, styleName, styleValue) {
	if(element) {
		bc.util._forEachElement(element, function(node) {
			node.style[styleName] = styleValue;
		});
	}
};


/**
 * @returns {boolean}
 */
bc.util.checkIsIos = function() {
	var check = false;
	(function(a) {
		if(/(iPad|iPhone|iPod)/g.test(a)) {
			check = true;
		}
	})(navigator.userAgent);
	return check;
	//return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
};

/**
 * @returns {boolean}
 */
bc.util.checkIsMobile = function() {
	var check = false;
	(function(a) {
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
			check = true;
		}
	})(navigator.userAgent || navigator.vendor || window.opera);
	return check;
};

/**
 * Returns the IE version if appliceable, otherwise returns a 0 if another browser
 * @returns {number}
 */
bc.util.msieversion = function() {
	var ua = window.navigator.userAgent;
	if(ua) {
		var msie = ua.indexOf("MSIE ");

		if(msie > 0) {
			return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));
		} else {
			if (Object.hasOwnProperty.call(window, "ActiveXObject") && !window.ActiveXObject) {
				return 11; //ie11
			} else {
				return 0;
			}
		}
	} else {
		return 0;
	}
};

