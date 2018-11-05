/* 2018 Soos Peter Levente. Licensed under the MIT license.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE. */


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
    this.isEnabled = undefined;
    this.filter = new RuleFilter();
    this.processor = new RequestSearchAndReplace();
    if (this.isEnabled || this.isEnabled === undefined) {
      this.enable();
    }
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

      return this.isEnabled;
    },


    disable: function () {
      this.isEnabled = false;

      browser.webRequest.onBeforeRequest.removeListener(processRequest);

      browser.webRequest.onHeadersReceived.removeListener(uncacheResponse);

      return this.isEnabled;
    }


  };


  return RequestProcessor;


})();
