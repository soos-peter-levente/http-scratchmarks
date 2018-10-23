var example = {
  site: "example.org",
  siteIsEnabled: true,
  paths: [{
    pathIsEnabled:true,
    pathType: "domain", // domain, path, prefix, regexp
    pathName: "example.org",
    ruleList: [{
      ruleType: "string", // string, regexp
      ruleSearch: "aaa",
      ruleReplace: "bbb",
      ruleIsEnabled: true
    }]
  }]
}

var BackgroundService = (function () {

  /* The BackgroundService has two purposes: first, it snoops on HTTP
     responses and alters them via a `processor' (a function that
     takes a Request object as argument and which is passed during
     instantiation, so it is rather loosely coupled). Secondly, it
     provides an interface for the popup to check/change extension
     state and load or store rules.

     So that's three things instead of one, and request processing,
     extension state and storage management interfaces could be
     meaningfully extracted, but at this size, it's not that Big a
     Whoop to let the popup use a single tunnel. */

  var storage = new Storage();

  function BackgroundService (webRequestOptions, processor) {
    // First, load all settings
    this.settings = {
      enabled: true,
      request: webRequestOptions
    };
    /* `processor' or a dolittle function. Remind you of anything? */
    this.processor = (processor) ? processor : ()=>{};

    // Start listening depending on extension state.
    if (this.settings.enabled) this.start();
  };

  BackgroundService.prototype = {
    start: function () {
      browser.webRequest.onBeforeRequest.addListener(
        this.processor, this.settings.request, ["blocking"]);
      this.settings.enabled = true;
    },
    stop: function () {
      browser.webRequest.onBeforeRequest.removeListener(this.processor);
      this.settings.enabled = false;
    },
    clear: function () {
      return storage.clearAll();
    },
    state: function () {
      return this.settings.enabled;
    },
    toggle: function () {
      this.settings.enabled = !this.settings.enabled;
      (this.settings.enabled) ? this.start() : this.stop();
      return this.settings.enabled;
    },
    toggleSite: function (site) {
      if (site === undefined)
        // otherwise, everything is returned for an empty query...
        throw new Error("Required parameter 'site' is undefined!");

      return storage.get(site)
        .then(stored => {
          stored[site].enabled = !stored[site].enabled;
          this.setRule(site, stored[site]);
        });

    },
    getSite: function (site) {
      return storage.get(site).then(stored => stored[site] || {});
    },
    getPath: function (site, paths) {},
    getRule: function (site, paths) {},
    setSite: function (site, status) {},
    setPath: function (site, paths) {
      return storage.put(site, paths);
    },
    setRule: function (site, paths, rules) {
      return storage.put(site, rules);
    },
    delSite: function (site) {
      return storage.remove(site);
    },
    delPath: function (site, paths) {},
    delRule: function (site, paths, rules) {},

  };

  return BackgroundService;

})();
