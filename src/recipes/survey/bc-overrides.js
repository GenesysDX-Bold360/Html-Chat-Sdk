var bc = window.bc || {};

bc.setOverrides = function() {
	var originalShowForm = bc.currentSession.viewManager.showForm;

	bc.currentSession.viewManager.showForm = function(introLocKey, formDef, invalidFormLocKey, submitLocKey, submitCallback, topField, topFieldLocKey, clearContainer) {
		if(introLocKey === 'api#postchat#intro' || introLocKey === 'api#chat#ended') {
			var thirdPartyIframe = bc.util.createElement('iframe', {src: 'http://boldchat.com', width: '200', height: '200'});
			var chatHistory = document.getElementById('bc-chat-history');
			chatHistory.appendChild(thirdPartyIframe);
			bc.currentSession.viewManager.scrollToBottom();
		} else {
			originalShowForm(introLocKey, formDef, invalidFormLocKey, submitLocKey, submitCallback, topField, topFieldLocKey, clearContainer);
		}
	};
};
