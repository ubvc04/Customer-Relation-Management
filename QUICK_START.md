# Quick Start Instructions

## Option 1: Use MongoDB Atlas (Cloud) - Recommended

1. **Quick Setup:** Go to https://www.mongodb.com/cloud/atlas
2. **Create Free Account** and follow the setup wizard
3. **Get Connection String** and update your `.env` file
4. **Start the servers**

## Option 2: Use MongoDB Community Server (Local)

Download and install MongoDB Community Server:
1. Go to https://www.mongodb.com/try/download/community
2. Download MongoDB Community Server for Windows
3. Install with default settings
4. MongoDB will run as a service automatically

## Option 3: Use Docker (If you have Docker installed)

```powershell
docker run --name mongodb -p 27017:27017 -d mongo:latest
```

## Current Status

Your applications are ready to run! Choose one of the options above, then:

### Start Backend (Terminal 1)
```powershell
cd backend
npm run dev
```

### Start Frontend (Terminal 2) 
```powershell
cd frontend
npm run dev
```

## Test Login Credentials

Once running, use these credentials to test:
- **Email:** admin@crm.com  
- **Password:** Admin123!

The backend will automatically create sample data on first connection.
