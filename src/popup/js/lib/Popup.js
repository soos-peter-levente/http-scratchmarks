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


const Popup = (function () {


  const


  log = prefixLog("Popup"),


  message = new Messenger(),


  Popup = function () {
    this.loaderContainer = $(".popup-loader-container");
    this.bodyContainer = $(".body-wrapper");
    this.renderLoader();
  };


  Popup.prototype = {


    initialize: function () {
      getCurrentURL(url => {
        this.showLoader();
        this.loadSite(url);
        setTimeout(() => {
          this.hideLoader();
          this.showPopup();
        }, 200);
      });
    },


    renderLoader: function () {
      this.loaderContainer.html(render("popup-loader-template", {}));
    },


    showLoader: function () {
      this.loaderContainer.show();
    },


    hideLoader: function () {
      this.loaderContainer.hide();
    },


    loadSite: function (site) {
      message.getSite(site, data => new MainView(data));
    },


    showPopup: function () {
      this.bodyContainer.addClass("visible");
    },


    hidePopup: function () {
      this.bodyContainer.removeClass("visible");
    },


  };


  return Popup;


})();
