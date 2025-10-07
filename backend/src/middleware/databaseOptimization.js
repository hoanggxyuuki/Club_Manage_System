const mongoose = require('mongoose');

// Middleware để tối ưu pagination
const paginationMiddleware = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    skip
  };

  next();
};

// Middleware để tối ưu select fields
const selectFieldsMiddleware = (defaultFields = '') => {
  return (req, res, next) => {
    const select = req.query.select || defaultFields;
    req.selectFields = select;
    next();
  };
};

// Middleware để tối ưu populate
const populateMiddleware = (defaultPopulate = '') => {
  return (req, res, next) => {
    const populate = req.query.populate || defaultPopulate;
    req.populateFields = populate;
    next();
  };
};

// Helper function để tạo optimized query
const createOptimizedQuery = (model, options = {}) => {
  const {
    filter = {},
    select = '',
    populate = '',
    sort = { createdAt: -1 },
    pagination = { skip: 0, limit: 10 }
  } = options;

  let query = model.find(filter);

  if (select) {
    query = query.select(select);
  }

  if (populate) {
    const populateOptions = populate.split(',').map(field => {
      const [path, select] = field.split(':');
      return select ? { path, select } : path;
    });
    query = query.populate(populateOptions);
  }

  query = query.sort(sort);

  if (pagination) {
    query = query.skip(pagination.skip).limit(pagination.limit);
  }

  return query;
};

// Helper function để tạo aggregation pipeline tối ưu
const createOptimizedAggregation = (pipeline, options = {}) => {
  const { allowDiskUse = false, maxTimeMS = 30000 } = options;
  
  return {
    pipeline,
    options: {
      allowDiskUse,
      maxTimeMS
    }
  };
};

// Middleware để monitor query performance
const queryPerformanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow queries (>1s)
      console.warn(`Slow query detected: ${req.method} ${req.path} - ${duration}ms`);
    }
  });

  next();
};

module.exports = {
  paginationMiddleware,
  selectFieldsMiddleware,
  populateMiddleware,
  createOptimizedQuery,
  createOptimizedAggregation,
  queryPerformanceMiddleware
}; 