# Html-Chat-Sdk

### What is the BoldChat HTML Chat Window SDK?
The BoldChat HTML SDK allows businesses to create and host a fully customized chat window. The Chat Window SDK is a a collection of html, javascript and css files that communicate with BoldChat's API. These files allow you to create a completely customized chat user interface that facilitates communication between the visitor and operator. 

### Below are some examples of the various themes currently available:

> ####Nightshade####
![nightshadelayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/NightshadeLayout.jpg)

----------

> ####Hubris####
![hubrislayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/HubrisLayout.gif)

----------

> ####Lovato####
![lovatolayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/LovatoLayout.gif)


## Getting Started:
1) Clone or download this repository and add it to your web site.

2) Generate an API key from the BoldChat client setup.  For more information see [BoldChat Help](http://help.boldchat.com/help/current/BoldChat/c_bc_sdk_android_get_sdk.html)

3) Modify the scripts/bc-config.js file in the HTML SDK.  Change the sessionApiKey to be the API key you generated in the BoldChat client.

4) Add 3 javascript tags to your page.
```html
<script type="text/javascript" src="scripts/bc-util.js"></script>
<script type="text/javascript" src="scripts/bc-config.js"></script>
<script type="text/javascript" src="scripts/bc-sdk-start.js"></script>
```

5) If you do not already have a BoldChat button on your page you will need to generate and add the html snippet to add the button. For detailed instructions on chat button setup please see [BoldChat Help docs](http://help.boldchat.com/help/current/BoldChat/c_bc_setupguide_header.html).

6) When the BoldChat button or invitation is clicked the HTML SDK will be launched instead of the default BoldChat window.


## Changing Themes:

To change the theme your chat window is using modify scripts/bc-config.js.  The themes variable is defined as the chatWindowUrl variable. Change this value to the theme path of your choice, for instance "themes/hubris".


## What does this repository contain?

This repository contains BoldChat's SDK which is a collection of html, javascript and css files. 
These javascript files serve to communicate with BoldChat's API to facilitate chat interactions between operator and visitor.
The repository contains a zip file which contains two versions of each theme included. One version is the non-minified and non-compressed version of the sdk. These html files reference raw javascript and css files. The second version is the production ready, minified and compressed versions of the files. Whereas these html files are both minified as well as referencing the compressed, minified and consolidated versions of the javascript and css files.

## Supported browsers/platforms:

 1. Chrome
 2. >=IE9
 3. Firefox
 4.  iOS (current and previous version)
 5. Android (current and previous version)

## Building from source

These files are built using [NPM](https://nodejs.org/) & [Gulp](http://gulpjs.com/). You'll want to install NodeJs as well as gulp. 

When you first download the zip, you'll notice a gulpfile.js, gulpfile.config.js and a package.json. These will be your starting off point to build the files.
In the package.json file, there is a scripts object with various options. However, initially you'll want to run the following to download everything necessary for your project:
```javascript
npm run build
```
All this is really doing is:
```javascript
npm install && gulp
```
####There are various gulp build options:

 - **build-requirements** :
	 - **fonts** : copies all the fonts files to their respective place in the output directory
	 - **images** : optimizes and copies all the images to their respective place in the output directory
	 - **videos** : copies all the videos to their respective place in the output directory
	 - **sass** : processes all the scss files to generate the appropriate css in their respective theme in the output directory
	 - **minify-all-js** : see below
 - **minify-all-js** : depending on build arguments, could minify, uglify and concatenates the javascript files according to their usage and outputs to their respective location 
	 - **minify-theme-js** : Theme js files are optional files which serve to override existing functionality. 
	 - **minify-boldchat-js** : Boldchat js files are the core html sdk files. These are files that are used equally by the popup and layered windows. 
	 - **minify-start-js** : The start js files are the files you drop onto your existing page where you want to use the html sdk chat window. These files include the utility functions used by the other files, the configuration files and a start-sdk file that handles the opening of the windows themselves.
	 - **minify-popup-js** : These files are used exclusively on the popup window. They include the minify-start-js files but also include an additional necessary popup file.
 - **html-process-only** : Our gulp process uses gulp-inject as a means to build the appropriate output files. Each theme can be opened in either a layered or popup window mode. To prevent duplication of effort on developments part, the popup.html files (under each theme) are created at build time. The 'template' for each popup is the index.html file under each theme. For example, building html-process-only would take the themes/hubris/index.html file and extract the html to build the themes/hubris/popup.html file. 
	 - **inject-index-html** : depending the build arguments, would inject the necessary js & css files in their appropriate tag placeholders
	 - **inject-popup-html** : depending the build arguments, would inject the necessary js & css files in their appropriate tag placeholders; copies index html and inserts into appropriate place in popup.html
 - Running the default gulp task will run 'build-requirements', 'html-process-only' and finally 'js-doc'. 
	 - js-doc creates a help document from the javascript files

####There are various gulp arguments you can pass into the gulp build process:
- **--verbose** : print out the files affected by each task
- **--prod** : create concatenated versions of the js/css files and have the html reference those files
	- ex. in the index.html page, there is are various comment tags used by the build process such as:
		- `<!-- inject:boldchat:js -->`
		- When in the html build processes (inject-index and inject-popup), the build process looks to see if the arg, --prod, was passed in. If so, getBoldchatJsSource function retrieves the source files (js_bc) and uses those files as the gulp source to finally build a final concatenated file named boldchat.js. So, instead of 9 js files, it would only be 1 js file.
- **--min** : used in conjuction with the --prod argument to further minify those js/css files and have the html reference accordingly
- **--minhtml** : minifies the html


## Additional Info:

#### Technically Speaking..

 - There is a bc-config.js file which sets all the configuration related information. However, it is also possible to override these settings on each of your pages. For instance, you may desire a completely different apikey/theme/layered vs popup on different pages. This is easily accomplished:
```javascript
<script type="text/javascript">
	window._bcChatWindowUrl = 'themes/{theme name here}';
	window._bcSessionApiKey = '{your api key here}';
	window._bcForcePopup = false; 
</script>
```
Simply add the above code for each page that you want to be different from the bc-config options.
Alternatively, you could have a different bc-config for each page as well. There are many ways to accomplish this.
* *One note, you should place the above code before your bc-config.js file.*

##### Layered vs Popup 
There is a certain hierarchy associated with how a window will be opened. Window definitions come from the chat api key. 
