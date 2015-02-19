function Revertable(attempt, revert) {
  function $attempt() {
    let ret = new Promise((f, r)=>{
      Promise.resolve(attempt()).then(f,r);
    }).then((v)=>[v],(e) => {
      e=Object(e);
      return $revert().then(
        _ => {
          e.unfinished = [e.unfinished];
          throw e;
        },
        revert_error => {
          e.unfinished = [revert_error.unfinished];
          throw e;
        }
      );
    });
    return ret; 
  };
  function $revert(values=[undefined]) {
    let ret = new Promise((f, r)=>{
      return Promise.resolve(revert(values[0])).then(f, r);
    }).then(v => undefined, e => {
      e=Object(e);
      e.revert = revert;
      e.unfinished = [values[0]];
      throw e;
    });
    return ret; 
  }
  let self = {
    attempt: $attempt,
    revert: $revert
  };
  return self;
}
Revertable.series = function (set) {
  function attempt() {
    let fulfill, reject;
    let ret = new Promise((f,r)=>{
      fulfill = f;
      reject = r;
    });
    let done = false;
    let index = -1;
    let values = [];
    next();
    return ret;

    function next() {
      if (done) return;
      index += 1;
      if (index === set.length) {
        done = true;
        fulfill(values);
        return;
      }
      let rev = set[index];
      rev.attempt().then((v) => {
        values.push(v);
        next();
      }, bail);
    }

    function bail(e) {
      if (done) return;
      done = true;
      let ret = revert(values.concat(undefined));
      ret.then(_ => {
        reject(e);
      }, revert_error => {
        e.unfinished = revert_error.unfinished;
        reject(e);
      });
    }
  }
  function revert(values=[]) {
    let fulfill, reject;
    let ret = new Promise((f,r)=>{
      fulfill = f;
      reject = r;
    });
    let done = false;
    let index = values.length;

    unwind();
    return ret;

    function unwind() {
      index -= 1;
      if (index === -1) {
        fulfill(null);
        return;
      }
      let data = values[index];
      let rev = set[index];
      rev.revert(data).then(unwind, (e)=> {
        e=Object(e);
        let innerUnfinished = e.unfinished;
        e.unfinished = [...values.slice(0, index), e.unfinished]
        reject(e);
      });
    }
  }
  
  return new Revertable(attempt, revert);
}
Revertable.branch = function (set) {
  function attempt() {
    let fulfill, reject;
    let ret = new Promise((f,r)=>{
      fulfill = f;
      reject = r;
    });
    let hadError = false;
    
    Promise.all(set.map(rev => rev.attempt().then(
      v=>{
        return {isError:false,error:null,value:v};
      },
      e=>{
        hadError = true;
        return {isError:true,error:e,value:null};
      }
    ))).then(results => {
      if (hadError) {
        let error = new Error('nested errors (see .inner[])');
        error.inner = [];
        error.unfinished = [];
        results.forEach((result,i)=>{
          if (result.isError) {
            error.inner[i] = result.error;
            error.unfinished[i] = undefined;
          }
          else {
            error.inner[i] = undefined;
            error.unfinished[i] = result.value;
          }
        });
        reject(error);
      }
      else {
        fulfill(results.reduce((ret,result,i)=>{
          ret[i] = result.value;
          return ret;
        },[]));
      }
    });
    
    return ret;
  }
  function revert(values=[]) {
    let fulfill, reject;
    let ret = new Promise((f,r)=>{
      fulfill = f;
      reject = r;
    });
    let hadError = false;
    
    Promise.all(set.map((rev,i) => rev.attempt(values[i]).then(
      v=>{
        return {isError:false,error:null,value:v};
      },
      e=>{
        hadError = true;
        return {isError:true,error:e,value:null};
      }
    ))).then(results => {
      if (hadError) {
        let error = new Error('nested errors (see .inner[])');
        error.inner = [];
        error.unfinished = [];
        results.forEach((result,i)=>{
          if (result.isError) {
            error.inner[i] = result.error;
            error.unfinished[i] = undefined;
          }
          else {
            error.inner[i] = undefined;
            error.unfinished[i] = result.value;
          }
        });
        reject(error);
      }
      else {
        fulfill(results.reduce((ret,result,i)=>{
          ret[i] = result.value;
          return ret;
        },[]));
      }
    });
    
    return ret;
  }
  
  return new Revertable(attempt, revert);
}
module.exports = Revertable;
