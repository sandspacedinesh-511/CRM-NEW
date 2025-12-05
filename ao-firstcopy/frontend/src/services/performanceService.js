class PerformanceService {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      errors: [],
      userInteractions: []
    };
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.init();
  }

  init() {
    if (!this.isEnabled) return;

    // Monitor page load performance
    this.monitorPageLoad();
    
    // Monitor API calls
    this.monitorApiCalls();
    
    // Monitor errors
    this.monitorErrors();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor network performance
    this.monitorNetworkPerformance();
  }

  monitorPageLoad() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        const pageLoadMetrics = {
          timestamp: Date.now(),
          url: window.location.href,
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
          userAgent: navigator.userAgent
        };

        this.metrics.pageLoads.push(pageLoadMetrics);
        this.sendMetrics('pageLoad', pageLoadMetrics);
      });
    }
  }

  monitorApiCalls() {
    // This would be integrated with your axios interceptor
    // For now, we'll create a wrapper
    this.originalFetch = window.fetch;
    window.fetch = (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      return this.originalFetch(...args).then(response => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const apiMetrics = {
          timestamp: Date.now(),
          url,
          method: 'GET', // Would be determined from args
          duration,
          status: response.status,
          statusText: response.statusText
        };

        this.metrics.apiCalls.push(apiMetrics);
        this.sendMetrics('apiCall', apiMetrics);
        
        return response;
      }).catch(error => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const apiErrorMetrics = {
          timestamp: Date.now(),
          url,
          method: 'GET',
          duration,
          error: error.message
        };

        this.metrics.apiCalls.push(apiErrorMetrics);
        this.sendMetrics('apiError', apiErrorMetrics);
        
        throw error;
      });
    };
  }

  monitorErrors() {
    window.addEventListener('error', (event) => {
      const errorMetrics = {
        timestamp: Date.now(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        url: window.location.href
      };

      this.metrics.errors.push(errorMetrics);
      this.sendMetrics('error', errorMetrics);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const rejectionMetrics = {
        timestamp: Date.now(),
        reason: event.reason,
        url: window.location.href
      };

      this.metrics.errors.push(rejectionMetrics);
      this.sendMetrics('unhandledRejection', rejectionMetrics);
    });
  }

  monitorUserInteractions() {
    let lastInteraction = Date.now();
    
    const events = ['click', 'scroll', 'keypress', 'mousemove'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const now = Date.now();
        const timeSinceLastInteraction = now - lastInteraction;
        
        // Only log significant interactions (not every mouse move)
        if (timeSinceLastInteraction > 1000 || eventType !== 'mousemove') {
          const interactionMetrics = {
            timestamp: now,
            type: eventType,
            target: event.target?.tagName || 'unknown',
            url: window.location.href
          };

          this.metrics.userInteractions.push(interactionMetrics);
          lastInteraction = now;
        }
      }, { passive: true });
    });
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = performance.memory;
        const memoryMetrics = {
          timestamp: Date.now(),
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit
        };

        this.sendMetrics('memory', memoryMetrics);
      }, 30000); // Check every 30 seconds
    }
  }

  monitorNetworkPerformance() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const networkMetrics = {
        timestamp: Date.now(),
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      this.sendMetrics('network', networkMetrics);
    }
  }

  sendMetrics(type, data) {
    if (!this.isEnabled) return;

    try {
      // In production, send to your analytics service
      // Example: Google Analytics, Mixpanel, or your own endpoint
      
      // For now, store locally
      const metrics = JSON.parse(localStorage.getItem('performanceMetrics') || '{}');
      if (!metrics[type]) {
        metrics[type] = [];
      }
      metrics[type].push(data);
      
      // Keep only last 100 entries per type
      if (metrics[type].length > 100) {
        metrics[type] = metrics[type].slice(-100);
      }
      
      localStorage.setItem('performanceMetrics', JSON.stringify(metrics));
      
      // Send to your analytics endpoint
      // this.sendToAnalytics(type, data);
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  sendToAnalytics(type, data) {
    // Example implementation for sending to your analytics service
    const endpoint = process.env.REACT_APP_ANALYTICS_ENDPOINT;
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
          sessionId: this.getSessionId()
        })
      }).catch(error => {
        console.error('Failed to send analytics:', error);
      });
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // Performance monitoring methods
  measureTime(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    const duration = end - start;
    
    this.sendMetrics('custom', {
      timestamp: Date.now(),
      name,
      duration,
      url: window.location.href
    });
    
    return result;
  }

  async measureAsyncTime(name, asyncFn) {
    const start = performance.now();
    const result = await asyncFn();
    const end = performance.now();
    
    const duration = end - start;
    
    this.sendMetrics('custom', {
      timestamp: Date.now(),
      name,
      duration,
      url: window.location.href
    });
    
    return result;
  }

  // Get performance report
  getPerformanceReport() {
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics
    };

    return report;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      errors: [],
      userInteractions: []
    };
    localStorage.removeItem('performanceMetrics');
  }

  // Get metrics from localStorage
  getStoredMetrics() {
    try {
      return JSON.parse(localStorage.getItem('performanceMetrics') || '{}');
    } catch (error) {
      console.error('Failed to parse stored metrics:', error);
      return {};
    }
  }
}

export default new PerformanceService(); 