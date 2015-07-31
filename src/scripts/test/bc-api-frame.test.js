var bc = window.bc || {};

describe('bc.ApiFrame.initialize', function() {
	var origin = 'http://localhost';

	function cleanIFrames() {
		var iframes = document.getElementsByClassName('bc-api-frame');
		for(var i = 0; i < iframes.length; i++) {
			iframes[i].parentElement.removeChild(iframes[i]);
		}
	}

	function mockLoadedMessage(apiFrame) {
		apiFrame.frameOrigin = origin;
		apiFrame.frame = {contentWindow: window};
		apiFrame._receiveApiMessage({
			data: JSON.stringify({method: 'loaded', params: {}, id: null}),
			origin: origin
		});
	}

	beforeEach(function() {
		cleanIFrames();
	});

	afterEach(function() {
		cleanIFrames();
	});

	it('Should create iframe', function() {
		//noinspection Eslint,JSUnusedLocalSymbols
		var apiFrame = new bc.ApiFrame('123');
		expect(document.getElementsByClassName('bc-api-frame').length).toBe(1);
	});

	it('Should not create iframe if you pass one in', function() {
		var iframe = bc.util.createElement('iframe');
		//noinspection Eslint,JSUnusedLocalSymbols
		var apiFrame = new bc.ApiFrame('123', iframe);
		expect(document.getElementsByClassName('bc-api-frame').length).toBe(0);
	});

	it('Should queue messages if iframe not loaded', function() {
		var iframe = bc.util.createElement('iframe');
		var apiFrame = new bc.ApiFrame('123', iframe);
		apiFrame.call('test', {});
		expect(apiFrame.isFrameLoaded).toBe(false);
		expect(apiFrame.frameLoadQueue.length).toBe(1);
	});

	it('Should respond to loaded message', function() {
		var iframe = bc.util.createElement('iframe');
		var apiFrame = new bc.ApiFrame('123', iframe);
		mockLoadedMessage(apiFrame);
		expect(apiFrame.isFrameLoaded).toBe(true);
	});

	it('Should call success callback method', function(done) {
		var iframe = bc.util.createElement('iframe');
		var apiFrame = new bc.ApiFrame('123', iframe);
		mockLoadedMessage(apiFrame);
		apiFrame.call('test', {}).success(function(message) {
			expect(message.someData).toBe('abc123');
			done();
		});
		// mock the response
		//noinspection JSAccessibilityCheck
		apiFrame._receiveApiMessage({
			data: JSON.stringify({someData: 'abc123', id: apiFrame.id - 1}),
			origin: origin
		});
	});

});
