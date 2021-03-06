# Revertable

```javascript
// place where we can show side effects
//
// -- this generally would be the fs or some
//    outside system
var state = {};

// creating a revertable is just creating a
// function to perform an action, and the inverse
var revertableInstance = new Revertable(
  function perform() {
    var key = Math.random();
    state[key] = 1;
    return Promise.resolve(key);
  }, function rollback(key) {
    delete state[key];
    return Promise.resolve(null);
  }
);

// revertables do not automatically perform their function
// so we should invoke it and wait for it to finish
var successfulPromise = revertableInstance.attempt();
var dataNeededToRevert;
successfulPromise.then(function success($data) {
  // often a task needs to produce data on how to undo
  // the side effects that it has created such as
  // where temporary files got saved

  // NOTE: this will not be equal to the data that was resolved
  //   during perform, this is to keep the data consumption of
  //   unfinished tasks identical to consuming results from 
  //   perform.
  dataNeededToRevert = $data;
  
  // since our task is stateless, we can use it to revert
  revertableInstance.revert(dataNeededToRevert);
}).catch(function failure(error) {
  // sometimes you can have errors during a revert()
  // if that is the case we maintain a way to continue
  // from the last point that was possible rather
  // than attempt to do a full revert
  //
  // this will be empty if there are no unfinished parts
  // of the task
  dataNeededToRevert = error.unfinished;
});
```

## Series

Sometimes we need to create a revertable that performs multiple actions.
We can do this by creating an array of revertables and using `Revertable.series`
to turn them into a single revertable.

```
Revertable.series([makeDir, writeFile]).attempt();
```

## Branch

Sometimes we have a large list of tasks that can be performed in parallel.
We can support this by using `Revertable.branch` similar to series.

```
Revertable.branch([writeToCache, writeToDB]).attempt();
```
