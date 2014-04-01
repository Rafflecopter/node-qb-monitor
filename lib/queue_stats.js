// node-qb-monitor/index.js
// Provide monitoring of queue sizes

var async = require('async')

module.exports = {
  queue: qb_queue_stats,
  allqueues: qb_allqueues_stats
}

function qb_queue_stats(qb, queue_name, callback) {
  relyq_stats(qb._queues[queue_name].queue, callback)
}

function qb_allqueues_stats(qb, callback) {
  var qnames = Object.keys(qb._queues)
  async.map(qnames, function (qname, cb) {
    relyq_stats(qb._queues[qname].queue, cb)
  }, function (err, results) {
    callback(err, wrap(qnames, results))
  })
}


var rq_queues = ['todo','doing','failed','done','deferred']

function relyq_stats(rq, callback) {
  async.map(rq_queues, function (qname, cb) {
    if (!rq[qname]) return cb()
    if (qname === 'deferred') return deferred_length(rq.deferred, cb)
    simpleq_length(rq[qname], cb)
  }, function (err, results) {
    callback(err, wrap(rq_queues, results))
  })
}

function deferred_length(def, callback) {
  if (def._redis.ready)
    def._redis.zcard(def._key, callback)
  else
    callback()
}

function simpleq_length(sq, callback) {
  if (sq._redis.ready)
    sq._redis.llen(sq._key, function (err, val) {
      // console.log('simpleq_length', sq._key, err, val)
      callback(err, val)
    })
  else
    callback()
}

function wrap(keys, values) {
  var obj = {}
  keys.forEach(function (k, i) {
    if (values[i] === undefined) return null;
    obj[k] = values[i];
  })
  return obj
}