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


  initializeSiteData = site => {
    if (site === undefined) {
      getCurrentDomain(domain => {
        message.getSite(domain, data => renderSiteData(domain, data));
        message.isExtensionEnabled(status => setMainToggle(status));
      });
    } else {
      message.getSite(site, data => renderSiteData(site, data));
    }
  },

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

    mainSiteBar.html(render("main-view-sitebar", {
      domain: site,
      isSiteEnabled: (data !== undefined && data.isSiteEnabled !== undefined)
        ? data.isSiteEnabled : true
    }));

    let deleteIcon = mainSiteBar.find(".delete-all-rules");
    let addRuleIcon = mainSiteBar.find(".add-site-rule");
    let siteToggle = mainSiteBar.find(".toggle-site-state input");
    let siteName = mainSiteBar.find(".site-name");

    onClickOrEnter(deleteIcon, () => deleteSite(deleteIcon));
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
          table.append(renderRule(currentPath.rules[j], currentPath));
        }
      }

      let pathName = element.find(".site-rule-path");
      let contents = element.find(".site-rule-content");
      let addRuleIcon = element.find(".site-rule-options.add");
      let deleteIcon = element.find(".site-rule-options.delete");

      onClickOrEnter(addRuleIcon, event => addRuleToPath(currentPath, data));
      onClickOrEnter(deleteIcon, event => deletePath(currentPath, deleteIcon));
      onClickOrEnter(pathName, function () {
        element.toggleClass("active");
        contents.toggleClass("active");
      });

      mainRuleView.append(element);
    }
  },


  renderRule = (rule, path) => {
    let element = $(render("site-rule", rule));
    let deleteIcon = element.find(".delete");
    let searchAndReplace = element.find(".search, .replace");
    onClickOrEnter(searchAndReplace, event => editRule(rule, path));
    onClickOrEnter(deleteIcon, event => deleteRule(path, rule, deleteIcon));
    return element;
  },


  renderEmptyList = () => {
    mainRuleView.html(render("empty-list"));
    mainRuleView.find(".info.empty-list").click(() => addNewRule());
  },


  renderDropdown = array => {
    mainRuleView.empty();
    mainRuleView.find(".site-dropdown-wrapper").remove();
    mainRuleView.prepend($(render("dropdown", array)));

    let siteBarInput = mainSiteBar.find("#site-dropdown-input");

    siteBarInput.on("input", filterDropdown);
    siteBarInput.on("keypress", jumpToDropdown);

    $(".site-dropdown.list-item").each(function (i) {
      $(this).mouseover(function () {
        onClickOrEnter($(this), loadDropdownSelection);
      });
    });
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
    resetEditFields();
  },


  showEdit = () => {
    mainContainer.hide();
    editContainer.show();
  },


  loadEditFields = (path, rule, disablePath) => {
    $(".edit-path select").val(path.pathType);
    $(".edit-path input").val(path.pathName);
    if (rule !== undefined) {
      $(".edit-search select").val(rule.ruleType);
      $(".edit-search textarea").val(rule.ruleSearch);
      $(".edit-replace textarea").val(rule.ruleReplace);
    }
    if (disablePath !== undefined && disablePath)
      $(".edit-path select, .edit-path input").prop("disabled" ,true);
  },


  resetEditFields = () => {
    $(".edit-path select").val("domain").prop("disabled", false);
    $(".edit-path input").val("").prop("disabled", false);;
    $(".edit-search select").val("string");
    $(".edit-search textarea").val("");
    $(".edit-replace textarea").val("");
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


  makeSiteObject = (site, path, rule) => {
    let newPath = {
      pathType: path.pathType,
      pathName: path.pathName,
      pathIsEnabled: path.pathIsEnabled
    };
    let newSite = {
      domain: site,
      siteIsEnabled: true
    };
    newPath.rules = rule ? [ rule ] : undefined;
    newSite.paths = newPath ? [ newPath ] : undefined;
    return newSite;
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

    message.getSiteNames(array => {
      renderDropdown(array);
    });
  },


  filterDropdown = event => {
    let input = $("#site-dropdown-input").val();
    if (event.key === 27) {
      event.preventDefault();
      log("Do something with selection");
      return;
    }
    $(".site-dropdown.list-item").each(function (i) {
      if (! $(this).text().startsWith(input)) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
  },


  loadDropdownSelection = event => {
    let domain = $(event.target).text();
    initializeSiteData(domain);
  },


  jumpToDropdown = event => {

    const step = event => {
      let target = undefined;
      if (event.keyCode === 40) {
        target = $(event.target).next();
      }
      if (event.keyCode === 38) {
        target = $(event.target).prev();;
      }
      onClickOrEnter(target, loadDropdownSelection);
      target.on("keydown", step);
      target.focus();
    };

    if (event.keyCode === 40) {
      let target = $(".site-dropdown.list-item:nth-child(1)");
      onClickOrEnter(target, loadDropdownSelection);
      target.on("keydown", step);
      target.focus();
    };
  },


  addNewRule = () => {
    let domain = getSelectedSite();
    showEdit();
    $("#path-input").val(domain).focus().select();
    onClickOrEnter($(".icon.cancel"), event => showMain());
    onClickOrEnter($(".icon.save"), event => saveRule(domain));
  },


  addRuleToPath = path => {
    let domain = getSelectedSite();
    loadEditFields(path, undefined, true);
    showEdit();
    $("#search-input").focus().select();
    onClickOrEnter($(".icon.cancel"), event => showMain());
    onClickOrEnter($(".icon.save"), event => saveRule(domain));
  },


  editRule = (rule, path) => {
    let domain = getSelectedSite();
    loadEditFields(path, rule, true);
    showEdit();
    $("#search-input").focus().select();
    onClickOrEnter($(".icon.cancel"), event => showMain());
    onClickOrEnter($(".icon.save"), event => {
      message.deleteSite(makeSiteObject(domain, path, rule), response => saveRule(domain));
    });
  },


  deleteSite = (icon) => {
    let domain = getSelectedSite();
    message.deleteSite( { domain: domain });
    initializeSiteData();
  },


  deletePath = (path, icon) => {
    let domain = getSelectedSite();
    message.deleteSite(makeSiteObject(domain, path));
    icon.parents(".site-rule-wrapper").remove();
    if ($(".site-rule-wrapper").length === 0) {
      renderEmptyList();
    }
  },


  deleteRule = (path, rule, icon) => {
    let domain = getSelectedSite();
    let header = icon.parents(".site-rule-table-header-row");
    message.deleteSite(makeSiteObject(domain, path, rule));
    icon.parents(".site-rule-table-row").remove();
    log("header", header);
    if ($(".site-rule-table-row").length === 0) {
      header.remove();
    }
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
  }


  ;// const defs end


  initialize();


})();
