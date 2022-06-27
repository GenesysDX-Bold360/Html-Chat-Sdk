var bc = window.bc || {};

describe('bc.Session', () => {
  const HEARTBEAT_TIMEOUT = 15000;
  const TEST_API_KEY = 'apiKey';

  let bcSession;
  let viewManagerMock;
  let canStartChatResponse;
  let createChatResponse;
  let chatWindowSettings;

  beforeEach(() => {
    canStartChatResponse = false;
    viewManagerMock = {
      initialize: jasmine.createSpy('initialize'),
      showBusy: jasmine.createSpy('showBusy'),
      hideBusy: jasmine.createSpy('hideBusy'),
      showForm: jasmine.createSpy('showForm'),
      closeChat: jasmine.createSpy('closeChat'),
      hideForm: jasmine.createSpy('hideForm'),
      hideChatInteraction: jasmine.createSpy('hideChatInteraction'),
      getLocalizedValue: jasmine.createSpy('getLocalizedValue'),
      setLocalizationValues: jasmine.createSpy('setLocalizationValues'),
      showStatusMessage: jasmine.createSpy('showStatusMessage'),
      showChatForm: jasmine.createSpy('showChatForm')
    };
    createChatResponse = {};
    chatWindowSettings = {
      EnableVideo: false
    };

    bcSession = new bc.Session(TEST_API_KEY, {}, {}, viewManagerMock, false);

    jasmine.getEnv().allowRespy(true);
    spyOnAllFunctions(bcSession.client);
    spyOn(bcSession.client, 'canStartChat').and.callFake(() =>
      bc.AsyncValue.resolve(canStartChatResponse));
    spyOn(bcSession.client, 'createChat').and.callFake(() => bc.AsyncValue.resolve(createChatResponse));
    spyOn(bcSession.client, 'finishChat').and.callFake(() => bc.AsyncValue.resolve({}));
    spyOn(bcSession.client, 'getChatWindowSettings').and.callFake(() => chatWindowSettings);
    jasmine.getEnv().allowRespy(false);

    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('startChat', () => {
    it('should create chat with pre-chat form', (done) => {
      createChatResponse = {
        PreChat: {
          field: 'random'
        }
      };

      bcSession.startChat(false, null, {})
        .success(() => {
          expect(viewManagerMock.showForm)
            .toHaveBeenCalledWith('api#prechat#intro', createChatResponse.PreChat, null, 'api#prechat#start',
              jasmine.any(Function));
          done();
        });
      jasmine.clock().tick(1);
    });

    it('should not call markChatAsVideoSupported if EnableVideo is false', (done) => {
      bcSession.startChat(false, null, {})
        .success(() => {
          expect(bcSession.client.markChatAsVideoSupported).not.toHaveBeenCalled();
          done();
        });
      jasmine.clock().tick(1);
    });

    it('should call markChatAsVideoSupported if EnableVideo is true', (done) => {
      chatWindowSettings.EnableVideo = true;

      bcSession.startChat(false, null, {})
        .success(() => {
          expect(bcSession.client.markChatAsVideoSupported).toHaveBeenCalled();
          done();
        });
      jasmine.clock().tick(1);
    });
  });

  describe('endChat', () => {
    beforeEach(() => {
      bcSession.endChat();
    });

    it('should unsubscribe from all event handlers', () => {
      expect(bcSession.client.unsubscribe).toHaveBeenCalledTimes(16);
    });
  });

  describe('heartbeat', () => {
    it('should trigger reconnect when no heartbeat in 15 seconds', () => {
      bcSession._heartbeat();

      jasmine.clock().tick(HEARTBEAT_TIMEOUT + 1);

      expect(bcSession.connectionState).toEqual('disconnected');
    });

    describe('destroy', () => {
      it('should stop waiting for heartbeat', () => {
        bcSession.destroy();

        jasmine.clock().tick(HEARTBEAT_TIMEOUT + 1);

        expect(bcSession.connectionState).not.toEqual('disconnected');
      });
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      bcSession.destroy();
    });

    it('should closeChat', () => {
      expect(viewManagerMock.closeChat).toHaveBeenCalled();
    });

    it('should hideForm', () => {
      expect(viewManagerMock.hideForm).toHaveBeenCalled();
    });

    it('should shut down client', () => {
      expect(bcSession.client.shutdown).toHaveBeenCalled();
    });

    it('should delete session data', () => {
      expect(bcSession.client.deleteSessionData).toHaveBeenCalled();
    });
  });
});
