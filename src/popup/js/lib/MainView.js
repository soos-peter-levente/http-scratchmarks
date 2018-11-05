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


  let instance = undefined;


  const


  log = prefixLog("MainView"),
  message = new Messenger(),


  container = $(".main-view-container"),
  header = $(".main-view-header-container"),
  siteBar = $(".site-dropdown-container"),
  rules = $(".site-rules-container .site-view-rules"),
  footer = $(".main-view-footer-container"),


  MainView = function (site) {
    if (!instance) {
      instance = this;
    }
    if (site) {
      this.redrawView(site);
    }
    return instance;
  };


  MainView.prototype = {


    redrawView: function (site) {
      renderHeader();
      renderSiteBar(site);
      renderRules(site.paths);
      renderFooter();
      return this;
    },


    showView: function () {
      container.show();
      return this;
    },


    hideView: function () {
      container.hide();
      return this;
    },


    getInstance: function () {
      return instance;
    }

  };


  async function renderHeader () {
    header.empty();
    header.html(render("extension-header", {
      title: "Scratchmarks"
    }));
    message.isExtensionEnabled(status => {
      header.find(".extension-header-toggle")
        .toggleClass("active", status);
    });
  };


  async function renderSiteBar (site) {
    siteBar.empty();
    siteBar.html(render("main-view-sitebar", {
      domain: site.domain || await getCurrentDomain(),
      isSiteEnabled: (!isEmptyObject(site) && site.isSiteEnabled !== undefined) ?
        site.isSiteEnabled : true
    }));
  };


  function renderRules (paths) {
    rules.empty();
    if (paths && paths.length !== 0) {
      log("renders paths from", paths);
    } else {
      renderEmptyList();
    }
  };


  function renderEmptyList () {
    rules.html(render("empty-list"));
    onClickOrEnter(rules, event => {
      new MainView().hideView();
      new EditView().showView();
    });
  };


  function renderFooter () {
    footer.empty();
    footer.html(render("main-view-footer"));
  }


  function getSelectedSite () {
    return siteBar.find(".site-name").text();
  };


  return MainView;


})();

