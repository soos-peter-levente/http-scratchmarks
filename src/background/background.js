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

  "use strict"; const


  /* do we have to request the available rules each time? */
  searchAndReplace = request => {
    console.log(request);
    /*
      0. return early if extension or site is disabled, or if no rules
      are stored for either site, `request.originUrl' or `request.url'

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


  bg = new BackgroundService(searchAndReplace);


  bg.listen();

})();
