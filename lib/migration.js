'use strict';
module.exports = Migration;

function Migration(title, up, down, description) {
  this.title = title;
  this.up = up;
  this.down = down;
  this.description = description;
  this.timestamp = null;
}

Migration.prototype.toJSON = function () {
  return { title: this.title, timestamp: this.timestamp };
};

Migration.prototype.upAsync = function () {
  const self = this;
  return new Promise(function (resolve, reject) {
    const result = self.up(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    if (result && result.then) {
      result.then(resolve).catch(reject);
    }
  });
};

Migration.prototype.downAsync = function () {
  const self = this;
  return new Promise(function (resolve, reject) {
    const result = self.down(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    if (result && result.then) {
      result.then(resolve).catch(reject);
    }
  });
};
