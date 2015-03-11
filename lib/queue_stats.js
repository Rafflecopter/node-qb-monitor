// node-qb-monitor/index.js
// Provide monitoring of queue sizes

var async = require('async')
  , objectValues = require('object-values')

module.exports = {
  queue: qb_queue_stats,
  allqueues: qb_allqueues_stats
}

function qb_queue_stats(qb, type, callback) {
  if (!qb._relyq) return callback(new Error('qb-monitor is only compatible with qb-relyq'))

  qb._relyq.qmanager.byType(type, function (qobj) {
    relyq_stats(qobj.queue, callback)
  })
}

function qb_allqueues_stats(qb, callback) {
  if (!qb._relyq) return callback(new Error('qb-monitor is only compatible with qb-relyq'))

  var qobjs = objectValues(qb._relyq.qmanager.queues)
    , types = qobjs.map(function (qobj) { return qobj.type })

  async.map(qobjs, function (qobj, cb) {
    relyq_stats(qobj.queue, cb)
  }, function (err, results) {
    callback(err, wrap(types, results))
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