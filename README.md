# qb-monitor

Monitoring utilities for [qb](https://github.com/rafflecopter/node-qb).

Specifically focuses on monitoring queue size.

## Usage

```
npm install qb-monitor --save
```

```javascript
var qbMonitor = require('qb-monitor')

// qb-monitor's http interface can be used on a qb-http instance or a passed in connect app
qbMonitor.enableHttp(qb.speaks(require('qb-http')), {prefix: prefix /*defaults to <api-base>/stats*/})
qbMonitor.enableHttp(qb, {app: app})

// qb-monitor can also notify statsd (using a qb-statsd instance or other statsd object)
require('qb-statsd').enable(qb)
qbMonitor.enableStatsd(qb, {interval: 1000 /* ms */})
qbMonitor.enableStatsd(qb, {statsd: statsd})
```

## License

MIT in LICENSE file
