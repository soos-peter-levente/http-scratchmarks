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


const RuleFilter = (function () {


  const


  log = prefixLog("RuleFilter: "),


  RuleFilter = function () {},


  pathMatchesDomain = (path, url) => {
    switch (path.pathType) {
      case "domain":
        return matchDomain(path.pathName, url);
        break;;
      case "regex":
        return matchRegex(path.pathName, url);
        break;;
      case "fixpath":
        return matchFixpath(path.pathName, url);
        break;;
      case "prefix":
        return matchPrefix(path.pathName, url);
        break;;
      default:
        return false;
    }
  },


  matchDomain = (pathname, url) => url.host.startsWith(pathname),


  matchRegex = (pathname, url) => url.href.match(pathname),


  matchFixpath = (pathname, url) =>
    (url.href === pathname ||
     url.domain + url.pathname + url.search === pathname ||
     url.pathname + url.search === pathname),


  matchPrefix = (pathname, url) =>
    url.href.startsWith(pathname) ||
    (url.pathname + url.search).startsWith(pathname) ||
    (url.domain + url.pathname + url.search).startsWith(pathname)


  ;


  RuleFilter.prototype = {


    filter: function (request, siteData) {
      if (siteData === undefined || siteData === {})
        return [];

      let rules = [];

      let requestUrl = new URL((request.originUrl !== undefined ) ? request.originUrl : request.url);

      siteData.paths.filter(path => {
        if (pathMatchesDomain(path, requestUrl)) {
          rules = rules.concat(path.rules);
        }
      });

      return rules;
    }

  };


  return RuleFilter;


})();
