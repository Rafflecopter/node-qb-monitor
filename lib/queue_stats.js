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

var rq_queues = ['todo','doing','failed']
  , rq_queues_wdone = rq_queues.concat('done')

function relyq_stats(rq, callback) {
  var qnames = rq._clean_finish ? rq_queues : rq_queues_wdone
  async.map(qnames, function (qname, cb) {
    simpleq_length(rq[qname], cb)
  }, function (err, results) {
    callback(err, wrap(qnames, results))
  })
}

function simpleq_length(sq, callback) {
  sq._redis.llen(sq._key, function (err, val) {
    // console.log('simpleq_length', sq._key, err, val)
    callback(err, val)
  })
}

function wrap(keys, values) {
  var obj = {}
  keys.forEach(function (k, i) {
    obj[k] = values[i] || (values[i] === 0 ? 0 : -1)
  })
  return obj
}