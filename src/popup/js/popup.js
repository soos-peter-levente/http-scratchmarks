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


(function () {


  const


  log = prefixLog("Popup"),


  message = new Messenger(),


  // constant DOM elements
  loader = $(".popup-loader-container"),
  wrapper = $(".body-wrapper"),

  mainContainer = $(".main-view-container"),
  mainHeader = $(".main-view-header-container"),
  mainSiteBar = $(".site-dropdown-container"),
  mainRuleView = $(".site-view-rules"),
  mainFooter = $(".main-view-footer-container"),

  editContainer = $(".edit-view-container"),
  editHeader = $(".edit-view-header-container"),
  editEditor = $(".edit-view-editor-container"),
  editFooter = $(".edit-view-footer-container"),


  initialize = () => {
    renderLoader();
    showLoader();
    renderMain();
    renderEdit();
    initializeSiteData();
    setTimeout(() => {
      hideLoader();
      showMain();
    }, 200);
  },


  initializeSiteData = () =>
    getCurrentDomain(domain => {
      message.getSite(domain, data => renderSiteData(domain, data));
      message.isExtensionEnabled(status => setMainToggle(status));
    }),



  ///////////////
  // RENDERING //
  ///////////////


  renderLoader = () => {
    loader.html(render("popup-loader"));
  },


  renderMain = () => {
    mainHeader.html(render("extension-header", { title: "Scratchmarks"}));
    onClickOrEnter(mainHeader.find(".extension-header-toggle"), event => {
      message.toggleExtension(status => setMainToggle(status));
    });
    mainFooter.html(render("main-view-footer"));
  },


  renderEdit = () => {
    editHeader.html(render("extension-header", { title: "Add new rule"}));
    onClickOrEnter(editHeader.find(".extension-header-toggle"), event => {
      message.toggleExtension(status => setMainToggle(status));
    });
    editEditor.html(render("editor"));
    editFooter.html(render("edit-view-footer"));
  },


  renderSiteData = (site, data) => {
    // create dropdown
    mainSiteBar.html(render("main-view-sitebar", {
      domain: site,
      isSiteEnabled: (data !== undefined && data.isSiteEnabled !== undefined)
        ? data.isSiteEnabled : true
    }));

    let deleteIcon = mainSiteBar.find(".delete-all-rules");
    let addRuleIcon = mainSiteBar.find(".add-site-rule");
    let siteToggle = mainSiteBar.find(".toggle-site-state");
    let siteName = mainSiteBar.find(".site-name");

    onClickOrEnter(deleteIcon, () => {
      message.deleteSite({ domain: site });
      initializeSiteData();
    });
    onClickOrEnter(addRuleIcon, () => addNewRule(site, data[site]));
    onClickOrEnter(siteToggle, () => toggleSite(site));
    onClickOrEnter(siteName, () => searchDropdown());
    
    if (isEmptyObject(data) ||
        data === undefined ||
        data.paths === undefined ||
        data.paths.length === 0) {
      renderEmptyList();
    } else {
      mainRuleView.empty();
      renderPaths(data);
    }

  },


  renderPaths = data => {

    let paths = data.paths;

    for (let i = 0; i < paths.length; i++) {
      let currentPath = paths[i];
      let element = $(render("site-path", currentPath));
      if (currentPath.rules.length !== 0) {
        let table = element.find("tbody");
        for (let j = 0; j < currentPath.rules.length; j++) {
          table.append(renderRule(currentPath.rules[j]), data);
        }
      }

      let pathName = element.find(".site-rule-path");
      let contents = element.find(".site-rule-content");
      let addRuleIcon = element.find(".site-rule-options.add");
      let deleteIcon = element.find(".site-rule-options.delete");

      onClickOrEnter(addRuleIcon, event => addRuleToPath(currentPath, data));
      onClickOrEnter(deleteIcon, event => deletePath(currentPath, data));
      onClickOrEnter(pathName, function () {
        element.toggleClass("active");
        contents.toggleClass("active");
      });

      mainRuleView.append(element);
    }
  },


  renderRule = (rule, data) => {
    let element = $(render("site-rule", rule));
    let deleteIcon = element.find(".delete");
    let searchAndReplace = element.find(".search, .replace");
    onClickOrEnter(searchAndReplace, event => editRule(rule, data));
    onClickOrEnter(deleteIcon, event => deleteRule(rule, data));
    return element;
  },

  renderEmptyList = () => {
    mainRuleView.html(render("empty-list"));
    mainRuleView.on("click", () => addNewRule());
  },


  ////////////////////
  // DOM UTILILTIES //
  ////////////////////


  setMainToggle = status => {
    let mainToggle = $(".extension-header-toggle");
    mainToggle.toggleClass("active", status);
  },


  showLoader = () => {
    wrapper.toggleClass("active", false);
    loader.show();
  },


  hideLoader = () => {
    wrapper.toggleClass("active", true);
    loader.hide();
  },


  showMain = () => {
    editContainer.hide(),
    mainContainer.show();
  },


  showEdit = () => {
    mainContainer.hide();
    editContainer.show();
  },


  resetEditFields = () => {
    $(".edit-path select").val("domain");
    $(".edit-search select").val("string");
    $(".edit-path input").val("");
    $(".edit-search input").val("");
    $(".edit-replace input").val("");
  },


  setSiteToggle = status => mainSiteBar.find(".toggle-site-state input")
    .prop("checked", status),


  getSelectedSite = () => mainSiteBar.find(".site-name").text(),


  getSiteObjectFromInput = (site, data) => {
    return {
      domain: site,
      isSiteEnabled: (data && data.isSiteEnabled !== undefined)
        ? data.isSiteEnabled : true,
      paths: [ {
        pathType: $(".edit-path select").val(),
        pathName: $(".edit-path input").val(),
        pathIsEnabled: true,
        rules: [{
          ruleType:   $(".edit-search select").val(),
          ruleSearch: $(".edit-search textarea").val(),
          ruleReplace:$(".edit-replace textarea").val(),
          ruleIsEnabled: true
        }]
      }]
    };
  },


  //////////////////////////
  // STATE & RULE EDITING //
  //////////////////////////


  toggleSite = site => message.toggleSite(site, status => setSiteToggle(status)),


  searchDropdown = () => {
    let display = mainSiteBar.find(".site-display-container");
    let dropdown = mainSiteBar.find(".site-dropdown-input-line");
    display.hide();
    dropdown.show().find("input").focus();

    mainSiteBar.focusout(event => {
      display.show();
      dropdown.hide();
    });

    message.getSiteNames(data => log("Searching these sites:", data));
  },


  addNewRule = () => {
    let domain = getSelectedSite();
    message.getSite(domain, data => {
      showEdit();
      $("#path-input").val(domain).focus().select();
      onClickOrEnter($(".icon.cancel"), event => showMain());
      onClickOrEnter($(".icon.save"), event => saveRule(domain));
    });
  },


  addRuleToPath = (path, data) => {
    log("adds a new rule to this path.");
  },


  editRule = (rule, data) => {
    log("edits this rule.");
  },


  deletePath = (path, data) => {
    log("deletes this path.");
  },


  deleteRule = (rule, data) => {
    log("deletes rule from path");
  },


  saveRule = domain => {
    let object = getSiteObjectFromInput(domain);
    message.putSite(object, undefined, data => {
      message.getSite(domain, data => {
        renderSiteData(domain, data);
        resetEditFields();
        showMain();
      });
    });
  };// const defs end


  initialize();


})();
