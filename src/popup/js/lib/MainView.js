"use strict";


var log = prefixLog("MainView");


const MainView = (function () {


  const


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

