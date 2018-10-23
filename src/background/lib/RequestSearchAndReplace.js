var RequestSearchAndReplace = (function () {

  function RequestSearchAndReplace (rules) {
    this.rules = rules;
  }

  RequestSearchAndReplace.prototype.exec = function (data) {
    console.log("These rules would be applied:", this.rules);
    console.log("to this string:", data);
  };

  function str2ab(str) {
    return new TextEncoder().encode(str).buffer;
  }

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  return RequestSearchAndReplace;

})();
