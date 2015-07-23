# Html-Chat-Sdk

### What is the BoldChat HTML Chat Window SDK?
The BoldChat HTML SDK allows businesses to create and host a fully customized chat window. The Chat Window SDK is a a collection of html, javascript and css files that communicate with BoldChat's API. These files allow you to create a completely customized chat user interface that facilitates communication between the visitor and operator. 

### Below are some examples of the various themes currently available.

> ####Nightshade####
![nightshadelayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/NightshadeLayout.png)

----------

> ####Hubris####
![hubrislayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/HubrisLayout.png)

----------

> ####Lovato####
![lovatolayout](http://logmein-boldchat.github.io/Html-Chat-Sdk/LovatoLayout.png)


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


##Changing Themes##

To change the theme your chat window is using modify scripts/bc-config.js.  The themes variable is defined as the chatWindowUrl variable. Change this value to the theme path of your choice, for instance "themes/hubris".


###What does this repository contain###

This repository contains BoldChat's SDK. This SDK is a collection of html, javascript and css files. 
These javascript files serve to communicate with BoldChat's API to 
The repository contains a zip file which contains two versions of each theme included. One version is the non-minified and non-compressed version of the sdk.  
