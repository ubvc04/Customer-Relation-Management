const mongoose = require('mongoose');

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
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('🔴 Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔴 Mongoose connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.log('\n🔧 Database connection failed, but server will continue running for frontend development');
    console.log('💡 You can:');
    console.log('1. Set up MongoDB Atlas (free): https://www.mongodb.com/cloud/atlas');
    console.log('2. Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.log('3. Continue frontend development without backend features');
    console.log('\n📖 See SETUP_GUIDE.md for detailed instructions');
    
    // Don't exit the process - let the server run for frontend development
    console.log('🌐 Server will continue running on http://localhost:5000');
    console.log('⚠️  Database-dependent features will not work until MongoDB is connected');
  }
};

module.exports = connectDB;
