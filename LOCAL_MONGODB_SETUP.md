# Local MongoDB Setup Guide

This guide will help you set up MongoDB locally for the CRM application instead of using MongoDB Atlas.

## Prerequisites

1. **Install MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Download the appropriate version for your operating system
   - Follow the installation instructions for your platform

## Installation Instructions

### Windows
1. Download MongoDB Community Server from the official website
2. Run the installer (.msi file)
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)
5. Optionally install MongoDB Compass (GUI tool)

### macOS
```bash
# Using Homebrew (recommended)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Configuration

### 1. Update Environment Variables
The `.env` file has been updated to use local MongoDB:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/crm_development
```

### 2. Verify MongoDB is Running

#### Windows
- Open Services (services.msc)
- Look for "MongoDB Server" service
- Ensure it's running

#### macOS/Linux
```bash
# Check if MongoDB is running
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Linux

# Connect to MongoDB shell to test
mongosh
```

### 3. Set Up Sample Data
Run the following command to create sample users and data:
```bash
cd backend
npm run setup-local-db
```

This will create:
- Admin user: `admin@crm.local` / `admin123`
- Manager user: `manager@crm.local` / `manager123`
- Sample customers and leads

## Start the Application

1. **Start MongoDB** (if not running as a service):
   ```bash
   # Windows (in MongoDB bin directory)
   mongod

   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

2. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Start the frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

## Database Management

### Using MongoDB Compass (GUI)
1. Install MongoDB Compass (if not already installed)
2. Connect to: `mongodb://127.0.0.1:27017`
3. Browse and manage your `crm_development` database

### Using MongoDB Shell
```bash
# Connect to your database
mongosh mongodb://127.0.0.1:27017/crm_development

# List collections
show collections

# View users
db.users.find().pretty()

# View customers
db.customers.find().pretty()

# View leads
db.leads.find().pretty()
```

## Troubleshooting

### MongoDB Connection Issues
1. **Port already in use**: Check if another MongoDB instance is running
2. **Permission denied**: Ensure MongoDB has proper file permissions
3. **Service not starting**: Check MongoDB logs in `/var/log/mongodb/mongod.log`

### Common Commands
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ismaster')"

# Restart MongoDB service
# Windows: Restart "MongoDB Server" service
# macOS: brew services restart mongodb-community
# Linux: sudo systemctl restart mongod

# View MongoDB logs
# Windows: Check Event Viewer or MongoDB log files
# macOS/Linux: tail -f /usr/local/var/log/mongodb/mongo.log
```

## Migration from Atlas

If you were previously using MongoDB Atlas and want to migrate data:

1. **Export from Atlas**:
   ```bash
   mongodump --uri="your_atlas_connection_string" --out=./backup
   ```

2. **Import to Local**:
   ```bash
   mongorestore --host=127.0.0.1:27017 --db=crm_development ./backup/your_atlas_db_name
   ```

## Performance Tips

1. **Create Indexes** for better performance:
   ```javascript
   // In MongoDB shell
   db.users.createIndex({ email: 1 })
   db.customers.createIndex({ email: 1, assignedTo: 1 })
   db.leads.createIndex({ status: 1, assignedTo: 1 })
   ```

2. **Configure Memory Usage**: Adjust MongoDB's cache size if needed in `mongod.conf`

## Security Notes

- Local MongoDB runs without authentication by default
- For production, enable authentication and SSL
- The sample setup creates pre-verified users for development convenience
- Change default passwords before deploying to production

## Switching Back to Atlas

To switch back to MongoDB Atlas, simply update the `.env` file:
```env
MONGODB_URI=mongodb+srv://admin:Bavesh%401234@cluster0.50i8x.mongodb.net/crm_development?retryWrites=true&w=majority&appName=Cluster0
```

And restart your application.
