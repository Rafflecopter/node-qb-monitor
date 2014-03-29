// lib/http_interface.js
// http endpoint

var qstats = require('./queue_stats')

module.exports = setupEndpoint

function setupEndpoint(qb, opts) {
  if (qb.dialect('http')) {
    setupHttpDialectEndpoint(qb, opts)
  } else if (opts.app) {
    setupAppEndpoint(qb, opts)
  } else {
    throw new Error('Cannot setup monitor endpoint with no server!')
  }
}

function setupAppEndpoint(qb, opts) {
  var app = opts.app
    , base = opts.base || ''

  addEndpoint(qb, app, base + (opts.endpoint || '/stats'))
}

function setupHttpDialectEndpoint(qb, opts) {
  var dialect = qb.dialect('http')
    , dia_options = dialect.options
    , app = dialect.app
    , base = dia_options.base || ''

  addEndpoint(qb, app, base + (opts.endpoint || '/stats'))
}

function addEndpoint(qb, app, endp) {
  app.use(endp, createHandler(qb))
}

function createHandler(qb) {
  return function (req, res) {
    var queue = req.url.split('/')[1]
    if (queue) {
      qstats.queue(queue, sendResponse(res))
    } else {
      qstats.allqueues(sendResponse(res))
    }
  }
}

function sendResponse(res) {
  return function (err, result) {
    if (err) {
      res.send(500, {error: err.message, stack:err.stack})
    } else {
      res.send(200, result)
    }
  }
}