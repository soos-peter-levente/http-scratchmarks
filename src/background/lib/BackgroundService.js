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


const BackgroundService = (function () {

  const

    /* The BackgroundService has two purposes: first, it snoops on HTTP
     responses and alters them via a `processor' (a function that
     takes a Request object as argument and which is passed during
     instantiation, so it is rather loosely coupled). Secondly, it
     provides an interface for the popup to check/change extension
     state and load or store rules.

     So that's three things instead of one (or two...), and request
     processing, extension state and storage management interfaces
     could be meaningfully extracted, but at this size, it's not that
     Big a Whoop to let the popup use a single tunnel. */


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


  storage = new Storage(),


  log = prefixLog("BG "),


  /////////
  // API //
  /////////


  BackgroundService = function (processor) {
    // First, load all settings
    this.settings = {
      enabled: true,
      request: webRequestSettings
    };
    /* `processor' or a dolittle function. Remind you of anything? */
    this.processor = (processor) ? processor : ()=>{};
    this.responder = null;
    this.port = null;

    // Start listening depending on extension state.
    if (this.settings.enabled) this.start();
  };


  BackgroundService.prototype = {

    listen: function () {

      browser.runtime.onConnect.addListener(
        port  => {
          this.port = port;
          this.responder = makeResponder(port).bind(this);
          this.port.onMessage.addListener(this.responder);
        });


      const makeResponder = (port) => {
        const respond = (message, response) => {
          log("sends to PU: ", { label: message.label, payload: response});
          port.postMessage({
            label: message.label,
            payload: response
          });
        };
        return (message) => {
          try {
            var response = this[message.label].bind(this).apply(null, message.args);
            // keep promises on the background
            if (typeof response.then === "function")
              response.then(response => respond(message, response));
            else respond(message, response);
          } catch (e) {
            throw new Error("Undefined Response Error! '" + message.label + "' did not produce a value." );
          }
        };

      };

    },


    ignore: function () {
      this.port.onMessage.removeListener(this.responder);
    },


    start: function () {
      browser.webRequest.onBeforeRequest.addListener(
        this.processor, this.settings.request, ["blocking"]);
      this.settings.enabled = true;
    },


    stop: function () {
      browser.webRequest.onBeforeRequest.removeListener(this.processor);
      this.settings.enabled = false;
    },


    toggle: function () {
      this.settings.enabled ? this.stop() : this.start();
      return this.settings.enabled;
    },


    state: function () {
      return this.settings.enabled;
    },


    clear: function () {
      return storage.clearAll();
    },


    flip: function (site) {
      if (site === undefined)
        // otherwise, everything is returned for an empty query...
        throw new Error("Required parameter 'site' is undefined!");

      return this.get(site).then(stored => {
        stored.siteIsEnabled = !stored.siteIsEnabled;
        return this.put(stored);
      });

    },


    get: function (site) {
      return storage.get(site).then(stored => stored[site] || {});
    },


    put: function (site) {
      return this.get(site.domain)
        .then(stored => new Site(stored).merge(new Site(site)))
        .then(result => storage.put(site.domain, result)
              .then(()=> this.get(site.domain)));
    },


    del: function (site) {
      if (site.paths !== undefined) {
        return this.get(site.domain)
          .then(stored => {
            let result = new Site(stored);
            for (let i = 0; i < site.paths.length; i++) {
              result = result.delPath(site.paths[i]);
            };
            return storage.put(site.domain, result);
          });
      } else {
        return storage.put(site.domain, undefined);
      }
    },


  };



  return BackgroundService;


})();
