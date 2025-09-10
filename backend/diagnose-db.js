const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Database Connection Diagnostics');
console.log('================================');

// Check environment variables
console.log('📋 Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  const isLocal = uri.includes('127.0.0.1') || uri.includes('localhost');
  console.log('Connection Type:', isLocal ? '🏠 Local MongoDB' : '☁️ MongoDB Atlas');
  console.log('Database:', uri.split('/').pop().split('?')[0]);
}

console.log('\n🔗 Testing Connection...');

// Simple connection test
const connectTest = async () => {
  try {
    // Use simple connection options for testing
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      bufferMaxEntries: 0
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ Connection successful!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    console.log('Ready State:', mongoose.connection.readyState); // 1 = connected
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Collections:', collections.length);
    
    // Test write operation
    const testDoc = await mongoose.connection.db.collection('connection_test').insertOne({
      timestamp: new Date(),
      test: 'database_connection_test'
    });
    console.log('✅ Write test successful');
    
    // Clean up test document
    await mongoose.connection.db.collection('connection_test').deleteOne({ _id: testDoc.insertedId });
    console.log('🧹 Test cleanup complete');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected gracefully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('1. Ensure MongoDB is running:');
      console.log('   - Windows: Start MongoDB service');
      console.log('   - Or start manually: mongod --dbpath <your-data-path>');
      console.log('2. Check if MongoDB is listening on port 27017');
      console.log('3. Verify connection string in .env file');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication Issue:');
      console.log('1. Check username and password in connection string');
      console.log('2. Verify user exists in MongoDB');
      console.log('3. Check user permissions');
    } else if (error.message.includes('serverSelectionTimeoutMS')) {
      console.log('\n🔧 Connection Timeout:');
      console.log('1. Check if MongoDB server is reachable');
      console.log('2. Verify network connectivity');
      console.log('3. Check firewall settings');
    }
    
    process.exit(1);
  }
};

connectTest();
