var bc = bc || {};

function randomString(len, charSet) {
	charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var randString = '';
	for(var i = 0; i < len; i++) {
		var randomPoz = Math.floor(Math.random() * charSet.length);
		randString += charSet.substring(randomPoz, randomPoz + 1);
	}
	return randString;
}

describe('bc.util.createCookie', function() {
	var cookieName = randomString(5);

	beforeEach(function() {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			bc.util.eraseCookie(cookies[i].split('=')[0]);
		}
	});

	it('Should create a cookie', function() {
		bc.util.createCookie(cookieName, 'abc123', 1);
		var pattern = new RegExp(cookieName + '=');
		expect(pattern.test(document.cookie)).toBe(true);
	});

	it('Should delete a cookie', function() {
		bc.util.createCookie(cookieName, 'abc123', 1);
		bc.util.eraseCookie(cookieName);
		var pattern = new RegExp(cookieName + '=');
		expect(pattern.test(document.cookie)).toBe(false);
	});

	it('Should read a cookie', function() {
		bc.util.createCookie('asdf', 'abc123', 1);
		bc.util.createCookie(cookieName, 'testing', 1);
		bc.util.createCookie('qwerty', '0897234508', 1);
		expect(bc.util.readCookie(cookieName)).toBe('testing');
	});

});

describe('bc.util.createElement', function() {

	it('Should create empty div element', function() {
		var element = bc.util.createElement('div');
		expect(element.nodeName).toBe('DIV');
		expect(element.innerHTML).toBe('');
	});

	it('Should create attributes', function() {
		var element = bc.util.createElement('span', {id: 'test', class: 'abc123'});
		expect(element.nodeName).toBe('SPAN');
		expect(element.getAttribute('id')).toBe('test');
		expect(element.getAttribute('class')).toBe('abc123');
		expect(element.innerHTML).toBe('');
	});

	it('Should add text node', function() {
		var element = bc.util.createElement('strong', null, 'testing text');
		expect(element.nodeName).toBe('STRONG');
		expect(element.innerHTML).toBe('testing text');
	});

});

describe('bc.util.loadJavascript', function() {
	it('Should create script tag with same src value', function() {
		var divContainer = bc.util.createElement('div', null, null);
		divContainer.innerHTML = '<script>test();</script>';
		var originalScriptElement = divContainer.getElementsByTagName('script')[0];

		bc.util.loadJavascript(divContainer);
		var newScriptElement = divContainer.getElementsByTagName('script')[0];

		expect(divContainer.getElementsByTagName('script').length).toBe(1);
		expect(originalScriptElement === newScriptElement).toBe(false);
		expect(originalScriptElement.getAttribute('src')).toEqual(newScriptElement.getAttribute('src'));
	});

	it('Should execute javascript function', function(done) {
		var divContainer = bc.util.createElement('div', null, null);
		window._testLoadJavascriptSuccess = false;
		window._testLoadJavascriptBlock = function() {
			expect(window._testLoadJavascriptSuccess).toBe(true);
			done();
		};
		divContainer.innerHTML = '<script>window._testLoadJavascriptSuccess = true; window._testLoadJavascriptBlock();</script>';
		document.body.appendChild(divContainer);
		bc.util.loadJavascript(divContainer);
	});
});

describe('bc.util.getId', function() {

	it('Should create an id with accountId base', function() {
		expect(bc.util.getId('87230845702398764597823')).toBeDefined();
	});

	it('Should create an id without accountId base', function() {
		expect(bc.util.getId()).toBeDefined();
	});

});

describe('bc.util.base64', function() {

	it('Should use browsers btoa function if available', function() {
		if(window.btoa) {
			spyOn(window, 'btoa');
			bc.util.base64('abc123');
			expect(window.btoa).toHaveBeenCalledWith('abc123');
		}
	});

	it('Should encode normally', function() {
		var btoa = bc.util.base64('abc123');
		expect(btoa).toBe('YWJjMTIz');
	});

	it('Should encode null as a string', function() {
		var btoa = bc.util.base64(null);
		expect(btoa).toBe('bnVsbA==');
	});

	it('Should encode undefined as a string', function() {
		var btoa = bc.util.base64(undefined);
		expect(btoa).toBe('dW5kZWZpbmVk');
	});

	it('Should never include newline', function() {
		var btoa = bc.util.base64(randomString(10000));
		var match = /\r|\n/.exec(btoa);
		expect(match).toBeNull();
	});

	it('Should use util\'s base64 encoding', function() {
		if(window.btoa) {
			var btoa = window.btoa;
			window.btoa = undefined;
			var result = bc.util.base64('abc123');
			expect(result).toBe('YWJjMTIz');
			window.btoa = btoa;
		}
	});

	it('Should use util\'s base64 encoding with padding', function() {
		if(window.btoa) {
			var btoa = window.btoa;
			window.btoa = undefined;
			var result = bc.util.base64('abc1234');
			expect(result).toBe('YWJjMTIzNA==');
			window.btoa = btoa;
		}
	});

	it('Should use util\'s base64 encoding with zero length', function() {
		if(window.btoa) {
			var btoa = window.btoa;
			window.btoa = undefined;
			var result = bc.util.base64('');
			expect(result).toBe('');
			window.btoa = btoa;
		}
	});

});

describe('bc.util.isNodeList', function() {

	it('Should not detect a node list', function() {
		var element = document.createElement('div');
		var result = bc.util.isNodeList(element);
		expect(result).toBe(false);
	});

	it('Should detect a node list', function() {
		var element = document.createElement('div');
		for(var i = 0; i < 100; i++) {
			var span = document.createElement('span');
			element.appendChild(span);
		}
		var nodes = element.getElementsByTagName('span');
		var result = bc.util.isNodeList(nodes);
		expect(result).toBe(true);
	});

	it('Should consider undefined as not a list', function() {
		var result = bc.util.isNodeList(undefined);
		expect(result).toBe(false);
	});

	it('Should consider null as not a list', function() {
		var result = bc.util.isNodeList(null);
		expect(result).toBe(false);
	});

	it('Should count empty list as a node list', function() {
		var element = document.createElement('div');
		var nodes = element.getElementsByTagName('span');
		var result = bc.util.isNodeList(nodes);
		expect(result).toBe(true);
	});

});

describe('bc.util.addClass', function() {

	it('Should add class attribute if there is none', function() {
		var element = document.createElement('div');
		bc.util.addClass(element, 'testClass');
		expect(element.getAttribute('class')).toBe('testClass');
	});

	it('Should add class to empty class attribute', function() {
		var element = document.createElement('div');
		element.setAttribute('class', '');
		bc.util.addClass(element, 'testClass');
		expect(element.getAttribute('class')).toBe('testClass');
	});

	it('Should add class to end of class attribute', function() {
		var element = document.createElement('div');
		element.setAttribute('class', 'existingClass');
		bc.util.addClass(element, 'testClass');
		expect(element.getAttribute('class')).toBe('existingClass testClass');
	});

	it('Should add class to all items in node list', function() {
		var element = document.createElement('div');
		for(var i = 0; i < 100; i++) {
			var span = document.createElement('span');
			element.appendChild(span);
		}
		var nodes = element.getElementsByTagName('span');
		bc.util.addClass(nodes, 'testClass');
		for(i = 0; i < 100; i++) {
			expect(nodes[i].getAttribute('class')).toBe('testClass');
		}
	});

});

describe('bc.util.removeClass', function() {

	it('Should single class', function() {
		var element = document.createElement('div');
		element.setAttribute('class', 'testClass');
		bc.util.removeClass(element, 'testClass');
		expect(element.getAttribute('class')).toEqual('');
	});

	it('Should remove class from beginning', function() {
		var element = document.createElement('div');
		element.setAttribute('class', 'testClass anotherClass');
		bc.util.removeClass(element, 'testClass');
		expect(element.getAttribute('class')).toEqual('anotherClass');
	});

	it('Should remove class from end', function() {
		var element = document.createElement('div');
		element.setAttribute('class', 'anotherClass testClass');
		bc.util.removeClass(element, 'testClass');
		expect(element.getAttribute('class')).toEqual('anotherClass');
	});

	it('Should remove class from middle', function() {
		var element = document.createElement('div');
		element.setAttribute('class', 'anotherClass testClass yetAnotherClass');
		bc.util.removeClass(element, 'testClass');
		expect(element.getAttribute('class')).toEqual('anotherClass yetAnotherClass');
	});

	it('Should remove class from all items in node list', function() {
		var element = document.createElement('div');
		for(var i = 0; i < 100; i++) {
			var span = document.createElement('span');
			span.setAttribute('class', 'testClass anotherClass');
			element.appendChild(span);
		}
		var nodes = element.getElementsByTagName('span');
		bc.util.removeClass(nodes, 'testClass');
		for(i = 0; i < 100; i++) {
			expect(nodes[i].getAttribute('class')).toBe('anotherClass');
		}
	});

});

describe('bc.util.removeElement', function() {

	it('Should removeElement from parent', function() {
		var element = document.createElement('div');
		var span = document.createElement('span');
		element.appendChild(span);

		expect(element.children.length).toBe(1);
		bc.util.removeElement(span);
		expect(element.children.length).toBe(0);
	});

	it('Should element all elements in node list', function() {
		var element = document.createElement('div');
		for(var i = 0; i < 100; i++) {
			var span = document.createElement('span');
			span.setAttribute('class', 'testClass anotherClass');
			element.appendChild(span);
		}
		var nodes = element.getElementsByTagName('span');
		expect(element.children.length).toBe(100);
		bc.util.removeElement(nodes);
		expect(element.children.length).toBe(0);
	});

});

describe('bc.util.toggleClass', function() {

	it('Should addClass to element with no existing class', function() {
		var element = document.createElement('div');
		bc.util.toggleClass(element, 'bc-class');
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
	});

	it('Should addClass to element with no existing class forcing className testing', function() {
		var element = document.createElement('div');
		bc.util.toggleClass(element, 'bc-class', null, true);
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
	});

	it('Should removeClass from element with existing class', function() {
		var element = document.createElement('div');
		bc.util.toggleClass(element, 'bc-class');
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
		bc.util.toggleClass(element, 'bc-class');
		expect(element.className.length === 0).toBeTruthy();
	});

	it('Should removeClass from element with existing class forcing className testing', function() {
		var element = document.createElement('div');
		bc.util.toggleClass(element, 'bc-class', null, true);
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
		bc.util.toggleClass(element, 'bc-class', null, true);
		expect(element.className.length === 0).toBeTruthy();
	});

	it('Should addClass to element with no existing class while forcing truthiness', function() {
		var element = document.createElement('div');
		bc.util.toggleClass(element, 'bc-class', true);
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
	});

	it('Should addClass to element with no existing class while forcing truthiness forcing className testing', function() {
		var element = document.createElement('div');
		bc.util.toggleClass(element, 'bc-class', true, true);
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
	});

	it('Should NOT addClass to element with no existing class while forcing falsiness', function() {
		var element = document.createElement('div');
		bc.util.toggleClass(element, 'bc-class', false);
		expect(element.className.indexOf('bc-class') > -1).toBeFalsy();
	});

	it('Should NOT addClass to element with no existing class while forcing falsiness forcing className testing', function() {
		var element = document.createElement('div');
		bc.util.toggleClass(element, 'bc-class', false, true);
		expect(element.className.indexOf('bc-class') > -1).toBeFalsy();
	});

	it('Should addClass to element with existing class', function() {
		var element = document.createElement('div');
		bc.util.addClass(element, 'bc-someOtherClass');
		bc.util.toggleClass(element, 'bc-class');
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
	});

	it('Should removeClass from element with existing class', function() {
		var element = document.createElement('div');
		bc.util.addClass(element, 'bc-someOtherClass');
		bc.util.toggleClass(element, 'bc-class');
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
		bc.util.toggleClass(element, 'bc-class');
		expect(element.className.indexOf('bc-class') > -1).toBeFalsy();
	});

	it('Should removeClass from element with existing class forcing falsiness', function() {
		var element = document.createElement('div');
		bc.util.addClass(element, 'bc-someOtherClass');
		bc.util.toggleClass(element, 'bc-class');
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
		bc.util.toggleClass(element, 'bc-class', false);
		expect(element.className.indexOf('bc-class') > -1).toBeFalsy();
	});

	it('Should removeClass from element with existing class forcing falsiness forcing className testing', function() {
		var element = document.createElement('div');
		bc.util.addClass(element, 'bc-someOtherClass');
		bc.util.toggleClass(element, 'bc-class', null, true);
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
		bc.util.toggleClass(element, 'bc-class', false, true);
		expect(element.className.indexOf('bc-class') > -1).toBeFalsy();
	});

	it('Should addClass to element with existing class while forcing truthiness', function() {
		var element = document.createElement('div');
		bc.util.addClass(element, 'bc-someOtherClass');
		bc.util.toggleClass(element, 'bc-class', true);
		expect(element.className.indexOf('bc-class') > -1).toBeTruthy();
	});

	it('Should NOT addClass to element with existing class while forcing falsiness', function() {
		var element = document.createElement('div');
		bc.util.addClass(element, 'bc-someOtherClass');
		bc.util.toggleClass(element, 'bc-class', false);
		expect(element.className.indexOf('bc-class') > -1).toBeFalsy();
	});

});

describe('bc.util.toggleVisibility', function() {

	it('Should set visibility to true on not yet set element', function() {
		var element = document.createElement('div');
		bc.util.toggleVisibility(element, true);
		expect(element.style.display === '').toBeTruthy();
	});

	it('Should set visibility to hidden on not yet set element', function() {
		var element = document.createElement('div');
		bc.util.toggleVisibility(element, false);
		expect(element.style.display === 'none').toBeTruthy();
	});

	it('Should set visibility to hidden on not yet set element', function() {
		var element = document.createElement('div');
		bc.util.toggleVisibility(element);
		expect(element.style.display === 'none').toBeTruthy();
	});

	it('Should set visibility to visible on hidden element', function() {
		var element = document.createElement('div');
		element.style.display = 'none';
		expect(element.style.display === 'none').toBeTruthy();
		bc.util.toggleVisibility(element);
		expect(element.style.display === '').toBeTruthy();
	});

	it('Should set visibility to hidden on hidden element forcing falsiness', function() {
		var element = document.createElement('div');
		element.style.display = 'none';
		expect(element.style.display === 'none').toBeTruthy();
		bc.util.toggleVisibility(element, false);
		expect(element.style.display === 'none').toBeTruthy();
	});
});

describe('bc.util.hasClass', function() {

	it('Should see element has existing class', function() {
		var element = document.createElement('div');
		element.setAttribute('class', 'bc-test');
		expect(bc.util.hasClass(element, 'bc-test')).toBeTruthy();
	});

	it('Should see element has no existing class', function() {
		var element = document.createElement('div');
		expect(bc.util.hasClass(element, 'bc-test')).toBeFalsy();
	});

	it('Should see element has existing class with multiple classes', function() {
		var element = document.createElement('div');
		element.setAttribute('class', 'bc-woop bc-test bc-blah');
		expect(bc.util.hasClass(element, 'bc-test')).toBeTruthy();
	});

	it('Should see element has no existing class with multiple classes', function() {
		var element = document.createElement('div');
		element.setAttribute('class', 'bc-woop bc-test bc-blah');
		expect(bc.util.hasClass(element, 'bc-what-the')).toBeFalsy();
	});
});

describe('bc.util.closest', function() {

	it('Should see closest matching element', function() {
		var div0 = document.createElement('div');
		div0.id = 'div0';
		div0.setAttribute('class', 'bc-test');

		var div1 = document.createElement('div');
		div1.id = 'div1';
		div1.setAttribute('class', 'bc-test');

		var div2 = document.createElement('div');
		div2.id = 'div2';
		div2.setAttribute('class', 'bc-test');

		div1.appendChild(div2);
		div0.appendChild(div1);

		var result = bc.util.closest(div1, '.bc-test');
		expect(result.id === 'div0').toBeTruthy();

		result = bc.util.closest(div2, '.bc-test');
		expect(result.id === 'div1').toBeTruthy();

		result = bc.util.closest(div0, '.bc-test');
		expect(result === null).toBeTruthy();

		result = bc.util.closest(div2, '#div0');
		expect(result.id === 'div0').toBeTruthy();
	});

});

describe('bc.util.addEventListener', function() {

	it('Should add Event Listener', function() {
		var div0 = document.createElement('div');
		div0.id = 'div0';

		var val;
		var myFunc = function(divId) {
			'use strict';
			val = divId;
		};

		bc.util.addEventListener(div0, 'click', myFunc(div0.id));
		div0.click();
		expect(val === 'div0').toBeTruthy();
	});

});

describe('bc.util.getHeight', function() {
	it('Should get correct height', function() {
		var element = document.createElement('div');
		element.setAttribute('style', 'width: 100px; height: 100px;');
		document.body.appendChild(element);
		expect(bc.util.getHeight(element)).toBe(100);
		document.body.removeChild(element);
	});
});

describe('bc.util.getHeight', function() {
	it('Should get correct height for single element', function() {
		var element = document.createElement('div');
		element.setAttribute('style', 'width: 100px; height: 100px;');
		document.body.appendChild(element);
		expect(bc.util.getHeight(element)).toBe(100);
		document.body.removeChild(element);
	});

	it('Should get correct height for first element in node list', function() {
		var element = document.createElement('div');
		element.setAttribute('style', 'width: 100px; height: 100px;');
		element.setAttribute('class', 'testing');
		document.body.appendChild(element);
		var element2 = document.createElement('div');
		element2.setAttribute('class', 'testing');
		element2.setAttribute('style', 'width: 200px; height: 200px;');
		document.body.appendChild(element2);

		expect(bc.util.getHeight(document.getElementsByClassName('testing'))).toBe(100);

		document.body.removeChild(element);
		document.body.removeChild(element2);
	});
});

describe('bc.util.setText', function() {
	it('Should set text for single element', function() {
		var element = document.createElement('div');
		bc.util.setText(element, 'hello world');
		expect(element.textContent).toBe('hello world');
	});

	it('Should set text for all elements', function() {
		var root = document.createElement('div');
		var element = document.createElement('div');
		element.setAttribute('class', 'testing');
		root.appendChild(element);
		var element2 = document.createElement('div');
		element2.setAttribute('class', 'testing');
		root.appendChild(element2);

		expect(bc.util.setText(root.getElementsByClassName('testing'), 'foo & bar'));
		expect(element.textContent).toBe('foo & bar');
		expect(element2.textContent).toBe('foo & bar');
	});
});

describe('bc.util.setHtml', function() {
	it('Should set html for single element', function() {
		var element = document.createElement('div');
		bc.util.setHtml(element, 'hello &amp; world');
		expect(element.innerHTML).toBe('hello &amp; world');
	});

	it('Should set html for all elements', function() {
		var root = document.createElement('div');
		var element = document.createElement('div');
		element.setAttribute('class', 'testing');
		root.appendChild(element);
		var element2 = document.createElement('div');
		element2.setAttribute('class', 'testing');
		root.appendChild(element2);

		expect(bc.util.setHtml(root.getElementsByClassName('testing'), 'foo &amp; bar'));
		expect(element.innerHTML).toBe('foo &amp; bar');
		expect(element2.innerHTML).toBe('foo &amp; bar');
	});
});

describe('bc.util.setHtml', function() {
	it('Should set attribute for single element', function() {
		var element = document.createElement('div');
		bc.util.setAttribute(element, 'data-test', 'hello world');
		expect(element.getAttribute('data-test')).toBe('hello world');
	});

	it('Should set attribute for all elements', function() {
		var root = document.createElement('div');
		var element = document.createElement('div');
		element.setAttribute('class', 'testing');
		root.appendChild(element);
		var element2 = document.createElement('div');
		element2.setAttribute('class', 'testing');
		root.appendChild(element2);

		expect(bc.util.setAttribute(root.getElementsByClassName('testing'), 'data-test', 'foo & bar'));
		expect(element.getAttribute('data-test')).toBe('foo & bar');
		expect(element2.getAttribute('data-test')).toBe('foo & bar');
	});
});

describe('bc.util.setStyle', function() {
	it('Should set style for single element', function() {
		var element = document.createElement('div');
		bc.util.setStyle(element, 'backgroundColor', '#FF0000');
		expect(element.getAttribute('style')).toBe('background-color: rgb(255, 0, 0);');
	});

	it('Should set style for all elements', function() {
		var root = document.createElement('div');
		var element = document.createElement('div');
		element.setAttribute('class', 'testing');
		root.appendChild(element);
		var element2 = document.createElement('div');
		element2.setAttribute('class', 'testing');
		root.appendChild(element2);

		expect(bc.util.setStyle(root.getElementsByClassName('testing'), 'backgroundColor', '#FF0000'));
		expect(element.getAttribute('style')).toBe('background-color: rgb(255, 0, 0);');
		expect(element2.getAttribute('style')).toBe('background-color: rgb(255, 0, 0);');
	});
});
