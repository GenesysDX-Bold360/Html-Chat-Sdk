var bc = window.bc = (window.bc || {});

bc.VendorRemoteControl = function (api, win) {
  var ua = win.navigator.userAgent;
  var isIOS = ua.match(/(iPad|iPhone|iPod)/g) != null;
  var isSilk = /Silk/.test(ua);
  var isAndroid = /Android/.test(ua) || isSilk;
  var isHTCOne = /HTC_One/.test(ua);
  var isIEMobile = /IEMobile/.test(ua);
  var isX64 = /WOW64|x64|win64|amd64|x86_64/.test(ua);
  var isWindows = /Windows/.test(ua);
  var isMac = /Mac/.test(ua);
  var isDesktop = /(windows|linux|os\s+9|os\s+x\s+10|solaris|bsd)/i.test(ua) && !isIOS && !isAndroid && !isSilk && !isHTCOne && !isIEMobile && !/windows\s+phone/i.test(ua);

  this.acceptVendorRemoteControl = function (remoteControlData) {
    if (isDesktop && (isMac || isWindows)) {
      return downloadVendorRcApplet(remoteControlData.activationBaseUrl, remoteControlData.vendorPin, remoteControlData.vendorUrl, win);
    } else {
      openPopupWindow(remoteControlData.vendorUrl, win);
      return Promise.resolve();
    }
  };

  this.isOsSupported = function (remoteControlData) {
    var osSupport = remoteControlData.osSupport;

    if (!osSupport) {
      return true;
    }

    if (!isDesktop) {
      return osSupport.mobile;
    }

    if (isWindows) {
      return osSupport.windows;
    }

    if (isMac) {
      return osSupport.mac;
    }

    return false;
  };

  var downloadVendorRcApplet = function (activationBaseUrl, vendorPin, vendorUrl, win) {
    var vendorMetadataUrl = activationBaseUrl + 'api/v3/support/' + vendorPin + '/metadata?legacy=1';
    return api.get(vendorMetadataUrl)
      .then(function (response) {
        var vendorMetadata = response.data;
        win.location.href = isMac
          ? vendorMetadata.client_info.mac_download_url + vendorPin
          : isWindows && isX64
            ? vendorMetadata.client_info.win_download_url + vendorPin
            : vendorMetadata.client_info.win_download_url_x86 + vendorPin;
      })
      .catch(function () {
        openPopupWindow(vendorUrl, win);
      });
  };

  var openPopupWindow = function (url, win) {
    var width = win.screen.width / 2;
    var height = win.screen.height / 2;
    var left = (win.screen.width - width) / 2;
    var top = (win.screen.height - height) / 2;

    win.open(url,
      "bold360_visitor_rc",
      stringifyProperties({
        toolbar: false,
        scrollbars: true,
        resizable: true,
        width: width,
        height: height,
        top: top,
        left: left
      })
    );
  };

  var stringifyProperties = function (properties) {
    return Object.keys(properties).map(function (prop) {
      return prop + '=' + properties[prop];
    }).join(', ');
  };
};
