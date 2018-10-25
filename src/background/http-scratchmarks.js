(function () {

  "use strict";

  const

  ///////////
  // APPLY //
  ///////////

  webRequestOptions = {
    urls: ["<all_urls>"],
    types: ["main_frame", "xmlhttprequest", "stylesheet", "script"]
  },

  /* do we have to request the available rules each time? */
  searchAndReplace = request => {
    console.log(request);
    /*
      0. return early if extension or site is disabled, or if no rules
      are stored for either site or `request.url'

      let filter = browser.webRequest.filterResponseData(request.requestId);

      1. Use RuleFilter object to prune the rules associated with the
      domain

      let rules = new RuleFilter().filter();

      2. if any apply, construct RequestSearchAndReplace with the pruned array.

      let sr = new RequestSearchAndReplace(rules);

      3. Pass request body to its exec();
      //filter.ondata = event =>
      filter.write(sr.exec(event.data)); filter.onstop = event =>
      filter.disconnect(); */
  },

  /* start the background service with `searchAndReplace'
     processing. Don't call start() from here -- whether to start or
     not depends on what setting is stored. If there are no options
     saved yet, the constructor will enable the extension and start
     listening to requests automatically.*/
  bg = new BackgroundService(webRequestOptions, searchAndReplace),

  //////////
  // EDIT //
  //////////

  /* Request processing is handled above. Here, the background is
     exposed to accept messages from the popup. */
  listenForConnections = () => {
    browser.runtime.onConnect.addListener(
      port  => port.onMessage.addListener(makeResponder(port)));
  },


  /* The responder calls the BackgroundService associated with the
     service/method name in the `request' property, waits for the
     results and sends them right back. At the speed of popup
     interaction, we can just write the original request on the return
     envelope of the payload and let the popup dispatch on that string
     without having to worry about further synchronization. */

  makeResponder = port => {

    /* TODO: figure out a nicer way of responding to popup messages.
     *  Alas, sendResponse is not available.
     *  https://github.com/mozilla/webextension-polyfill/issues/16#issuecomment-296693219
     */
    const respond = (message, response) => {
      console.log("BG -> PU:", { label: message.label, payload: response});
      port.postMessage({
        label: message.label,
        payload: response
      });
    };

    return (message) => {
      try {
        var response = bg[message.label].bind(bg).apply(null, message.args);
        // keep promises on the background
        if (typeof response.then === "function")
          response.then(response => respond(message, response));
        else respond(message, response);
      } catch (e) {
        throw new Error("Undefined Response Error! '" + message.label + "' did not produce a value." );
      }
    };

  }


  ; // const defs end

  //bg.clear();
  
  listenForConnections();

})();
