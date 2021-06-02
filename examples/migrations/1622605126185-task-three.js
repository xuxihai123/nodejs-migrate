"use strict";

module.exports.up = function (next) {
  console.log("up three");
  next();
};

module.exports.down = function (next) {
  console.log("down three");
  next();
};
