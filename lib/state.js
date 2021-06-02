'use strict';
var chalk = require('chalk');
var dateFormat = require('dateformat');

module.exports = State;

function State(options) {
  this.lastRun = options.lastRun;
  this.migrations = options.migrations || [];
}

State.prototype.getIndex = function (title) {
  return this.migrations.findIndex((temp) => temp.title === title);
};

State.prototype.getLastIndex = function () {
  return this.migrations.findIndex((temp) => temp.title === this.lastRun);
};

State.prototype.printItem = function (item, showStatus) {
  const dateStr = item.timestamp ? dateFormat(item.timestamp, 'yyyy-mm-dd hh:MM:ss') : 'not run';
  const label = chalk.grey(`${item.index + 1}. ${item.title}  [${dateStr}]`);
  const desp = chalk.cyan(`<${item.description || 'No Description'}>`);
  if (showStatus) {
    const status = item.title === this.lastRun ? chalk.green('=>') : '**';
    console.log(status + ' ' + label + ':' + desp);
  } else {
    console.log(label + ':' + desp);
  }
};
State.prototype.printList = function () {
  this.migrations.forEach((temp) => this.printItem(temp));
};
State.prototype.printStatus = function () {
  this.migrations.forEach((temp) => this.printItem(temp, true));
};
