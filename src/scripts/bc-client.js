/* bc.VisitorClient
 <constructor> (auth) - Creates the visitor client with the given authorization token

 Events: (All events happen only during a started chat)
 reconnecting - when the client does not think it is connected
 closed - when the chat client has been closed and is no longer active
 updateChat - when the active chat is updated
 updateTyper - when a typer status is updated
 addMessage - when a message is added
 autoMessage - when an auto message happens
 updateBusy - when the busy queue message is updated
 beginActiveAssist - when an active assist was initiated by the operator
 resumeActiveAssist - when active assist should be resumed (e.g. page was reloaded)
 updateActiveAssist - when the active assist status has been updated
 beginRemoteControl - when remote control session is initiated by the operator

 .createChat(visitorID, language, skipPreChat, data, secured) - Create the chat session
 .changeLanguage(language) - Changes the language of the pre-chat form
 .submitPreChat(data) - Submit the pre-chat with the given form information
 .submitUnavailableForm(from, subject, body) - Submit the unavailable form with the given information
 .finishChat() - Finish the chat and go to the post-chat form if there is one
 .getUnavailableForm() - Finish the chat and get the unavailable email form
 .submitPostChat(data) - Submit the post chat data

 .visitorTyping(isTyping) - Sets the typing status of the visitor
 .sendMessage(name, message) - Sends the given message as the given name
 .emailChatHistory(email) - Schedules the chat transcript to be emailed later
 .acceptActiveAssist() - Accepts the active assist request
 .declineActiveAssist() - Declines the active assist request
 .cancelActiveAssist() - Cancels the current active assist

 All methods return bc.Rpc objects to handle success/failure results

 .getMessages() - Gets the currrent list of all messages in the chat history


 On creation, a global in bc.instance is set
 */

/* bc.Rpc object for handling rpc call results
 Events:
 success (result) - The results on success
 failure (message) - The message on failure
 */
var bc = window.bc = (window.bc || {});

/* bc.subscriber - Utility function to add event handling methods to the given object for the given events */
bc.subscriber = function(subscriberObject, events) {
  var subscribers = {};
  subscriberObject.subscribe = function(name, callback) {
    subscribers[name] = subscribers[name] || [];
    subscribers[name].push(callback);
    return subscriberObject;
  };
  subscriberObject.unsubscribe = function(name, callback) {
    for(var i = 0; subscribers[name] && i < subscribers[name].length; i++) {
      if(subscribers[name][i] === callback) {
        subscribers[name].splice(i, 1);
      }
    }
    return subscriberObject;
  };
  subscriberObject.fireEvent = function(eventName) {
    var args = Array.prototype.slice.call(arguments, 1);
    var eventSubscribers = subscribers[eventName];
    for(var i = 0; eventSubscribers && i < eventSubscribers.length; i++) {
      if(bc.config.throwErrors) {
        eventSubscribers[i].apply(subscriberObject, args);
      }
      else {
        try {
          eventSubscribers[i].apply(subscriberObject, args);
        } catch(e) {
          bc.util.log(e);
        }
      }
    }
    return subscriberObject;
  };
  for(var eventIndex = 0; eventIndex < events.length; eventIndex++) {
    subscriberObject[events[eventIndex]] = (function() {
      var event = events[eventIndex];
      return function(callback) {
        return subscriberObject.subscribe(event, callback);
      };
    })();
  }
};

bc.Rpc = function() {
  var scope = this;
  bc.subscriber(scope, ['success', 'failure']);
  scope.finished = function(response) {
    if(response && (response.error || response.Status === 'error' || response.result && response.result.Status === 'error')) {
      scope.fireEvent('failure', response.error || response.result && response.result.Message || response.Message);
    }
    else {
      scope.fireEvent('success', response && response.result || response);
    }
  };
  return scope;
};

bc.RpcError = function(message) {
  var scope = this;
  scope.success = function() {
    return scope;
  };
  scope.failure = function(handler) {
    handler(message);
    return scope;
  };
  return scope;
};

bc.VisitorClient = function(auth) {
  var scope = this;

  scope.createAuthParamParts = function(auth) {
    var parts = auth;
    var aidPart = auth;
    if(auth.indexOf(';') > -1) {
      parts = auth.split(';');
      aidPart = parts[0].split(':')[1];
    } else if(auth.indexOf(':') > -1) {
      parts = auth.split(':');
      aidPart = parts[0];
    } else {
      // because auth is a string and if you return it as a string instead of an array,
      // the assembleAuthParamByAuthorizationType function will check the string's length instead of the number of elements in the array
      parts = [parts];
    }

    return {
      parts: parts,
      aid: aidPart
    };
  };

  scope.assembleAuthParamByAuthorizationType = function(auth) {
    var authParamParts = this.createAuthParamParts(auth);
    var aid = authParamParts.aid;
    var serverSet = null;

    // if authentication is done via chat api key then the format is either 3 or 4 long where 4 long format contains the serverset
    // otherwise if the key format is 8 long then authentication is done via private account key and we process it on the backend part
    if(authParamParts.parts.length >= 3 && authParamParts.parts.length <= 4) {
      if(authParamParts.parts.length === 4) {
        serverSet = '-' + authParamParts.parts[3];
        auth = authParamParts.parts.slice(0, 3).join(':');
      }
      auth = bc.util.base64(auth);
    } else if(authParamParts.parts.length === 8) {
      serverSet = authParamParts.parts[7].split(':')[1];
      auth = authParamParts.parts.slice(0, 7).join(';');
    }

    return {
      aid: aid,
      auth: auth,
      serverSet: serverSet
    };
  };

  var authParams = this.assembleAuthParamByAuthorizationType(auth);
  auth = authParams.auth;

  var existingBcFrames = document.getElementsByClassName(bc.ApiFrame.frameClass) || [];
  var apiFrame = new bc.ApiFrame(authParams.aid, existingBcFrames[0], authParams.serverSet);

  var events = [
    'updateChat',
    'updateTyper',
    'addMessage',
    'autoMessage',
    'updateBusy',
    'beginActiveAssist',
    'resumeActiveAssist',
    'updateActiveAssist',
    'remoteControlMessage',
    'beginRemoteControl',
    'reconnecting',
    'chatEndedByOp',
    'chatEnded',
    'closed'
  ];

  var windowParameterMapping = {
    lc: 'language',
    vn: 'first_name',
    ln: 'last_name',
    vp: 'phone',
    ve: 'email',
    iq: 'initial_question',
    vr: 'reference',
    vi: 'information'
  };

  var operationStateEnum = {
    coBrowsePrompt: 1,
    coBrowseActive: 2,
    remoteControlPrompt: 3
  };

  bc.subscriber(this, events);

  var chatKey = getActiveChatKey();
  var sessionStorage = null;
  var state = chatKey ? 'started' : 'create';
  var clientID = null;
  var activeAssistID = null;
  var remoteControlData = null;

  var callStream = function(method, obj) {
    if(chatKey) {
      obj.ChatKey = chatKey;
    }
    obj.auth = auth;
    obj.stream = true;
    return apiFrame.call(method, obj);
  };

  var call = function(method, obj) {
    if(chatKey) {
      obj.ChatKey = chatKey;
    }
    obj.auth = auth;
    return apiFrame.call(method, obj);
  };

  var onStart = function(client) {
    if(isCurlInSessionStorage()) {
      window.sessionStorage.setItem(bc.config.chatCookie, chatKey);
    } else {
      bc.util.createCookie(bc.config.chatCookie, chatKey, 0.08);
    }

    clientID = client.ClientID;

    apiFrame.call('connect', client);

    if(client.Brandings) {
      sessionStorage.setBrandings(client.Brandings);
    }

    sessionStorage.setClientData(client);

    // async operation is required to wait until bc.ViewManager will be initialized
    setTimeout(function() {
      scope._resumeOperation();
    }, 1);
  };

  var onFinish = function() {
    apiFrame.call('disconnect', {});

    activeAssistID = null;
    clientID = null;

    scope.fireEvent('closed');
  };

  var onFailure = function(message) {
    bc.util.log(message);
  };

  var messageHandlers = {};
  var chat = null;
  var people = {};
  var finishing = false;


  scope.hasChatKey = function() {
    return !!chatKey;
  };

  scope.getChatParams = function() {
    return sessionStorage && sessionStorage.getChatParams() || {};
  };

  scope.addChatParams = function(data) {
    sessionStorage.addChatParams(data);
  };

  scope.setChatWindowSettings = function(data) {
    sessionStorage.setChatWindowSettings(data);
  };

  scope.getChatWindowSettings = function() {
    return (sessionStorage && sessionStorage.getChatWindowSettings()) || {};
  };

  scope.getVisitInfo = function() {
    return sessionStorage && sessionStorage.getVisitInfo() || {};
  };

  scope.addVisitInfo = function(data) {
    sessionStorage.addVisitInfo(data);
  };

  scope.updateVisitInfo = function(data) {
    sessionStorage.addVisitInfo(data);
  };

  scope.getMessages = function() {
    return sessionStorage.getMessages();
  };

  scope.getPerson = function(personId) {
    return people[personId] || sessionStorage.getPeople()[personId] || {};
  };

  scope.getChat = function() {
    return chat;
  };

  scope.getPostChatFormIfAvail = function() {
    scope.finishChat().success(function(data) {
      scope.fireEvent('chatEnded', data);
    });
  };

  scope.getLastMessageId = function() {
    return sessionStorage.getLastMessageId();
  };

  scope.isMinimized = function() {
    return sessionStorage && sessionStorage.getMinimizedStatus();
  };

  scope.changeMinimizedStatus = function(isMinimized) {
    return sessionStorage.changeMinimizedStatus(isMinimized);
  };

  scope.chatContainsStatusMessage = false;
  var updateOperatorMessageFlag = function(data) {
    if(!scope.chatContainsStatusMessage && data.PersonType && data.PersonType === 'operator') {
      scope.chatContainsStatusMessage = true;
    }
  };

  messageHandlers.updateChat = function(params) {
    var values = params.Values;
    chat = chat || {};
    for(var i in values) {
      if(values.hasOwnProperty(i)) {
        chat[i] = values[i];
      }
    }
  };

  messageHandlers.updateTyper = function(params) {
    updatePerson(params);
  };

  messageHandlers.addMessage = function(params) {
    bc.util.log('Received a message from the server', false, params);
    var values = params.Values;
    var id = params.MessageID;
    updateOperatorMessageFlag(values);
    sessionStorage.addMessage(id, values);
    updatePerson(params);
  };

  messageHandlers.autoMessage = function() {
  };

  messageHandlers.updateBusy = function(params) {
    bc.util.log('Received an updateBusy message from the server: ', false, params);
    sessionStorage.setQueueIndicator(params);
  };

  messageHandlers.beginActiveAssist = function(params) {
    activeAssistID = params.ActiveAssistID;
    sessionStorage.setClientData({ ActiveAssistID: activeAssistID, operationState: operationStateEnum.coBrowsePrompt });
  };

  messageHandlers.resumeActiveAssist = function() {
  };

  messageHandlers.updateActiveAssist = function(params) {
    var values = params.Values;
    if(values.Ended) {
      activeAssistID = null;
      sessionStorage.setClientData({ ActiveAssistID: null, operationState: null });
    }
  };

  messageHandlers.remoteControlMessage = function(params) {
    if (typeof params === 'string') {
      params = JSON.parse(params);
    }

    if (params.command === 'ended') {
      remoteControlData = null;
      sessionStorage.setClientData({ remoteControlData: null, operationState: null });
      return;
    }

    remoteControlData = params;
    if (params.command === 'started') {
      sessionStorage.setClientData({ remoteControlData: remoteControlData, operationState: operationStateEnum.remoteControlPrompt });
      scope.fireEvent('beginRemoteControl');
    }
  };

  messageHandlers.beginRemoteControl = function() {
  };

  messageHandlers.startChat = function() {
    if(state === 'started' && !finishing) {
      scope.startChat();
    }
  };

  messageHandlers.finishChat = function() {
    bc.util.log('messageHandler.finishChat');
    if(state === 'started' && !finishing) {
      scope.fireEvent('chatEndedByOp');
    }
  };

  messageHandlers.chatEndedByOp = function() {
    bc.util.log('client:messageHandlers.chatEndedByop');
  };

  messageHandlers.chatEnded = function() {
    bc.util.log('chatEnded');
  };

  messageHandlers.reconnecting = function() {
    scope.fireEvent('reconnecting');
  };

  scope.handleMessage = function(method, params) {
    bc.util.log('messageHandler.handleMessage:method = ', false, method);
    bc.util.log('messageHandler.handleMessage:params = ', false, params);
    var handler = messageHandlers[method];
    if(handler) {
      handler(params);
    }
    scope.fireEvent(method, params);
  };

  apiFrame.setMessageListener(scope.handleMessage);


  scope.getChatAvailability = function(visitorId) {
    return call('getChatAvailability', {VisitorId: visitorId || null})
      .failure(onFailure);
  };

  scope.createChat = function(visitorID, language, skipPreChat, data, secured, button, url, customUrl) {
    if(state !== 'create') {
      return new bc.RpcError('You can only call createChat once');
    }

    var bcConfig = window.bcConfig || {};
    var bcPost = bcConfig.post || {};
    var secureParam =
      secured ||
      (bcPost.secured && bcPost.secured.length ? bcPost.secured[0] : undefined) ||
      (bcPost.localsecured && bcPost.localsecured.length ? bcPost.localsecured[0] : undefined);

    // TODO: when this new feature switch is turned on for bot chats the always-true expression can be fixed
    if(true || bcConfig.collectWindowParametersFromPageView) {
      data = bc.util.objectAssign({}, getWindowParameters(), data);
    }

    var params = {
      VisitorID: visitorID,
      Language: language,
      IncludeBrandingValues: true,
      IncludeLayeredBrandingValues: false,
      SkipPreChat: skipPreChat,
      Data: JSON.stringify(data),
      Secured: secureParam,
      ButtonID: button,
      ChatUrl: url,
      CustomUrl: customUrl,
      IncludeChatWindowSettings: true
    };

    var activeChatParams = getChatKeyFromCurl();
    if(activeChatParams) {
      params.ChatKey = activeChatParams.chatKey;
    }

    return call('createChat', params)
      .failure(onFailure)
      .success(function(result) {
        if(typeof bc.setOverrides === 'function') {
          bc.setOverrides();
        }
        chatKey = result.ChatKey;
        sessionStorage = new bc.SessionStorage(chatKey);
        sessionStorage.setBrandings(result.Brandings);
        sessionStorage.setClientData(result);

        state = result.UnavailableReason ? 'unavailable' : result.PreChat ? 'prechat' : 'started';
        if(state === 'started') {
          onStart(result);
        }
        schedulePingChat();
      });
  };

  scope.cancelChat = function() {
    scope.destroyChatSession();
  };

  scope.destroyChatSession = function() {
    window.sessionStorage && window.sessionStorage.removeItem(bc.config.chatCookie);
    bc.util.eraseCookie(bc.config.chatCookie);
    bc.util.eraseCookie(bc.config.configCookie);
  };

  scope.submitUnavailableEmail = function(from, subject, body) {
    if(state !== 'unavailable') {
      return new bc.RpcError('You can only submit the unavailable form on the unavailable form');
    }
    return call('submitUnavailableEmail', {From: from, Subject: subject, Body: body})
      .failure(onFailure)
      .success(function() {
        state = 'unavailable_submitted';
      });
  };

  scope.submitPreChat = function(data) {
    if(state !== 'prechat') {
      return new bc.RpcError('You can only submit a pre chat when on the pre chat');
    }
    return call('submitPreChat', {Data: JSON.stringify(data)})
      .failure(onFailure)
      .success(function(result) {
        state = result.UnavailableReason ? 'unavailable' : result.PreChat ? 'prechat' : 'started';
        if(state === 'started') {
          onStart(result);
        }
      });
  };

  scope.changeLanguage = function(language) {
    if(state !== 'prechat') {
      return new bc.RpcError('You can only change language on the pre chat form');
    }
    return call('changeLanguage', {Language: language})
      .failure(onFailure)
      .success(function(data) {
        if(data.Brandings) {
          sessionStorage.setBrandings(data.Brandings);
        }
      });
  };

  scope.startChat = function() {
    if(state !== 'started' && !chatKey) {
      window.sessionStorage && window.sessionStorage.removeItem(bc.config.chatCookie);
      bc.util.eraseCookie(bc.config.chatCookie);
      return new bc.RpcError('You can only start a chat once it is started (needs a chat key from createChat)');
    }
    apiFrame.call('disconnect', {});

    if(typeof bc.setOverrides === 'function') {
      bc.setOverrides();
    }

    var params = {};

    if(!sessionStorage && chatKey) {
      sessionStorage = new bc.SessionStorage(chatKey);
      if(!sessionStorage.getBrandings()) {
        params.IncludeBrandingValues = true;
      }

      var messages = sessionStorage.getMessages();
      // Try to load from storage, if this load fails the server will re-send all the messages.
      try {
        for(var i = 0; i < messages.length; i++) {
          updateOperatorMessageFlag(messages[i]);
          messages[i].IsReconstitutedMsg = true;
          scope.fireEvent('addMessage', {MessageID: messages[i].MessageID, Values: messages[i]});
        }
        params.LastChatMessageID = sessionStorage.getLastMessageId();
      } catch(error) {
        bc.util.log(error, true);
      }

      var queueIndicator = sessionStorage.getQueueIndicator();
      try {
        var data = {
          Position: queueIndicator.Position,
          UnavailableFormEnabled: queueIndicator.UnavailableFormEnabled
        };
        scope.fireEvent('updateBusy', data);
      } catch(error) {
        bc.util.log(error, true);
      }
    }

    if(!pingChatCheck) {
      schedulePingChat();
    }

    return call('startChat', params)
      .success(onStart)
      .failure(function(message) {
        window.sessionStorage && window.sessionStorage.removeItem(bc.config.chatCookie);
        bc.util.eraseCookie(bc.config.chatCookie);
        onFailure(message);
      });

  };

  scope.visitorTyping = function(isTyping) {
    if(state !== 'started') {
      return new bc.RpcError('You cannot change typing state if the chat is not active');
    }

    return callStream('visitorTyping', {IsTyping: isTyping})
      .failure(onFailure);
  };

  scope.sendMessage = function(name, message, messageId) {
    if(state !== 'started') {
      return new bc.RpcError('You cannot send messages if the chat is not active');
    }

    var msgObj = {
      Name: name,
      Message: message,
      ChatMessageID: messageId || bc.util.getId()
    };

    return callStream('sendMessage', msgObj)
      .failure(function(message) {
        onFailure('bc-client.sendMessage error:');
        onFailure(message);
      });
  };

  scope.emailChatHistory = function(email) {
    if(state !== 'started' && state !== 'postchat' && state !== 'done') {
      return new bc.RpcError('You cannot email the chat before it is started');
    }

    return callStream('emailChatHistory', {EmailAddress: email})
      .failure(onFailure);
  };

  scope.finishChat = function(skipPostChat) {
    if(state !== 'started') {
      stopPingChatLoop();
      return new bc.RpcError('You cannot finish the chat unless it is started');
    }
    finishing = true;

    return call('finishChat', {ClientID: clientID})
      .failure(function(message) {
        stopPingChatLoop();
        onFailure(message);
      })
      .success(function(result) {
        onFinish();
        window.sessionStorage && window.sessionStorage.removeItem(bc.config.chatCookie);
        bc.util.eraseCookie(bc.config.chatCookie);
        bc.util.eraseCookie(bc.config.configCookie);
        state = (result.PostChat && !skipPostChat) ? 'postchat' : 'done';
      });
  };

  scope.getUnavailableForm = function() {
    if(state !== 'started') {
      return new bc.RpcError('You cannot get the unavailable form unless the chat has started');
    }
    finishing = true;

    return call('getUnavailableForm', {ClientID: clientID})
      .failure(onFailure)
      .success(function() {
        onFinish();

        state = 'unavailable';
      });
  };

  scope.acceptActiveAssist = function() {
    if(!activeAssistID) {
      return new bc.RpcError('There is no active assist to accept');
    }

    sessionStorage.setClientData({ operationState: operationStateEnum.coBrowseActive });
    return callStream('acceptActiveAssist', {ClientID: clientID, ActiveAssistID: activeAssistID})
      .failure(onFailure);
  };

  scope.declineActiveAssist = function() {
    sessionStorage.setClientData({ ActiveAssistID: null, operationState: null });
    return callStream('declineActiveAssist', {ClientID: clientID, ActiveAssistID: activeAssistID})
      .failure(onFailure);
  };

  scope.cancelActiveAssist = function() {
    sessionStorage.setClientData({ ActiveAssistID: null, operationState: null });
    return callStream('cancelActiveAssist', {ClientID: clientID, ActiveAssistID: activeAssistID})
      .failure(onFailure);
  };

  scope.acceptRemoteControl = function() {
    if (remoteControlData) {
      var targetURL = remoteControlData.appletUrl.replace(/\$\{REBOOT_URL\}/g, encodeURIComponent(location.href));
      location.href = targetURL;
    } else {
      bc.util.log('remoteControlData is not available');
    }
  };

  scope.declineRemoteControl = function() {
    sessionStorage.setClientData({ remoteControlData: null, operationState: null });
    bc.util.log('declineRemoteControl is not available for HTML-Chat-SDK');
    remoteControlData = null;
  };

  scope.cancelRemoteControl = function() {
    sessionStorage.setClientData({ remoteControlData: null, operationState: null });
    bc.util.log('cancelRemoteControl is not available for HTML-Chat-SDK');
    remoteControlData = null;
  };

  scope.submitPostChat = function(data) {
    if(state !== 'postchat') {
      return new bc.RpcError('Cannot call post chat when not on the post chat');
    }

    return call('submitPostChat', {Data: JSON.stringify(data)})
      .failure(onFailure)
      .success(function(result) {
        state = result.PostChat ? 'postchat' : 'done';
      });
  };

  scope.getState = function() {
    return state;
  };

  scope.isStarted = function() {
    return state === 'started';
  };

  scope.setState = function(overrideState) {
    state = overrideState;
  };

  scope.getBrandings = function() {
    return sessionStorage.getBrandings();
  };

  scope.sendFile = function(file, onSuccess, onError, onProgress) {
    var ssHasDomain = /[0-9a-zA-Z-]*\.(boldchat|bold360)\.(io|com)(:[0-9]+)?$/.test(apiFrame.serverSet);
    var host = 'https://upload' + apiFrame.serverSet + (ssHasDomain ? '' : '.boldchat.com');
    var client = sessionStorage.getClientData();
    var chatId = client.ChatID;

    var api = {
      put: scope._put,
      post: scope._post,
      upload: scope._upload
    };

    var usr = {
      accountId: client.WebSocketURL.match(/\/aid\/(\d+)/i)[1],
      clientId: client.ClientID,
      personId: client.VisitorID,
      personType: bc.UploadModule.PersonType.Visitor
    };

    var config = {
      fileUploadHost: host
    };

    var service = new bc.UploadModule.FileUploadService(config, api, usr);

    service.queueFile(file, chatId);
    service
      .initiateUpload()
      .then(function() {
        return service.uploadFile(onProgress);
      })
      .then(function() {
        return service.sendFile();
      })
      .then(onSuccess)
      .catch(onError);

    return service;
  };

  var pingChatCheck = null;
  var schedulePingChat = function(time) {
    pingChatCheck = setTimeout(function() {
      pingChatLoop();
    }, time || 30000);
  };

  var stopPingChatLoop = function() {
    bc.util.log('Stopping ping chat loop');
    clearTimeout(pingChatCheck);
  };

  var failures = 0;
  var pingChatLoop = function() {
    if(state !== 'create' && state !== 'done') {
      return call('pingChat', {Closed: false})
        .success(function() {
          schedulePingChat(30000);
          failures = 0;
          // TODO: process chat recovery
        })
        .failure(function() {
          failures++;
          if(failures < 50) {
            schedulePingChat(5000);
          }
        });

    } else {
      bc.util.log('Exiting ping chat loop state = ' + state);
      clearTimeout(pingChatCheck);
      pingChatCheck = null;
    }

  };

  var handleUnload = function() {
  };

  var updatePerson = function(data) {
    var personID = data.Values ? data.Values.PersonID || data.PersonID : data.PersonID;
    if(data.Values && personID) {
      people[personID] = people[personID] || sessionStorage.getPeople()[personID] || {};
      if(data.Values.ImageURL) {
        people[personID].Avatar = data.Values.ImageURL;
      }
      if(data.Values.Name) {
        people[personID].Name = data.Values.Name;
      }
      sessionStorage.setPeople(people);
    }
  };

  function getChatKeyFromCurl() {
    var value = window.sessionStorage && window.sessionStorage.getItem(bc.config.chatRecoverCookie);
    if (!value) {
      value = bc.util.readRawCookie(bc.config.chatRecoverCookie);
    }

    if(value) {
      var parts = value.split(':');
      return {
        chatKey: parts[0]
      };
    }
    return null;
  }

  function getActiveChatKey() {
    var value = window.sessionStorage && window.sessionStorage.getItem(bc.config.chatCookie);
    if (!value) {
      value = bc.util.readRawCookie(bc.config.chatCookie);
    }

    return value;
  }

  function isCurlInSessionStorage() {
    return !!(window.sessionStorage && window.sessionStorage.getItem(bc.config.chatRecoverCookie));
  }

  function getWindowParameters() {
    if(!window._bcvm || !window._bcvm.pageViewer || !window._bcvm.pageViewer.getParameter) {
      return null;
    }

    var data = {};
    var raw = window._bcvm.pageViewer.getParameter('WindowParameters');
    if(raw) {
      var pairs = raw.split('&');
      for(var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        var name = pair.shift();
        if(isParameterNameValid(name)) {
          name = transformParameterName(name);
          if(pair.length === 0) {
            data[name] = '';
          } else {
            data[name] = decodeURIComponent(pair.join('='));
          }
        }
      }
    }

    return data;
  }

  function isParameterNameValid(name) {
    return name && (name.indexOf('custom_') === 0 || name.indexOf('customField_') === 0 || windowParameterMapping[name]);
  }

  function transformParameterName(name) {
    if(name && name.indexOf('customField_') === 0) {
      return 'custom_' + name.substring('customField_'.length);
    } else if(windowParameterMapping[name]) {
      return windowParameterMapping[name];
    }
    return name;
  }

  scope.setEmailTranscript = function(emailAddress) {
    if(state !== 'started') {
      return new bc.RpcError('You cannot get the unavailable form unless the chat has started');
    }
    if(chatKey) {
      return call('emailChatHistory', {ChatKey: chatKey, EmailAddress: emailAddress})
        .failure(onFailure);
    }
  };

  scope._resumeOperation = function() {
    var clientData = sessionStorage.getClientData();
    activeAssistID = clientData.ActiveAssistID || null;
    remoteControlData = clientData.remoteControlData || null;

    switch (clientData.operationState) {
      case operationStateEnum.coBrowsePrompt:
        scope.fireEvent('beginActiveAssist');
        break;

      case operationStateEnum.coBrowseActive:
        scope.fireEvent('resumeActiveAssist');
        break;

      case operationStateEnum.remoteControlPrompt:
        scope.fireEvent('beginRemoteControl');
        break;
    }
  };

  scope._put = function(url, requestBody, config) {
    return scope._request('PUT', url, requestBody, config);
  };

  scope._post = function(url, requestBody, config) {
    return scope._request('POST', url, requestBody, config);
  };

  scope._upload = function(url, file, progress) {
    var xhr;
    return new Promise(function(resolve, reject) {
      var data = new FormData();
      data.append('file', file);

      xhr = new XMLHttpRequest();
      (xhr.upload || xhr).addEventListener('progress', function(event) {
        if(!progress) {
          return;
        }

        var done = event.position || event.loaded;
        var total = event.totalSize || event.total;
        var position = Math.round(done / total * 100);

        progress(position);
      });
      xhr.addEventListener('load', function(e) {
        if(this.status >= 400) {
          reject();
        } else {
          resolve(this.responseText);
        }
      });
      xhr.addEventListener('error', reject);
      xhr.addEventListener('abort', reject);
      xhr.open('post', url, true);
      xhr.send(data);
    });
  };

  scope._request = function(type, url, requestBody, config) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();

      xhr.addEventListener('load', function(e) {
        if(this.status >= 400) {
          reject({ status: this.status });
        } else {
          var obj = {
            status: this.status,
            data: this.responseText ? JSON.parse(this.responseText) : {}
          };

          resolve(obj);
        }
      });
      xhr.addEventListener('error', reject);
      xhr.addEventListener('abort', reject);
      xhr.open(type, url, true);

      if(config && config.headers) {
        for(var key in config.headers) {
          if(config.headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, config.headers[key]);
          }
        }
      }

      xhr.send(JSON.stringify(requestBody));
    });
  };

  if(window.addEventListener) {
    window.addEventListener('beforeunload', handleUnload, false);
  } else {
    window.attachEvent('onbeforeunload', handleUnload);
  }

  return scope;
};
