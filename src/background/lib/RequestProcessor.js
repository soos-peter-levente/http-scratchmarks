"use strict";


const RequestProcessor = (function () {


  const


  log = prefixLog("RequestProcessor"),


  storage = new Storage(),


  webRequestSettings = {
    urls: [
      "<all_urls>"
    ],
    types: [
      "main_frame",
      "xmlhttprequest",
      "stylesheet",
      "script"
    ]
  },


  NO_CACHE_HEADER = {
    name: "Cache-Control",
    value: "no-cache, no-store, must-revalidate"
  },


  processRequest = function (request) {
    let url = new URL((request.originUrl) ? request.originUrl : request.url);
    storage.get(url.host)
      .then(stored =>
            (stored.siteIsEnabled === this.isEnabled === true) ?
            this.filter.filter(request, stored) : [])
      .then(rules => this.processor.exec(request, rules));
  },


  uncacheResponse = function (response) {
    storage.get(new URL(response.url).host)
      .then(stored => {
        let headers = { responseHeaders: response.responseHeaders };
        if (stored.domain !== undefined) {
          for (let i = 0 ; i < headers.responseHeaders.length; i++) {
            if (headers.responseHeaders[i].name === NO_CACHE_HEADER.name) {
              headers.responseHeaders[i] = NO_CACHE_HEADER;
              return headers;
            }
          }
          headers.responseHeaders.push(NO_CACHE_HEADER);
        }
        return headers;
      });
  },


  RequestProcessor = function () {
    this.isEnabled = true;
    this.filter = new RuleFilter();
    this.processor = new RequestSearchAndReplace();
    if (this.isEnabled) this.enable();
  };


  RequestProcessor.prototype = {


    enable: function () {
      this.isEnabled = true;

      browser.webRequest.onBeforeRequest.addListener(
        processRequest.bind(this), webRequestSettings,
        ["blocking"]);


      browser.webRequest.onHeadersReceived.addListener(
        uncacheResponse.bind(this), webRequestSettings,
        ["blocking", "responseHeaders"]
      );

    },


    disable: function () {
      this.isEnabled = false;

      browser.webRequest.onBeforeRequest.removeListener(processRequest);

      browser.webRequest.onHeadersReceived.removeListener(uncacheResponse);

    }


  };


  return RequestProcessor;


})();
