const mongoose = require('mongoose');

class DatabaseOptimizer {
  constructor() {
    this.indexes = new Map();
    this.initializeIndexes();
  }

  initializeIndexes() {
    // User indexes
    this.indexes.set('User', [
      { email: 1, unique: true },
      { username: 1, unique: true },
      { phone: 1, sparse: true },
      { role: 1 },
      { status: 1 },
      { createdAt: -1 },
      { lastLoginAt: -1 },
      { email: 1, status: 1 }, // Compound index
      { role: 1, status: 1 }   // Compound index
    ]);

    // Member indexes
    this.indexes.set('Member', [
      { userId: 1, unique: true },
      { memberId: 1, unique: true },
      { department: 1 },
      { position: 1 },
      { joinDate: -1 },
      { status: 1 },
      { department: 1, status: 1 },
      { position: 1, status: 1 }
    ]);

    // Post indexes
    this.indexes.set('Post', [
      { author: 1 },
      { category: 1 },
      { tags: 1 },
      { createdAt: -1 },
      { updatedAt: -1 },
      { likes: -1 },
      { views: -1 },
      { status: 1 },
      { author: 1, createdAt: -1 },
      { category: 1, createdAt: -1 },
      { tags: 1, createdAt: -1 }
    ]);

    // Event indexes
    this.indexes.set('Event', [
      { organizer: 1 },
      { startDate: 1 },
      { endDate: 1 },
      { status: 1 },
      { category: 1 },
      { location: 1 },
      { startDate: 1, status: 1 },
      { organizer: 1, startDate: 1 }
    ]);

    // Task indexes
    this.indexes.set('Task', [
      { assignee: 1 },
      { assigner: 1 },
      { status: 1 },
      { priority: 1 },
      { dueDate: 1 },
      { createdAt: -1 },
      { assignee: 1, status: 1 },
      { assignee: 1, dueDate: 1 },
      { status: 1, dueDate: 1 }
    ]);

    // Chat indexes
    this.indexes.set('Chat', [
      { participants: 1 },
      { lastMessageAt: -1 },
      { type: 1 },
      { participants: 1, lastMessageAt: -1 }
    ]);

    // Message indexes
    this.indexes.set('Message', [
      { chatId: 1 },
      { sender: 1 },
      { createdAt: -1 },
      { chatId: 1, createdAt: -1 },
      { sender: 1, createdAt: -1 }
    ]);

    // Notification indexes
    this.indexes.set('Notification', [
      { recipient: 1 },
      { type: 1 },
      { read: 1 },
      { createdAt: -1 },
      { recipient: 1, read: 1 },
      { recipient: 1, createdAt: -1 },
      { type: 1, createdAt: -1 }
    ]);

    // Competition indexes
    this.indexes.set('Competition', [
      { name: 1 },
      { status: 1 },
      { startDate: 1 },
      { endDate: 1 },
      { category: 1 },
      { status: 1, startDate: 1 },
      { category: 1, status: 1 }
    ]);

    // Achievement indexes
    this.indexes.set('Achievement', [
      { userId: 1 },
      { type: 1 },
      { earnedAt: -1 },
      { userId: 1, type: 1 },
      { userId: 1, earnedAt: -1 }
    ]);

    // Group indexes
    this.indexes.set('Group', [
      { name: 1 },
      { admin: 1 },
      { status: 1 },
      { createdAt: -1 },
      { admin: 1, status: 1 }
    ]);

    // GroupMember indexes
    this.indexes.set('GroupMember', [
      { groupId: 1 },
      { userId: 1 },
      { role: 1 },
      { joinedAt: -1 },
      { groupId: 1, userId: 1, unique: true },
      { groupId: 1, role: 1 }
    ]);
  }

  // Tạo tất cả indexes
  async createAllIndexes() {
    console.log('🔄 Creating database indexes...');
    
    const results = [];
    
    for (const [modelName, indexConfigs] of this.indexes) {
      try {
        const Model = mongoose.model(modelName);
        const modelResults = await this.createModelIndexes(Model, indexConfigs);
        results.push({ model: modelName, indexes: modelResults });
      } catch (error) {
        console.error(`❌ Error creating indexes for ${modelName}:`, error.message);
        results.push({ model: modelName, error: error.message });
      }
    }

    return results;
  }

  // Tạo indexes cho một model cụ thể
  async createModelIndexes(Model, indexConfigs) {
    const results = [];
    
    for (const config of indexConfigs) {
      try {
        const indexName = this.generateIndexName(config);
        
        // Kiểm tra index đã tồn tại chưa
        const existingIndexes = await Model.collection.indexes();
        const indexExists = existingIndexes.some(index => 
          index.name === indexName || 
          JSON.stringify(index.key) === JSON.stringify(config)
        );

        if (!indexExists) {
          await Model.collection.createIndex(config);
          results.push({ 
            name: indexName, 
            config, 
            status: 'created' 
          });
          console.log(`✅ Created index: ${indexName} for ${Model.modelName}`);
        } else {
          results.push({ 
            name: indexName, 
            config, 
            status: 'exists' 
          });
          console.log(`ℹ️ Index exists: ${indexName} for ${Model.modelName}`);
        }
      } catch (error) {
        console.error(`❌ Error creating index for ${Model.modelName}:`, error.message);
        results.push({ 
          config, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Generate tên index từ config
  generateIndexName(config) {
    const keys = Object.keys(config).filter(key => key !== 'unique' && key !== 'sparse');
    const name = keys.map(key => `${key}_${config[key]}`).join('_');
    
    if (config.unique) return `${name}_unique`;
    if (config.sparse) return `${name}_sparse`;
    
    return name;
  }

  // Xóa index không cần thiết
  async dropUnusedIndexes() {
    console.log('🗑️ Checking for unused indexes...');
    
    const results = [];
    
    for (const [modelName] of this.indexes) {
      try {
        const Model = mongoose.model(modelName);
        const unusedIndexes = await this.findUnusedIndexes(Model);
        
        for (const index of unusedIndexes) {
          try {
            await Model.collection.dropIndex(index.name);
            results.push({ 
              model: modelName, 
              index: index.name, 
              status: 'dropped' 
            });
            console.log(`🗑️ Dropped unused index: ${index.name} from ${modelName}`);
          } catch (error) {
            console.error(`❌ Error dropping index ${index.name}:`, error.message);
          }
        }
      } catch (error) {
        console.error(`❌ Error checking indexes for ${modelName}:`, error.message);
      }
    }

    return results;
  }

  // Tìm indexes không được sử dụng
  async findUnusedIndexes(Model) {
    const allIndexes = await Model.collection.indexes();
    const definedIndexes = this.indexes.get(Model.modelName) || [];
    
    // Lọc ra indexes không được định nghĩa
    return allIndexes.filter(index => {
      if (index.name === '_id_') return false; // Không xóa _id index
      
      const isDefined = definedIndexes.some(defined => {
        const definedKeys = Object.keys(defined).filter(key => 
          key !== 'unique' && key !== 'sparse'
        );
        const indexKeys = Object.keys(index.key);
        
        return definedKeys.length === indexKeys.length &&
               definedKeys.every(key => defined[key] === index.key[key]);
      });
      
      return !isDefined;
    });
  }

  // Get index statistics
  async getIndexStats() {
    const stats = {};
    
    for (const [modelName] of this.indexes) {
      try {
        const Model = mongoose.model(modelName);
        const indexes = await Model.collection.indexes();
        
        stats[modelName] = {
          total: indexes.length,
          indexes: indexes.map(index => ({
            name: index.name,
            keys: index.key,
            size: index.size || 'N/A',
            usage: index.usage || 'N/A'
          }))
        };
      } catch (error) {
        stats[modelName] = { error: error.message };
      }
    }

    return stats;
  }

  // Analyze query performance
  async analyzeQuery(query, modelName) {
    try {
      const Model = mongoose.model(modelName);
      const explain = await Model.find(query).explain('executionStats');
      
      return {
        query: query,
        executionStats: explain.executionStats,
        queryPlanner: explain.queryPlanner,
        suggestions: this.generateQuerySuggestions(explain)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Generate suggestions cho query optimization
  generateQuerySuggestions(explain) {
    const suggestions = [];
    
    if (explain.executionStats.totalDocsExamined > explain.executionStats.nReturned * 10) {
      suggestions.push('Consider adding an index to reduce documents examined');
    }
    
    if (explain.executionStats.executionTimeMillis > 100) {
      suggestions.push('Query is slow, consider optimizing indexes or query structure');
    }
    
    if (explain.queryPlanner.winningPlan.inputStage.stage === 'COLLSCAN') {
      suggestions.push('Query is performing collection scan, add appropriate index');
    }
    
    return suggestions;
  }

  // Monitor index usage
  async monitorIndexUsage() {
    const usage = {};
    
    for (const [modelName] of this.indexes) {
      try {
        const Model = mongoose.model(modelName);
        const indexes = await Model.collection.indexes();
        
        usage[modelName] = indexes.map(index => ({
          name: index.name,
          usage: index.usage || { ops: 0, since: new Date() }
        }));
      } catch (error) {
        usage[modelName] = { error: error.message };
      }
    }

    return usage;
  }
}

// Singleton instance
const databaseOptimizer = new DatabaseOptimizer();

module.exports = databaseOptimizer; 