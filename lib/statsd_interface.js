// lib/statsd_interface.js

var qstats = require('./queue_stats')

module.exports = setupStatsd

function setupStatsd(qb, opts) {
  var statsd = qb._statsd || opts.statsd
    , interval = opts.interval || 1000
    , prefix = opts.prefix

  if (!statsd) {
    throw new Error('Statsd instance not available!')
  } else if (!prefix) {
    throw new Error('Prefix is required in options argument')
  }

  startStatsdCollection(qb, statsd, interval, prefix)
}

function startStatsdCollection(qb, statsd, interval, prefix) {
  var ival = setInterval(function () {
    qstats.allqueues(qb, function (err, result) {
      if (err) {
        return qb.emit('error', err, 'Statsd collection failed')
      }
      sendStats(statsd, prefix, result)
    })
  }, interval)

  qb.on('end', function () {
    clearInterval(ival)
  })
}

function sendStats(statsd, prefix, result) {
  Object.keys(result).forEach(function (key) {
    statsd.gauge(prefix + '.' + key, result[key])
  })
}