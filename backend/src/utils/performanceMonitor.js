const os = require('os');
const mongoose = require('mongoose');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byRoute: {},
        responseTimes: []
      },
      database: {
        queries: 0,
        slowQueries: [],
        connections: 0
      },
      memory: {
        usage: [],
        gc: []
      },
      errors: {
        count: 0,
        byType: {}
      }
    };
    
    this.startTime = Date.now();
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memory.usage.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      });

      // Keep only last 100 records
      if (this.metrics.memory.usage.length > 100) {
        this.metrics.memory.usage.shift();
      }
    }, 30000); // Every 30 seconds

    // Monitor database connections
    setInterval(() => {
      this.metrics.database.connections = mongoose.connection.readyState;
    }, 10000); // Every 10 seconds
  }

  // Track request performance
  trackRequest(req, res, next) {
    const startTime = Date.now();
    const method = req.method;
    const route = req.route?.path || req.path;

    // Increment counters
    this.metrics.requests.total++;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byRoute[route] = (this.metrics.requests.byRoute[route] || 0) + 1;

    // Track response time
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      this.metrics.requests.responseTimes.push({
        timestamp: Date.now(),
        method,
        route,
        statusCode: res.statusCode,
        responseTime
      });

      // Keep only last 1000 response times
      if (this.metrics.requests.responseTimes.length > 1000) {
        this.metrics.requests.responseTimes.shift();
      }

      // Track slow requests
      if (responseTime > 1000) {
        this.metrics.requests.slowQueries.push({
          timestamp: Date.now(),
          method,
          route,
          responseTime,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });

        // Keep only last 100 slow queries
        if (this.metrics.requests.slowQueries.length > 100) {
          this.metrics.requests.slowQueries.shift();
        }
      }
    });

    next();
  }

  // Track database query performance
  trackDatabaseQuery(query, duration) {
    this.metrics.database.queries++;

    if (duration > 100) { // Slow query threshold
      this.metrics.database.slowQueries.push({
        timestamp: Date.now(),
        collection: query.collection?.name || 'unknown',
        operation: query.op || 'unknown',
        duration,
        query: query._conditions || {}
      });

      // Keep only last 50 slow queries
      if (this.metrics.database.slowQueries.length > 50) {
        this.metrics.database.slowQueries.shift();
      }
    }
  }

  // Track errors
  trackError(error, context = {}) {
    this.metrics.errors.count++;
    
    const errorType = error.name || 'Unknown';
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
  }

  // Get system metrics
  getSystemMetrics() {
    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();
    const cpuUsage = os.loadavg();

    return {
      uptime,
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        system: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        }
      },
      cpu: {
        loadAverage: cpuUsage,
        cores: os.cpus().length
      },
      platform: {
        type: os.type(),
        release: os.release(),
        arch: os.arch()
      }
    };
  }

  // Get performance metrics
  getMetrics() {
    const systemMetrics = this.getSystemMetrics();
    
    // Calculate averages
    const avgResponseTime = this.metrics.requests.responseTimes.length > 0
      ? this.metrics.requests.responseTimes.reduce((sum, req) => sum + req.responseTime, 0) / this.metrics.requests.responseTimes.length
      : 0;

    const requestsPerMinute = this.metrics.requests.total / (systemMetrics.uptime / 60000);

    return {
      ...this.metrics,
      system: systemMetrics,
      calculated: {
        avgResponseTime: Math.round(avgResponseTime),
        requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
        errorRate: this.metrics.requests.total > 0 
          ? (this.metrics.errors.count / this.metrics.requests.total * 100).toFixed(2)
          : 0
      }
    };
  }

  // Get health status
  getHealthStatus() {
    const metrics = this.getMetrics();
    const issues = [];

    // Check response time
    if (metrics.calculated.avgResponseTime > 1000) {
      issues.push('High average response time');
    }

    // Check error rate
    if (parseFloat(metrics.calculated.errorRate) > 5) {
      issues.push('High error rate');
    }

    // Check memory usage
    const memoryUsagePercent = (metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      issues.push('High memory usage');
    }

    // Check database connections
    if (metrics.database.connections !== 1) {
      issues.push('Database connection issues');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      timestamp: Date.now()
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byRoute: {},
        responseTimes: []
      },
      database: {
        queries: 0,
        slowQueries: [],
        connections: 0
      },
      memory: {
        usage: [],
        gc: []
      },
      errors: {
        count: 0,
        byType: {}
      }
    };
    this.startTime = Date.now();
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor; 