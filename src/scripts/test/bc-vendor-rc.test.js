var bc = window.bc || {};

describe('BcVendorRemoteControl', () => {
  const macDownloadUrl = "macUrl";
  const winDownloadUrl = "winUrl";
  const winDownloadUrlX86 = "winX86Url";
  const getResponse = {
    data: {
      client_info: {
        mac_download_url: macDownloadUrl,
        win_download_url: winDownloadUrl,
        win_download_url_x86: winDownloadUrlX86
      }
    }
  };

  let windowMock;
  let apiMock;

  let vendorRemoteControl;

  beforeEach(() => {
    windowMock = {
      navigator: {
        userAgent: ''
      },
      location: {
        href: ''
      },
      screen: {
        width: 420,
        height: 69
      },
      open: jasmine.createSpy("open")
    };
    apiMock = {
      get: jasmine.createSpy("get")
    };
  });

  describe('acceptVendorRemoteControl', () => {
    let remoteControlData;

    beforeEach(() => {
      remoteControlData = {
        activationBaseUrl: 'baseUrl',
        vendorPin: 'vendorPin',
        vendorUrl: 'vendorUrl'
      };
    });

    it('should set href to download url for mac', async () => {
      apiMock.get.and.callFake(() => Promise.resolve(getResponse));
      windowMock.navigator.userAgent = 'Mac OS X 10';

      vendorRemoteControl = new bc.VendorRemoteControl(apiMock, windowMock);
      await vendorRemoteControl.acceptVendorRemoteControl(remoteControlData);

      expect(apiMock.get).toHaveBeenCalledWith(remoteControlData.activationBaseUrl + "api/v3/support/" + remoteControlData.vendorPin + "/metadata?legacy=1");
      expect(windowMock.location.href).toEqual(macDownloadUrl + remoteControlData.vendorPin);
    });

    it('should set href to download url for windows', async () => {
      apiMock.get.and.callFake(() => Promise.resolve(getResponse));
      windowMock.navigator.userAgent = 'Windows win64';

      vendorRemoteControl = new bc.VendorRemoteControl(apiMock, windowMock);
      await vendorRemoteControl.acceptVendorRemoteControl(remoteControlData);

      expect(apiMock.get).toHaveBeenCalledWith(remoteControlData.activationBaseUrl + "api/v3/support/" + remoteControlData.vendorPin + "/metadata?legacy=1");
      expect(windowMock.location.href).toEqual(winDownloadUrl + remoteControlData.vendorPin);
    });

    it('should set href to download url for windows x86', async () => {
      apiMock.get.and.callFake(() => Promise.resolve(getResponse));
      windowMock.navigator.userAgent = 'Windows';

      vendorRemoteControl = new bc.VendorRemoteControl(apiMock, windowMock);
      await vendorRemoteControl.acceptVendorRemoteControl(remoteControlData);

      expect(apiMock.get).toHaveBeenCalledWith(remoteControlData.activationBaseUrl + "api/v3/support/" + remoteControlData.vendorPin + "/metadata?legacy=1");
      expect(windowMock.location.href).toEqual(winDownloadUrlX86 + remoteControlData.vendorPin);
    });

    it('should open new window on error', async () => {
      windowMock.navigator.userAgent = 'Error';
      apiMock.get.and.callFake(() => Promise.reject("failed"));

      vendorRemoteControl = new bc.VendorRemoteControl(apiMock, windowMock);
      await vendorRemoteControl.acceptVendorRemoteControl(remoteControlData);

      expect(windowMock.open).toHaveBeenCalledWith(remoteControlData.vendorUrl, 'bold360_visitor_rc', getExpectedWindowParameters());
    });

    it('should open new window on mobile', async () => {
      windowMock.navigator.userAgent = 'iPhone';
      apiMock.get.and.callFake(() => Promise.reject("failed"));

      vendorRemoteControl = new bc.VendorRemoteControl(apiMock, windowMock);
      await vendorRemoteControl.acceptVendorRemoteControl(remoteControlData);

      expect(windowMock.open).toHaveBeenCalledWith(remoteControlData.vendorUrl, 'bold360_visitor_rc', getExpectedWindowParameters());
    });
  });

  describe('isOsSupported', () => {
    it('should return true when no osSupport in remoteControlData', () => {
      const vendorRemoteControl = new bc.VendorRemoteControl(apiMock, windowMock);

      expect(vendorRemoteControl.isOsSupported({})).toBeTrue();
    });

    [
      ["Mac OS X 10", "mac"],
      ["Windows", "windows"],
      ["iPhone", "mobile"]
    ].forEach((item) => {
      it(`should return true for '${item[0]}' useragent when ${item[1]} is enabled`, () => {
        const remoteControlData = {
          osSupport: {
            [item[1]]: true
          }
        };
        windowMock.navigator.userAgent = item[0];
        const vendorRemoteControl = new bc.VendorRemoteControl(apiMock, windowMock);

        expect(vendorRemoteControl.isOsSupported(remoteControlData)).toBeTrue();
      });

      it(`should return false for '${item[0]}' useragent when ${item[1]} is disabled`, () => {
        const remoteControlData = {
          osSupport: {
            [item[1]]: false
          }
        };
        windowMock.navigator.userAgent = item[0];
        const vendorRemoteControl = new bc.VendorRemoteControl(apiMock, windowMock);

        expect(vendorRemoteControl.isOsSupported(remoteControlData)).toBeFalse();
      });
    });
  });

  function getExpectedWindowParameters() {
    const width = windowMock.screen.width / 2;
    const height = windowMock.screen.height / 2;
    const left = (windowMock.screen.width - width) / 2;
    const top = (windowMock.screen.height - height) / 2;

    return `toolbar=false, scrollbars=true, resizable=true, width=${width}, height=${height}, top=${top}, left=${left}`;
  }
});
