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

    // request processing
    start: function () {
      browser.webRequest.onBeforeRequest.addListener(
        this.processor, this.settings.request, ["blocking"]);
    },

    stop: function () {
      browser.webRequest.onBeforeRequest.removeListener(this.processor);
    },

    // global & site-specific state
    isEnabled: function () {
      return this.settings.enabled;
    },

    isSiteEnabled: function (domain) {
      return storage.get(domain).then(stored => stored[domain].enabled);
    },

    toggleMain: function () {
      this.settings.enabled = !this.settings.enabled;
      (this.settings.enabled) ? this.start() : this.stop();
      return this.settings.enabled;
    },

    toggleSite: function (domain) {
      // be careful, if domain is undefined, everything is returned
      // this knows too much
      return storage.get(domain)
        .then(stored => {
          stored[domain].enabled = !stored[domain].enabled;
          this.setRule(domain, stored[domain]);
        });
    },

    // manage rules in storage
    getRule: function (domain) {
      return storage.get(domain).then(stored => stored[domain] || {});
    },

    getAll: function () {
      return storage.getAll();
    },

    setRule: function (domain, rules) {
      return storage.put(domain, rules);
    },

    delRule: function (domain, rules) {
      // get the rules, reindex and put it back
      return storage.del(domain, rules);
    },

    delDomain: function (domain) {
      return storage.remove(domain);
    },

    reinitialize: function () {
      return storage.clearAll();
    }

  };

  return BackgroundService;

})();
