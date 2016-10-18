var bc = bc || {};

/**
 * @typedef {(object)} iframeElement
 */

/**
 * Initializes a communication frame for the boldchat api to make requests and receive oss messages.
 * @param {string} accountId - The accountid for the customer
 * @param {iframeElement} [frame] - An iframe element
 * @param {string} serverSet - The server set where the account resides (currently 'eu' for EU and empty for US)
 * @constructor
 */
bc.ApiFrame = function(accountId, frame, serverSet) {
	var isConfigServerSetDefined = !!bc.config.serverSet || bc.config.serverSet === '';

	this.accountId = accountId;
	this.frame = frame;
	this.frameLoadQueue = [];
	this.framePendingResults = {};
	this.serverSet = isConfigServerSetDefined ? bc.config.serverSet : (serverSet || '');
	this.frameOrigin = 'https://api' + this.serverSet + '.boldchat.com';
	this.messageListener = null;
	this.id = 1;
	this.isFrameLoaded = false;
	this.isConnectionError = false;

	this.initialize();
};

bc.ApiFrame.prototype.initialize = function() {
	if(!this.frame) {
		this.frame = bc.util.createElement('iframe',
			{
				class: 'bc-api-frame',
				src: 'about:blank',
				frameborder: 0,
				style: 'float: right; width: 1px; height: 1px; visibility: hidden'
			}
		);
		document.body.appendChild(this.frame);
	}
	if(this.frame) {
		this.frame.setAttribute('src', this.frameOrigin + '/aid/' + this.accountId + '/ext/api/apiframe.html');
	}

	var scope = this;
	var receiveApiMessageListener = function(event) {
		scope._receiveApiMessage(event);
	};
	if(window.addEventListener) {
		window.addEventListener('message', receiveApiMessageListener);
	} else {
		window.attachEvent('message', receiveApiMessageListener);
	}
};


/**
 * Sets the listener for oss messages.
 * @param {function} listener - The listener for messages
 */
bc.ApiFrame.prototype.setMessageListener = function(listener) {
	this.messageListener = listener;
};

/**
 * Receiver method that is called when a new message arrives from the iframe that sends api responses and websocket messages.
 * @param {object} event - The message event
 * @private
 */
bc.ApiFrame.prototype._receiveApiMessage = function(event) {
	if(event.origin === this.frameOrigin) {
		var message = {};
		try {
			message = JSON.parse(event.data);
		} catch(error) {
			//TODO: We are just logging the errors to the console, but as a customer, you may want to log this information to your server.
			bc.util.log(event.data, true);
			bc.util.log(error, true);
		}

		var method = message.method;
		if(method) {
			if(method === 'loaded') {
				var i = this.frameLoadQueue.shift();
				this.isFrameLoaded = true;
				while(i) {
					this._callRestObj(i);
					i = this.frameLoadQueue.shift();
				}
			} else if(this.frameLoadQueue.length > 0 && method === 'reconnected') {
				bc.util.log('** We are RECONNECTED', false, rest);
				var i = this.frameLoadQueue.shift();
				this.isConnectionError = false;
				var scope = this;
				while(i) {
					bc.util.log('** Attempting CallRestObj again', false, i);
					(function(i) {
						setTimeout(function() {
							scope._callRestObj(i);
						}, 250);
					})(i);
					i = this.frameLoadQueue.shift();
				}
				this.messageListener(message.method, message.params, message.id);
			} else if(method === 'reconnecting') {
				bc.util.log('** RECONNECTING');
			} else {
				this.messageListener(message.method, message.params, message.id);
			}
		} else {
			var rest = this.framePendingResults[message.id];
			if(rest) {
				if(!message.error) {
					this.framePendingResults[message.id] = null;
					rest.callback.finished(message);
				} else {
					this.isConnectionError = true;
					this.frameLoadQueue.push(rest);
					bc.util.log('** adding to frameLoadQueue : _receiveApiMessage', false, rest);
				}
			}
		}
	}
};

bc.ApiFrame.prototype.call = function(method, params) {
	return this._callRestObj({
		request: {
			method: method,
			params: params,
			id: this.id++
		},
		callback: new bc.Rpc()
	});
};

bc.ApiFrame.prototype._callRestObj = function(rest) {
	if(this.isFrameLoaded && !this.isConnectionError) {
		this.frame.contentWindow.postMessage(JSON.stringify(rest.request), this.frameOrigin);
		this.framePendingResults[rest.request.id] = rest;
	} else {
		// iFrame isn't loaded yet, queue the request, they will be called when it is ready.
		this.frameLoadQueue.push(rest);
		bc.util.log('** adding to frameLoadQueue : _callRestObj', false, rest);
	}
	return rest.callback;
};
