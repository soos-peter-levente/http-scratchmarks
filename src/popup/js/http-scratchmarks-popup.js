(function () {

  "use strict";


  const

  //// DOM

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

  getSiteName = () =>
    browser.tabs.query({ currentWindow: true, active: true })
    .then(tabs => new URL(tabs[0].url)),

  
  // BUILDING DOM ELEMENTS
  // Two things require DOM fiddling: rules and the site toggle.


  renderDomain = url =>
    siteUseText.html("Use on: ").append(renderHost(url.host)),


  renderHost = url =>
    $("<span>").attr("title", "Add rule for domain")
      .addClass("site-name").text(url)
      .on("click", addDomainRule),


  renderSiteData = siteData => {
    if ($.isEmptyObject(siteData)) return;

    siteRules.html(
      Mustache.render($("#site-rule-template").html(), siteData)
    );

    $(".site-rule-options").on("click", deleteThisRule);
    $(".site-rule-accordion-wrapper").on("click", toggleContents);
    $(".site-s-r-edit").on("click", editThisRule);
    $(".site-s-r-delete").on("click", deleteThisRule);

    setSlider(siteToggle, (siteData.enabled || true));

  },

  // event handlers, function keyword to bind `this'
  toggleContents = function (event) {
    $(this).siblings(".site-rule-content").toggle();
  },


  deleteThisRule = function (event) {
    // we could be a bit more forgiving than this.
    $(this).closest(".site-rule-wrapper").remove();
    setRule();
  },


  editThisRule = function (event) {
    console.log("Edit the rule: ", $(this));
  },


  // READING FROM THE DOM

  /* 1. take whatever is in the input fields (inputToObject)
     2. read all remaining rules from the list (collectExistingRules)
     3. merge the new rule if present (mergeRule)
     4. send result to background (setRule)

     We don't really want to instantiate the Rule objects that we
     gleam over yonder in the background. In other news, it's too bad
     that blocks and the object literals overlap in JS syntax:
     implicit returns of arrow functions don't work in these cases. */
  ruleObject = (type, search, replace, enabled) => {
    return {
      ruleIsEnabled: enabled || true,
      ruleType: type,
      ruleSearch: search,
      ruleReplace: replace,
    };
  },


  inputToObject = () => {
    /* Do it simply. Merging a new rule with the existing list and
       sending everything in a single whoosh delivers us from the
       delta management logic that would otherwise result.

       The list of rules to be saved is canonized early in the pipe,
       close to where input validation will be happening, which
       means that hopefully fewer inscrutable errors will be barfed
       up from the bowels of the extension. */
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


  collectAllRules = () => mergeRule(inputToObject(), collectExistingRules()),


  collectExistingRules = () =>
    Array.from(siteRules.find(".site-rule-wrapper")).map(collectPath) || [],


  collectPath = wrapper => {
    return {
      pathIsEnabled: true,
      pathType: $(wrapper).find("button").attr("data-path-type"),
      pathName: $(wrapper).find(".site-rule-path").text(),
      ruleList: Array.from(collectRuleList($(wrapper).find("table")))
    };
  },


  collectRuleList = table =>
    Array.from(table.find("tr.site-rule-table-row"))
      .map(row =>
           ruleObject(
             $(row).find(".search").attr("data-match-type"),
             $(row).find(".search").text(),
             $(row).find(".replace").text())),

  // this is up next

  mergeRule = (rule, existingRules) => {
    /* if the domain already has rules
          if a set of rules for the same match type and path exists
             merge rule with that specific array of rules
          else create new path and type and add first rule
       else add first rule to domain  */
    if (existingRules.length !== 0 ) {
      let [ samePath, pathIndex ] = findSamePath(existingRules, rule.pathName, rule.pathType);
      if (samePath && pathIndex) {
        console.log("Merging rule", rule, "with", existingRules);
        mergeRuleIntoPath(rule, pathIndex, existingRules);
      }
    } else {
      existingRules.push(rule);
    }
    return existingRules;
  },


  findSamePath = (rules, path, type) => {
    for (let rule in rules) {
      if (rules[rule].pathName === path && rules[rule].pathType === type)
        return [ true, rule ];
    }
    return [ undefined, undefined ];
  },


  mergeRuleIntoPath = (rule, index, rules) => {
    console.log(rules);
    if (rules[index].ruleSearch !== rule.ruleSearch &&
        rules[index].ruleReplace !== rule.ruleReplace &&
        rules[index].ruleType !== rule.ruleType)
      return rules;
    else
      rules.push(rule);
    return rules;
  },


  nullifyInputValues = () => {
    pathInput.val("");
    searchInput.val("");
    replaceInput.val("");
  },

  
  //// BACKGROUND CONNECTION & PERSISTED DATA

  // this is our tunnel to the extension's services.
  background = browser.runtime.connect( { name: "background" } ),


  /* Handle incoming background responses. Requests are the only
     things that point "inside", and only responses ever come out.

     Response-request pairs are associated via name and via name
     only. Whenever a response is received, it is dispatched on in a
     uniform fashion, which should be okay at UI speeds (meaning I
     hope not to have to worry about the order in which responses
     arrive and dispatches are triggered). Also, given the way the
     Port API is used (the background only ever fires for onMessage
     events), we can rely on it never to send anything without having
     first logged a corresponding request from the popup. */
  listenForBackgroundResponses = () =>
    background.onMessage.addListener(dispatchResponse),


  /* Right now, two kinds of responses trigger action in the popup: a
     list of rules to be rendered, and state toggling. If and when the
     UI is refined to do more error handling on user input, setRule()
     should also be dispatched on. */
  dispatchResponse = response => {
    switch (response.request) {
      case "getRule":
        renderSiteData(response.payload);
        break;;
      case "toggleMain":
      case "isEnabled":
        setSlider(mainToggle, response.payload);
        break;;
      case "toggleSite":
      case "isSiteEnabled":
        setSlider(siteToggle, response.payload);
        break;;
      default:
        console.log("POPUP: no-action response:", response);
    }
  },


  // /**
  //  * Message background to `start' the extension globally.
  //  */
  // start = () => {},


  // /**
  //  * Message background to `stop' the extension globally.
  //  */
  // stop = () => {},


  // /**
  //  * Message background to `clear' the contents of the local
  //  * storage. All settings and saved sites/paths/rules are lost.
  //  */
  // clear = () => {},


  // /**
  //  * Message background to send extension `state' in the payload of a
  //  * labeled asynchronous message.
  //  * @returns {boolean} - enabled / disabled
  //  */
  // state = () => {},


  // /**
  //  * Message background to send all `site'-related data in the payload
  //  * of a labeled aynchronous message.
  //  * @param {string} site - the domain for which to load the data.
  //  */
  // getSite = site => {},


  // /**
  //  * Message background to send data for each `path' associated with
  //  * `site' in the payload of a labeled asynchronous message.
  //  * @param {string} site - the domain for which to load the path(s).
  //  * @param {array} paths - the path(s) to load.
  //  */
  // getPath = (site, paths) => {},


  // /**
  //  * Message background to send all rules for each of the `paths'
  //  * associated with `site'. in the payload of a labeled asynchronous
  //  * message.
  //  * @param {} site
  //  * @param {} paths
  //  */
  // getRule = (site, paths) => {},


  // /**
  //  * Message background to set site to `status' (disable / enable it).
  //  * @param {string} site - the domain to set
  //  * @param {boolean} status - enabled / disabled
  //  */
  // setSite = (site, status) => {},

  // /**
  //  * Message background to set/update each `path' for `site'.
  //  * @param {string} site - the domain for which to set `paths'
  //  * @param {object / array} paths - a path or an array of paths
  //  */
  // setPath = (site, paths) => {

  // },

  // /**
  //  * Message the background to set/update `rules' for each  of `paths'.
  //  * @param {string} site - the domain to associate the path & rules to.
  //  * @param {object / array} paths - a path object or array of path objects
  //  * @param {object / array} rules - a rule object or array of rule objects
  //  */
  // setRule = (site, paths, rules) => {},


  getData = () => {
    getSiteName()
      .then(url => {
        renderDomain(url);
        getRule(url.host);
      });
  },

  
  isEnabled = () => {
    background.postMessage({
      request: "isEnabled"
    });
  },


  isSiteEnabled = () => {
    background.postMessage({
      request: "isSiteEnabled"
    });
  },


  getRule = domain => {
    background.postMessage({
      request: 'getRule',
      args: [ domain ]
    });
  },

  toggleMain = event => {
    background.postMessage({
      request: "toggleMain"
    });
    setSlider(mainToggle, !mainToggle.checked);
  },

  toggleSite = event => {
    background.postMessage({
      request: "toggleSite",
      args: [ getSiteName() ]
    });
    setSlider(siteToggle, !siteToggle.checked);
  },

  setRule = event => {
    getSiteName()
      .then(url =>
        background.postMessage({
          request: "setRule",
          args: [ url.hostname, {
            siteIsEnabled: siteToggle.prop("checked"),
            rules: collectAllRules()
          } ]
        }))
      .then(() => getData().then(() => stopEdit()));
  },

  //// LISTENERS AND INTERACTION HANDLERS (UI only, no background)

  addRule = event => {
    editTitle.text("Add new rule");
    showEdit();
    pathInput.focus();
  },

  addDomainRule = event => {
    editTitle.text("Add new rule");
    getSiteName().then(url => pathInput.val(url.host));
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
  }

  ; // const defs end here

  // INIT

  mainToggle.on("click", toggleMain);

  siteToggle.on("click", toggleSite);

  saveButton.on("click", setRule);
  // UI only, no background message
  editButton.on("click", editRule);

  addButton.on("click", addRule);

  cancelButton.on("click", stopEdit);


  // load-time calls
  isEnabled();

  isSiteEnabled();

  getData();

  listenForBackgroundResponses();

  // we are in business

})();
