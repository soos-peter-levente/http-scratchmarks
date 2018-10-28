var RequestSearchAndReplace = (function () {

  function RequestSearchAndReplace () {}

  RequestSearchAndReplace.prototype.exec = function (request, rules) {
    console.log("Apply rules", rules, "to", request);
  };

  function str2ab(str) {
    return new TextEncoder().encode(str).buffer;
  }

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  return RequestSearchAndReplace;

})();
