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


const Rule = (function () {


  const


  log = prefixLog("Rule: "),


  Rule = function (object) {
    this.ruleIsEnabled = object.ruleIsEnabled;
    this.ruleType = object.ruleType;
    this.ruleSearch = object.ruleSearch;
    this.ruleReplace = object.ruleReplace;
  };


  Rule.prototype = {


    toObject: function () {
      return {
        ruleIsEnabled: this.ruleIsEnabled,
        ruleType: this.ruleType,
        ruleSearch: this.ruleSearch,
        ruleReplace: this.ruleReplace,
      };
    },


    toString: function () {
      return JSON.stringify(this.toObject());
    },


    isEnabled: function () {
      return this.ruleIsEnabled;
    },


    enable: function () {
      this.ruleIsEnabled = true;
    },


    disable: function () {
      this.ruleIsEnabled = false;
    },


    equals: function (rule) {
      return (this.ruleType === rule.ruleType &&
              this.ruleSearch === rule.ruleSearch &&
              this.ruleReplace === rule.ruleReplace);
    },


    apply: function (string) {
      switch (this.ruleType) {
        case "regexp":
          return this.applyRegexp(string);  break;
        case "string":
          return this.applyString(string);  break;
        default:
          throw new Error("Unrecognized rule type!");
      }
    }


  };


  function applyRegexp (string) {
    log("Regex apply", this.toObject(), "to", string);
  };


  function applyString (string) {
    log("String apply", this.toObject(), "to", string);
  }


  return Rule;


})();
