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


const Path = (function () {


  const


  log = prefixLog("Path: "),


  Path = function (object) {
    this.pathIsEnabled = object.pathIsEnabled;
    this.pathName = object.pathName;
    this.pathType = object.pathType;
    this.rules = (object.rules||[])
      .map(rule => new Rule(rule)) || [];
  };


  Path.prototype = {


    toObject: function () {
      return {
        pathIsEnabled: this.pathIsEnabled,
        pathName: this.pathName,
        pathType: this.pathType,
        rules: this.rules.map(rule => rule.toObject())
      };
    },


    toString: function () {
      return JSON.stringify(this.toObject());
    },


    isEnabled: function () {
      return this.pathIsEnabled;
    },


    enable: function () {
      this.pathIsEnabled = true;
    },


    disable: function () {
      this.pathIsEnabled = false;
    },


    equals: function (rule) {
      return (this.pathName === rule.pathName &&
              this.pathType === rule.pathType);
    },


    merge: function (path) {
      log("Merging path", path);
      this.pathIsEnabled = path.pathIsEnabled;
      this.pathType = path.pathType;
      this.pathName = path.pathName;
      for (var i = 0; i < path.rules.length; i++) {
        this.mergeRule(path.rules[i]);
      }
      return this;
    },


    // Rule handling


    mergeRule: function (rule) {
      let i = this.findRule(rule);
      if (Number.isInteger(i)) {
        log("Rule exists. Leaving as-is.");
      } else {
        log("Pushing rule.");
        this.rules.push(new Rule(rule));
      }
      return this.rules;
    },


    findRule: function (rule) {
      let theRule = new Rule(rule);
      for (let i = 0; i < this.rules.length; i++) {
        if (theRule.equals(this.rules[i])) {
          return i;
        }
      }
      return undefined;
    },


    getRule: function (index) {
      return (index === undefined) ? this.rules : this.rules[index];
    },


    hasRule: function (rule) {
      return Number.isInteger(this.findRule(rule));
    },


    delRule: function (rule) {

    }

  };


  return Path;


})();
