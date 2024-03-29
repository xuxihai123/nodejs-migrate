'use strict';

var fs = require('fs');

module.exports = FileStore;

function FileStore(path) {
  this.path = path;
}

/**
 * Save the migration data.
 *
 * @api public
 */

FileStore.prototype.save = function (state, fn) {
  fs.writeFile(this.path, JSON.stringify({ lastRun: state.lastRun, migrations: state.migrations }, null, '  '), fn);
};

/**
 * Load the migration data and call `fn(err, obj)`.
 *
 * @param {Function} fn
 * @return {Type}
 * @api public
 */

FileStore.prototype.load = function (fn) {
  fs.readFile(this.path, 'utf8', function (err, json) {
    if (err && err.code !== 'ENOENT') return fn(err);
    if (!json || json === '') {
      return fn(null, {});
    }

    let state;
    try {
      state = JSON.parse(json);
    } catch (err) {
      return fn(err);
    }
    return fn(null, state);
  });
};
