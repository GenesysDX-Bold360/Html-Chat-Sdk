var bc = window.bc || {};

describe('bc.ApiFrame', function () {
  const RANDOM_SERVER_SET = '-random';

  function cleanIFrames() {
    var iframes = document.getElementsByClassName(bc.ApiFrame.frameClass);
    for (var i = iframes.length - 1; i >= 0; i--) {
      iframes[i].parentElement.removeChild(iframes[i]);
    }
  }

  beforeEach(function () {
    cleanIFrames();
  });

  describe('initialize', function () {
    it('Should queue messages if iframe not loaded', function () {
      var iframe = bc.util.createElement('iframe');
      var apiFrame = new bc.ApiFrame('123', iframe, RANDOM_SERVER_SET);
      apiFrame.call('test', {});
      expect(apiFrame.isFrameLoaded).toBe(false);
      expect(apiFrame.frameLoadQueue.length).toBe(1);
    });

    it('Should respond to loaded message', function () {
      var iframe = bc.util.createElement('iframe');
      var apiFrame = new bc.ApiFrame('123', iframe, RANDOM_SERVER_SET);
      mockLoadedMessage(apiFrame);
      expect(apiFrame.isFrameLoaded).toBe(true);
    });

    it('Should skip the loaded message when origin is different', function () {
      var iframe = bc.util.createElement('iframe');
      var apiFrame = new bc.ApiFrame('123', iframe, RANDOM_SERVER_SET);
      mockLoadedMessage(apiFrame, 'blah.com');
      expect(apiFrame.isFrameLoaded).toBe(false);
    });

    it('Should call success callback method', function (done) {
      var apiFrame = new bc.ApiFrame('123', null, RANDOM_SERVER_SET);
      mockLoadedMessage(apiFrame);
      apiFrame.call('test', {}, true)
        .success(function (message) {
          expect(message.someData).toBe('abc123');
          done();
        });
      // mock the response
      //noinspection JSAccessibilityCheck
      apiFrame._receiveApiMessage({
        data: JSON.stringify({someData: 'abc123', id: apiFrame.id - 1}),
        source: apiFrame.frame.contentWindow,
        origin: apiFrame.frameOrigin
      });
    });

    it('Frame Origin should not contains serverSet when it is not provided', function () {
      var apiFrame = new bc.ApiFrame('123');
      mockLoadedMessage(apiFrame);

      expect(apiFrame.isFrameLoaded).toBe(true);
      expect(apiFrame.frameOrigin).toBe('https://api.boldchat.com');
    });

    it('Frame Origin should contains serverSet when it is provided', function () {
      var serverSet = '-dev';
      var apiFrame = new bc.ApiFrame('123', null, serverSet);
      mockLoadedMessage(apiFrame);

      expect(apiFrame.isFrameLoaded).toBe(true);
      expect(apiFrame.frameOrigin).toBe('https://api' + serverSet + '.boldchat.com');
    });

    it('Frame Origin should not contains boldchat.com when serverSet contains domain', function () {
      var serverSet = '-dev.bold360.io';
      var apiFrame = new bc.ApiFrame('123', null, serverSet);
      mockLoadedMessage(apiFrame);

      expect(apiFrame.isFrameLoaded).toBe(true);
      expect(apiFrame.frameOrigin).not.toMatch('.boldchat.com');
      expect(apiFrame.frameOrigin).toBe('https://api' + serverSet);
    });
  });

  describe('initFrame', function () {
    it('Should create iframe', function () {
      new bc.ApiFrame('123', null, RANDOM_SERVER_SET);
      expect(document.getElementsByClassName(bc.ApiFrame.frameClass).length).toBe(1);
    });

    it('Should not create iframe if you pass one in', function () {
      var iframe = bc.util.createElement('iframe');
      new bc.ApiFrame('123', iframe, RANDOM_SERVER_SET);
      expect(document.getElementsByClassName(bc.ApiFrame.frameClass).length).toBe(0);
    });
  });

  describe('destroy', () => {
    let apiFrame;

    beforeEach(() => {
      apiFrame = new bc.ApiFrame('123', null, RANDOM_SERVER_SET);
      mockLoadedMessage(apiFrame);
    });

    it('should stop retry loop', () => {
      expect(apiFrame._retryInterval).not.toBeFalsy();

      apiFrame.destroy();

      expect(apiFrame._retryInterval).toBeFalsy();
    });

    it('should close stream', () => {
      const iframeContentWindow = apiFrame.frame.contentWindow;
      spyOn(iframeContentWindow, 'postMessage');

      apiFrame.destroy();

      const expectedMessage = JSON.stringify({"method": "disconnect", "params": {}, "id": 1});
      expect(iframeContentWindow.postMessage).toHaveBeenCalledWith(expectedMessage, 'https://api-random.boldchat.com');
    });

    it('should remove iframe', () => {
      jasmine.clock().install();

      apiFrame.destroy();
      jasmine.clock().tick(100);

      const iframes = document.getElementsByClassName(bc.ApiFrame.frameClass);
      expect(iframes.length).toBe(0);
      expect(apiFrame.frame).toBeNull();
      jasmine.clock().uninstall();
    });
  });

  function mockLoadedMessage(apiFrame, origin) {
    origin = origin || apiFrame.frameOrigin;
    apiFrame._receiveApiMessage({
      data: JSON.stringify({method: 'loaded', params: {}, id: null}),
      source: apiFrame.frame.contentWindow,
      origin: origin
    });
  }
});

