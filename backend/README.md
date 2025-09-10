# 🚀 CRM Backend Setup Guide

## Prerequisites

Before running this backend, make sure you have the following installed:

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **MongoDB** (local or cloud)
   - Local: https://www.mongodb.com/try/download/community
   - Cloud: https://www.mongodb.com/atlas (recommended)

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## Installation Steps

### 1. Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install all dependencies
npm install
```

### 2. Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configurations:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # For MongoDB Atlas (recommended):
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm?retryWrites=true&w=majority
   
   # For local MongoDB:
   # MONGODB_URI=mongodb://localhost:27017/crm_development
   
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_EXPIRE=30d
   
   FRONTEND_URL=http://localhost:3000
   ```

### 3. Database Setup

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Whitelist your IP address
6. Get the connection string and update `MONGODB_URI` in `.env`

#### Option B: Local MongoDB

1. Install MongoDB Community Server
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/crm_development`

### 4. Seed Database (Optional)

```bash
# Import sample data
npm run seed
```

### 5. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Leads
- `GET /api/leads/all` - Get all leads
- `GET /api/customers/:customerId/leads` - Get customer leads
- `POST /api/customers/:customerId/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/funnel` - Get sales funnel

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run seed` - Seed database with sample data

## Project Structure

```
backend/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── utils/           # Utility functions
├── tests/           # Test files
├── _data/           # Sample data for seeding
├── server.js        # Main server file
└── package.json     # Dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running (local)
   - Verify connection string in `.env`
   - Check network access (Atlas)

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `npx kill-port 5000`

3. **JWT Token Errors**
   - Make sure JWT_SECRET is set in `.env`
   - Check token format in requests

4. **CORS Errors**
   - Verify FRONTEND_URL in `.env`
   - Check CORS configuration in server.js

### Environment Variables

Make sure all required environment variables are set:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

## API Documentation

Access the API documentation at:
- Health Check: `GET http://localhost:5000/api/health`
- API Info: `GET http://localhost:5000/api`

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **Rate Limiting** - Prevent spam/abuse
- **Input Validation** - Joi validation schemas
- **XSS Protection** - Clean user inputs
- **CORS** - Configured for frontend domain
- **Helmet** - Security headers

## Performance Features

- **MongoDB Indexing** - Optimized queries
- **Compression** - Gzip compression
- **Caching** - Response caching
- **Pagination** - Efficient data loading
- **Aggregation** - Complex queries

## Next Steps

1. Install and run the backend
2. Test the API endpoints
3. Set up the frontend React application
4. Connect frontend to backend API
5. Deploy to production

For deployment guides, see the main README.md file.
