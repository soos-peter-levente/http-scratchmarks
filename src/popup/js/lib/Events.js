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


  const


  log = prefixLog("Events"),


  message = new Messenger(),


  onClickOrEnter = (element, callback) => {
    element.on("keydown", function (event) {
      if (event.keyCode === 13)
        callback(event);
    });
    element.on("click", function (event) {
      element.blur();
      callback(event);
    });
  },


  Events = function () {};


  Events.prototype = {


    addSiteBarEvents: function (siteBar, site) {
      onClickOrEnter(siteBar, () => log("triggers siteBar event"));
    },


    addEmptyListEvents: function (emptyList) {
      onClickOrEnter(emptyList, () => log("triggers empty list event"));
    },


    addFooterEvents: function (footer) {
      onClickOrEnter(footer, () => log("triggers footer event"));
    }
  };


  return Events;


})();
