# qb-monitor

Monitoring utilities for [qb](https://github.com/rafflecopter/node-qb).

Gathers statistics on the queue size for [qb-relyq](https://github.com/rafflecopter/node-qb-relyq), and exposes via `statsd` or `http`, usually in conjunction with [qb-statsd](https://github.com/rafflecopter/node-qb-statsd) and [qb-http](https://github.com/rafflecopter/node-qb-http) respectively.

## Usage

```
npm install qb-monitor --save
```

```javascript
var qbMonitor = require('qb-monitor')

// qb-monitor's http interface can be used on a qb-http instance or a passed in connect app
qb.component(qbMonitor.http, {endpoint: '/my-qb-stats'})

// qb-monitor can also notify statsd (using a qb-statsd instance or other statsd object)
qb.component(qbMonitor.statsd, {interval: 1000, prefix: 'monitor.'})
```

## Options

### HTTP Options

- `app` Pass in an express `app` if `qb-http` isn't being used.
- `endpoint` Place to get stats information (default: `'/stats'`)

### Statsd Options

- `statsd` Pass in a `statsd` client if `qb-statsd` isn't being used.
- `interval` Milliseconds between stats gathering
- `prefix` Prefix before stats in statsd. Note that the client also can hold a prefix, and the `qb-statsd` prefix applies.

## License

MIT in LICENSE file
