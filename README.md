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

 - build-requirements :
	 - fonts : copies all the fonts files to their respective place in the output directory
	 - images : optimizes and copies all the images to their respective place in the output directory
	 - videos : copies all the videos to their respective place in the output directory
	 - sass : processes all the scss files to generate the appropriate css in their respective theme in the output directory
 - minify-all-js : optionally minifies, uglifies and concatenates the javascript files according to their usage and outputs to their respective location 
	 - minify-theme-js : Theme js files are optional files which serve to override existing functionality. 
	 - minify-boldchat-js : Boldchat js files are the core html sdk files. These are files that are used equally by the popup and layered windows. 
	 - minify-start-js : The start js files are the files you drop onto your existing page where you want to use the html sdk chat window. 
	 - minify-popup-js : These files are used exclusively on the popup window. They include the minify-start-js files but also include an additional popup file.
 - html-process-only : The index files
	 - inject-index-html : 
	 - inject-popup-html : 
