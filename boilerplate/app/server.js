const express = require('express');
const mysql = require('mysql2/promise');
const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let mysqlConnection = null;
let redisClient = null;

async function connectMySQL() {
  try {
    mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'boilerplate-mysql',
      user: process.env.MYSQL_USER || 'user',
      password: process.env.MYSQL_PASSWORD || 'userpassword',
      database: process.env.MYSQL_DATABASE || 'boilerplate_db'
    });
    console.log('✅ MySQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
}

async function connectRedis() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'boilerplate-redis',
        port: process.env.REDIS_PORT || 6379
      },
      password: process.env.REDIS_PASSWORD || 'redispassword'
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));

    await redisClient.connect();
    console.log('✅ Redis connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
}

app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      app: true,
      mysql: false,
      redis: false
    }
  };

  try {
    if (mysqlConnection) {
      await mysqlConnection.ping();
      health.services.mysql = true;
    }
  } catch (error) {
    health.services.mysql = false;
  }

  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      health.services.redis = true;
    }
  } catch (error) {
    health.services.redis = false;
  }

  const allHealthy = Object.values(health.services).every(status => status === true);
  health.status = allHealthy ? 'healthy' : 'degraded';

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/', (req, res) => {
  res.json({
    message: 'Docker Boilerplate Application',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    endpoints: {
      health: '/health',
      info: '/info'
    }
  });
});

app.get('/info', async (req, res) => {
  const info = {
    app: {
      name: 'boilerplate-app',
      version: '1.0.0',
      node: process.version,
      environment: process.env.NODE_ENV || 'production',
      uptime: process.uptime()
    },
    connections: {
      mysql: mysqlConnection ? 'connected' : 'disconnected',
      redis: redisClient && redisClient.isOpen ? 'connected' : 'disconnected'
    },
    memory: process.memoryUsage()
  };

  res.json(info);
});

async function initializeConnections() {
  console.log('🚀 Initializing connections...');
  await connectMySQL();
  await connectRedis();
}

async function gracefulShutdown() {
  console.log('\n📛 Shutting down gracefully...');

  if (mysqlConnection) {
    await mysqlConnection.end();
    console.log('MySQL connection closed');
  }

  if (redisClient) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }

  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);

  await initializeConnections();
});