var bc = window.bc = (window.bc || {});

/**
 * Creates a session storage instance for storing messages for faster chat window rebuild on page transitions.
 * @param chatKey {string} The chat key of the active chat
 * @constructor
 */
bc.SessionStorage = function(chatKey) {
	var storage;
	var messageIndex = {};

	var isStorageAvailable = function() {
		if(bc.config && !bc.config.messageCache) {
			return false;
		} else {
			try {
				if(bc.config && bc.config.logging) {
					bc.util.log('sessionStorage available: ' + !!window.sessionStorage);
				}
				return !!window.sessionStorage;
			} catch(error) {
				bc.util.log(error, true);
				return false;
			}
		}
	};

	var initialize = function() {
		if(isStorageAvailable()) {
			var storageString;
			try {
				storageString = sessionStorage.bc;
			} catch(error) {
				bc.util.log(error);
			}
			if(storageString) {
				try {
					storage = JSON.parse(storageString);
					for(var i = 0; i < storage.chat.messages.length; i++) {
						if(storage.chat.messages[i].MessageID) {
							messageIndex[storage.chat.messages[i].MessageID] = i;
						}
					}
				} catch(error) {
					bc.util.log('Failed to parse session storage: ' + error);
					sessionStorage.removeItem('bc');
				}
			}
		}
		if(!storage || !storage.chat || storage.chat.chatKey !== chatKey) {
			storage = {
				chat: {
					chatKey: chatKey,
					messages: []
				},
				queueIndicator: {},
				chatParams: {},
				visitInfo: {},
				lastUpdated: new Date(),
				isMinimized: 'false'
			};
		}
	};

	var saveStorage = function() {
		storage.lastUpdated = new Date();
		if(isStorageAvailable()) {
			try {
				sessionStorage.bc = JSON.stringify(storage);
				bc.util.log('Wrote to session storage');
			} catch(error) {
				bc.util.log(error, true);
			}
		}
	};

	/**
	 * Adds a message to the session storage if it is available.
	 * @param {string} messageId
	 * @param {{MessageID: string, Created: object}} message
	 */
	this.addMessage = function(messageId, message) {
		var newMessage = this._clone(message);
		newMessage.MessageID = messageId;

		if(typeof messageIndex[messageId] !== 'undefined') {
			storage.chat.messages[messageIndex[messageId]] = newMessage;
		} else {
			storage.chat.messages.push(newMessage);
			messageIndex[messageId] = storage.chat.messages.length - 1;
			storage.chat.lastMessageId = messageId;
		}
		saveStorage();
	};

	this._clone = function(object) {
		if(typeof object === 'object') {
			var newObject = {};
			for(var i in object) {
				if(object.hasOwnProperty(i)) {
					newObject[i] = object[i];
				}
			}
			return newObject;
		} else {
			return object || {};
		}
	};

	/**
	 * Gets the ID of the last message saved to storage.
	 * @returns {string}
	 */
	this.getLastMessageId = function() {
		return storage.chat.lastMessageId;
	};

	this.getMinimizedStatus = function() {
		return storage.chat.isMinimized;
	};

	this.changeMinimizedStatus = function(isMinimized) {
		storage.chat.isMinimized = isMinimized;
		saveStorage();
	};

	/**
	 * Gets all messages stored for the chat
	 * @returns {*}
	 */
	this.getMessages = function() {
		return storage.chat.messages;
	};

	this.getChatParams = function() {
		return storage.chatParams;
	};

	this.addChatParams = function(data) {
		storage.chatParams = data;
		saveStorage();
	};

	this.getVisitInfo = function() {
		return storage.visitInfo;
	};

	this.addVisitInfo = function(data) {
		storage.visitInfo = data;
		saveStorage();
	};

	this.getQueueIndicator = function() {
		return storage.queueIndicator;
	};

	this.setQueueIndicator = function(queueIndicator) {
		storage.queueIndicator = queueIndicator;
		saveStorage();
	};

	this.setBrandings = function(brandings) {
		storage.chat.brandings = brandings;
		saveStorage();
	};

	this.getBrandings = function() {
		return storage.chat.brandings;
	};

	this.setPeople = function(people) {
		storage.people = people;
		saveStorage();
	};

	this.getPeople = function() {
		return storage.people || {};
	};

	initialize();

};
