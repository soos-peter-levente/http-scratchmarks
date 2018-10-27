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


"use strict"; const


log = prefixLog("PU ");


(function () {

  const 

  ////////////////
  // BACKGROUND //
  ////////////////


  /* We communicate with the background using the API below, which
   * mirrors the callable methods of BackgroundService (except for
   * `dispatch', which is a popup-side exclusive background message
   * handler).
   *
   * THe way this works is, it seems the Port messaging API doesn't
   * have an onResponse listener (and sendResponse has disappeared
   * some time ago?). The BackgroundService is set to send responses
   * to each message from the popup, but the request and the response
   * are only paired up via their label. The popup-side implements an
   * API call as a.) the functions themselves and b.) the
   * corresponding branch in the `dispatch' function, which tells the
   * popup what to do with a response with a given label. In the
   * js-docs below, @returns refers to the payload that is sent to
   * `dispatch' in the response.
   *
   * By the way, all the background ever does in this direction is
   * respond. It will never send anything to the popup without having
   * first logged a corresponding message. The pop-up only sends
   * messages to the background during initialization and after that,
   * upon user action.*/


  // API calls are made through this port (in `send')
  background = browser.runtime.connect( { name: "background" } ),


  // hook into  responses
  addBackgroundListener = () =>
    background.onMessage.addListener(dispatch),


  removeBackgroundListener = () =>
    background.onMessage.removeListener(dispatch),


  /**
   * Send a message with `label' and `args' to the background. Wrapper
   * for the messaging API of the Port object.
   * @param {string} label - name of the call to be invoked by the background.
   * @param {array} args - array of arguments to be passed to the invocation.
   */
  send = (label, ...args) => {
    log("sends to BG: ", { label: label, args: args });
    background.postMessage({
      label: label,
      args: args || []
    });
  },


  /////////
  // API //
  /////////


  /**
   * Message background to `start' the extension (global).
   */
  start = () => send("start"),


  /**
   * Message background to `stop' the extension (global).
   */
  stop = () => send("stop"),


  /**
   * Message background to `flip' the extension switch (global).
   */
  flip = () => send("flip"),


  /**
   * Message background to `toggle' site.
   */
  toggle = site => send("toggle", site),


  /**
   * Message background to send extension `state' in the payload of a
   * labeled asynchronous message.
   * @returns {boolean} - enabled / disabled
   */
  state = () => send("state"),


  /**
   * Message background to `clear' the contents of the local
   * storage. All settings and saved sites/paths/rules are lost.
   */
  clear = () => send("clear"),


  /**
   * Message background to respond with a \"get\" labeled message
   * that contains all rules associated with `site'.
   * @param {string} site - the domain for which to get rules.
   */
  get = site => send("get", site),


  /**
   * Message the background to set/update `site'.
   * @param {string} site - the domain to associate the path & rules to.
   */
  put = (site) => send("put", site),


  /**
   * Message the background to delete specified parts of site
   * object. The scope of deletion works via specificity of content in
   * `site'. If a `paths' property is defined, each of the paths in it
   * are searched for rules. If any rules are found in any, those
   * rules are deleted, but the path itself remains intact. Otherwise,
   * the path is deleted. If no `paths' property is found, all paths
   * associated with the site are deleted.
   *
   * @param {object} site - the site on which to run the delete call.
   */
  del = (site) => send("del", site),


  /**
   * Handle responses sent by the background in response to API calls.
   * @param {object} response - the response received from background.
   */
  dispatch = response => {
    switch (response.label) {
        // redraw with payload
      case "get":
      case "put":
        renderData(response.payload);
        break;;
        // don't redraw
      case "del":
        /* The UI event handlers should take care of visual removal of
         * elements. Deletion in storage has already happened by the
         * time of dispatch, so this case is superfluous, but it's
         * listed explicitly until behavior is sorted out.
         */
        break;;
      case "clear":
        voidList();   // special case
        break;;
      case "start":
      case "stop":
      case "toggle":
      case "state":
        setSlider(mainToggle, response.payload);
        break;;
      case "flip":
        setSlider(siteToggle, response.payload);
        break;;
      default:
        console.log("PU: NOP:", response);
    }
  },



  ///////////////////////
  // DOM & INTERACTION //
  ///////////////////////


  // DOM elements
  mainView = $(".main-view-container"),
  editView = $(".edit-view-container"),

  mainFooter = $(".site-view-footer"),
  editFooter = $(".edit-view-footer"),

  siteRules = $(".site-view-rules"),

  editTitle = $("#edit-title h1"),

  mainToggle = $("#main-status input"),
  siteToggle = $("#site-status input"),

  siteUseText = $("#site-status .toggle-text"),
  siteName = $(".site-name"),

  deleteIcon = $(".icon.trash"),
  exportIcon = $(".icon.export"),
  importIcon = $(".icon.import"),
  addNewIcon = $(".icon.add"),

  cancelIcon = $(".icon.cancel"),
  searchIcon = $(".icon.search"),
  resetIcon = $(".icon.reset"),
  saveIcon = $(".icon.save"),

  pathDropdown = $(".edit-path-dropdown"),
  searchDropdown = $(".edit-rule-dropdown"),

  pathID = $("#path-id"),
  searchID = $("#rule-id"),

  pathInput = $("#edit-domain-path"),
  searchInput = $("#edit-search"),
  replaceInput = $("#edit-replace"),


  // templates
  nameTemplate = $("#site-name-template").html(),
  pathTemplate = $("#site-path-template").html(),
  ruleTemplate = $("#site-rule-template").html(),


  setSlider = (slider, status) => slider.attr("checked", status),


  getSlider = (slider) => slider.prop("checked"),


  showMain = () => {
    mainView.show();
    mainFooter.show();
    editView.hide();
    editFooter.hide();
  },


  showEdit = () => {
    mainView.hide();
    mainFooter.hide();
    editView.show();
    editFooter.show();
  },


  showSearch = () => {
    log("Search screen in development");
  },


  /* We'll assume that we only ever want to edit rules for the current
   * tab. Though this might not always be the case, anything more
   * involved is too much for such a lean popup anyway. A domain
   * selector dropdown below the main toggle could also work.
   */


  withURL = callback =>
    browser.tabs.query({ currentWindow: true, active: true })
    .then(tabs => new URL(tabs[0].url))
    .then(url  => callback ? callback(url) : url),


  ///////////////////////
  // UI EVENT HANDLERS //
  ///////////////////////


  add = event => {
    editTitle.text("Add new rule");
    showEdit();
    pathInput.focus();
  },


  addDomain = event => {
    editTitle.text("Add new rule");
    withURL(url => pathInput.val(url.host));
    showEdit();
    searchInput.focus();
  },


  edit = (rule, path) => {
    editTitle.text("Edit rule");
    addRuleAndPathToDOM(rule, path);
    showEdit();
    pathInput.focus().select();
  },


  reset = event => {
    voidInput();
    pathInput.focus();
  },


  search = event => showSearch(),


  cancel = event => {
    voidInput();
    showMain();
  },


  voidInput = () => {
    pathInput.val("");
    searchInput.val("");
    replaceInput.val("");
    searchID.attr("data-rule-id", "");
    pathID.attr("data-path-id", "");
  },


  voidList = () => siteRules.html(""),


  addRuleAndPathToDOM = (rule, path) => {
    pathInput.val(path.pathName);
    pathDropdown.val(path.pathType);
    pathID.attr("data-path-id", path.pathID);

    searchInput.val(rule.ruleSearch);
    replaceInput.val(rule.ruleReplace);
    searchDropdown.val(rule.ruleType);
    searchID.attr("data-rule-id", rule.ruleID);
  },


  // function keyword to bind `this'
  toggleContents = function (event) {
    $(this).parent().siblings(".site-rule-content").toggleClass("active")
      .parents(".site-rule-wrapper").toggleClass("active");
  },


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


  ///////////////////////
  // BACKGROUND EVENTS //
  ///////////////////////



  save = event =>
    withURL(url => {
      let site = {
        domain: url.host,
        siteIsEnabled: getSlider(siteToggle),
        paths: [{
          pathIsEnabled: true,
          pathType: pathDropdown.val(),
          pathName: pathInput.val(),
          rules: [{
            ruleIsEnabled: true,
            ruleType: searchDropdown.val(),
            ruleSearch: searchInput.val(),
            ruleReplace: replaceInput.val()
          }]
        }]
      };
      put(site);
      voidInput();
      showMain();
    }),


  deletePath = (rule, icon) => {
    withURL(url => del(url.host, rule.ruleID));
    $(icon).parents(".site-rule-wrapper").html("");
  },


  deleteRule = (rule, icon) => {
    withURL(url => del(url.host, rule.pathID, ));
    $(icon).parents("tr.site-rule-table-row").html("");
  },


  deleteAll = () => clear(),


  toggleSite = () => {},


  toggleMain = () => {},


  exportData = () => log("Export all rules"),


  importData = () => log("Import all rules"),

  ///////////////
  // RENDERING //
  ///////////////


  render = (template, object) =>
    Mustache.render(template, object),


  renderData = siteData => {
    voidList();
    renderDomain();
    if ($.isEmptyObject(siteData)) return;
    for (let path of siteData.paths)
      siteRules.append(renderPath(path));
    setSlider(siteToggle, (siteData.siteIsEnabled || true));
  },


  renderDomain = () =>
    withURL(url => siteUseText.html(
      render(nameTemplate, { domain: url.host }))
                   .find(".site-name").on("click", addDomain)),


  renderPath = path => {
    let pathElement = $(render(pathTemplate, path));

    pathElement.find("button").on("click", toggleContents);
    pathElement.find(".delete").on("click", event => deletePath(path, event.target));

    let tableElement = pathElement.find("tbody");

    for (let rule of path.rules)
      tableElement.append(renderRule(rule, path));

    return pathElement;
  },


  renderRule = (rule, path) => {
    let ruleElement = $(render(ruleTemplate, rule));
    ruleElement.find(".delete").on("click", event => deleteRule(rule, path, event.target));
    ruleElement.find(".search, .replace").on("click", event => edit(rule, path));
    return ruleElement;
  },


  initialize = () => {
    withURL(url => {
      state();
      get(url.host);
      showMain();
      addBackgroundListener();
    });
  }


  ; // end const defs


  //////////
  // INIT //
  //////////


  onClickOrEnter(mainToggle, toggleMain);


  onClickOrEnter(siteToggle, toggleSite);


  onClickOrEnter(addNewIcon, add);


  onClickOrEnter(deleteIcon, deleteAll);


  onClickOrEnter(exportIcon, exportData);


  onClickOrEnter(importIcon, importData);


  onClickOrEnter(saveIcon, save);


  onClickOrEnter(cancelIcon, cancel);


  onClickOrEnter(resetIcon, reset);


  onClickOrEnter(searchIcon, search);


  // we are in business
  initialize();


})();