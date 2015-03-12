// lib/statsd_interface.js

var qstats = require('./queue_stats')

module.exports = setupStatsd

function setupStatsd(qb, options) {
  var statsd = qb._statsd || options.statsd
    , interval = options.interval || 1000
    , prefix = options.prefix || ''

  if (!statsd) {
    throw new Error('Statsd instance not available!')
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
    Object.keys(result[key]).forEach(function (subkey) {
      statsd.gauge([prefix, key, subkey].join('.'), result[key][subkey])
    })
  })
}