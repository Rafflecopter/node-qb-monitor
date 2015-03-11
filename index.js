// qb-monitor/index.js

module.exports = {
  http: require('./lib/http_interface'),
  statsd: require('./lib/statsd_interface')
}