# 🚀 CRM Application Setup Guide

## Quick Start Checklist

### ✅ Completed Steps
- [x] Backend dependencies installed (`npm install`)
- [x] Frontend dependencies installed (`npm install`)
- [x] Security vulnerabilities resolved (`npm audit fix --force`)

### 📋 Next Steps

## 1. MongoDB Atlas Setup (Cloud Database)

Since you don't have MongoDB installed locally, let's use MongoDB Atlas (cloud):

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and create an account
3. Create a new project (name it "CRM Application")

### Step 2: Create a Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select a cloud provider and region (choose closest to you)
4. Name your cluster (e.g., "crm-cluster")
5. Click "Create"

### Step 3: Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (save these!)
5. Set privilege to "Atlas admin" or "Read and write to any database"
6. Click "Add User"

### Step 4: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0) for development
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

## 2. Update Environment Configuration

Replace the MongoDB URI in your `.env` file:

```bash
# In backend/.env file, replace:
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/crm_development?retryWrites=true&w=majority
```

**Replace:**
- `YOUR_USERNAME` with your database username
- `YOUR_PASSWORD` with your database password  
- `YOUR_CLUSTER` with your cluster name

## 3. Start the Application

### Terminal 1 - Start Backend Server
```powershell
cd backend
npm run dev
```

Expected output:
```
[nodemon] starting `node server.js`
🚀 Server running on port 5000
📊 MongoDB connected successfully
```

### Terminal 2 - Start Frontend Development Server
```powershell
cd frontend  
npm run dev
```

Expected output:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 4. Test the Application

1. Open your browser to `http://localhost:5173`
2. You should see the CRM login page
3. Use the seeded admin account:
   - **Email:** admin@crm.com
   - **Password:** Admin123!

## 5. Development Workflow

### Backend Development
- API runs on `http://localhost:5000`
- MongoDB Atlas for database
- Automatic restart with nodemon
- Logs show in terminal

### Frontend Development  
- React app runs on `http://localhost:5173`
- Hot reload enabled
- Proxy API calls to backend
- TypeScript compilation

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: MongoNetworkError: failed to connect to server
```
**Solution:** 
- Check your MongoDB Atlas connection string
- Verify network access allows your IP
- Check username/password in connection string

**2. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```powershell
# Kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F
```

**3. CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Backend CORS is configured for `http://localhost:3000` and `http://localhost:5173`

**4. TypeScript Errors**
```
Cannot find module or its corresponding type declarations
```
**Solution:** All dependencies are installed, restart TypeScript server in VS Code

## 📁 Project Structure

```
CRM/
├── backend/               # Node.js/Express API
│   ├── models/           # MongoDB schemas
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth, validation, security
│   ├── routes/          # API endpoints
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── frontend/             # React/TypeScript app
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route components
│   │   ├── store/       # Redux state management
│   │   ├── services/    # API calls
│   │   ├── hooks/       # Custom React hooks
│   │   └── utils/       # Helper functions
│   └── index.html       # Entry HTML
└── README.md            # Project documentation
```

## 🎯 Next Development Steps

After setup is complete:

1. **Test Authentication Flow**
   - Login with admin credentials
   - Test registration
   - Verify JWT tokens

2. **Implement Remaining Pages**
   - Customer management
   - Lead pipeline
   - Settings page
   - User profile

3. **Add Advanced Features**
   - Email notifications
   - File uploads
   - Advanced filtering
   - Export functionality

4. **Deploy to Production**
   - Frontend: Vercel/Netlify
   - Backend: Railway/Render
   - Database: MongoDB Atlas (production cluster)

## 🚀 Ready to Code!

Your CRM application foundation is complete. Follow the steps above to get it running, then start building amazing features!
