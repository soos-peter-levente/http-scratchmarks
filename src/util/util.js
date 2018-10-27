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
