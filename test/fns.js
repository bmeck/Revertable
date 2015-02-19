var Promise = require('bluebird');
var id = 0;
function uuid() {
  return id++;
}
exports.resolve = function () {
  var id = uuid();
  debug('resolve with id: %s', id);
  return Promise.resolve({id: id});
}
exports.reject = function () {
  var id = uuid();
  debug('reject with id: %s', id);
  return Promise.reject({id: id});
}
exports.throwValue = function () {
  var id = uuid();
  debug('throw raw value with id: %s', id);
  throw {id: id};
}
exports.throwError = function () {
  var id = uuid();
  debug('throw error with id: %s', id);
  var err = new Error('thrown error');
  err.id = id;
  throw err;
}
