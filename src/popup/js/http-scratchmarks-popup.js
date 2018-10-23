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
   * @param {array} args - array of arguments to be passed to the invocation
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
   * Message background to `clear' the contents of the local
   * storage. All settings and saved sites/paths/rules are lost.
   */
  clear = () => send("clear"),


  /**
   * Message background to send extension `state' in the payload of a
   * labeled asynchronous message.
   * @returns {boolean} - enabled / disabled
   */
  state = () => send("state"),


  /**
   * Message background to `toggle' the extension (global).
   */
  toggle = () => send("toggle"),


  /**
   * Messagae background to `toggle' site status.
   */
  toggleSite = site => send("toggleSite", site),


  /**
   * Message background to send all `site'-related data in the payload
   * of a labeled aynchronous message.
   * @param {string} site - the domain for which to load the data.
   * @returns {object} - {} or site data (state, paths & rules)
   */
  getSite = site => send("getSite"),


  /**
   * Message background to send data for each `path' associated with
   * `site' in the payload of a labeled asynchronous message.
   * @param {string} site - the domain for which to load the path(s).
   * @param {array} paths - the path(s) to load.
   * @returns {object} - {} or paths
   */
  getPath = (site, paths) => send("getPath", site, paths),


  /**
   * Message background to send all rules for each of the `paths'
   * associated with `site'. in the payload of a labeled asynchronous
   * message.
   * @param {string} site - the domain for which to get paths.
   * @param {object / array} paths - path or array of paths.
   */
  getRule = (site, paths) => send("getRule", site, paths),


  /**
   * Message background to set site to `status' (disable / enable it).
   * @param {string} site - the domain to set
   * @param {boolean} status - enabled / disabled
   */
  setSite = (site, status) => send("setSite", site, status),


  /**
   * Message background to set/update each `path' for `site'.
   * @param {string} site - the domain for which to set `paths'
   * @param {object / array} paths - a path or an array of paths
   */
  setPath = (site, paths) => send("setPath", site, paths),


  /**
   * Message the background to set/update `rules' for each  of `paths'.
   * @param {string} site - the domain to associate the path & rules to.
   * @param {object / array} paths - a path object or array of path objects
   * @param {object / array} rules - a rule object or array of rule objects
   */
  setRule = (site, paths, rules) => send("setRule", site, paths, rules),


  /**
   * Message the background to delete from storage `site' and all
   * associated paths and rules.
   * @param {string} site - the domain to delete
   */
  delSite = site => send("delSite", site),


  /**
   * Message the background to delete from storage each of `paths', if
   * associated with `site'.
   * @param {string} site - the domain from which to delete paths.
   * @param {object / array} paths - the path(s) to delete.
   */
  delPath = (site, paths) => send("delPath", site, paths),


  /**
   * Message the background to delete from storage each of `rules'
   * from each of `paths' if associated with `site'.
   * @param {string} site - the domain from which to delete rule(s).
   * @param {object / array} paths - the path(s) from which to delete rule(s)
   * @param {object / array} rules - the rule(s) to delete
   */
  delRule = (site, paths, rules) => send("delPath", site, paths, rules),


  /**
   * Handle responses sent by the background in response to API calls.
   * @param {object} response - the response received from background.
   */
  dispatch = response => {
    switch (response.label) {
      case "getSite":
      case "getPath":
      case "getRule":    // redraw with payload
      case "setSite":
      case "setPath":
      case "setRule":
        renderData(response.payload);
        break;;
      case "delSite":
      case "delPath":    // don't redraw
      case "delRule":
        /* The UI event handlers should take care of visual removal of
         * elements. Deletion in storage has already happened by the
         * time of dispatch, so this case is superfluous, but it's
         * listed explicitly until behavior is sorted out.
         */
        deleteData(response.payload);
        break;;
      case "clear":
        voidTheList();   // special case
        break;;
      case "start":
      case "stop":
      case "toggle":
      case "state":
        setSlider(mainToggle, response.payload);
        break;;
      case "toggleSite":
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

  pathInput = $("#edit-domain-path"),
  searchInput = $("#edit-search"),
  replaceInput = $("#edit-replace"),


  setSlider = (slider, status) => slider.attr("checked", status),


  showMain = () => { mainView.show(); editView.hide(); },


  showEdit = () => { mainView.hide(); editView.show(); },

  /* We'll assume that we only ever want to edit rules for the current
     tab. Though this might not always be the case, anything more
     involved is too much for such a lean popup anyway. A domain
     selector dropdown below the main toggle could also work. */

  getCurrentURL = callback =>
    browser.tabs.query({ currentWindow: true, active: true })
    .then(tabs => new URL(tabs[0].url))
    .then(url  => callback ? callback(url) : url),



  ///////////////////////
  // UI EVENT HANDLERS //
  ///////////////////////


  saveRule = event => {
    console.log("save rule:", inputToObject());
  },


  addRule = event => {
    editTitle.text("Add new rule");
    showEdit();
    pathInput.focus();
  },


  addDomainRule = event => {
    editTitle.text("Add new rule");
    getCurrentURL().then(url => pathInput.val(url.host));
    showEdit();
    searchInput.focus();
  },


  editRule = event => {
    editTitle.text("Edit rule");
    showEdit();
  },


  stopEdit = event => {
    nullifyInputValues();
    showMain();
  },


  // function keyword to bind `this'
  toggleContents = function (event) {
    $(this).siblings(".site-rule-content").toggle();
  },


  deleteThisRule = function (event) {
    // we could be a bit more forgiving than this.
    $(this).closest(".site-rule-wrapper").remove();
  },


  editThisRule = function (event) {
    console.log("Edit the rule: ", $(this));
  },


  deleteData = siteData => console.log("deleting data:", siteData),


  voidTheList = () => siteRules.html(""),



  ///////////////
  // RENDERING //
  ///////////////


  renderData = siteData => {

    renderDomain();

    if ($.isEmptyObject(siteData)) return;

    siteRules.html(Mustache.render($("#site-rule-template").html(), siteData));

    $(".site-rule-options").on("click", deleteThisRule);
    $(".site-rule-accordion-wrapper").on("click", toggleContents);
    $(".site-s-r-edit").on("click", editThisRule);
    $(".site-s-r-delete").on("click", deleteThisRule);

    setSlider(siteToggle, (siteData.enabled || true));

  },

  renderDomain = () =>
    getCurrentURL(url => siteUseText.html(
      Mustache.render($("#site-name-template").html(), { domain: url.host }))
                  .find(".site-name").on("click", addDomainRule)),


  // READING FROM THE DOM


  // None of them yonder Rule objects.
  ruleObject = (type, search, replace, enabled) => {
    return {
      ruleIsEnabled: enabled || true,
      ruleType: type,
      ruleSearch: search,
      ruleReplace: replace,
    };
  },


  inputToObject = () => {
    /* Change of heart. User input validation should indeed happen
     * here, but let's not use non-input DOM as a two-way
     * thing. Templates only get stuff, they shouldn't give them
     * back. As for the inputs, we'll only send single rules (brand
     * new ones or edits) or delete requests, and we'll take
     * responsibility for sanitization. The background will do all the
     * merging and deleting. */
    return {
      pathIsEnabled: true,
      pathType: pathDropdown.val(),
      pathName: pathInput.val(),
      ruleList: [ ruleObject(
        searchDropdown.val(),
        searchInput.val(),
        replaceInput.val()
      ) ]
    };
  },


  nullifyInputValues = () => {
    pathInput.val("");
    searchInput.val("");
    replaceInput.val("");
  }


  ; // end const defs


  //////////
  // INIT //
  //////////


  // background messaging
  mainToggle.on("click", toggle);


  siteToggle.on("click", toggleSite);


  saveButton.on("click", saveRule);

  // UI events
  editButton.on("click", editRule);


  addButton.on("click", addRule);


  cancelButton.on("click", stopEdit);

  // make a few calls
  getCurrentURL(url => {
    state();
    getSite(url.host);
    addBackgroundListener();
  });

  // we are in business

})();
