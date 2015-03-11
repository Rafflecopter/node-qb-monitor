// lib/http_interface.js
// http endpoint

var qstats = require('./queue_stats')

module.exports = setupEndpoint

function setupEndpoint(qb, opts) {
  var endpoint = opts.endpoint || '/stats'
  if (opts.app) {
    addEndpoint(qb, opts.app, endpoint)
  } else if (qb._http) {
    addEndpoint(qb, qb._http.app, endpoint)
  } else {
    throw new Error('Cannot setup monitor endpoint with no server!')
  }
}

function addEndpoint(qb, app, endp) {
  app.use(endp, createHandler(qb))
}

function createHandler(qb) {
  return function (req, res) {
    var queue = req.url.split('/')[1]
    if (queue) {
      qstats.queue(qb, queue, sendResponse(res))
    } else {
      qstats.allqueues(qb, sendResponse(res))
    }
  }
}

function sendResponse(res) {
  return function (err, result) {
    if (err) {
      res.status(500).jsonp({error: err.message, stack:err.stack})
    } else {
      res.status(200).jsonp(result)
    }
  }
}