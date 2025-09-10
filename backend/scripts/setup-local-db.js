const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');

// Local MongoDB connection
const MONGODB_URI = 'mongodb://127.0.0.1:27017/crm_development';

const setupLocalDatabase = async () => {
  try {
    console.log('🔗 Connecting to local MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to local MongoDB');

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Lead.deleteMany({});

    // Create a verified admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      isEmailVerified: true, // Pre-verified for local development
      isActive: true
    });
    await adminUser.save();
    console.log('✅ Admin user created (Email: admin@example.com, Password: admin123)');

    // Create a verified manager user
    console.log('👤 Creating manager user...');
    const managerUser = new User({
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'manager123',
      role: 'manager',
      isEmailVerified: true, // Pre-verified for local development
      isActive: true
    });
    await managerUser.save();
    console.log('✅ Manager user created (Email: manager@example.com, Password: manager123)');

    // Create sample customers
    console.log('👥 Creating sample customers...');
    const customers = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        company: 'Tech Solutions Inc',
        address: {
          street: '123 Business St',
          city: 'Tech City',
          state: 'TC',
          zipCode: '12345'
        },
        ownerId: adminUser._id,
        status: 'active',
        tags: ['enterprise', 'technology'],
        notes: 'Enterprise client interested in our premium services.'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@marketingpro.com',
        phone: '+1-555-0102',
        company: 'Marketing Pro LLC',
        address: {
          street: '456 Marketing Ave',
          city: 'Brand City',
          state: 'BC',
          zipCode: '67890'
        },
        ownerId: managerUser._id,
        status: 'active',
        tags: ['marketing', 'small-business'],
        notes: 'Small business looking for cost-effective solutions.'
      }
    ];

    const createdCustomers = await Customer.insertMany(customers);
    console.log(`✅ Created ${createdCustomers.length} sample customers`);

    // Create sample leads
    console.log('🎯 Creating sample leads...');
    const leads = [
      {
        customerId: createdCustomers[0]._id,
        title: 'Enterprise Software Solution',
        description: 'Interested in our enterprise package for their growing team.',
        source: 'Website',
        status: 'New',
        priority: 'high',
        value: 50000,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        assignedTo: adminUser._id,
        notes: 'Interested in our enterprise package. Scheduled follow-up call.',
        tags: ['startup', 'enterprise']
      },
      {
        customerId: createdCustomers[1]._id,
        title: 'Marketing Automation Platform',
        description: 'Looking for cost-effective marketing automation solutions.',
        source: 'Referral',
        status: 'Contacted',
        priority: 'medium',
        value: 25000,
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        assignedTo: managerUser._id,
        notes: 'Referred by existing client. Needs demo of our retail solutions.',
        tags: ['retail', 'referral']
      },
      {
        customerId: createdCustomers[0]._id,
        title: 'CRM Integration Project',
        description: 'Comprehensive CRM solution for consulting operations.',
        source: 'Social Media',
        status: 'Qualified',
        priority: 'high',
        value: 75000,
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        assignedTo: adminUser._id,
        notes: 'Consulting firm looking for comprehensive CRM solution.',
        tags: ['consulting', 'high-value']
      }
    ];

    const createdLeads = await Lead.insertMany(leads);
    console.log(`✅ Created ${createdLeads.length} sample leads`);

    console.log('\n🎉 Local database setup complete!');
    console.log('\n👤 Test Users Created:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Manager: manager@example.com / manager123');
    console.log('\n📊 Sample Data:');
    console.log(`   Customers: ${createdCustomers.length}`);
    console.log(`   Leads: ${createdLeads.length}`);
    console.log('\n🚀 You can now start your application and login with the test users!');

  } catch (error) {
    console.error('❌ Error setting up local database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the setup
setupLocalDatabase();
