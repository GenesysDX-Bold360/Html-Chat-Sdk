/**
 * Define parameters that specify the chat window sdk integration in this file
 * Parameters can easily be overridden on your site (see src/index.html as an example)
 */


var bc = bc || {};

(function() {

	if(!bc.config || !bc.config.initialized) {	//to prevent overwriting of the config object when using in a popup environment
		bc.config = {
			initialized: true,
			logging: true,
			throwErrors: true,
			useWebsocket: null,
			jsonp: true,
			sessionApiKey: null,
			messageCache: true,
			chatCookie: '_bcck',
			configCookie: '_bccfg',
			chatWindowUrl: '',

			/**
			 * Defining to use a popup vs layered window is set based on the invocation type of the page. For example, a
			 * floating button can be assigned to a popup window and a static chat button can be assigned to a floating window.
			 * These are setup in the Boldchat Client.agent
			 *
			 * You can override the settings of the client by setting forcePopup to true or false here, or on the page that you are
			 * wanting to run the HTML SDK from.
			 */
			forcePopup: null,

			addViewportMetaTag: true,
			viewPortMetaTagContent: 'width=device-width, height=device-height, initial-scale=1, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',

			displayTypingOperatorImage: true,
			defaultCompanyLogoLocation: 'images/unknown-customer.png'
		};
	}

}());

