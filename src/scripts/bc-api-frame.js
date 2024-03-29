var bc = window.bc = (window.bc || {});

/**
 * Initializes a communication frame for the boldchat api to make requests and receive oss messages.
 * @param {string} accountId - The accountid for the customer
 * @param {HTMLElement} [frame] - An iframe element
 * @param {string} serverSet - The server set where the account resides (currently 'eu' for EU and empty for US)
 * @constructor
 */
bc.ApiFrame = function (accountId, frame, serverSet) {
  var isConfigServerSetDefined = !!bc.config.serverSet || bc.config.serverSet === '';
  var ss = isConfigServerSetDefined ? bc.config.serverSet : (serverSet || '');
  var ssHasDomain = /[0-9a-zA-Z-]*\.(boldchat|bold360)\.(io|com)(:[0-9]+)?$/.test(ss);

  this.accountId = accountId;
  this.frame = frame;
  this.frameLoadQueue = [];
  this.framePendingResults = {};
  this.serverSet = ss;
  this.frameOrigin = 'https://api' + this.serverSet + (ssHasDomain ? '' : '.boldchat.com');
  this.messageListener = null;
  this.id = 1;
  this.isFrameLoaded = false;
  this.retryTimeout = 15000;
  this._retryInterval = null;

  this.initialize();
};

bc.ApiFrame.frameClass = 'bc-api-frame';

bc.ApiFrame.prototype.initialize = function () {
  this.frame = this.initFrame(this.frame, this.frameOrigin, this.accountId);

  var scope = this;
  this._receiveApiMessageListener = function (event) {
    scope._receiveApiMessage(event);
  };
  // TODO: Cleanup dead code due to old browser support
  if (window.addEventListener) {
    window.addEventListener('message', this._receiveApiMessageListener);
  } else {
    window.attachEvent('message', this._receiveApiMessageListener);
  }
};

bc.ApiFrame.prototype.initFrame = function (frame, frameOrigin, accountId) {
  if (!frame) {
    frame = bc.util.createElement('iframe', {
      class: bc.ApiFrame.frameClass,
      frameborder: 0,
      style: 'float: right; width: 1px; height: 1px; visibility: hidden'
    });
    document.body.appendChild(frame);
  }
  frame.setAttribute('src', frameOrigin + '/aid/' + accountId + '/ext/api/apiframe.html?ver=2');
  return frame;
};


/**
 * Sets the listener for oss messages.
 * @param {function} listener - The listener for messages
 */
bc.ApiFrame.prototype.setMessageListener = function (listener) {
  this.messageListener = listener;
};

/**
 * Receiver method that is called when a new message arrives from the iframe that sends api responses and websocket messages.
 * @param {object} event - The message event
 * @private
 */
bc.ApiFrame.prototype._receiveApiMessage = function (event) {
  if (event.origin === this.frameOrigin && event.source === this.frame.contentWindow) {
    var message = {};
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      //TODO: We are just logging the errors to the console, but as a customer, you may want to log this information to your server.
      bc.util.log(event.data, true);
      bc.util.log(error, true);
      return
    }

    var method = message.method;
    if (method) {
      if (method === 'loaded') {
        var i = this.frameLoadQueue.shift();
        this.isFrameLoaded = true;
        while (i) {
          this._callRestObj(i);
          i = this.frameLoadQueue.shift();
        }

        var context = this;
        this._retryInterval = setInterval(function () {
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
      if (pending) {
        if (message.error) {
          bc.util.log('** pending failed : _receiveApiMessage', message, pending);
        }

        if (!message.error || (pending.rest && pending.rest.skipRetry)) {
          delete this.framePendingResults[message.id];
          pending.rest.callback.finished(message);
        } else {
          bc.util.log('** pending failed : _receiveApiMessage', message, pending);
          pending.rest.callback.finished(message);
          if (pending.tries >= 2 ||
            (pending.rest && pending.rest.skipRetry)) {
            delete this.framePendingResults[message.id];
          }
        }
      }
    }
  }
};

bc.ApiFrame.prototype.call = function (method, params, skipRetry) {
  return this._callRestObj({
    request: {
      method: method,
      params: params,
      id: this.id++
    },
    skipRetry: skipRetry,
    callback: new bc.Rpc()
  });
};

bc.ApiFrame.prototype._callRestObj = function (rest, tries) {
  if (this.isFrameLoaded) {
    if (rest.request.method !== 'connect' && rest.request.method !== 'disconnect' && rest.request.method !== 'tryReconnect') {
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

bc.ApiFrame.prototype.openStream = function(client) {
  this.call('connect', client);
};

bc.ApiFrame.prototype.closeStream = function() {
  this.call('disconnect', {});
};

bc.ApiFrame.prototype.tryReconnect = function() {
  this.call('tryReconnect', {});
};

bc.ApiFrame.prototype.destroy = function () {
  var self = this;
  if (this._retryInterval) {
    clearInterval(this._retryInterval);
    this._retryInterval = null;
  }
  this.closeStream();

  // Wait for WS to close properly
  setTimeout(function() {
    if (window.removeEventListener) {
      window.removeEventListener('message', self._receiveApiMessageListener);
    } else {
      window.detachEvent('message', self._receiveApiMessageListener);
    }
    try {
      self.frame.parentNode.removeChild(self.frame);
    } catch (e) {
      bc.util.log('Cannot remove API frame', true);
    }
    self.isFrameLoaded = false;
    self.frame = null;
  }, 100);
};
