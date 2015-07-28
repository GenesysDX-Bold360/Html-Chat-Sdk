# Html-Chat-SDK

### What is the BoldChat HTML Chat Window SDK?
The BoldChat HTML SDK allows businesses to create and host a fully customized chat window. The HTML Chat Window SDK is a collection of HTML, JavaScript and CSS files that allow you to create a completely customized chat user interface, facilitating communication between the visitor and operator.

## What does this repository contain?
The SDK is bundled with template themes that you can use as a base for further customization.

The zip file in this repository contains two versions of each included theme:
 - A non-minified and non-compressed version. The included HTML files reference the raw JavaScript and CSS files.
 - A production ready, minified and compressed version. The included HTML files are minified and reference the compressed, minified and consolidated JavaScript and CSS files.

### Examples of currently available themes

> ####Nightshade####
![nightshadelayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/NightshadeLayout.jpg)

----------

> ####Hubris####
![hubrislayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/HubrisLayout.gif)

----------

> ####Lovato####
![lovatolayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/LovatoLayout.gif)

## Supported browsers/platforms:

 1. Chrome
 2. Internet Explorer 9 or newer
 3. Firefox
 4. iOS (current and previous version)
 5. Android (current and previous version)

## Getting Started
1) Download one of the theme zip files and add it to your web site. Alternatively you could clone or download this repository.

2) Generate an API key in the Boldchat Client. For more information see [BoldChat Help](http://help.boldchat.com/help/BoldChat/c_bc_sdk_get_sdk.html)

3) Modify the scripts/bc-config.js file in the HTML SDK. Change the sessionApiKey value to the API key you generated in the BoldChat client.

4) Define which theme you want to use.
```html
<script type="text/javascript">
    window._bcChatWindowUrl = 'themes/nightshade';
</script>
```

5) Add 3 javascript files to your page.
```html
<script type="text/javascript" src="scripts/bc-util.js"></script>
<script type="text/javascript" src="scripts/bc-config.js"></script>
<script type="text/javascript" src="scripts/bc-sdk-start.js"></script>
```

6) If you do not already have a BoldChat button on your page, you must generate one in the BoldChat client and add the HTML snippet to your web site. For detailed instructions on chat button setup please see [BoldChat Help](http://help.boldchat.com/help/current/BoldChat/c_bc_setupguide_header.html).

7) When the BoldChat button or invitation is clicked, the HTML SDK will be launched instead of the default BoldChat window.

## Building from source

These files are built using [NPM](https://nodejs.org/) & [Gulp](http://gulpjs.com/). You must install NodeJs as well as gulp. 

The SDK bundle comes with three files to get you started with the build process:
 - gulpfile.js
 - gulpfile.config.js
 - package.json:
 
The package.json file contains a scripts object that provides various build options. However, if this is your initial build, we suggest you run the following command to download everything necessary for your project:
```javascript
npm run build
```
This is the equivalent of running:
```javascript
npm install && gulp
```
####gulp Build Options

 - **build-requirements** :
	 - **fonts**: Copies all font files to their respective location in the output directory.
	 - **images**: Optimizes and copies all images to their respective location in the output directory.
	 - **videos**: Copies all videos to their respective location in the output directory.
	 - **sass**: Processes all scss files and generates the appropriate CSS in their respective theme, then places them in their respective location in the output directory.
	 - **minify-all-js**: See below.
 - **minify-all-js**: Depending on build arguments, this option minifies, uglifies or concatenates the JavaScript files according to their usage, then places them in their respective location.
	 - **minify-theme-js**: Theme js files are optional that serve to override existing functionality.
	 - **minify-boldchat-js**: Boldchat js files are the core HTML SDK files, used by both Popup and Layered Chat Windows. 
	 - **minify-start-js**: Place Start js files on your existing site/page where you want to use the HTML SDK Chat Window. These files include the utility functions used by the other files, the configuration files as well as a start-sdk file that handles the opening of the windows themselves.
	 - **minify-popup-js**: These files are used exclusively by Popup Windows. The minify-start-js files are included besides the necessary popup file.
 - **html-process-only**: Our gulp process uses gulp-inject as a means to build the appropriate output files. Each theme can be opened in either a layered or popup window mode. To prevent duplication of effort on developments part, the popup.html files (under each theme) are created at build time. The 'template' for each popup is the index.html file under each theme. For example, building html-process-only would take the themes/hubris/index.html file and extract the html to build the themes/hubris/popup.html file. 
	 - **inject-index-html**: Injects the necessary JavaScript and CSS files into their appropriate tag placeholders, depending on build arguments.
	 - **inject-popup-html**: Injects the necessary JavaScript and CSS files into their appropriate tag placeholders, depending on build arguments. It also copies the index.html and inserts into appropriate place in popup.html
 - Running the default gulp task executes 'build-requirements', 'html-process-only' and finally 'js-doc'. 
	 - **js-doc**: Creates a help document from the JavaScript files.

####There are various gulp arguments you can pass to the gulp build process:
- **--verbose**: Lists the files affected by each task.
- **--prod**: Creates concatenated versions of the JavaScript/CSS files and sets the proper reference in the HTML files.
	- For example, the index.html file includes various comment tags used by the build process, such as:
		- `<!-- inject:boldchat:js -->`
		- The HTML build processes (inject-index and inject-popup) check whether the --prod argument has been passed. If so, the getBoldchatJsSource function retrieves the source files (js_bc) to be used as the gulp source, and builds a final concatenated file named boldchat.js, resulting in a single JavaScript file instead of nine.
- **--min**: Used in conjuction with the --prod argument to further minify JavaScript and CSS files.
- **--minhtml**: Minifies the HTML file(s).


## Additional Info:

#### Technically Speaking...

 - While the bc-config.js file sets all the configuration information, it is also possible to override these settings on each page. For instance, you may need to use a different API key, theme and window type on different pages. To accomplish this, add the following snippet to each page to override bc-config options:
```javascript
<script type="text/javascript">
	window._bcChatWindowUrl = 'themes/{theme name here}';
	window._bcSessionApiKey = '{your api key here}';
	window._bcForcePopup = false; 
</script>
```

**Important**: The snippet must be placed before the bc.config.js file reference.

As an alternative method, you can also set up a different bc-config file for each page.

##### Layered vs Popup Windows
There is a certain hierarchy associated with how a window is opened. Window Definitions are determined by the API Key. Learn more about the Chat Window Definition on [our help site](http://help.boldchat.com/help/BoldChat/c_bc_chatwindow_about.html).

##### Important Javascript Files
![diagram](http://logmein-boldchat.github.io/Html-Chat-Sdk/sdk-diagram.png)
 - **bc-sdk-start.js** - The main starting point for the HTML SDK.  When included in your page this javascript will register itself with your BoldChat button or invitation, and when clicked will initiate the launch of your customized HTML chat window.  It injects the theme's html into the web page, and loads any javascript files included in the theme's html.
 - **bc-session.js** - Maintains the high-level state of an active chat session.  This file does not directly manipulate the DOM, but instead facilities the communication between the view manager (bc-view-manager) and the lower level server communication (bc-client).
 - **bc-view-manager.js** - When bc-session wants to change something visible such as showing a form, showing a busy indicator, or adding a chat message bc-view-manager is called to perform the DOM update. When customizing look and behavior of your chat window this is the file you will most likely be changing.
 - **bc-localizer.js** - Controls the localization of the chat window.  When a user selects a different language in the pre-chat form the localizer will receive the new localization keys, and update the view.  Elements with attributes "data-l10n" will be considered for localization.
 - **bc-form-builder.js** - Pre and Post chat forms are not defined in the theme's html, instead they come from the BoldChat servers as defined in the chat window definition in your account settings.  This form builder takes these form definitions and creates an HTML form based on the definition.
 - **bc-client.js** - Handles low level chat state and communication with the BoldChat servers.
 - **bc-api-frame.js** - Used to transport server messages to and from the chat window and the iframe.  The iframe is a 1x1 pixel hidden iframe with some lightweight javascript served from BoldChat's servers.  This is a common technique to work around browser restrictions and allow commuication between your web page and BoldChat's servers.
 - **bc-storage.js** - When a user transitions to a new page while in an active chat session it is critical that the re-constition of the chat window be done as fast as possible.  To re-create the chat window as fast as possible some key information is stored in session storage.  This javascript is used to store and retrieve this information.  The use of session storage can be disabled in bc-config.js.

##### Description of HTML Components
The index.html files in the themes is what gets injected into the host page when a chat is launched.  This file contains the structure for the chat window, and the css files (compiled from scss) apply the styling for the chat window. There are important elements within this chat window HTML which are used by the bc-view-manager javascript. Visibility of the html elements described below is typically controlled by adding or removing a .bc-hidden class. Some of the more important elements are:
 - **#bc-chat** - The outermost container for a visible chat window, this will be hidden or shown depending on chat state.
 - **.bc-busy** - A container for indicating the chat is busy such as when submitting a pre-chat form.
 - **#bc-minimized-indicator** - The container shown when a chat has been minimized.
 - **#bc-msg-op-template** - The template element for operator messages.  This element gets copied and added to the #bc-chat-history container when a new operator message arrives.
 - **#bc-msg-vis-template** - The template element for visitor messages.  This element gets copied and added to the #bc-chat-history container when a new visitor message is sent.
 - **#bc-msg-sys-template** - Some messages are sent by the BoldChat system (non-human). When one of these messages arrives this element is copied and added to the #bc-chat-history container.
 - **#bc-status-msg** - This element isn't a template but will be shown or hidden when a status message needs to be shown to the user. 
 - **#bc-form-container** - This container will be emptied and a dynamically generated HTML form will be added to it by bc-form-builder.
 - **#bc-typing** - This container will be hidden or shown depending on the typing status of an operator.  If a #bc-typers element exists the name of the typers will be put inside it.
 - **#bc-queue-wrap** - If the chat is in a queue then this element will be shown.
 - **#bc-send-msg-text** - This should be an input field or textarea where messages will be input.
 - **#bc-send-msg-btn** - This should be a button or anchor for sending a message in the #bc-send-msg-text field.

##### Example Customization: 3rd Party Survey
In this example customization we want to embed a 3rd party survey (e.g. surveymonkey or surveygizmo) instead of the BoldChat post-chat survey. The example survey will be embedded in an iframe, but could just as easily be fully customized html that submits to your own servers.

One way you could accomplish this would be to directly modify bc-session, and instead of showing a post-chat survey when a chat ends instead show the 3rd party survey.  

Another way to accomplish this would be to create a bc.setOverrides function, which allows for overriding of any methods in bc-session, bc-view-manager, or bc-form-builder.  Since any method can be overriden we will override the post-chat survey with our own survey.

```javascript
// Ensure the bc object is created to prevent loading order problems
var bc = window.bc || {};

// When this method is defined it will be called at the point the chat is created.
bc.setOverrides = function() {
	// Save a copy of the original showForm method.
	var originalShowForm = bc.currentSession.viewManager.showForm;

	// Define a new version of the showForm method
	bc.currentSession.viewManager.showForm = function(introLocKey, formDef, invalidFormLocKey, submitLocKey, submitCallback, topField, topFieldLocKey, clearContainer) {
		// If the chat has ended and it's time to show a post-chat survey add an iframe to the chat history area with the embedded survey.
		if(introLocKey === 'api#postchat#intro' || introLocKey === 'api#chat#ended') {
			var thirdPartyIframe = bc.util.createElement('iframe', {src: 'http://boldchat.com', width: '200', height: '200'});
			var chatHistory = document.getElementById('bc-chat-history');
			chatHistory.appendChild(thirdPartyIframe);
			bc.currentSession.viewManager.scrollToBottom();
		} else {
			// If another form needs to be shown call the original showForm method.
			originalShowForm(introLocKey, formDef, invalidFormLocKey, submitLocKey, submitCallback, topField, topFieldLocKey, clearContainer);
		}
	};
};
```
