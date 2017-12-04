var bc = window.bc = (window.bc || {});

bc.setConfig = function(config, chatParams, visitInfo) {
	var configCookieValue = bc.util.readCookie(bc.config.configCookie);
	if(configCookieValue) {
		bc.config = JSON.parse(configCookieValue);
	} else if(config) {
		if(bc.config.onChatClosed) {
			config.onChatClosed = bc.config.onChatClosed;
		}
		if(bc.config.onChatCreated) {
			config.onChatCreated = bc.config.onChatCreated;
		}
		if(bc.config.onChatStarted) {
			config.onChatStarted = bc.config.onChatStarted;
		}
		if(bc.config.onMessageArrived) {
			config.onMessageArrived = bc.config.onMessageArrived;
		}
		if(bc.config.onOperatorTyping) {
			config.onOperatorTyping = bc.config.onOperatorTyping;
		}
		if(bc.config.onChatEnded) {
			config.onChatEnded = bc.config.onChatEnded;
		}
		if(bc.config.onChatClosed) {
			config.onChatClosed = bc.config.onChatClosed;
		}
		bc.config = config;
		bc.util.createCookie(bc.config.configCookie, JSON.stringify(bc.config), 0.8);
	}
	bc.startSession(chatParams, visitInfo, null);
};
