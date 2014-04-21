
var QB = require('qb').backend(require('qb-relyq'))
  , Moniker = require('moniker')
  , redis = require('redis')
  , qstats = require('../lib/queue_stats')

var qb;

// If we are getting a test.done complaint, turn this on. It helps find errors
process.on('uncaughtException', function (err) {
  console.error(err.stack);
});
process.setMaxListeners(100);

var tests = exports.tests = {};

tests.setUp = function (cb) {
    qb = new QB({
      prefix: 'qb:'+Moniker.choose(),
      max_out: 1,
      allow_defer: false,
      allow_recur: false,
      createRedis: function () {return redis.createClient(6379, 'localhost', { enable_offline_queue: false })}
    });
    cb();
}

tests.tearDown = function (cb) {
  qb.end(cb)
}


tests.qstats = function (test) {
  var cnts = {todo:0,doing:0,failed:0}
  test.expect(12)
  qb.on('error', function (err) { console.log('ERROR:', err); test.ifError(err); test.done(err); })
    .can('work', function (task, done) {
      if (task.n==1) qb.push('work', {n:2})
      done(task.n === 2 ? new Error('yoyoes') : null)
    })
    .pre('push', function (type, task) {
      task.n > 1 ? cnts.todo++ : cnts.doing++
    })
    .pre('process', function (type, task) {
      if(task.n > 1) cnts.todo--, cnts.doing++
    })
    .pre('finish', function () {
      cnts.doing --;
    })
    .pre('fail', function () {
      cnts.doing --; cnts.failed ++;
    })
    .on('push', test_state.bind(null, 'push'))
    .pre('process', test_state.bind(null, 'process'))
    .post('finish', test_state.bind(null, 'finish'))
    .post('fail', function (type, task, cb) {
      setTimeout(function () {
        test_state('fail', type, task, test.done)
      }, 1000)
    })
    .start()

    .on('ready', function () {
      qb.push('work', {n: 1})
    })


  function test_state(state, type, task, cb) {
    var cntsx = clone(cnts)
    qstats.queue(qb, 'work', function (err, res) {
      test.ifError(err)
      console.log('test_state', state, task.n, res, cntsx)
      test.deepEqual(res, cntsx, 'failed at ' + state + task.n)
      cb()
    })
  }
}

function clone(obj) {
  var no = {}
  Object.keys(obj).forEach(function (k) {
    no[k] = obj[k]
  })
  return no
}