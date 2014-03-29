// qb-monitor/index.js

module.exports = {
  enableHttp: require('./lib/http_interface'),
  enableStatsd: require('./lib/statsd_interface')
}