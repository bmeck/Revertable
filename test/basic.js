var debug = require('debug')();
var Revertable = require('../');
var fns = require('./fns');
var tape = require('tape');

tape.test('success should not revert', function (t) {
  t.plan(2);
  var ret = {};
  var rev = new Revertable(attempt, fail('called revert()'));
  rev.attempt().then(end, fail('produced an error'));
  function attempt() {
    t.pass('called attempt()');
    return fns.resolve(ret);
  }
  function fail(msg) {
    return function (e) {
      console.log(e);
      t.fail(msg);
    };
  }
  function end(v) {
    t.equal(v[0], ret);
    t.end();
  }
});

tape.test('failure->revert success should automatically revert with no unfinished tasks', function (t) {
  t.plan(4);
  var ret = {};
  var rev = new Revertable(attempt, reject);
  rev.attempt().then(fail('did not produce an error'), end);
  function attempt() {
    t.pass('called attempt()');
    return fns.reject(ret);
  }
  function reject(data) {
    t.equal(data, undefined);
    return fns.resolve(null);
  }
  function fail(msg) {
    return function (e) {
      console.log(e);
      t.fail(msg);
    };
  }
  function end(v) {
    t.equal(v, ret);
    t.equal(v.unfinished.length, 0);
    t.end();
  }
});
tape.test('failure->revert failure should automatically revert with unfinished tasks', function (t) {
  t.plan(5);
  var ret = {};
  var rev = new Revertable(attempt, revert);
  rev.attempt().then(fail('did not produce an error'), end);
  function attempt() {
    t.pass('called attempt()');
    return fns.reject(ret);
  }
  var reject_ret = {};
  function revert(data) {
    t.equal(data, undefined);
    return fns.reject({unfinished: [reject_ret]});
  }
  function fail(msg) {
    return function (e) {
      console.log(e);
      t.fail(msg);
    };
  }
  function end(v) {
    t.equal(v, ret);
    t.equal(v.unfinished.length, 1);
    t.equal(v.unfinished[0], reject_ret);
    t.end();
  }
});
