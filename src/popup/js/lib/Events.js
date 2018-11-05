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


const Events = (function () {


  let instance = undefined;


  const


  log = prefixLog("Events"),
  message = new Messenger(),


  Events = function () {
    if (!instance) {
      instance = this;
    }
    return instance;
  };


  Events.prototype = {


    /////////////////
    // MAIN SCREEN //
    /////////////////


    addHeaderEvents: function (header) {
      let toggle = header.find(".extension-header-toggle");
      onClickOrEnter(toggle, event => {
        message.toggleExtension(status => toggle.toggleClass("active", status));
      });
    },


    addSiteBarEvents: function (siteBar, site) {
      onClickOrEnter(siteBar, () => log("triggers siteBar event"));
    },


    addEmptyListEvents: function (emptyList, site) {
      onClickOrEnter(emptyList, () => {
        new EditView(site).showView();
        new MainView().hideView();
      });
    },


    addPathEvents: function (path, site) {
      onClickOrEnter(path, event => log("clicked on a path"));
    },


    addFooterEvents: function (footer) {
      onClickOrEnter(footer, event => {
        let settings = footer.find(".icon.settings");
        onClickOrEnter(settings, event => log("Open settings"));
      });
    }


  };


  return Events;


})();
