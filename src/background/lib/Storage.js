/* Provides a set of CRUD methods for the background to access saved
 * rules. Might not be necessary. */
var Storage = (function () {


  function Storage () {};


  Storage.prototype = {


    put: function (key, value) {
      return browser.storage.local.set({ [key]: value })
        .then(gotItem, StorageError);
    },


    get: function (key) {
      return browser.storage.local.get(key)
        .then(gotItem, StorageError);
    },


    getAll: function () {
      return browser.storage.local.get()
        .then(gotItem, StorageError);
    },


    clearAll: function () {
      return browser.storage.local.clear();
    }


  };


  function gotItem (item) {
    return item;
  }


  function StorageError (error) {
    throw new Error("Storage", error);
  }


  return Storage;


})();
