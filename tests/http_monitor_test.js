var dgram = require('dgram')
  , extend = require('xtend')
  , moniker = require('moniker')
  , request = require('request')
  , QB = require('qb')
  , qbRelyq = require('qb-relyq')
  , qbHttp = require('qb-http')
  , redis = require('redis')
  , createRedis = function() { return redis.createClient(6379, 'localhost', { enable_offline_queue: false }) }
  , qbMonitor = require('..')
  , socket
  , qb
  , relyqOptions = { createRedis: createRedis, blocking_timeout: 1 }
  , httpOptions = { base: '/qb' }
  , options = { interval: 50  }

var tests = exports.tests = {}

process.on('uncaughtException', function (err) {
  console.log('uncaught error!', err)
})

tests.setUp = function (cb) {
  try{
    httpOptions.port = Math.floor(Math.random() * 1000) + 18000
    options.prefix = 'monitor'

    qb = new QB({name: options.prefix})
      .component(qbRelyq.queue, relyqOptions)
    cb()
  }catch(e){console.log('setUp error!', e.stack); cb(e)}
}

tests.tearDown = function (cb) {
  qb.end()
  cb()
}

tests.nil = function (test) {
  test.expect(0)
  qb.component(qbHttp.receive, httpOptions)
    .component(qbMonitor.http, options)
  test.done()
}

tests.hit_endpoint = function (test) {
  test.expect(3)
  qb.component(qbHttp.receive, httpOptions)
    .component(qbMonitor.http, options)
    .can('march', function () {})
    .on('process-ready', function () {
      request('http://localhost:' + httpOptions.port + '/stats', function (err, res, body) {
        test.ifError(err)
        test.equal(res.statusCode, 200)
        test.equal(body, JSON.stringify({march: {todo: 0, doing: 0, failed: 0}}))
        test.done()
      })
    })
}

tests.hit_endpoint_after_push = function (test) {
  var call_done
  test.expect(3)
  qb.component(qbHttp.receive, httpOptions)
    .component(qbMonitor.http, options)
    .can('march', function (task, done) {call_done = done})
    .on('process-ready', function () {
      qb.push('march', {}, function () {
        request('http://localhost:' + httpOptions.port + '/stats', function (err, res, body) {
          test.ifError(err)
          test.equal(res.statusCode, 200)
          test.equal(body, JSON.stringify({march: {todo: 0, doing: 1, failed: 0}}))
          call_done()
        })
      })
    })
    .on('finish', function () {
      test.done()
    })
}

tests.custom_endpoint_uri = function (test) {
  test.expect(3)
  qb.component(qbHttp.receive, httpOptions)
    .component(qbMonitor.http, extend(options, {endpoint: '/yoyo-stats'}))
    .can('march', function () {})
    .on('process-ready', function () {
      request('http://localhost:' + httpOptions.port + '/yoyo-stats', function (err, res, body) {
        test.ifError(err)
        test.equal(res.statusCode, 200)
        test.equal(body, JSON.stringify({march: {todo: 0, doing: 0, failed: 0}}))
        test.done()
      })
    })
}

tests.pass_in_app = function (test) {
  test.expect(3)
  qb.component(qbHttp.receive, httpOptions)
  var app = qb._http.app
  qb._http.app = null

  qb.component(qbMonitor.http, extend(options, {app: app}))
    .can('march', function () {})
    .on('process-ready', function () {
      request('http://localhost:' + httpOptions.port + '/stats', function (err, res, body) {
        test.ifError(err)
        test.equal(res.statusCode, 200)
        test.equal(body, JSON.stringify({march: {todo: 0, doing: 0, failed: 0}}))
        test.done()
      })
    })
}