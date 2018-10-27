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


const Site = (function () {


  const


  log = prefixLog("Site: "),


  Site = function (object) {
    this.domain = object.domain;
    this.siteIsEnabled = object.siteIsEnabled;
    this.paths = (object.paths || []).map(rule => new Path(rule)) || [];
  };


  Site.prototype = {


    toObject: function () {
      return {
        domain: this.domain,
        isSiteEnabled: this.siteIsEnabled,
        rules: this.paths.map(path => path.toObject())
      };
    },


    toString: function () {
      return JSON.stringify(this.toObject());
    },


    isEnabled: function () {
      return this.siteIsEnabled;
    },


    enable: function () {
      this.siteIsEnabled = true;
    },


    disable: function () {
      this.siteIsEnabled = false;
    },


    equals: function (site) {
      if (this.domain === site.domain &&
          this.paths.length === site.paths.length) {
        for (var i = 0; i < this.paths.length; i++) {
          if (!this.hasPath(site.paths[i])) {
            return false;
          }
        };
      };
      return false;
    },


    merge: function (site) {
      log("Merging site", site);
      this.domain = site.domain;
      this.siteIsEnabled = site.siteIsEnabled;
      for (let i = 0; i < site.paths.length; i++) {
        this.mergePath(site.paths[i]);
      }
      return this;
    },


    // Path handling


    mergePath: function (path) {
      let i = this.findPath(path);
      if (Number.isInteger(i)) {
        log("Path exists. Entering Path.merge().");
        this.paths[i] = new Path(this.paths[i]).merge(path);
      } else {
        log("Pushing path.");
        this.paths.push(new Path(path));
      }
      return this;
    },


    findPath: function (path) {
      let thePath = new Path(path);
      for (let i = 0; i < this.paths.length; i++) {
        if (thePath.equals(this.paths[i])) {
          return i;
        }
      }
      return undefined;
    },


    getPath: function (index) {
      return (index === undefined) ? this.paths : this.paths[index];
    },


    hasPath: function (path) {
      return Number.isInteger(this.findPath(path));
    },


    delPath: function (path) {

    },

  };


  return Site;


})();
