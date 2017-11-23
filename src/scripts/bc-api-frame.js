var bc = window.bc = (window.bc || {});

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
	this.retryTimeout = 15000;

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

				var context = this;
				setInterval(function() {
					var current = new Date().getTime();
					for (var i in context.framePendingResults) {
						var pending = context.framePendingResults[i];
						var time = pending.time;
						var wait = Math.min(context.retryTimeout * pending.tries, 60000);
						if (current - time > wait) {
							context._callRestObj(pending.rest, pending.tries);
						}
					}
				}, this.retryTimeout);
			} else {
				this.messageListener(message.method, message.params, message.id);
			}
		} else {
			var pending = this.framePendingResults[message.id];
			if(pending) {
				if(!message.error) {
					delete this.framePendingResults[message.id];
					pending.rest.callback.finished(message);
				} else {
					bc.util.log('** pending failed : _receiveApiMessage', message, pending);
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

bc.ApiFrame.prototype._callRestObj = function(rest, tries) {
	if(this.isFrameLoaded) {
		if (rest.request.method !== 'connect' && rest.request.method !== 'disconnect') {
			this.framePendingResults[rest.request.id] = {time: new Date().getTime(), rest: rest, tries: (tries || 0) + 1};
		}
		try {
			this.frame.contentWindow.postMessage(JSON.stringify(rest.request), this.frameOrigin);
		} catch (e) {
			console.log(e);
		}
	} else {
		// iFrame isn't loaded yet, queue the request, they will be called when it is ready.
		this.frameLoadQueue.push(rest);
		bc.util.log('** adding to frameLoadQueue : _callRestObj', false, rest);
	}
	return rest.callback;
};