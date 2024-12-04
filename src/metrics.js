const config = require('./config.js');


const os = require('os');

// REQUIRED METRICS:

// # of HTTP total, GET, PUT, POST, and DELETE requests
// # of authentication attempts: successful and failed
// usage percentage of CPU and memory
// # pizzas are sold per minute
// # creation failures
// # revenue / minute
// # pizza creation latency
// ms request latency

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.getRequests = 0;
    this.putRequests = 0;
    this.postRequests = 0;
    this.deleteRequests = 0;

    this.activeUsers = 0;
    this.successfulAuth = 0;
    this.failedAuth = 0;

    this.cpuPercentage = 0;
    this.memoryPercentage = 0.0;

    this.pizzas = 0;
    this.creationFailures = 0;
    this.revenue = 0.0;

    this.pizzaCreationLatency = 0.0;
    this.msRequestLatency = 0.0;
  }

  incrementTotalRequests() {
    this.totalRequests++;
  }

  incrementGetRequests() {
    this.getRequests++;
  }

  incrementPutRequests() {
    this.putRequests++;
  }

  incrementPostRequests() {
    this.postRequests++;
  }

  incrementDeleteRequests() {
    this.deleteRequests++;
  }

  incrementSuccessfulAuth() {
    this.successfulAuth++;
  }

  incrementFailedAuth() {
    this.failedAuth++;
  }

  incrementActiveUsers() {
    this.activeUsers++;
  }

  decrementActiveUsers() {
    this.activeUsers--;
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    this.cpuPercentage = cpuUsage.toFixed(2) * 100;
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    this.memoryPercentage = memoryUsage.toFixed(2);
  }

  incrementTotalPizzas() {
    this.pizzas++;
  }

  incrementCreationFailures() {
    this.creationFailures++;
  }

  updateTotalRevenue(revenue) {
    this.revenue += revenue;
  }

  updatePizzaCreationLatency(pizzaCreationLatency) {
    this.pizzaCreationLatency = pizzaCreationLatency;
  }

  updateMsRequestLatency(msRequestLatency) {
    // console.log(`Updating msRequestLatency to: ${msRequestLatency}`);
    if (msRequestLatency != 0)
      this.msRequestLatency = msRequestLatency;
  }

  sendMetricToGrafana(metrics) {
    fetch(`${config.metrics.url}`, {
      method: 'post',
      body: metrics,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error(response.body);
          console.error('Failed to push metrics data to Grafana');
        } else {
          // console.log(`Pushed ${metrics}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }
}

class MetricsBuilder {
  constructor() {
    this.metricList = "";
  }

  addMetric(metricPrefix, method, metricValue) {
    this.metricList += `${metricPrefix},source=${config.metrics.source},method=${method} total=${metricValue} \n`;
  }

  toString() {
    return this.metricList;
  }
}

const metrics = new Metrics();
module.exports = metrics;

function systemMetrics(buf) {
  metrics.getCpuUsagePercentage();
  metrics.getMemoryUsagePercentage();
  buf.addMetric('System', 'CPU', metrics.cpuPercentage);    
  buf.addMetric('System', 'Memory', metrics.memoryPercentage);   
}

function httpMetrics(buf) {
  buf.addMetric('HTTPRequests', 'TotalRequests', metrics.totalRequests); 
  buf.addMetric('HTTPRequests', 'GETRequests', metrics.getRequests);
  buf.addMetric('HTTPRequests', 'PUTRequests', metrics.putRequests);
  buf.addMetric('HTTPRequests', 'POSTRequests', metrics.postRequests);
  buf.addMetric('HTTPRequests', 'DELETERequests', metrics.deleteRequests);
}

function authMetrics(buf) {
  buf.addMetric('ActiveUsers', 'ActiveUsers', metrics.activeUsers);
  buf.addMetric('Auth', 'SuccessfulAuthRequests', metrics.successfulAuth);
  buf.addMetric('Auth', 'FailedAuthRequests', metrics.failedAuth);
}

function purchaseMetrics(buf) {
  buf.addMetric('Purchase', 'PizzasPurchased', metrics.pizzas);
  buf.addMetric('Purchase', 'PizzaCreationFailures', metrics.creationFailures);
  buf.addMetric('Revenue', 'Revenue', metrics.revenue);
}

function latencyMetrics(buf) {
  buf.addMetric('Latency', 'PizzaCreationLatency', metrics.pizzaCreationLatency);
  buf.addMetric('Latency', 'RequestLatency', metrics.msRequestLatency);
}

function sendMetricsPeriodically(period) {
  setInterval(() => {
    try {
      const buf = new MetricsBuilder();
      httpMetrics(buf);
      authMetrics(buf);
      systemMetrics(buf);
      purchaseMetrics(buf);
      latencyMetrics(buf);

      const metricsList = buf.toString();
      metrics.sendMetricToGrafana(metricsList);
    } catch (error) {
      console.log('Error sending metrics', error);
    }
  }, period);
}

sendMetricsPeriodically(5000);