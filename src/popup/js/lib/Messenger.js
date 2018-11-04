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


var log = prefixLog("Message");


const Messenger = (function () {


  /* The previous approach to the messaging between the popup and the
   * background (dispatch on string labels) turned out to be broken in
   * a fundamental way: each unique use case of the API required a
   * uniquely named call. To avoid that sort of proliferation, a
   * lexically closed-over messageID is used to associate a callback
   * with the response. The label is still there, but it is only used
   * in the background (and no case analysis is required, we just need
   * to make sure that a function with the same name as the label is
   * present in Dispatch). */


  let


  messageID = 0,


  callbacks = {},

  // singleton
  instance = undefined;


  const


  /**
   * Call in-store callback for response.id on the response
   * payload. Remove the callback afterwards.
   *
   * @param {object} response -- response received from background.
   */
  handle = function (response) {
    callbacks[response.id](response.payload);
    delete callbacks[response.id];
  },


  Messenger = function () {
    if (!instance) {
      instance = this;
      this.handlingIsEnabled = true;
      this.background = browser.runtime.connect( { name: "background" } ),
      this.handleResponses();
    }
    return instance;
  };


  /////////
  // API //
  /////////


  Messenger.prototype = {


    handleResponses: function () {
      this.handlingIsEnabled = true;
      this.background.onMessage.addListener(handle);
    },


    ignoreResponses: function () {
      this.handlingIsEnabled = false;
      this.background.onMessage.removeListener(handle);
    },


    enableMessages: function (callback) {
      this.send("enableMessages", callback);
    },


    disableMessages: function (callback) {
      this.send("disableMessages", callback);
    },


    isExtensionEnabled: function (callback) {
      this.send("isExtensionEnabled", callback);
    },


    toggleExtension: function (callback) {
      this.send("toggleExtension", callback);
    },


    toggleSite: function (callback) {
      this.send("toggleSite", callback);
    },


    clearAll: function (callback) {
      this.send("clearAll", callback);
    },


    getSite: function (site, callback) {
      this.send("getSite", callback, site);
    },


    getSiteNames: function (site, callback) {
      this.send("getSiteNames", callback, site);
    },


    getAllSites: function (callback) {
      this.send("getAllSites", callback);
    },


    putSite: function (site, prev, callback) {
      this.send("putSite", callback, site, prev);
    },


    deleteSite: function (site, callback) {
      this.send("deleteSite", callback, site);
    },


    /**
     * Create a message with label and send it to background. At the
     * same time, associate a callback with a unique request ID to
     * be called when the background responds.
     *
     * Generally, send should not be called directly. It is wrapped by
     * the rest of the API.
     *
     * @param {string} label -- the name of the API call.
     * @param {function} callback -- function to call on the response
     * @param {array} args -- arguments to pass to background.
     */
    send: function (label, callback, ...args) {
      messageID++;

      log("to Dispatch: ", {
        label: label,
        id: messageID,
        args: args
      });

      this.background.postMessage({
        id: messageID, // increment guarantees uniqueness in session
        label: label,
        args: args || []
      });

      if (this.handlingIsEnabled) {
        callbacks[messageID] = callback || (()=>{});
      }

    }


  };


  return Messenger;


})();
