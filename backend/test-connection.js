const mongoose = require('mongoose');
require('dotenv').config();

// Test both connection URIs
const testConnection = async () => {
  try {
    console.log('🔗 Testing MongoDB connections...');
    
    // Test primary connection (already configured)
    console.log('Testing MONGODB_URI:', process.env.MONGODB_URI);
    
    const conn1 = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MONGODB_URI connected:', conn1.connection.host);
    console.log('📊 Database name:', conn1.connection.name);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));
    
    // Test if our sample data exists
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    const customerCount = await mongoose.connection.db.collection('customers').countDocuments();
    const leadCount = await mongoose.connection.db.collection('leads').countDocuments();
    
    console.log('📊 Data count:');
    console.log('   Users:', userCount);
    console.log('   Customers:', customerCount);
    console.log('   Leads:', leadCount);
    
    if (userCount > 0) {
      const sampleUser = await mongoose.connection.db.collection('users').findOne({});
      console.log('👤 Sample user found:', sampleUser.email, '(role:', sampleUser.role + ')');
    }
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
  
  process.exit(0);
};

testConnection();
