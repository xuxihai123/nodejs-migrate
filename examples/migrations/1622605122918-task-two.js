"use strict";

module.exports.up = function (next) {
  console.log("up two");
  setTimeout(() => {
    next();
  }, 1000);
};

module.exports.down = function (next) {
  console.log("down two");
  setTimeout(() => {
    next();
  }, 2000);
};
