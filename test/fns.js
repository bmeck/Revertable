var Promise = require('bluebird');
var debug = require('debug')('test.fns');
var id = 0;
function uuid() {
  return id++;
}
exports.resolve = function (v) {
  var id = uuid();
  debug('resolve with id: %s', id);
  return Promise.resolve(v);
}
exports.reject = function (v) {
  var id = uuid();
  debug('reject with id: %s', id);
  return Promise.reject(v);
}
exports.throwValue = function (v) {
  var id = uuid();
  debug('throw raw value with id: %s', id);
  throw v;
}
