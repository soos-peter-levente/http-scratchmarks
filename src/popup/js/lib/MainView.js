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


const MainView = (function () {


  const


  log = prefixLog("MainView"),


  message = new Messenger(),


  MainView = function (site) {

    this.container = $(".main-view-container");

    this.headerContainer = $(".main-view-header-container");
    this.siteBarContainer = $(".site-dropdown-container");
    this.ruleContainer = $(".site-rules-container .site-view-rules");
    this.footerContainer = $(".main-view-footer-container");

    this.reloadView(site);
  };


  MainView.prototype = {


    reloadView: function (site) {
      this.renderHeader();
      this.renderSiteBar(site);
      this.renderRules(site.paths);
      this.renderFooter();
    },


    showView: function () {
      this.container.show();
    },


    hideView: function () {
      this.container.hide();
    },


    renderHeader: async function () {
      message.isExtensionEnabled(resp => log(resp));
      this.headerContainer.empty();
      this.headerContainer.html(render("main-view-header-template"));
    },


    renderSiteBar: async function (site) {
      this.siteBarContainer.empty();
      this.siteBarContainer.html(render("main-view-sitebar-template", {
        domain: site.domain || await getCurrentURL(),
        isSiteEnabled: (!isEmptyObject(site) && site.isSiteEnabled !== undefined) ?
          site.isSiteEnabled : true
      }));
    },


    renderRules: function (paths) {
      this.ruleContainer.empty();
      if (paths && paths.length !== 0) {
        log("renders paths from", paths);
      } else {
        this.renderEmptyList();
      }
    },


    renderEmptyList: function () {
      this.ruleContainer.html(render("empty-list-template"));
    },


    renderFooter: function () {
      this.footerContainer.empty();
      this.footerContainer.html(render("main-view-footer-template"));
    }

  };


  return MainView;


})();

