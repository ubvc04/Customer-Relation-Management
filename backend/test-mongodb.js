const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Use the connection string from your .env file
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false
});

async function testConnection() {
  try {
    console.log('🔗 Testing MongoDB Atlas connection...');
    console.log('📍 Connection URI:', uri.replace(/:[^:]*@/, ':****@')); // Hide password
    
    // Connect the client to the server
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    // Test creating/accessing the CRM database
    const db = client.db("crm_development");
    const collections = await db.listCollections().toArray();
    
    console.log("📊 Database: crm_development");
    console.log("📁 Collections found:", collections.length);
    
    if (collections.length > 0) {
      console.log("📋 Existing collections:");
      collections.forEach(col => console.log(`  - ${col.name}`));
    } else {
      console.log("📝 No collections found (database is empty - this is normal for new setup)");
    }
    
    console.log("🎉 MongoDB Atlas connection test SUCCESSFUL!");
    
  } catch (error) {
    console.error("❌ MongoDB connection test FAILED:");
    console.error("🔴 Error:", error.message);
    
    if (error.message.includes('IP')) {
      console.log("\n🛠️  SOLUTION: Add your IP address to MongoDB Atlas whitelist:");
      console.log("1. Go to https://cloud.mongodb.com/");
      console.log("2. Navigate to Network Access");
      console.log("3. Add your current IP address");
      console.log("4. Or add 0.0.0.0/0 for all IPs (development only)");
    }
    
    if (error.message.includes('authentication')) {
      console.log("\n🛠️  SOLUTION: Check your username/password:");
      console.log("1. Verify username: admin");
      console.log("2. Verify password in connection string");
      console.log("3. Ensure user has read/write permissions");
    }
    
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log("🔌 Connection closed");
  }
}

// Run the test
testConnection().catch(console.dir);
