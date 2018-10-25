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


(function () {

  "use strict"; const // functional yay!

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
    console.log("PU -> BG:", { label: label, args: args });
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
   * Message background to respond with a \"getRule\" labeled message
   * that contains all rules associated with `site'.
   * @param {string} site - the domain for which to get rules.
   */
  get = site => send("get", site),


  /**
   * Message the background to set/update `rules' for each  of `paths'.
   * @param {string} site - the domain to associate the path & rules to.
   * @param {object} rule - a rule to set
   */
  put = rule => send("put", rule),


  /**
   * Message the background to delete site, path or rule. The scope of
   * deletion is specified by the last defined parameter. E.g. `site'
   * alone will delete all paths and searches associated with
   * `site'. An additional `path' parameter will cause that ID to be
   * removed only. Furthermore, passing a valid `rule' will cause that
   * rule to be removed from `path'.
   *
   * @param {string} site - the domain from which to delete
   * @param {object} path - the path to delete from `site'
   * @param {object} rule - the rule to delete from `path'
   */
  del = (site, path, rule) => send("del", site, path, rule),


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

  siteRules = $(".site-view-rules"),

  editTitle = $("#edit-title h1"),

  mainToggle = $("#main-status input"),
  siteToggle = $("#site-status input"),

  siteUseText = $("#site-status .toggle-text"),
  siteName = $(".site-name"),
  
  addButton = $("#site-add-rule button"),
  editButton = $("#site-edit-rule button"),
  saveButton = $("#edit-save-rule button"),
  cancelButton = $("#edit-cancel button"),

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


  showMain = () => { mainView.show(); editView.hide(); },


  showEdit = () => { mainView.hide(); editView.show(); },

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
    addRuleAndPathToDOM(rule, path);
    showEdit();
    pathInput.focus().select();
  },


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

  ///////////////////////
  // BACKGROUND EVENTS //
  ///////////////////////



  save = event =>
    withURL(url => {
      put({
        site: url.host,
        path: {
          //pathID: pathID.attr("data-path-id"),
          pathType: pathDropdown.val(),
          pathName: pathInput.val(),
        },
        rule: {
          //ruleID: searchID.attr("data-rule-id"),
          ruleType: searchDropdown.val(),
          search: searchInput.val(),
          replace: replaceInput.val()
        }
      });
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


  toggleSite = () => {},


  toggleMain = () => {},


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
    ruleElement.find(".edit").on("click", event => edit(rule, path));
    return ruleElement;
  }


  ; // end const defs


  //////////
  // INIT //
  //////////


  // background messaging
  mainToggle.on("click", toggleMain);


  siteToggle.on("click", toggleSite);


  saveButton.on("click", save);

  // UI events
  addButton.on("click", add);


  cancelButton.on("click", cancel);


  // make a few calls
  withURL(url => {
    state();
    get(url.host);
    addBackgroundListener();
  });

  // we are in business

})();
