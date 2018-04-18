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
 updateActiveAssist - when the active assist status has been updated

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
 .acceptActiveAssist() - Accepts the current active assist
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
	var parts = auth.split(':');
	var aid = parts[0];
	var serverSet = null;

	if (parts.length > 3) {
		serverSet = '-' + parts[3];
		auth = parts.slice(0,3).join(':');
	}

	auth = bc.util.base64(auth);

	var apiFrame = new bc.ApiFrame(aid, null, serverSet);

	var events = ['updateChat', 'updateTyper', 'addMessage', 'autoMessage', 'updateBusy', 'beginActiveAssist', 'updateActiveAssist', 'reconnecting', 'chatEndedByOp', 'chatEnded', 'closed'];
	bc.subscriber(this, events);

	var scope = this;
	var chatKey = bc.util.readCookie(bc.config.chatCookie);
	var sessionStorage = null;
	var state = chatKey ? 'started' : 'create';
	var clientID = null;
	var activeAssistID = null;

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
		bc.util.createCookie(bc.config.chatCookie, chatKey, 0.08);

		clientID = client.ClientID;

		apiFrame.call('connect', client);

		if(client.Brandings) {
			sessionStorage.setBrandings(client.Brandings);
		}
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
	};

	messageHandlers.updateActiveAssist = function(params) {
		var values = params.Values;
		if(values.Ended) {
			activeAssistID = null;
		}
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

		var params = {
			VisitorID: visitorID,
			Language: language,
			IncludeBrandingValues: true,
			SkipPreChat: skipPreChat,
			Data: JSON.stringify(data),
			Secured: secured,
			ButtonID: button,
			ChatUrl: url,
			CustomUrl: customUrl
		};

		var recoverParams = parseChatRecoverCookie();
		if (recoverParams) {
			params.ChatKey = recoverParams.chatKey;
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

				state = result.UnavailableReason ? 'unavailable' : result.PreChat ? 'prechat' : 'started';
				if(state === 'started') {
					onStart(result);
				}
				schedulePingChat();
			});
	};

	scope.cancelChat = function() {
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

	scope.finishChat = function() {
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

				bc.util.eraseCookie(bc.config.chatCookie);
				bc.util.eraseCookie(bc.config.configCookie);
				state = result.PostChat ? 'postchat' : 'done';
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

		return callStream('acceptActiveAssist', {ClientID: clientID, ActiveAssistID: activeAssistID})
			.failure(onFailure);
	};

	scope.cancelActiveAssist = function() {
		return callStream('cancelActiveAssist', {ClientID: clientID, ActiveAssistID: activeAssistID})
			.failure(onFailure);
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

	function parseChatRecoverCookie() {
		var value = bc.util.readRawCookie(bc.config.chatRecoverCookie);
		if(value) {
			var parts = value.split(':');
			return {
				chatKey: parts[0]
			};
		}
		return null;
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

	if(window.addEventListener) {
		window.addEventListener('beforeunload', handleUnload, false);
	} else {
		window.attachEvent('onbeforeunload', handleUnload);
	}

	return scope;
};
