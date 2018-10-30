prefixLog = (...args) => console.log;
var Rule = require("../src/background/lib/Rule.js");

var rule = new Rule({
  ruleIsEnabled: true,
  ruleType: "string",
  ruleSearch: "aaa",
  ruleReplace: "bbb"
});

describe("test", function () {

  it("works", function () {
    expect(true).toBe(true);
  });

  it("has a Rule", function () {
    expect(typeof rule).toBe('object');
  });

});
