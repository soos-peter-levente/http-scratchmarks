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


const Dispatch = (function () {


  const


  log = prefixLog("Dispatch"),


  storage = new Storage(),


  processor = new RequestProcessor(),


  Dispatch = function () {
    this.responder = null;
    this.port = null;
  };


  /////////
  // API //
  /////////


  Dispatch.prototype = {


    enableMessages: function () {
      browser.runtime.onConnect.addListener(
        port  => {
          this.port = port;
          this.responder = makeResponder(port).bind(this);
          this.port.onMessage.addListener(this.responder);
        });

      const makeResponder = (port) => {

        const respond = (message, response) => {
          log("to Popup: ", { label: message.label, payload: response});
          port.postMessage({
            label: message.label,
            id: message.id,
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


    disableMessages: function () {
      this.port.onMessage.removeListener(this.responder);
    },


    isExtensionEnabled: function () {
      return processor.isEnabled;
    },


    toggleExtension: function () {
      return processor.isEnabled ? processor.disable() : processor.enable();
    },


    toggleSite: async function () {
    },


    clearAll: async function () {
      await storage.clearAll();
    },


    getSite: async function (site) {
      let stored = await storage.get(site);
      return stored[site] || {};
    },


    getSiteNames: async function () {
      return Object.keys(await storage.get());
    },


    getAllSites: async function () {
      return await storage.get() || {};
    },


    putSite: async function (site, prev) {
      return this.getSite(site.domain)
        .then(stored => new Site(stored).put(site, prev))
        .then(result => storage.put(site.domain, result)
              .then(()=> this.getSite(site.domain)));
    },


    deleteSite: async function (site) {
      log("deletes", site);
      if (site.paths !== undefined) {
        return this.getSite(site.domain)
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
    }


  };


  return Dispatch;


})();
