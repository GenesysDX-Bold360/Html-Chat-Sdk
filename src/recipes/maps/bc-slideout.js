var bc = window.bc || {};
bc.bcMapLog = function(message, obj) {
	"use strict";

	if (bc.util) {
		bc.util.log('sodiv: ' + message, false, obj)
	} else {
		console.log('sodiv: ' + message, obj);
	}
};

Function.prototype.inheritsFrom = function(parentClassOrObject, args) {
	if(parentClassOrObject.constructor == Function) {
		//Normal Inheritance
		this.prototype = new parentClassOrObject(args);
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject.prototype;
	}
	else {
		//Pure Virtual Inheritance
		this.prototype = parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject;
	}
	return this;
};

bc.slideOutDiv = function(type) {
	"use strict";
	this.type = type;
	this.container = 'not set';

	this.elementToToggle = null;
	this.minimizedClassName = null;
	this.invokerCtrl = null;

	this.isVisible = false;
	this.isInitialized = false;

	this.elementsToHide = [];
	bc.bcMapLog('sodiv begin slideOutDiv type=' + this.type);
};
bc.slideOutDiv.prototype = function() {
	"use strict";
	bc.bcMapLog('begin slideOutDiv.prototype');

	function addElementsToHide(type, element) {
		if(this.elementsToHide.length === 0 || !type in this.elementsToHide) {
			this.elementsToHide[type] = element;
			this.elementsToHide.push(type);
		}
	}

	function toggleVisibility() {
		"use strict";
		bc.bcMapLog('toggleVisibility=' + this.type);

		this.isVisible = !this.isVisible;
		if(this.isVisible) {
			bc.util.removeClass(this.invokerCtrl, this.minimizedClassName);
			bc.util.removeClass(this.elementToToggle, this.minimizedClassName);

			for(var i = 0; i < this.elementsToHide.length; i++) {
				this.elementsToHide[this.elementsToHide[i]].hideElement();
			}

		} else {
			bc.util.addClass(this.invokerCtrl, this.minimizedClassName);
			bc.util.addClass(this.elementToToggle, this.minimizedClassName);
		}
	}

	function showElement() {
		"use strict";

		bc.bcMapLog('showElement=' + this.type);
		if(!this.isVisible && this.elementToToggle && this.minimizedClassName && this.invokerCtrl) {
			this.isVisible = true;
			bc.util.removeClass(this.invokerCtrl, this.minimizedClassName);
			bc.util.removeClass(this.elementToToggle, this.minimizedClassName);
		}
	}

	function hideElement() {
		"use strict";

		bc.bcMapLog('hideElement=' + this.type);
		if(this.isVisible && this.elementToToggle && this.minimizedClassName && this.invokerCtrl) {
			this.isVisible = false;
			bc.util.addClass(this.invokerCtrl, this.minimizedClassName);
			bc.util.addClass(this.elementToToggle, this.minimizedClassName);
		}
	}

	return {
		toggleVisibility: toggleVisibility,
		showElement: showElement,
		hideElement: hideElement,
		addElementsToHide: addElementsToHide
	}
}();

bc.iframe = function(container) {
	"use strict";

	bc.bcMapLog('begin iframe');
	//this.container = container;
	this.isInitialized = true;

	var scope = this;
	//var idSuffix = Math.random().toString();
	var bcIframeDivId = 'bc-iframe-div';
	var bcIframeDiv = document.getElementById(bcIframeDivId);
	var bcIframeId = 'bc-iframe';
	var bcIframeMinimizerId = 'bc-iframe-minimize';
	var bcIframeMinimizedClassName = 'bc-sodiv-minimized';
	var bcIframe = document.getElementById(bcIframeId);
	var bcIframeMinimizerDiv = document.getElementById(bcIframeMinimizerId);
	if(!bcIframeDiv) {
		bcIframeDiv = bc.util.createElement('div', {id: bcIframeDivId, class: bcIframeMinimizedClassName});
		bcIframe = bc.util.createElement('iframe', {id: bcIframeId, class: bcIframeMinimizedClassName});
		bcIframeMinimizerDiv = bc.util.createElement('div', {
			id: bcIframeMinimizerId,
			class: bcIframeMinimizedClassName
		});

		bcIframeDiv.appendChild(bcIframe);

		bcIframeMinimizerDiv.addEventListener('click', function() {
			//scope.forceHideElement(document.getElementById('bc-maps-canvas'), 'bc-sodiv-minimized', document.getElementById('bc-maps-minimize'));
			scope.toggleVisibility();
		});

		container.parentNode.appendChild(bcIframeDiv);
		container.parentNode.appendChild(bcIframeMinimizerDiv);
	}
	this.bcFrame = bcIframe;
	this.elementToToggle = bcIframeDiv;
	this.minimizedClassName = bcIframeMinimizedClassName;
	this.invokerCtrl = bcIframeMinimizerDiv;
};
bc.iframe.inheritsFrom(bc.slideOutDiv, 'iframe');
bc.iframe.prototype.applyUrl = function(url) {
	"use strict";

	this.bcFrame.src = url;
};

bc.googleMap = function(container, message) {
	"use strict";
	bc.bcMapLog('begin googleMap cont=' + container);
	//private unique variables/funcs for each instance
	this.container = container;
	this.isInitialized = true;
	this.map = {};

	this.coordinates = [];	//how can i make this private only for the prototype function to see?
	var _coord = this.getCoordinates(message);
	this.coordinates.push(_coord);
	this.infoCoord = {};
	this.infoCoord[_coord] = this.getInfo(message);

	var scope = this;
	var bcMapsCanvasId = 'bc-maps-canvas';
	var bcMapsMinimizerId = 'bc-maps-minimize';
	var bcMapsMinimizedClassName = 'bc-sodiv-minimized';
	var bcMapsCanvasDiv = document.getElementById(bcMapsCanvasId);
	var bcMapsMinimizerDiv = document.getElementById(bcMapsMinimizerId);

	if(!bcMapsCanvasDiv) {
		bcMapsCanvasDiv = bc.util.createElement('div', {id: bcMapsCanvasId, class: bcMapsMinimizedClassName});
		if(!bcMapsMinimizerDiv) {
			bcMapsMinimizerDiv = bc.util.createElement('div', {
				id: bcMapsMinimizerId,
				class: bcMapsMinimizedClassName
			});
		}

		bcMapsMinimizerDiv.addEventListener('click', function() {
			//scope.forceHideElement(document.getElementById('bc-iframe-div'), 'bc-sodiv-minimized', document.getElementById('bc-iframe-minimize'));
			scope.toggleVisibility();
		});

		container.parentNode.appendChild(bcMapsCanvasDiv);
		container.parentNode.appendChild(bcMapsMinimizerDiv);
	}
	this.elementToToggle = bcMapsCanvasDiv;
	this.minimizedClassName = bcMapsMinimizedClassName;
	this.invokerCtrl = bcMapsMinimizerDiv;


	if(window && !window.initializeMaps) {
		window.initializeMaps = function() {
			scope.map = new google.maps.Map(bcMapsCanvasDiv, {
				center: _coord,
				zoom: 10,
				panControl: true,
				zoomControl: true,
				zoomControlOptions: {
					style: google.maps.ZoomControlStyle.LARGE
				},
				mapTypeControl: true,
				mapTypeControlOptions: {
					style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
				},
				scaleControl: true,
				streetViewControl: true,
				overviewMapControl: true,
				rotateControl: true,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			});
			setTimeout(function() {
				scope.addMapMarker();
			}, 200);

		};

		var bcGoogleApiId = 'bc-google-api';
		var googleApiScript = document.getElementById(bcGoogleApiId);
		if(!googleApiScript) {
			googleApiScript = bc.util.createElement('script', {
				id: bcGoogleApiId,
				type: 'text/javascript',
				src: 'http://maps.googleapis.com/maps/api/js?callback=initializeMaps'
			});
			container.appendChild(googleApiScript);
		}
	}
};
bc.googleMap.inheritsFrom(bc.slideOutDiv, 'map');
bc.googleMap.prototype.getCoordinates = function(message) {
	bc.bcMapLog('bc.googleMap.prototype:getCoordinates type=' + this.type);

	var mapLatIndex = message.indexOf('/@') + 2;
	var mapLngIndex = message.indexOf(',', mapLatIndex) + 1;
	var mapLngIndexEnd = message.indexOf(',', mapLngIndex);
	var mapLatCoord = message.substr(mapLatIndex, mapLngIndex - mapLatIndex - 1);
	var mapLngCoord = message.substr(mapLngIndex, mapLngIndexEnd - mapLngIndex);
	var mapCoordinates = {lat: Number(mapLatCoord), lng: Number(mapLngCoord)};

	bc.bcMapLog('maps coordinates', false, mapCoordinates);
	return mapCoordinates;
};
bc.googleMap.prototype.getInfo = function(message) {
	"use strict";

	var info = null;
	var infoKeyStart = '/info/';
	var infoKeyEnd = '/infoend/';
	var infoIdx = message.indexOf(infoKeyStart);
	if(infoIdx !== -1) {
		infoIdx += infoKeyStart.length;
		var infoEndIdx = message.indexOf(infoKeyEnd, infoIdx);
		info = message.substr(infoIdx, infoEndIdx - infoIdx);
		bc.bcMapLog('info= ' + info);
	}

	return info;
};
bc.googleMap.prototype.addMapMarker = function(coordinates, info) {
	"use strict";

	function unescapeHTML(p_string)
	{
		if ((typeof p_string === "string") && (new RegExp(/&amp;|&lt;|&gt;|&quot;|&#39;/).test(p_string)))
		{
			return p_string.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
		}

		return p_string;
	}

	if(coordinates) {
		this.coordinates.push(coordinates);
		this.infoCoord[coordinates] = info;
	}
	if(this.coordinates) {
		var remainingCoordinates = this.coordinates.shift();
		var marker;
		while(remainingCoordinates) {
			if(google && google.maps && google.maps.Marker) {
				marker = new google.maps.Marker({position: remainingCoordinates});
				marker.setMap(this.map);
				this.map.setCenter(remainingCoordinates);

				if(this.infoCoord[remainingCoordinates]) {
					var infowindow = new google.maps.InfoWindow({content: unescapeHTML(this.infoCoord[remainingCoordinates])});

					marker.addListener('click', function() {
						infowindow.open(this.map, marker);
					});
				}

				remainingCoordinates = this.coordinates.shift();
			}
		}
	}
	this.showElement();
};


bc.setOverrides = function() {
	var originalAddOrUpdateMessage = bc.currentSession.viewManager.addOrUpdateMessage;

	bc.map = bc.map || {};
	bc.iframe = bc.iframe || {};

	var _bcChat = null;

	function getBcChat() {
		"use strict";
		if(!_bcChat) {
			_bcChat = document.getElementById('bc-chat');
		}
		return _bcChat;
	}

	bc.currentSession.viewManager.addOrUpdateMessage = function(messageId, personType, name, time, message, avatar, isReconstitutedMsg, originalText) {
		if(message.indexOf('/maps/') !== -1 && message.indexOf('/@') !== -1) {
			var info = null;
			if(!bc.map.isInitialized) {
				bc.map = new bc.googleMap(getBcChat(), message);
				info = bc.map.getInfo(message);
			} else {
				info = bc.map.getInfo(message);
				bc.map.addMapMarker(bc.map.getCoordinates(message), info);
			}
			if(info) {
				message = message.replace('/info/' + info + '/infoend/', '');
			}

			if(bc.iframe && bc.iframe.isInitialized) {
				bc.iframe.hideElement();
				bc.map.addElementsToHide(bc.iframe.type, bc.iframe);
				bc.iframe.addElementsToHide(bc.map.type, bc.map);
			}

		} else if(message.indexOf('/iframe/') !== -1) {
			var url = message.substr(message.indexOf('/iframe/') + 8);
			bc.bcMapLog('url=' + url);
			if(!bc.iframe.isInitialized) {
				bc.iframe = new bc.iframe(getBcChat());
			}
			bc.iframe.applyUrl(url);
			bc.iframe.showElement();

			if(bc.map && bc.map.isInitialized) {
				bc.map.hideElement();
				bc.map.addElementsToHide(bc.iframe.type, bc.iframe);
				bc.iframe.addElementsToHide(bc.map.type, bc.map);
			}
		}

		originalAddOrUpdateMessage(messageId, personType, name, time, message, avatar, isReconstitutedMsg, originalText);

		//TODO: Need a way to clear out the elements when chat closes
	};
};
