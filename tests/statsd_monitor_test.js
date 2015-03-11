var dgram = require('dgram')
  , extend = require('xtend')
  , moniker = require('moniker')
  , QB = require('qb')
  , qbRelyq = require('qb-relyq')
  , qbStatsD = require('qb-statsd')
  , redis = require('redis')
  , createRedis = function() { return redis.createClient(6379, 'localhost', { enable_offline_queue: false }) }
  , qbMonitor = require('..')
  , socket
  , qb
  , relyqOptions = { createRedis: createRedis, blocking_timeout: 1 }
  , statsdOptions = { host: 'localhost' }
  , options = { interval: 50 }

var tests = exports.tests = {}

process.on('uncaughtException', function (err) {
  console.log('uncaught error!', err)
})

tests.setUp = function (cb) {
  try{
    statsdOptions.prefix = relyqOptions.prefix = moniker.choose()
    options.prefix = 'monitor'
    socket = dgram.createSocket('udp4')
    socket.bind(17000 + Math.floor(Math.random() * 1000))
    socket.on('listening', function () {
      // console.log('socket listening on ' + socket.address().address + ':' + socket.address().port)
      statsdOptions.port = socket.address().port
      qb.component(qbStatsD, statsdOptions)
      cb()
    })
    socket.on('error', cb)

    qb = new QB({name: options.prefix})
      .component(qbRelyq.queue, relyqOptions)
  }catch(e){console.log('setUp error!', e.stack); cb(e)}
}

tests.tearDown = function (cb) {
  socket.close()
  qb.end()
  cb()
}

tests.nil = function (test) {
  test.expect(0)
  qb.component(qbMonitor.statsd, options)
  test.done()
}


tests.statsd_empty = function (test) {
  var start = new Date()
    , i = 0
  test.expect(5)

  socket.on('message', onmsg)
  qb.can('math', function (task, done) { done() })
    .on('process-ready', function () {
      qb.component(qbMonitor.statsd, options)
    })

  function onmsg(message) {
    var msg = message.toString('utf8')
    if (/todo/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.' + options.prefix + '.math.todo:0|g')
    else if (/doing/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.' + options.prefix + '.math.doing:0|g')
    else if (/done/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.' + options.prefix + '.math.done:0|g')
    else if (/failed/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.' + options.prefix + '.math.failed:0|g')
    else
      test.ifError(new Error('unrecognized message: ' + msg))

    if (++i == 4) {
      var length = new Date() - start
      test.ok(length < 150, 'length is > 100: ' + length)
      test.done()
    }
  }
}

tests.statsd_failure = function (test) {
  var i = 0
    , call_done
  test.expect(6)

  socket.on('message', onmsg)
  qb.can('math', function (task, done) { call_done = done })
    .on('process-ready', function () {
      qb.component(qbMonitor.statsd, options)
        .push('math', {x: 1, y: 2})
    })
    .on('finish', function () {
      test.done()
    })

  function onmsg(message) {
    var msg = message.toString('utf8')
    if (/todo/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.' + options.prefix + '.math.todo:0|g')
    else if (/doing/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.' + options.prefix + '.math.doing:1|g')
    else if (/done/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.' + options.prefix + '.math.done:0|g')
    else if (/failed/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.' + options.prefix + '.math.failed:0|g')
    else if (/push/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.math.push:1|c')
    else if (/process/.test(msg))
      test.equal(msg, statsdOptions.prefix + '.math.process:1|c')
    else
      test.ifError(new Error('unrecognized message: ' + msg))

    if (++i == 6) {
      call_done()
    }
  }
}