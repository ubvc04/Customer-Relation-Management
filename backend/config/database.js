const mongoose = require('mongoose');

// Enhanced database configuration for production
const connectDB = async () => {
  try {
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not configured in environment variables');
      console.log('📝 Please update your .env file with a valid MongoDB connection string');
      console.log('🌐 For MongoDB Atlas: https://www.mongodb.com/cloud/atlas');
      console.log('💻 For local MongoDB: mongodb://localhost:27017/crm_development');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    
    // Different connection options for local vs cloud MongoDB
    const isLocalDB = process.env.MONGODB_URI.includes('127.0.0.1') || process.env.MONGODB_URI.includes('localhost');
    
    const connectionOptions = {
      // Connection management
      maxPoolSize: 100, // Maximum number of connections in the pool
      minPoolSize: 5,   // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: isLocalDB ? 5000 : 10000, // Faster timeout for local
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      
      // Buffering and retries
      bufferCommands: false, // Disable buffering
      retryWrites: true,
      
      // Heartbeat
      heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
      
      // Performance optimization
      compressors: ['zlib'], // Enable compression
      
      // Write concern for production
      writeConcern: {
        w: 'majority',
        j: true, // Wait for journal acknowledgment
        wtimeout: 10000
      },
      
      // Read preference
      readPreference: 'primary',
      readConcern: { level: 'local' }
    };

    // Add serverApi only for MongoDB Atlas (cloud)
    if (!isLocalDB) {
      connectionOptions.serverApi = {
        version: '1',
        strict: true,
        deprecationErrors: true,
      };
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔧 Connection Pool: Max ${connectionOptions.maxPoolSize} connections`);
    
    // Enhanced connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('🔴 Mongoose connection error:', err.message);
      // Implement error recovery logic
      if (err.name === 'MongoNetworkError') {
        console.log('🔄 Attempting to reconnect in 5 seconds...');
        setTimeout(() => {
          mongoose.connect(process.env.MONGODB_URI, connectionOptions);
        }, 5000);
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 Mongoose disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🟢 Mongoose reconnected to MongoDB');
    });

    // Production monitoring
    if (process.env.NODE_ENV === 'production') {
      // Monitor connection pool
      setInterval(() => {
        const state = mongoose.connection.readyState;
        const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        console.log(`📊 MongoDB Status: ${stateNames[state]} | Active connections: ${mongoose.connections.length}`);
      }, 60000); // Log every minute
    }

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n👋 ${signal} received. Shutting down gracefully...`);
      try {
        await mongoose.connection.close();
        console.log('🔴 Mongoose connection closed due to application termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle application termination signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

    return conn;

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    
    const isLocalDB = process.env.MONGODB_URI?.includes('127.0.0.1') || process.env.MONGODB_URI?.includes('localhost');
    
    if (isLocalDB) {
      console.log('\n🔧 Local MongoDB connection failed!');
      console.log('💡 To fix this:');
      console.log('1. Install MongoDB Community Server: https://www.mongodb.com/try/download/community');
      console.log('2. Start MongoDB service:');
      console.log('   - Windows: Open Services and start "MongoDB Server"');
      console.log('   - macOS/Linux: Run "sudo systemctl start mongod" or "brew services start mongodb-community"');
      console.log('3. Verify MongoDB is running on port 27017');
      console.log('4. Install MongoDB Compass for GUI management');
      console.log('5. Connect to: mongodb://127.0.0.1:27017');
    } else {
      console.log('\n🔧 Database connection failed, but server will continue running for frontend development');
      console.log('💡 You can:');
      console.log('1. Set up MongoDB Atlas (free): https://www.mongodb.com/cloud/atlas');
      console.log('2. Install MongoDB locally: https://www.mongodb.com/try/download/community');
      console.log('3. Continue frontend development without backend features');
    }
    
    console.log('\n📖 See SETUP_GUIDE.md for detailed instructions');
    
    // In production, exit on database connection failure
    if (process.env.NODE_ENV === 'production') {
      console.log('🚨 Production mode: Exiting due to database connection failure');
      process.exit(1);
    }
    
    // Don't exit the process in development - let the server run for frontend development
    console.log('🌐 Server will continue running on http://localhost:5000');
    console.log('⚠️  Database-dependent features will not work until MongoDB is connected');
  }
};

// Database health check function
const checkDatabaseHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

// Database performance metrics
const getDatabaseMetrics = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      storageSize: stats.storageSize,
      documents: stats.objects,
      averageObjectSize: stats.avgObjSize,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { error: error.message, timestamp: new Date().toISOString() };
  }
};

module.exports = { 
  connectDB, 
  checkDatabaseHealth, 
  getDatabaseMetrics 
};
