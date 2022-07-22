var bc = window.bc || {};

describe("bc.VisitorClient", function() {
  const BC_CURL_COOKIE_NAME = '_bc-curl';
  const BC_CURL_COOKIE_VALUE = 'this-is-a-bc-curl-cookie';
  const BCCK_COOKIE_NAME = '_bcck';

  let client;
  let postChatEnabled = false;
  let session = {
    basicAuth: "2307475884:1935873874619821:WFr8EvyhuCvpV7hHmIbHN6F1iTN3TLnx:alphacx1",
    chatKey: 1234,
    chatId: 9876,
    accountId: 5678,
    clientId: 62442,
    personId: 3456,

    genericUrl: "https://xxxx.com/aid/34343",
    genericToken: "token",
    progressPosition: 33
  };
  let bcckCookieValue;
  let bcVendorRemoteControl;

  beforeEach(function() {
    jasmine.clock().install();
    jasmine.getEnv().allowRespy(true);

    bc.launcherVersion = 'someVersion';
    bcckCookieValue = null;
    spyOn(bc.ApiFrame.prototype, "call").and.callFake(function(method) {
      if(method === 'pingChat') {
        return bc.AsyncValue.resolve({});
      }

      return bc.AsyncValue.resolve({
        ChatKey: session.chatKey,
        ChatID: session.chatId,
        AccountId: session.accountId,
        ClientID: session.clientId,
        PersonID: session.personId,
        VisitorID: session.personId,
        WebSocketURL: session.genericUrl,
        PostChat: postChatEnabled
      });
    });
    spyOn(bc, "setOverrides").and.returnValue({});
    spyOn(bc.util, 'readRawCookie').and.callFake((name) => {
      if(name === BC_CURL_COOKIE_NAME) {
        return bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE);
      } else if(name === BCCK_COOKIE_NAME) {
        return bc.AsyncValue.resolve(bcckCookieValue);
      }
      return bc.AsyncValue.resolve(null);
    });

    bcVendorRemoteControl = {
      acceptVendorRemoteControl: jasmine.createSpy("acceptVendorRemoteControl"),
      isOsSupported: jasmine.createSpy("isOsSupported")
    };

    bc.VendorRemoteControl = function() {
      return bcVendorRemoteControl;
    };

    createClient();
  });

  afterEach(function() {
    client && client.finishChat();
    jasmine.clock().uninstall();
    jasmine.getEnv().allowRespy(false);
  });

  describe('initializeAsync', () => {
    it('should resolve when chat ended state check is disabled and chat has not ended', (done) => {
      bc.chatEndedStateCheckEnabled = false;
      spyOn(bc.util, 'readRawCookie').and.returnValue(bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE));
      spyOn(bc.ApiFrame.prototype, 'call').and.returnValue(bc.AsyncValue.resolve({Ended: false}));

      const result = client.initializeAsync();
      result.success(() => done());
      result.failure(() => done.fail('should not reject'));

      tick();
    });

    it('should resolve when chat ended state check is enabled and chat has not ended', (done) => {
      bc.chatEndedStateCheckEnabled = true;
      spyOn(bc.util, 'readRawCookie').and.returnValue(bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE));
      spyOn(bc.ApiFrame.prototype, 'call').and.returnValue(bc.AsyncValue.resolve({Ended: false}));

      const result = client.initializeAsync();
      result.success(() => done());
      result.failure(() => done.fail('should not reject'));

      tick();
    });

    it('should resolve when chat ended state check is disabled and chat has ended', (done) => {
      bc.chatEndedStateCheckEnabled = false;
      spyOn(bc.util, 'readRawCookie').and.returnValue(bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE));
      spyOn(bc.ApiFrame.prototype, 'call').and.returnValue(bc.AsyncValue.resolve({Ended: true}));

      const result = client.initializeAsync();
      result.success(() => done());
      result.failure(() => done.fail('should not reject'));

      tick();
    });

    it('should reject when chat ended state check is enabled and chat has ended', (done) => {
      bc.chatEndedStateCheckEnabled = true;
      spyOn(bc.util, 'readRawCookie').and.returnValue(bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE));
      spyOn(bc.ApiFrame.prototype, 'call').and.returnValue(bc.AsyncValue.resolve({Ended: true}));

      const result = client.initializeAsync();
      result.success(() => done.fail('should not resolve'));
      result.failure(() => done());

      tick();
    });
  });

  describe('canStartChat', () => {
    it('should resolve when chat ended state check is disabled and chat has not ended', (done) => {
      bc.chatEndedStateCheckEnabled = false;
      spyOn(bc.util, 'readRawCookie').and.returnValue(bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE));
      spyOn(bc.ApiFrame.prototype, 'call').and.returnValue(bc.AsyncValue.resolve({Ended: false}));

      const result = client.canStartChat();
      result.success(() => done());
      result.failure(() => done.fail('should not reject'));

      tick();
    });

    it('should resolve when chat ended state check is enabled and chat has not ended', (done) => {
      bc.chatEndedStateCheckEnabled = true;
      spyOn(bc.util, 'readRawCookie').and.returnValue(bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE));
      spyOn(bc.ApiFrame.prototype, 'call').and.returnValue(bc.AsyncValue.resolve({Ended: false}));

      const result = client.canStartChat();
      result.success(() => done());
      result.failure(() => done.fail('should not reject'));

      tick();
    });

    it('should resolve when chat ended state check is disabled and chat has ended', (done) => {
      bc.chatEndedStateCheckEnabled = false;
      spyOn(bc.util, 'readRawCookie').and.returnValue(bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE));
      spyOn(bc.ApiFrame.prototype, 'call').and.returnValue(bc.AsyncValue.resolve({Ended: true}));

      const result = client.canStartChat();
      result.success(() => done());
      result.failure(() => done.fail('should not reject'));

      tick();
    });

    it('should reject when chat ended state check is enabled and chat has ended', (done) => {
      bc.chatEndedStateCheckEnabled = true;
      spyOn(bc.util, 'readRawCookie').and.returnValue(bc.AsyncValue.resolve(BC_CURL_COOKIE_VALUE));
      spyOn(bc.ApiFrame.prototype, 'call').and.returnValue(bc.AsyncValue.resolve({Ended: true}));

      const result = client.canStartChat();
      result.success(() => done.fail('should not resolve'));
      result.failure(() => done());

      tick();
    });

    describe('when integration is legacy integration', () => {
      beforeEach(() => {
        bc.launcherVersion = undefined;
      });

      it('should return true if bcck cookie has value', (done) => {
        bcckCookieValue = 'not null';
        createClient();

        const result = client.canStartChat();
        result.success(value => {
          expect(value).toBeTrue();
          done();
        });

        tick();
      });
    });
  });

  describe("createChat", function() {
    it("should create a validated chat with the local secure parameter", function(done) {
      var secureParameter = "securityisawesome";

      client.createChat("", "", "", "", secureParameter)
        .success(() => {
          expect(bc.ApiFrame.prototype.call).toHaveBeenCalled();
          expect(bc.ApiFrame.prototype.call.calls.first().args[1].Secured).toEqual(secureParameter);
          done();
        });
      waitForChatCreation();
    });

    it("should create a validated chat with the global secure parameter", function(done) {
      window.bcConfig = window.bcConfig || {};
      window.bcConfig.post = {secured: ["totallysecure"]};

      client.createChat()
        .success(function() {
          expect(bc.ApiFrame.prototype.call).toHaveBeenCalled();
          expect(bc.ApiFrame.prototype.call.calls.first().args[1].Secured).toEqual(window.bcConfig.post.secured[0]);
          done();
        });
      waitForChatCreation();
    });

    it("should prefer the local parameter over the global one", function(done) {
      var secureParameter = "localSecureParameter";
      window.bcConfig = window.bcConfig || {};
      window.bcConfig.post = {secured: ["globalSecureParameter"]};

      client.createChat("", "", "", "", secureParameter)
        .success(function() {
          expect(bc.ApiFrame.prototype.call).toHaveBeenCalled();
          expect(bc.ApiFrame.prototype.call.calls.first().args[1].Secured).toEqual(secureParameter);
          done();
        });
      waitForChatCreation();
    });

    it("should create a validated chat with the localsecure parameter", function(done) {
      window.bcConfig = window.bcConfig || {};
      window.bcConfig.post = {localsecured: ["sortofsecure"]};

      client.createChat()
        .success(function() {
          expect(bc.ApiFrame.prototype.call).toHaveBeenCalled();
          expect(bc.ApiFrame.prototype.call.calls.first().args[1].Secured).toEqual(window.bcConfig.post.localsecured[0]);
          done();
        });
      waitForChatCreation();
    });

    it('should start pinging chat in every 30 seconds', (done) => {
      client.createChat("", "", "", "", "")
        .success(function() {
          expectChatPing();
          expectChatPing();

          done();
        });
      waitForChatCreation();
    });
  });

  describe("cancelPreChat", function() {
    it('should send a post request to the backend', () => {
      client.cancelPreChat();

      expect(bc.ApiFrame.prototype.call).toHaveBeenCalled();
      expect(bc.ApiFrame.prototype.call.calls.first().args[0]).toEqual("cancelPreChat");
    });
  });

  describe("sendFile", function() {
    var file = {
      name: "test.png",
      size: 500001,
      type: "image/png"
    };

    beforeEach(function() {
      spyOn(client, "_request").and.returnValue(Promise.resolve({
        status: 200,
        data: {
          token: session.genericToken,
          uploadUrl: session.genericUrl
        }
      }));

      spyOn(client, "_upload").and.callFake(function(url, input, progress) {
        expect(url).toEqual(session.genericUrl);
        expect(input.name).toEqual(file.name);

        progress(session.progressPosition);
        return Promise.resolve({});
      });
    });

    it("should upload file", function(done) {
      client
        .createChat()
        .success(function() {
          client.sendFile(file, function() {
            done();
          }, function() {
            throw "Promise failed";
          }, function(position) {
            expect(position).toEqual(session.progressPosition);
          });
        });
      waitForChatCreation();
    });
  });

  describe("setChatWindowSettings / getChatWindowSettings", function() {
    it("should save and restore chat window settings from storage", function(done) {
      var settings = {
        EnableFileTransfer: true,
        EnableActiveAssist: true,
        EnableRemoteControl: true,
        ShowTranscriptButton: true
      };

      client.createChat()
        .success(function() {
          client.setChatWindowSettings(settings);
          expect(client.getChatWindowSettings()).toEqual(settings);
          done();
        });
      waitForChatCreation();
    });
  });

  describe('video chat', function() {
    it('accept video call should get vendor session visitor url', function(done) {
      client.acceptVideoCall()
        .success(() => {
          expect(bc.ApiFrame.prototype.call).toHaveBeenCalledWith('getVendorVideoSessionVisitorUrl', jasmine.any(Object));
          done();
        });
      tick();
    });

    it('accept video call should accept video session', function(done) {
      client.acceptVideoCall()
        .success(() => {
          expect(bc.ApiFrame.prototype.call).toHaveBeenCalledWith('acceptVideoSession', jasmine.any(Object));
          done();
        });
      tick();
    });

    it('accept video should fire videoSessionStarted event', function() {
      var videoUrl = 'https://vendor.vid/id';
      spyOn(bc.ApiFrame.prototype, 'call')
        .withArgs('getVendorVideoSessionVisitorUrl', jasmine.any(Object))
        .and.returnValue(bc.AsyncValue.resolve(videoUrl));
      var videoSessionStartedSpy = jasmine.createSpy('videoSessionStartedSpy');
      client.videoSessionStarted(videoSessionStartedSpy);

      client.acceptVideoCall();
      tick(1);

      expect(videoSessionStartedSpy).toHaveBeenCalledWith(videoUrl);
    });

    it('decline video call should decline video session', function(done) {
      client.declineVideoCall()
        .success(() => {
          expect(bc.ApiFrame.prototype.call).toHaveBeenCalledWith('declineVideoSession', jasmine.any(Object));
          done();
        });
      tick();
    });

    it('mark chat as video supported call should call corresponding endpoint', function(done) {
      client.markChatAsVideoSupported()
        .success(() => {
          expect(bc.ApiFrame.prototype.call).toHaveBeenCalledWith('markChatAsVideoSupported', jasmine.any(Object), undefined);
          done();
        });
      tick();
    });
  });

  describe('bcClient.initFrame', function() {
    beforeEach(function() {
      spyOn(bc.ApiFrame.prototype, 'initFrame').and.callThrough();
    });

    it('should pass undefined to new ApiFrame, when no bc-specific iframe found', function() {
      spyOn(document, 'getElementsByClassName').and.returnValue([]);
      new bc.VisitorClient('testAuth');
      expect(bc.ApiFrame.prototype.initFrame).toHaveBeenCalledWith(undefined, jasmine.anything(), jasmine.anything());
    });

    it('should pass existing iframe to new ApiFrame, when there is an existing bc-specific iframe, already', function() {
      var expectedIFrame = bc.util.createElement('iframe', {class: bc.ApiFrame.frameClass});
      spyOn(document, 'getElementsByClassName').and.returnValue([expectedIFrame]);
      new bc.VisitorClient('testAuth');
      expect(bc.ApiFrame.prototype.initFrame).toHaveBeenCalledWith(expectedIFrame, jasmine.anything(), jasmine.anything());
    });
  });

  describe('bcClient.assembleAuthParamByAuthorizationType', function() {
    it('should give back valid aid and valid auth variable, when authorization type is private account key', function() {
      var privateAccountKey = "AccountID:2307475884;ChatWindowDefID:1998143730736545;WebsiteDefID:1998143594430657;OperatorID:;DepartmentID:;Timestamp:1535536742408;Key:EB0231BD22DF17B4BD72C71C68F9FD4AFC0A7A7475C4A33E573C1D6C30743E5014983EB92240B3CE839473059DE0801E37BE89CDB9E59568F17EF1F352BA0F7C;ServerSet:-dev.boldchat.com";
      var privateAccountKeyAuth = privateAccountKey.substring(0, privateAccountKey.indexOf(';ServerSet'));
      var authParam = client.assembleAuthParamByAuthorizationType(privateAccountKey);
      expect(authParam.aid).toEqual('2307475884');
      expect(authParam.auth).toEqual(privateAccountKeyAuth);
      expect(authParam.serverSet).toEqual('-dev.boldchat.com');
    });

    it('should give back empty aid and valid auth variable, when authorization type is private account key', function() {
      var privateAccountKey = "AccountID:;ChatWindowDefID:1998143730736545;WebsiteDefID:1998143594430657;OperatorID:;DepartmentID:;Timestamp:1535536742408;Key:EB0231BD22DF17B4BD72C71C68F9FD4AFC0A7A7475C4A33E573C1D6C30743E5014983EB92240B3CE839473059DE0801E37BE89CDB9E59568F17EF1F352BA0F7C;ServerSet:-dev.boldchat.com";
      var privateAccountKeyAuth = privateAccountKey.substring(0, privateAccountKey.indexOf(';ServerSet'));
      var authParam = client.assembleAuthParamByAuthorizationType(privateAccountKey);
      expect(authParam.aid).toEqual('');
      expect(authParam.auth).toEqual(privateAccountKeyAuth);
      expect(authParam.serverSet).toEqual('-dev.boldchat.com');
    });

    it('should give back valid aid and valid auth variable, when authorization type is basic', function() {
      var authParam = client.assembleAuthParamByAuthorizationType(session.basicAuth);
      var authParamParts = client.createAuthParamParts(session.basicAuth).parts;
      var auth = authParamParts.slice(0, 3).join(':');
      auth = bc.util.base64(auth);
      expect(authParam.aid).toEqual('2307475884');
      expect(authParam.auth).toEqual(auth);
      expect(authParam.serverSet).toEqual('-' + authParamParts[3]);
    });

    it('should give back valid aid and valid auth variable, when authorization type is basic and server set is not defined', function() {
      var basicAuthWithoutServerSet = "2307475884:1935873874619821:WFr8EvyhuCvpV7hHmIbHN6F1iTN3TLnx";
      var authParam = client.assembleAuthParamByAuthorizationType(basicAuthWithoutServerSet);
      var hashedAuth = bc.util.base64(basicAuthWithoutServerSet);
      expect(authParam.aid).toEqual('2307475884');
      expect(authParam.auth).toEqual(hashedAuth);
      expect(authParam.serverSet).toEqual(null);
    });
  });

  describe('finishChat', () => {
    describe('when chat is started', () => {
      beforeEach(() => {
        client.setState('started');
      });

      describe('when PostChat form is enabled', () => {
        beforeEach(() => {
          postChatEnabled = true;
        });

        it('should set state to PostChat', (done) => {
          client.finishChat()
            .success(() => {
              expect(client.getState()).toEqual('postchat');
              done();
            });
          tick();
        });

        it('should skip PostChat', (done) => {
          client.finishChat(true)
            .success(() => {
              expect(client.getState()).toEqual('done');
              done();
            });
          tick(0);
        });
      });

      describe('when PostChat form is disabled', () => {
        beforeEach(() => {
          postChatEnabled = false;
        });

        it('should set state to done', (done) => {
          client.finishChat()
            .success(() => {
              expect(client.getState()).toEqual('done');
              done();
            });
          tick(0);
        });
      });
    });
  });

  describe('shutdown', () => {
    beforeEach((done) => {
      client.createChat("", "", "", "", "")
        .success(done);
      waitForChatCreation();
    });

    it('should stop pinging chat', () => {
      bc.ApiFrame.prototype.call.calls.reset();

      client.shutdown();

      tick(30000);
      expect(bc.ApiFrame.prototype.call).not.toHaveBeenCalledWith('pingChat', jasmine.any(Object), true);
    });

    it('should destroy ApiFrame', () => {
      spyOn(bc.ApiFrame.prototype, 'destroy').and.callFake(() => {
      });

      client.shutdown();

      expect(bc.ApiFrame.prototype.destroy).toHaveBeenCalled();
    });
  });

  describe('Vendor RC', () => {
    beforeEach((done) => {
      client.createChat("", "", "", "", "")
        .success(() => {
          done();
        });
      waitForChatCreation();
    });

    describe('acceptRemoteControl', () => {
      it('should call VendorRemoteControl and accept session when vendor started message is in remote control data', () => {
        const rcHistoryId = 'rcHistoryId';
        const remoteControlData = {activationBaseUrl: 'test1', vendorPin: 'test2', rcHistoryId};
        client.handleMessage("remoteControlMessage", remoteControlData);

        client.acceptRemoteControl();

        expect(bcVendorRemoteControl.acceptVendorRemoteControl).toHaveBeenCalledWith(remoteControlData);
        expect(bc.ApiFrame.prototype.call).toHaveBeenCalledWith("acceptRemoteControlSession", {
          RCHistoryID: rcHistoryId,
          ChatKey: session.chatKey,
          auth: jasmine.anything(),
          ClientID: session.clientId,
          stream: true
        });
      });
    });

    describe('remoteControlMessage', () => {
      it('should decline RC when OS is not supported for vendor session', () => {
        const rcHistoryId = 'id';
        const remoteControlData = {command: 'started', activationBaseUrl: 'test', vendorPin: 'test', rcHistoryId};
        bcVendorRemoteControl.isOsSupported.and.returnValue(false);

        client.handleMessage("remoteControlMessage", remoteControlData);

        expect(bc.ApiFrame.prototype.call).toHaveBeenCalledWith("declineRemoteControlSessionForUnsupportedOs", {
          RCHistoryID: rcHistoryId,
          ChatKey: session.chatKey,
          ClientID: session.clientId,
          auth: jasmine.anything(),
          stream: true
        });
      });
    });
  });

  function tick(ms) {
    jasmine.clock().tick(ms);
  }

  function waitForChatCreation() {
    tick(0);
    tick(0);
  }

  function expectChatPing() {
    bc.ApiFrame.prototype.call.calls.reset();
    tick(30000);
    expect(bc.ApiFrame.prototype.call).toHaveBeenCalledWith('pingChat', jasmine.any(Object), true);
  }

  function createClient() {
    client = new bc.VisitorClient(session.basicAuth);

    // wait for client to initialize
    tick();
  }
});
