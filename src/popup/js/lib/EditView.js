"use strict";


var log = prefixLog("EditView");


const EditView = (function () {


  const


  message = new Messenger(),


  EditView = function (site) {

    this.container = $(".edit-view-container");

  };


  EditView.prototype = {


    reloadView: function () {

    },


    showView: function () {
      this.container.show();
    },


    hideView: function () {
      this.container.hide();
    },


  };


  return EditView;


})();
