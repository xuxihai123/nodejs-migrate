"use strict";

const timeoutPromise = (time) =>
  new Promise((resolve) => setTimeout(resolve, time));

module.exports.up = async function () {
  console.log("up five");
  await timeoutPromise(1000);
};

module.exports.down = async function () {
  console.log("down five");
  await timeoutPromise(2000);
};
