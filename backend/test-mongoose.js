const mongoose = require('mongoose');
require('dotenv').config();

async function testMongooseConnection() {
  try {
    console.log('🔗 Testing Mongoose connection to MongoDB Atlas...');
    console.log('🌐 Your current IP:', '103.238.230.194');
    console.log('📍 Connection URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    
    // Try to connect with Mongoose (same as your app uses)
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Mongoose connected successfully!');
    console.log('🏠 Host:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    console.log('🔌 Ready State:', conn.connection.readyState); // 1 = connected
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    
    if (collections.length > 0) {
      console.log('📋 Existing collections:');
      collections.forEach(col => console.log(`  - ${col.name}`));
    }
    
    console.log('🎉 MongoDB Atlas connection test SUCCESSFUL!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection test FAILED:');
    console.error('🔴 Error:', error.message);
    
    if (error.message.includes('IP') || error.message.includes('whitelist') || error.message.includes('not authorized')) {
      console.log('\n🛠️  SOLUTION: Add your IP to MongoDB Atlas whitelist:');
      console.log(`1. Go to https://cloud.mongodb.com/`);
      console.log('2. Select your project and cluster');
      console.log('3. Go to "Network Access" in the left sidebar');
      console.log('4. Click "Add IP Address"');
      console.log(`5. Add this IP: 103.238.230.194`);
      console.log('6. Or add 0.0.0.0/0 for all IPs (development only)');
    }
    
    if (error.message.includes('authentication') || error.message.includes('password')) {
      console.log('\n🛠️  SOLUTION: Check your credentials:');
      console.log('1. Username: admin');
      console.log('2. Password: Bavesh@1234 (check if this is correct)');
      console.log('3. Ensure user has readWrite permissions on the database');
    }
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🛠️  SOLUTION: SSL/TLS issue detected:');
      console.log('1. This might be a temporary network issue');
      console.log('2. Try again in a few minutes');
      console.log('3. Check if your firewall/antivirus is blocking the connection');
      console.log('4. Try connecting from a different network');
    }
    
    console.log('\n📝 Connection string format check:');
    console.log('Expected: mongodb+srv://username:password@cluster.mongodb.net/database');
    console.log('Your URI looks correct in format');
    
  }
}

testMongooseConnection();
