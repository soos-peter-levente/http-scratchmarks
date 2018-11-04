"use strict"; 

function prefixLog (prefix) {
  return (...args) => {
    args.unshift(prefix);
    console.log.apply(null, args);
  };
};


function isEmptyObject (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

function  render (template, object) {
  return Mustache.render(loadTemplate(template), (object || {}));
};

function loadTemplate (template) {
  return $("#" + template).html();
};

async function getCurrentDomain (callback) {
  let tabs = await browser.tabs.query({ currentWindow: true, active: true });
  let domain = new URL(tabs[0].url).host;
  return callback ? callback(domain) : domain;
};
