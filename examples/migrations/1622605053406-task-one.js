"use strict";

module.exports.up = function (next) {
  console.log("up one");
  next();
};

module.exports.down = function (next) {
  console.log("down one");
  next();
};
