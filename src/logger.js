const config = require('./config.js');

class Logger {
  httpLogger = (req, res, next) => {
    let send = res.send;
    res.send = (resBody) => {
      const logData = {
        authorized: !!req.headers.authorization,
        path: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        reqBody: JSON.stringify(req.body),
        resBody: JSON.stringify(resBody),
      };
      const level = this.statusToLogLevel(res.statusCode);
      this.log(level, 'http', logData);
      res.send = send;
      return res.send(resBody);
    };
    next();
  };

  // level is info, warn, or error
  // type is the label to be used in grafana
  log(level, type, logData) {
    const labels = { component: config.logging.source, level: level, type: type };
    const values = [this.nowString(), this.sanitize(logData)];
    const logEvent = { streams: [{ stream: labels, values: [values] }] };

    this.sendLogToGrafana(logEvent);
  }

  statusToLogLevel(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
  }

  nowString() {
    return (Math.floor(Date.now()) * 1000000).toString();
  }

  sanitize(logData) {
    logData = JSON.stringify(logData);

    logData.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"');
    logData.replace(/\\"token\\":\s*\\"[^"]*\\"/gi, '\\"token\\": \\"*****\\"');
    logData.replace(/\\"jwt\\":\s*\\"[^"]*\\"/gi, '\\"jwt\\": \\"*****\\"');

    return logData;
  }

  sendLogToGrafana(event) {
      const body = JSON.stringify(event);
      // console.log(body);
      fetch(`${config.logging.url}`, {
        method: 'post',
        body: body,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.logging.userId}:${config.logging.apiKey}`,
        },
      }).then((res) => {
        if (!res.ok) {
          res.json().then((errorData) => {
            console.log('Failed to send log to Grafana:', errorData);
          });
        }
      });
    }
}

module.exports = new Logger();