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


const BackgroundService = (function () {


  "use strict"; const


  /* The BackgroundService has two purposes: first, it snoops on HTTP
     responses and alters them via a `processor' (a function that
     takes a Request object as argument and which is passed during
     instantiation, so it is rather loosely coupled). Secondly, it
     provides an interface for the popup to check/change extension
     state and load or store rules.

     So that's three things instead of one (or two...), and request
     processing, extension state and storage management interfaces
     could be meaningfully extracted, but at this size, it's not that
     Big a Whoop to let the popup use a single tunnel. */


  BackgroundService = function (webRequestOptions, processor) {
    // First, load all settings
    this.settings = {
      enabled: true,
      request: webRequestOptions
    };
    /* `processor' or a dolittle function. Remind you of anything? */
    this.processor = (processor) ? processor : ()=>{};

    // Start listening depending on extension state.
    if (this.settings.enabled) this.start();
  },

  isEmptyObject = obj =>
    Object.keys(obj).length === 0 && obj.constructor === Object,

  storage = new Storage();


  /////////
  // API //
  /////////


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


    toggle: function () {
      this.settings.enabled ? this.stop() : this.start();
      return this.settings.enabled;
    },


    state: function () {
      return this.settings.enabled;
    },


    clear: function () {
      return storage.clearAll();
    },


    flip: function (site) {
      if (site === undefined)
        // otherwise, everything is returned for an empty query...
        throw new Error("Required parameter 'site' is undefined!");

      return this.get(site).then(stored => {
        stored.siteIsEnabled = !stored.siteIsEnabled;
        return this.put(site, stored);
        });

    },


    get: function (site) {
      return storage.get(site).then(stored => stored[site] || {});
    },


    put: function (rule) {
      return this.get(rule.site)
        .then(stored => this.merge(stored, rule))
        .then(result => storage.put(rule.site, result)
              .then(()=> this.get(rule.site)));
    },


    merge: function (existingData, newData) {

      let result = existingData;

      // if empty, create
      if (isEmptyObject(result)) {
        result = {
          siteIsEnabled: true,
          paths:  []
        };
      }

      // new rule
      let newRule =  {
        ruleIsEnabled: true,
        ruleSearch: newData.rule.search,
        ruleReplace: newData.rule.replace,
        ruleType: newData.rule.ruleType
      };

      // new path
      let newPath = {
        pathIsEnabled: true,
        pathType: newData.path.pathType,
        pathName: newData.path.pathName,
        rules: [ newRule ]
      };

      /* I'm still exploring the question of how to merge the thing
       *  with the extant rules. In the time being, we'll just push.
       */

      result.paths.push(newPath);
      return result;
    },


    del: function (site, pathID, ruleID) {
      console.log("Mock-removing", site, "from storage");
    },

  };

  
  return BackgroundService;

})();
