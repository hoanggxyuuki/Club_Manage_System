import React, { useState, useEffect } from 'react';
import { Activity, Database, HardDrive, RefreshCw, Trash2, Zap, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { adminApi } from '@/services/api';
import { toast } from '@/utils/toast';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      console.log('Fetching performance metrics...');
      const response = await adminApi.getPerformanceMetrics();
      console.log('Raw response:', response);
      setMetrics(response);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to fetch performance metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const clearCache = async () => {
    try {
      await adminApi.clearCache();
      toast.success('Cache cleared successfully');
      fetchMetrics();
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const optimizeDatabase = async () => {
    try {
      const response = await adminApi.optimizeDatabase();
      console.log(response);
      toast.success('Database optimization completed');
      fetchMetrics();
    } catch (error) {
      toast.error('Failed to optimize database');
    }
  };

  const getMemoryUsagePercentage = () => {
    if (!metrics?.system?.memory) return 0;
    const { heapUsed, heapTotal } = metrics.system.memory;
    return Math.round((heapUsed / heapTotal) * 100);
  };
  console.log(metrics); 
  const getCacheStatus = () => {
    if (!metrics?.cache) return { status: 'unknown', color: 'gray' };
    
    if (metrics.cache.type === 'redis') {
      return { status: 'Redis Active', color: 'green' };
    } else if (metrics.cache.type === 'memory') {
      return { status: 'Memory Cache', color: 'blue' };
    } else {
      return { status: 'Cache Error', color: 'red' };
    }
  };

  const getDatabaseStatus = () => {
    if (!metrics?.database) return { status: 'Unknown', color: 'gray' };
    
    const totalIndexes = Object.values(metrics.database).reduce((sum, model) => {
      return sum + (model.total || 0);
    }, 0);
    
    if (totalIndexes > 0) {
      return { status: 'Optimized', color: 'green', indexes: totalIndexes };
    } else {
      return { status: 'Needs Optimization', color: 'orange' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-gray-600">
            Real-time system performance metrics and optimization tools
          </p>
        </div>
        <button 
          onClick={fetchMetrics} 
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={clearCache} className="flex items-center p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          <Trash2 className="h-5 w-5 mr-3 text-red-500" />
          <div className="text-left">
            <div className="font-semibold">Clear Cache</div>
            <div className="text-sm text-gray-600">Free up memory</div>
          </div>
        </button>
        
        <button onClick={optimizeDatabase} className="flex items-center p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          <Zap className="h-5 w-5 mr-3 text-yellow-500" />
          <div className="text-left">
            <div className="font-semibold">Optimize DB</div>
            <div className="text-sm text-gray-600">Rebuild indexes</div>
          </div>
        </button>
        
        <button className="flex items-center p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          <TrendingUp className="h-5 w-5 mr-3 text-green-500" />
          <div className="text-left">
            <div className="font-semibold">System Health</div>
            <div className="text-sm text-gray-600">Overall status</div>
          </div>
        </button>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">System Status</h3>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.system?.uptime ? 
              `${Math.floor(metrics.system.uptime / 3600)}h ${Math.floor((metrics.system.uptime % 3600) / 60)}m` : 
              'N/A'
            }
          </div>
          <p className="text-xs text-gray-500 mt-1">Uptime</p>
        </div>

        {/* Memory Usage */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Memory Usage</h3>
            <HardDrive className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.system?.memory?.heapUsed || 0} MB
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getMemoryUsagePercentage()}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getMemoryUsagePercentage()}% of {metrics?.system?.memory?.heapTotal || 0} MB
          </p>
        </div>

        {/* Cache Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Cache Status</h3>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              getCacheStatus().color === 'green' 
                ? 'bg-green-100 text-green-800' 
                : getCacheStatus().color === 'blue'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {getCacheStatus().status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {metrics?.cache?.keys || 0} cached items
          </p>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Database</h3>
            <Database className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              getDatabaseStatus().color === 'green' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {getDatabaseStatus().status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getDatabaseStatus().indexes || 0} indexes
          </p>
        </div>
      </div>

      {/* System Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">System Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Node Version:</span>
              <span className="font-mono text-gray-900">{metrics?.system?.nodeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <span className="text-gray-900">{metrics?.system?.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="text-gray-900">{Math.floor((metrics?.system?.uptime || 0) / 3600)} hours</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Memory Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">RSS:</span>
              <span className="text-gray-900">{metrics?.system?.memory?.rss} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heap Used:</span>
              <span className="text-gray-900">{metrics?.system?.memory?.heapUsed} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heap Total:</span>
              <span className="text-gray-900">{metrics?.system?.memory?.heapTotal} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">External:</span>
              <span className="text-gray-900">{metrics?.system?.memory?.external} MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Indexes */}
      {metrics?.database && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Database Indexes</h3>
          <div className="space-y-4">
            {Object.entries(metrics.database).map(([modelName, modelData]) => (
              <div key={modelName} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{modelName}</h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {modelData.total || 0} indexes
                  </span>
                </div>
                {modelData.indexes && (
                  <div className="space-y-1">
                    {modelData.indexes.slice(0, 5).map((index, idx) => (
                      <div key={idx} className="text-sm text-gray-600">
                        • {index.name}: {Object.entries(index.keys).map(([key, value]) => `${key}(${value})`).join(', ')}
                      </div>
                    ))}
                    {modelData.indexes.length > 5 && (
                      <div className="text-sm text-gray-600">
                        ... and {modelData.indexes.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-600">Cache Type</div>
            <div className="text-2xl font-bold text-gray-900">{metrics?.cache?.type || 'Unknown'}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Cached Items</div>
            <div className="text-2xl font-bold text-gray-900">{metrics?.cache?.keys || 0}</div>
          </div>
          
          {metrics?.cache?.type === 'memory' && (
            <>
              <div>
                <div className="text-sm font-medium text-gray-600">Hit Rate</div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.cache.hitRate ? `${(metrics.cache.hitRate * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Hits</div>
                <div className="text-2xl font-bold text-gray-900">{metrics.cache.hits || 0}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {getMemoryUsagePercentage() > 80 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-sm text-red-700">
              High memory usage detected. Consider clearing cache or restarting the application.
            </div>
          </div>
        </div>
      )}

      {getDatabaseStatus().color === 'orange' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-orange-400 mr-3 mt-0.5" />
            <div className="text-sm text-orange-700">
              Database optimization recommended. Click "Optimize DB" to rebuild indexes.
            </div>
          </div>
        </div>
      )}

      {getCacheStatus().color === 'red' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-sm text-red-700">
              Cache system error detected. Check Redis connection or restart the service.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard; 