"use strict";

module.exports.up = function (next) {
  console.log("up four");
  next();
};

module.exports.down = function (next) {
  console.log("down four");
  next();
};
