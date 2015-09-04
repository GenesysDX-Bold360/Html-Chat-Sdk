var bc = bc || {};

bc.startSession = function(chatParams, visitInfo, hideChatWindow) {
	'use strict';

	if(bc && bc.ViewManager) {
		var viewManager = new bc.ViewManager();
		if(hideChatWindow && typeof hideChatWindow === 'function') {
			viewManager.closeChat = hideChatWindow;
		}

		var chatContainerElement = document.getElementById('bc-layered-chat') || document.getElementById('bc-popup-chat');
		if(chatContainerElement) {
			var ieVersion = bc.util.msieversion();
			if(ieVersion && ieVersion !== 0) {
				bc.util.addClass(chatContainerElement, 'bc-ie bc-ie' + ieVersion.toString());
			}
		}

		bc.currentSession = new bc.Session(bc.config.sessionApiKey, chatParams, visitInfo, viewManager);
		bc.currentSession.startChat();
	}
};

/**
 * This class is the callback function invoked once the visitor clicks on the related chat button.
 * This code makes a call to your server to retrieve the layered window.
 * @param {Object} chatParams - the parameters related to the chat
 * @param {Object} visitInfo - the parameters related to the visit
 * @constructor
 */
bc.openChat = function(chatParams, visitInfo) {
	'use strict';

	//create the instances
	var siteMetaTag = null;
	var bcMetaTag = null;
	var chatContainerElement = null;
	var configCookieValue = bc.util.readCookie(bc.config.configCookie);
	if(configCookieValue) {
		bc.config = JSON.parse(configCookieValue);
	}
	if(typeof window._bcForcePopup !== 'undefined') {
		bc.config.forcePopup = window._bcForcePopup;
	}
	if(typeof window._bcSessionApiKey !== 'undefined') {
		bc.config.sessionApiKey = window._bcSessionApiKey;
	}
	if(typeof window._bcServerSet !== 'undefined') {
		bc.config.serverSet = window._bcServerSet;
	}
	if(typeof window._bcChatWindowUrl !== 'undefined') {
		bc.config.chatWindowUrl = window._bcChatWindowUrl;
	}


	var hideInvite = function(opacity) {
		if(opacity === 0) {
			var invites = document.getElementsByName('bt_invite_box');
			if(invites && invites.length > 0) {
				for(var i = 0; i < invites.length; i++) {
					bc.util.removeElement(invites[i]);
				}
			}
			invites = document.getElementsByName('bc-invite-box');
			if(invites && invites.length > 0) {
				for(var i = 0; i < invites.length; i++) {
					bc.util.removeElement(invites[i]);
				}
			}
		}
	};

	var removeMetaTag = function() {
		if(!bc.config.forcePopup && bc.config && bc.config.addViewportMetaTag) {
			bc.util.removeElement(bcMetaTag);
			if(siteMetaTag) {
				document.getElementsByTagName('head')[0].appendChild(siteMetaTag);
			}
		}
	};

	var hideChatWindow = function() {
		chatContainerElement.style.visibility = 'hidden';
		removeMetaTag();
		if(document.body) {
			document.body.removeChild(chatContainerElement);
			window.bcChatOpen = false;
		}
	};

	var startSession = function() {
		bc.util.log('startSession');
		bc.startSession(chatParams, visitInfo, hideChatWindow);
	};

	var addMetaTag = function(headElement, rootDocument) {
		if(bc.config.forcePopup || bc.config.addViewportMetaTag) {
			siteMetaTag = headElement.querySelector('meta[name=viewport]');
			if(siteMetaTag) {
				bc.util.removeElement(siteMetaTag);
			}

			if(!bcMetaTag) {
				bcMetaTag = rootDocument.createElement('meta');
				bcMetaTag.id = 'bc-viewport';
				bcMetaTag.name = 'viewport';
				bcMetaTag.content = bc.config.viewPortMetaTagContent;
			}
			headElement.appendChild(bcMetaTag);
		}
	};

	var initContainerElement = function(data, context, id) {
		chatContainerElement = context.createElement('div');
		chatContainerElement.id = id;
		chatContainerElement.innerHTML = data;
	};

	var showChatWindow = function(data) {
		if(!window.bcChatOpen) {
			window.bcChatOpen = true;

			if(!chatContainerElement) {
				initContainerElement(data, document, 'bc-layered-chat');
			}

			hideInvite(0);
			addMetaTag(document.getElementsByTagName('head')[0], document);
			bc.util.loadJavascript(chatContainerElement, startSession);
			bc.util.log('afterLoadJavascript');
			document.body.appendChild(chatContainerElement);
			chatContainerElement.style.visibility = 'visible';
		}
	};

	/**
	 * This function does the actual request for the chat window html
	 * @param {string} path - the path (url) to the custom chat window to be opened
	 * @param {function} callback - the function that will open the custom chat window when requested
	 */
	var fetchWindow = function(path, callback) {
		if(!window.bcChatOpen) {
			//TODO: Include XDomainRequest as well
			var httpRequest = new XMLHttpRequest();
			httpRequest.onreadystatechange = function() {
				if(httpRequest.readyState === 4 && httpRequest.status === 200) {
					if(callback && typeof callback === 'function') {
						callback(httpRequest.responseText);
					}
				}
			};
			httpRequest.open('GET', path);
			httpRequest.send();
		}
	};


	var openPopupWindow = function(path) {
		var hideShowChatButtons = function(opacity) {
			if(opacity === 0) {
				var head = document.head || document.getElementsByTagName('head')[0];
				if(!head.querySelector('#bc-hide-style')) {
					var css = '.bc-hide-buttons {display: none !important;}';
					var style = bc.util.createElement('style', {type: 'text/css', id: 'bc-hide-style'});
					if(style.styleSheet) {
						style.styleSheet.cssText = css;
					} else {
						style.appendChild(document.createTextNode(css));
					}
					head.appendChild(style);
				}
			}

			hideInvite(opacity);
			var fbs = document.getElementsByClassName('bcFloat');
			var sbs = document.getElementsByClassName('bcStatic');

			var totalElemsToHide = [];
			if(fbs && fbs.length > 0) {
				totalElemsToHide.push(fbs);
			}
			if(sbs && sbs.length > 0) {
				totalElemsToHide.push(sbs);
			}
			for(var i = 0; i < totalElemsToHide.length; i++) {
				for(var y = 0; y < totalElemsToHide[i].length; y++) {
					if(opacity === 0) {
						bc.util.addClass(totalElemsToHide[i][y], 'bc-hide-buttons');
					} else {
						bc.util.removeClass(totalElemsToHide[i][y], 'bc-hide-buttons');
					}
				}
			}
		};

		var width = 480;
		var height = 640;
		if(chatParams && chatParams.width && chatParams.height) {
			if(chatParams.height > chatParams.width) {
				height = chatParams.height;
				width = chatParams.width;
			} else {
				height = chatParams.width;
				width = chatParams.height;
			}
		}

		var winAttrs = 'width=' + width + ',height=' + height + ',resizable=0,menubar=no,location=0,titlebar=0';
		var popupWindow = window.open(path, 'BoldChatbyLogMeIn', winAttrs);
		if(popupWindow) {
			window.bcChatOpen = true;
			hideShowChatButtons(0);

			var limit = 100;
			var openTimer = window.setInterval(function() {
				try {
					popupWindow.bc.setConfig(bc.config, chatParams, visitInfo);
					window.clearTimeout(openTimer);
				} catch(ex) {
					limit -= 1;
					if(limit <= 0) {
						window.clearTimeout(openTimer);
						bc.util.log('Could not invoke setConfig on the popup window. Error: ' + ex, true);
					}
				}
			}, 100);
			var pollTimer = window.setInterval(function() {
				if(popupWindow.closed !== false) { // !== is required for compatibility with Opera
					window.clearInterval(pollTimer);
					bc.util.eraseCookie(bc.config.chatCookie);
					bc.util.eraseCookie(bc.config.configCookie);
					window.bcChatOpen = false;
					hideShowChatButtons(1);
				}
			}, 500);
		}
	};

	// TODO: remove random parameter, so local caching works
	if(!window.bcChatOpen) {
		if(!bc.config.forcePopup) {
			fetchWindow(bc.config.chatWindowUrl, showChatWindow);
		} else {
			if(!bc.util.readCookie(bc.config.chatCookie) && !bc.util.readCookie(bc.config.configCookie)) {
				openPopupWindow(bc.config.chatWindowUrl + '/popup.html');
			} else {
				bc.startSession(chatParams, visitInfo, null);
			}
		}
	}
};

(function() {
	'use strict';

	if(!window.bcChatOpen) {
		window._bcvma = window._bcvma || [];
		window._bcvma.push(['setCustomChatWindow', bc.openChat]);

		if(bc.util && (bc.util.readCookie(bc.config.chatCookie) || bc.util.readCookie(bc.config.configCookie))) {
			bc.openChat();
		}
	}
}());
