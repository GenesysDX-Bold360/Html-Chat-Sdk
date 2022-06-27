import * as Chance from 'chance';
import * as sinon from 'sinon';

var bc = window.bc || {};

const mockPromise = () => {
  let counter = 0;
  let f = () => {
    f.calledOnce = ++counter === 1;
    return new Promise(resolve => {
      setTimeout(() => {
        counter--;
        resolve();
      }, 250);
    });
  };

  f.calledOnce = false;
  return f;
};

describe('FileUploadService', () => {
  let fileUploadService;
  let file;
  let configMock;
  let apiMock;
  let accountId;
  let personId;
  let chatId;
  let userObjMock;
  let uploadToken;
  let chance;

  beforeEach(() => {
    chance = new Chance.Chance();

    file = {
      name: 'file.name',
      type: 'text/html',
      size: chance.integer({min: 0})
    };

    configMock = {fileUploadHost: sinon.stub().returns('apiUrl')};
    uploadToken = chance.integer({min: 0});
    chatId = chance.integer({min: 0});
    accountId = chance.integer({min: 0});
    personId = chance.integer({min: 0});

    userObjMock = {accountId, personId, personType: bc.UploadModule.PersonType.Operator};

    apiMock = {
      post: mockPromise(),
      put: mockPromise()
    };

    fileUploadService = new bc.UploadModule.FileUploadService(configMock, apiMock, userObjMock);
  });

  describe('initiateUpload', () => {
    beforeEach(() => {
      fileUploadService._fileUploadState = bc.UploadModule.UploadState.Default;
      fileUploadService.queueFile(file, chatId);
    });

    it('should send only one post request even if initiateUpload was called multiple times', () => {
      fileUploadService.initiateUpload();

      expect(() => fileUploadService.initiateUpload()).toThrow(new Error('Upload in progress'));
      expect(apiMock.post.calledOnce).toEqual(true);
    });
  });

  describe('sendFile', () => {
    beforeEach(() => {
      fileUploadService._uploadToken = uploadToken;
      fileUploadService._fileUploadState = bc.UploadModule.UploadState.Uploaded;
    });

    it('should send only one put request even if sendFile was called multiple times', () => {
      fileUploadService.sendFile();

      expect(() => fileUploadService.sendFile()).toThrow(new Error('Upload in progress'));
      expect(apiMock.put.calledOnce).toEqual(true);
    });
  });
});
