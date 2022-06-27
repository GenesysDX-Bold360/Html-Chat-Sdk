var bc = window.bc = (window.bc || {});

bc.UploadModule = (function () {
  var FileType = {
    DEFAULT: 'DEFAULT',
    PICTURE: 'PICTURE',
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
    PDF: 'PDF',
    WORD: 'WORD',
    EXCEL: 'EXCEL',
    PRESENTATION: 'PRESENTATION',
    CODE: 'CODE',
    TEXT: 'TEXT',
    ARCHIVE: 'ARCHIVE'
  };

  var MimeTypeIcons = (function () {
    var temp = {};
    temp[FileType.DEFAULT] = 'fa-file-o';
    temp[FileType.PICTURE] = 'fa-file-image-o';
    temp[FileType.VIDEO] = 'fa-file-video-o';
    temp[FileType.AUDIO] = 'fa-file-audio-o';
    temp[FileType.PDF] = 'fa-file-pdf-o';
    temp[FileType.WORD] = 'fa-file-word-o';
    temp[FileType.EXCEL] = 'fa-file-excel-o';
    temp[FileType.PRESENTATION] = 'fa-file-powerpoint-o';
    temp[FileType.CODE] = 'fa-file-code-o';
    temp[FileType.TEXT] = 'fa-file-text-o';
    temp[FileType.ARCHIVE] = 'fa-file-archive-o';
    return temp;
  }());

  var MimeTypeMapper = {
    // Default mime-types
    'default': FileType.DEFAULT,
    'image-default': FileType.PICTURE,
    'video-default': FileType.VIDEO,
    'audio-default': FileType.AUDIO,

    // PDF mime-type
    'application/pdf': FileType.PDF,

    // Code mime-types
    'text/html': FileType.CODE,
    'application/json': FileType.CODE,
    'application/x-javascript': FileType.CODE,

    // Text mime-types
    'text/plain': FileType.TEXT,
    'application/rtf': FileType.TEXT,
    'text/richtext': FileType.TEXT,

    // Archive mime-types
    'application/x-gzip': FileType.ARCHIVE,
    'application/gzip': FileType.ARCHIVE,
    'application/x-compressed': FileType.ARCHIVE,
    'application/x-zip-compressed': FileType.ARCHIVE,
    'application/zip': FileType.ARCHIVE,
    'application/x-tar': FileType.ARCHIVE,
    'application/java-archive': FileType.ARCHIVE,
    'multipart/x-zip': FileType.ARCHIVE,
    'multipart/x-gzip': FileType.ARCHIVE,

    // MSWord mime-types
    'application/msword': FileType.WORD,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileType.WORD,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template': FileType.WORD,
    'application/vnd.ms-word.document.macroEnabled.12': FileType.WORD,
    'application/vnd.ms-word.template.macroEnabled.12': FileType.WORD,

    // Excel mime-types
    'application/msexcel': FileType.EXCEL,
    'application/vnd.ms-excel': FileType.EXCEL,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileType.EXCEL,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.template': FileType.EXCEL,
    'application/vnd.ms-excel.sheet.macroEnabled.12': FileType.EXCEL,
    'application/vnd.ms-excel.template.macroEnabled.12': FileType.EXCEL,
    'application/vnd.ms-excel.addin.macroEnabled.12': FileType.EXCEL,
    'application/vnd.ms-excel.sheet.binary.macroEnabled.12': FileType.EXCEL,

    // Powerpoint mime-types
    'application/mspowerpoint': FileType.PRESENTATION,
    'application/vnd.ms-powerpoint': FileType.PRESENTATION,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileType.PRESENTATION,
    'application/vnd.openxmlformats-officedocument.presentationml.template': FileType.PRESENTATION,
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow': FileType.PRESENTATION,
    'application/vnd.ms-powerpoint.addin.macroEnabled.12': FileType.PRESENTATION,
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12': FileType.PRESENTATION,
    'application/vnd.ms-powerpoint.slideshow.macroEnabled.12': FileType.PRESENTATION,

    // Image mime-types (not starting with 'image/')
    // --

    // Video mime-types (not starting with 'video/')
    'application/annodex': FileType.VIDEO,
    'application/mp4': FileType.VIDEO,
    'application/ogg': FileType.VIDEO,
    'application/octet-stream': FileType.VIDEO,
    'application/vnd.rn-realmedia': FileType.VIDEO,
    'application/x-matroska': FileType.VIDEO,
    'application/x-troff-msvideo': FileType.VIDEO

    // Audio mime-types (not starting with 'audio/')
    // --
  };

  var PersonType = {
    Visitor: 'Visitor',
    Operator: 'Operator',
  };

  var UploadState = {
    Default: 'Default',
    UploadInProgress: 'UploadInProgress',
    Uploaded: 'Uploaded',
    SendingInProgress: 'SendingInProgress'
  };

  var FileUploadService = (function () {
    var API_VERSION = 'v1';
    var ACCOUNT_ID_PARAM = 'account-id';
    var filesEndpoint = 'files';
    var aidPrefix = 'aid';

    function FileUploadService(config, api, userObj) {
      this.config = config;
      this.api = api;
      this.userObj = userObj;
      this._fileUploadState = UploadState.Default;
    }

    FileUploadService.prototype = {
      constructor: FileUploadService,

      _getBaseUrl: function (accountId) {
        return [
          this.config.fileUploadHost,
          aidPrefix,
          accountId,
          ACCOUNT_ID_PARAM,
          accountId,
          API_VERSION
        ].join('/') + '/';
      },

      _getEndpointUrl: function (apiMethod, accountId) {
        if (!apiMethod) {
          throw new Error('Please specify apiMethod!');
        }

        if (!accountId) {
          throw new Error('Please specify accountId!');
        }

        return this._getBaseUrl(accountId) + apiMethod;
      },

      _sendPut: function (apiMethod, parameters) {
        if (!apiMethod) {
          throw new Error('Please specify apiMethod!');
        }

        var accountId = this.userObj.accountId;
        var queryString = parameters && parameters.queryString;
        var bodyParams = parameters && parameters.body;
        var url = this._getEndpointUrl(apiMethod, accountId);
        var headers = {
          skipHttpInterceptor: true,
          params: queryString,
          headers: {'Content-Type': 'application/json'}
        };

        return this.api.put(url, bodyParams || null, headers)
          .then(function (result) {
            return result.data;
          });
      },

      _sendPost: function (apiMethod, parameters) {
        if (!apiMethod) {
          throw new Error('Please specify apiMethod!');
        }

        var accountId = this.userObj.accountId;
        var queryString = parameters && parameters.queryString;
        var bodyParams = parameters && parameters.body;
        var url = this._getEndpointUrl(apiMethod, accountId);
        var headers = {
          skipHttpInterceptor: true,
          params: queryString,
          headers: {'Content-Type': 'application/json'}
        };

        // NOTE: If you leave the request body undefined, $http will not send the Content-Type header, and the server
        //       will return with a "No 'Access-Control-Allow-Origin' header is present on the requested resource" error.
        return this.api.post(url, bodyParams || null, headers)
          .then(function (result) {
            return result.data;
          });
      },

      _requestToken: function (chatId, fileName, fileSize, fileType) {
        if (!chatId) {
          throw new Error('Please specify chatId!');
        }

        if (!this.userObj.personId) {
          throw new Error('Please specify personId!');
        }

        if (typeof this.userObj.personType === 'undefined') {
          throw new Error('Please specify personType!');
        }

        if (!fileName) {
          throw new Error('Please specify file name!');
        }

        if (!fileSize) {
          throw new Error('Please specify file size!');
        }

        if (typeof fileType === 'undefined' || fileType == null) {
          throw new Error('Please specify file type!');
        }

        var params = this._getTokenRequestParams(chatId, fileName, fileSize, fileType);
        return this._sendPost(filesEndpoint, {body: params});
      },

      _getTokenRequestParams: function (chatId, fileName, fileSize, fileType) {
        var person = PersonType[this.userObj.personType].toUpperCase();

        return {
          chatId: chatId,
          personId: this.userObj.personId,
          clientId: this.userObj.clientId,
          personType: person,
          fileName: fileName,
          fileSize: fileSize,
          fileType: fileType
        };
      },

      _registerToken: function (token) {
        if (!token) {
          throw new Error('Please specify the upload token!');
        }

        var url = this._getTokenRegisterUrl(token);
        return this._sendPut(url);
      },

      _getTokenRegisterUrl: function (token) {
        return filesEndpoint + '/' + token;
      },

      queueFile: function (file, chatId) {
        if (!file) {
          throw new Error('Please specify the file!');
        }

        if (!chatId) {
          throw new Error('Please specify the chat id!');
        }

        this._file = file;
        this._chatId = chatId;
      },

      initiateUpload: function () {
        var _this = this;
        if (!this._file) {
          throw new Error('Please specify the file first!');
        }

        if (!this._chatId) {
          throw new Error('Please specify the chat id first!');
        }

        if (!this.userObj.accountId) {
          throw new Error('Please specify accountId!');
        }

        if (this._fileUploadState !== UploadState.Default) {
          throw new Error('Upload in progress');
        }

        this._fileUploadState = UploadState.UploadInProgress;
        return this._requestToken(this._chatId, this._file.name, this._file.size, this.getFileType())
          .then(function (result) {
            _this._uploadToken = result.token;
            _this._uploadUrl = result.uploadUrl;
          })
          .catch(function (error) {
            _this._fileUploadState = UploadState.Default;
            _this.hasErrorMessage = true;
            return Promise.reject(error);
          });
      },

      uploadFile: function (onProgress) {
        var _this = this;
        this._uploadRequest = this.api.upload(this._uploadUrl, this._file, onProgress);
        return this._uploadRequest
          .then(function () {
            _this._fileUploadState = UploadState.Uploaded;
          })
          .catch(function (error) {
            _this._fileUploadState = UploadState.Default;
            _this.hasErrorMessage = true;
            return Promise.reject(error);
          });
      },

      abortUpload: function () {
        if (this._uploadRequest && this._fileUploadState === UploadState.UploadInProgress) {
          this._uploadRequest.abort();
        }
      },

      sendFile: function () {
        var _this = this;
        if (!this.userObj.accountId) {
          throw new Error('Please specify accountId!');
        }

        if (this._fileUploadState !== UploadState.Uploaded) {
          throw new Error('Upload in progress');
        }

        this._fileUploadState = UploadState.SendingInProgress;
        return this._registerToken(this._uploadToken)
          .then(function () {
            _this._file = null;
            _this._fileUploadState = UploadState.Default;
          }, function (error) {
            _this._fileUploadState = UploadState.Default;
            _this.hasErrorMessage = true;
            return Promise.reject(error);
          });
      },

      isFileUploaded: function () {
        return this._fileUploadState === UploadState.Uploaded;
      },

      isSendingInProgress: function () {
        return this._fileUploadState === UploadState.SendingInProgress;
      },

      getFileType: function () {
        if (!this._file) {
          return null;
        }
        var contentType = this._file.type;

        // Firefox may recognize executables as an octect-stream
        if (this._file.name.toLowerCase().lastIndexOf('.exe') === this._file.name.length - 4) {
          return FileType.DEFAULT;
        }

        if (contentType.indexOf(';') >= 0) {
          contentType = contentType.substring(0, contentType.indexOf(';'));
        }

        var returnVal = MimeTypeMapper[contentType];
        if (returnVal === undefined) {
          if (contentType.indexOf('audio/') >= 0) {
            returnVal = MimeTypeMapper['audio-default'];
          } else if (contentType.indexOf('video/') >= 0) {
            returnVal = MimeTypeMapper['video-default'];
          } else if (contentType.indexOf('image/') >= 0) {
            returnVal = MimeTypeMapper['image-default'];
          } else {
            returnVal = FileType.DEFAULT;
          }
        }
        return returnVal;
      }
    };

    return FileUploadService;
  }());

  return {
    FileUploadService: FileUploadService,
    PersonType: PersonType,
    UploadState: UploadState,
    FileType: FileType,
    MimeTypeIcons: MimeTypeIcons,
    MimeTypeMapper: MimeTypeMapper
  };
}());
