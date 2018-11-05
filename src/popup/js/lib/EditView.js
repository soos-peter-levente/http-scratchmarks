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


const EditView = (function () {


  const


  log = prefixLog("EditView"),
  message = new Messenger(),

  container = $(".edit-view-container"),
  header = $(".edit-view-header-container"),
  editor = $(".edit-view-editor-container"),
  footer = $(".edit-view-footer-container"),


  EditView = function (site, data) {
    this.redrawView(data);
    return this;
  };


  EditView.prototype = {


    redrawView: function (data) {
      renderHeader();
      renderEditor(data);
      renderFooter();
    },


    showView: function () {
      container.show();
    },


    hideView: function () {
      container.hide();
    }


  };


  function renderHeader() {
    header.empty();
    header.html(render("extension-header", {
      title: "Add new rule"
    }));
    message.isExtensionEnabled(status => {
      header.find(".extension-header-toggle")
        .toggleClass("active", status);
    });
  };


  function renderEditor (data) {
    editor.empty();
    editor.html(render("editor"));
  };


  function renderFooter () {
    footer.empty();
    footer.html(render("edit-view-footer"));
    footer.find(".icon.save").click(saveRule);
  };

  function saveRule () {
    log("Saving input");
    new EditView().hideView();
    new MainView().showView();
  };

  return EditView;


})();
