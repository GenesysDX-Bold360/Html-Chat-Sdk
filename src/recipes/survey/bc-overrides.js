var bc = window.bc || {};

bc.setOverrides = function() {
	var originalShowForm = bc.currentSession.viewManager.showForm;

	bc.currentSession.viewManager.showForm = function(introLocKey, formDef, invalidFormLocKey, submitLocKey, submitCallback, topField, topFieldLocKey, clearContainer) {
		if(introLocKey === 'api#postchat#intro' || introLocKey === 'api#chat#ended') {
			var thirdPartyIframe = bc.util.createElement('iframe', {src: 'https://www.surveymonkey.com/s/HL2XLGC', width: '90%', height: '550px'});
			var chatHistory = document.getElementById('bc-chat-history');
			chatHistory.appendChild(thirdPartyIframe);
			//bc.currentSession.viewManager.scrollToBottom();
		} else {
			originalShowForm(introLocKey, formDef, invalidFormLocKey, submitLocKey, submitCallback, topField, topFieldLocKey, clearContainer);
		}
	};
};
