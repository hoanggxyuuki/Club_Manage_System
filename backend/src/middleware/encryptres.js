const { encrypt } = require('../utils/encrypt');

function encryptResponse(req, res, next) {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (res.statusCode >= 400) {
      return originalJson.call(this, data);
    }

    try {
      
      const encryptedData = encrypt(data);
      
      
      const decoyResponse = generateDecoyResponse(encryptedData);
      
      return originalJson.call(this, decoyResponse);
    } catch (error) {
      console.error('Encryption error:', error);
      res.status(500);
      return originalJson.call(this, { 
        error: 'Server encryption error',
        message: 'Failed to encrypt response data'
      });
    }
  };
  
  next();
}

/**
 * Generates a response with decoy fields to obfuscate the real encrypted data
 * @param {string} realEncryptedData - The actual encrypted data string
 * @returns {Object} An object containing both real and decoy data
 */
function generateDecoyResponse(realEncryptedData) {
  
  const decoyFieldCount = Math.floor(Math.random() * 13) + 8;
  
  
  const possibleFieldNames = [
    'meta', 'payload', 'content', 'package', 'bundle', 
    'response', 'body', 'message', 'blob', 'chunk', 
    'fragment', 'segment', 'section', 'part', 'element',
    'container', 'wrapper', 'envelope', 'carrier', 'vessel',
    'transport', 'delivery', 'packet', 'frame', 'block',
    'unit', 'module', 'component', 'assembly', 'structure',
    'params', 'cache', 'metrics', 'stats', 'analytics',
    'resource', 'object', 'entity', 'item', 'record',
    'collection', 'dataset', 'stream', 'channel', 'pipeline',
    'context', 'scope', 'environment', 'configuration', 'settings'
  ];
  
  
  const result = {};
  
  
  result.data = realEncryptedData;
  result.encrypted = true;
  
  
  const timeFieldName = ['timestamp', 'time', 'created', 'generated', 'processed'][Math.floor(Math.random() * 5)];
  result[timeFieldName] = Date.now() - Math.floor(Math.random() * 1000);
  
  
  const sessionFieldName = ['sid', 'session', 'token', 'identifier', 'trace'][Math.floor(Math.random() * 5)];
  result[sessionFieldName] = generateComplexToken(64 + Math.floor(Math.random() * 32));
  
  
  result.auth = {
    level: ['basic', 'standard', 'premium', 'enterprise'][Math.floor(Math.random() * 4)],
    expires: Date.now() + Math.floor(Math.random() * 86400000),
    refresh: Math.random() > 0.5,
    passwordPolicy: {
      lastChanged: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString(),
      expiresIn: Math.floor(Math.random() * 90) + 30 + ' days',
      complexity: ['medium', 'high', 'very-high'][Math.floor(Math.random() * 3)],
      requiresReset: Math.random() > 0.9,
      requirements: {
        minLength: 8 + Math.floor(Math.random() * 8),
        requireUppercase: Math.random() > 0.2,
        requireLowercase: true,
        requireNumbers: Math.random() > 0.1,
        requireSpecial: Math.random() > 0.3,
        prohibitReuse: Math.floor(Math.random() * 10) + 5,
      },
      historySize: Math.floor(Math.random() * 10) + 5,
      lockoutThreshold: Math.floor(Math.random() * 5) + 3
    },
    mfa: {
      enabled: Math.random() > 0.6,
      method: ['app', 'sms', 'email', 'hardware-token'][Math.floor(Math.random() * 4)],
      lastVerified: new Date(Date.now() - Math.floor(Math.random() * 10 * 86400000)).toISOString(),
      recoveryCodesRemaining: Math.floor(Math.random() * 10),
      providers: ['google-authenticator', 'authy', 'duo', 'okta'][Math.floor(Math.random() * 4)],
      backupPhone: Math.random() > 0.5 ? `+1${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}` : null
    },
    jwt: {
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${generateBase64String(Math.floor(Math.random() * 500) + 300)}.${generateBase64String(43)}`,
      issued: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      expiresAt: new Date(Date.now() + Math.floor(Math.random() * 3600000) + 3600000).toISOString()
    },
    permissions: generateRandomPermissions()
  };
  
  
  result.user = {
    id: `usr_${generateComplexToken(24)}`,
    uuid: generateUUID(),
    role: ['user', 'admin', 'manager', 'guest', 'moderator', 'support', 'developer'][Math.floor(Math.random() * 7)],
    plan: ['free', 'basic', 'pro', 'enterprise', 'custom'][Math.floor(Math.random() * 5)],
    credentials: {
      hash: `$2b$12$${generateComplexToken(53)}`,
      salt: generateComplexToken(24),
      iterations: 10000 + Math.floor(Math.random() * 5000),
      keylen: 64,
      digest: 'sha512',
      hashingAlgorithm: ['bcrypt', 'argon2id', 'pbkdf2'][Math.floor(Math.random() * 3)]
    },
    profile: {
      firstName: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa'][Math.floor(Math.random() * 8)],
      lastName: ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson'][Math.floor(Math.random() * 8)],
      email: `${['user', 'john', 'jane', 'admin', 'contact', 'support', 'info'][Math.floor(Math.random() * 7)]}@${['example.com', 'test.org', 'domain.net', 'company.io'][Math.floor(Math.random() * 4)]}`,
      phone: `+1${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`,
      address: {
        street: `${Math.floor(Math.random() * 9999) + 1} ${['Main', 'Oak', 'Maple', 'Washington', 'Park'][Math.floor(Math.random() * 5)]} ${['St', 'Ave', 'Blvd', 'Rd', 'Ln'][Math.floor(Math.random() * 5)]}`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'][Math.floor(Math.random() * 6)],
        state: ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'][Math.floor(Math.random() * 10)],
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        country: 'US'
      },
      preferences: {
        language: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN'][Math.floor(Math.random() * 5)],
        theme: ['light', 'dark', 'system', 'high-contrast'][Math.floor(Math.random() * 4)],
        notifications: {
          email: Math.random() > 0.3,
          push: Math.random() > 0.5,
          sms: Math.random() > 0.7
        }
      }
    },
    status: ['active', 'pending', 'suspended', 'deactivated', 'locked'][Math.floor(Math.random() * 5)],
    activity: {
      lastLogin: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString(),
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      ipAddress: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      userAgent: generateRealisticUserAgent(),
      loginAttempts: Math.floor(Math.random() * 5),
      devices: Math.floor(Math.random() * 4) + 1
    }
  };
  
  
  result.meta = {
    server: `srv-${generateAlphaNumeric(8)}-${generateAlphaNumeric(4)}`,
    region: ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-southeast-1', 'sa-east-1', 'ca-central-1'][Math.floor(Math.random() * 6)],
    route: `/api/v${Math.floor(Math.random() * 3) + 1}/${['users', 'data', 'records', 'items', 'transactions', 'reports', 'analytics'][Math.floor(Math.random() * 7)]}/${generateAlphaNumeric(8)}`,
    environment: ['production', 'staging', 'development', 'testing', 'qa'][Math.floor(Math.random() * 5)],
    version: `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 30)}.${Math.floor(Math.random() * 100)}`,
    buildNumber: `build-${Math.floor(Math.random() * 10000)}`,
    processId: Math.floor(Math.random() * 100000),
    requestId: `req-${generateUUID()}`
  };
  
  
  result.api = {
    version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
    endpoint: `/v${Math.floor(Math.random() * 3) + 1}/${['auth', 'data', 'users', 'admin'][Math.floor(Math.random() * 4)]}`,
    rateLimit: {
      limit: [100, 500, 1000, 5000][Math.floor(Math.random() * 4)],
      remaining: Math.floor(Math.random() * 100),
      reset: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 3600)
    },
    metrics: {
      responseTime: Math.floor(Math.random() * 200),
      cpuTime: Math.floor(Math.random() * 100),
      dbQueries: Math.floor(Math.random() * 10)
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': `req-${generateUUID()}`,
      'X-RateLimit-Limit': [100, 500, 1000, 5000][Math.floor(Math.random() * 4)],
      'X-RateLimit-Remaining': Math.floor(Math.random() * 100),
      'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 3600)
    },
    queryParams: {
      search: generateAlphaNumeric(10),
      filter: ['active', 'pending', 'suspended'][Math.floor(Math.random() * 3)],
      sort: ['asc', 'desc'][Math.floor(Math.random() * 2)],
      page: Math.floor(Math.random() * 10) + 1,
      limit: [10, 25, 50, 100][Math.floor(Math.random() * 4)]
    }
  };
  
  
  result.license = {
    type: ['trial', 'standard', 'professional', 'enterprise'][Math.floor(Math.random() * 4)],
    expiresAt: new Date(Date.now() + Math.floor(Math.random() * 365 * 86400000)).toISOString(),
    features: {
      advanced: Math.random() > 0.5,
      premium: Math.random() > 0.7,
      customization: Math.random() > 0.6,
      support: Math.random() > 0.8,
      analytics: Math.random() > 0.4,
      integrations: Math.random() > 0.5
    },
    seats: Math.floor(Math.random() * 50) + 1,
    usage: {
      current: Math.floor(Math.random() * 50),
      max: Math.floor(Math.random() * 100) + 50,
      overage: Math.random() > 0.5
    }
  };
  
  
  result.keys = {
    public: generateRealisticPublicKey(),
    keyId: `kid-${generateAlphaNumeric(16)}`,
    algorithm: ['RS256', 'ES384', 'PS512', 'HS512', 'EdDSA'][Math.floor(Math.random() * 5)],
    created: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString(),
    expires: new Date(Date.now() + Math.floor(Math.random() * 365 * 86400000)).toISOString(),
    keyUse: ['sig', 'enc'][Math.floor(Math.random() * 2)],
    x5t: generateBase64String(20),
    'x5t#S256': generateBase64String(32)
  };
  
  
  result.database = {
    instance: `db-${Math.floor(Math.random() * 100)}`,
    cluster: `cl-${Math.random().toString(36).substring(2, 8)}`,
    reads: Math.floor(Math.random() * 1000),
    writes: Math.floor(Math.random() * 500),
    queryTime: Math.random() * 100,
    shardId: Math.floor(Math.random() * 10),
    replication: {
      status: ['active', 'syncing', 'error'][Math.floor(Math.random() * 3)],
      lag: Math.floor(Math.random() * 100),
      nodes: Math.floor(Math.random() * 10) + 1
    },
    backup: {
      lastBackup: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString(),
      nextBackup: new Date(Date.now() + Math.floor(Math.random() * 7 * 86400000)).toISOString(),
      status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)]
    }
  };
  
  
  for (let i = 0; i < decoyFieldCount; i++) {
    
    let fieldName;
    do {
      fieldName = possibleFieldNames[Math.floor(Math.random() * possibleFieldNames.length)];
    } while (result[fieldName]);
    
    
    const valueType = Math.floor(Math.random() * 5);
    
    if (valueType === 0) {
      
      result[fieldName] = Math.random().toString(36).substring(2, 10 + Math.floor(Math.random() * 10));
    } else if (valueType === 1) {
      
      result[fieldName] = Math.floor(Math.random() * 10000);
    } else if (valueType === 2) {
      
      result[fieldName] = {
        id: Math.floor(Math.random() * 1000),
        value: Math.random().toString(36).substring(2, 10),
        active: Math.random() > 0.5
      };
    } else if (valueType === 3) {
      
      result[fieldName] = {
        id: Math.floor(Math.random() * 1000),
        created: new Date().toISOString(),
        properties: {
          type: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
          count: Math.floor(Math.random() * 100),
          verified: Math.random() > 0.5
        },
        metadata: {
          version: `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
          source: ['internal', 'external', 'third-party'][Math.floor(Math.random() * 3)]
        }
      };
    } else {
      
      const arrayLength = Math.floor(Math.random() * 5) + 1;
      const array = [];
      for (let j = 0; j < arrayLength; j++) {
        array.push({
          idx: j,
          val: Math.random().toString(36).substring(2, 7),
          seq: Math.floor(Math.random() * 100)
        });
      }
      result[fieldName] = array;
    }
  }
  
  
  if (Math.random() > 0.7) {
    result.diagnostics = {
      status: 'ok',
      latency: Math.floor(Math.random() * 200),
      warnings: Math.random() > 0.8 ? ['Non-critical issue detected'] : [],
      debug: false
    };
  }
  
  
  result.security = {
    algorithm: ['AES-256', 'RSA', 'Blowfish', 'Twofish'][Math.floor(Math.random() * 4)],
    keyId: `key-${Math.floor(Math.random() * 10000)}`,
    fingerprint: Array(40).fill(0).map(() => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
    keyStrength: Math.floor(Math.random() * 256) + 128,
    keyLength: Math.floor(Math.random() * 256) + 128,
    keyUsage: ['encryption', 'decryption', 'signing', 'verification'][Math.floor(Math.random() * 4)],
    keyFormat: ['PEM', 'DER', 'JWK'][Math.floor(Math.random() * 3)]
  };
  
  
  result.network = {
    cdn: ['cloudflare', 'akamai', 'fastly', 'aws-cloudfront'][Math.floor(Math.random() * 4)],
    ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    geo: {
      country: ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA'][Math.floor(Math.random() * 7)],
      region: `r-${Math.floor(Math.random() * 100)}`,
      datacenter: `dc-${Math.floor(Math.random() * 20) + 1}`
    },
    latency: Math.floor(Math.random() * 150),
    bandwidth: Math.floor(Math.random() * 1000) + 100,
    packetLoss: Math.random() * 0.1,
    jitter: Math.random() * 50,
    connectionType: ['fiber', 'dsl', 'cable', 'satellite'][Math.floor(Math.random() * 4)]
  };
  
  return result;
}



/**
 * Generates a complex random token of specified length
 */
function generateComplexToken(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return result;
}

/**
 * Generates a standard UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generates base64-encoded string of specific length
 */
function generateBase64String(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return result;
}

/**
 * Generates alphanumeric string of specific length
 */
function generateAlphaNumeric(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return result;
}

/**
 * Generates a realistic-looking PEM public key
 */
function generateRealisticPublicKey() {
  const header = '-----BEGIN PUBLIC KEY-----\n';
  const footer = '\n-----END PUBLIC KEY-----';
  
  
  const numLines = Math.floor(Math.random() * 10) + 5;
  let keyBody = '';
  
  for (let i = 0; i < numLines; i++) {
    keyBody += generateBase64String(64) + '\n';
  }
  
  return header + keyBody + footer;
}

/**
 * Generates a realistic-looking set of permissions
 */
function generateRandomPermissions() {
  const possiblePermissions = [
    'read:users', 'write:users', 'delete:users', 
    'read:data', 'write:data', 'delete:data',
    'admin:access', 'admin:settings', 'admin:users',
    'api:access', 'api:write', 'api:admin',
    'billing:read', 'billing:write', 'reports:access',
    'files:upload', 'files:download', 'notifications:manage'
  ];
  
  const numPermissions = Math.floor(Math.random() * 10) + 3;
  const permissions = [];
  
  for (let i = 0; i < numPermissions; i++) {
    const perm = possiblePermissions[Math.floor(Math.random() * possiblePermissions.length)];
    if (!permissions.includes(perm)) {
      permissions.push(perm);
    }
  }
  
  return permissions;
}

/**
 * Generates a realistic-looking User-Agent string
 */
function generateRealisticUserAgent() {
  const browsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  ];
  
  return browsers[Math.floor(Math.random() * browsers.length)];
}

module.exports = encryptResponse;