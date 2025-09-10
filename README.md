# 🚀 Mini CRM Application

A modern, full-stack CRM application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring a beautiful UI with animations and robust functionality.

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Secure registration and login with JWT
- 👥 **Customer Management** - Complete CRUD operations for customers
- 📊 **Lead Management** - Track leads/opportunities for each customer
- 📈 **Dashboard & Reporting** - Visual insights and analytics
- 🔍 **Search & Pagination** - Efficient data browsing
- 📱 **Responsive Design** - Works on desktop and mobile

### Advanced Features
- 🎨 **Modern UI** - Clean, intuitive interface with animations
- 🔒 **Role-based Access** - Admin and User roles
- ✅ **Form Validation** - Client and server-side validation
- 🎯 **Real-time Updates** - Live data synchronization
- 🌙 **Dark/Light Mode** - Theme switching capability

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (MongoDB Atlas)
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Joi** - Input validation
- **CORS** - Cross-origin resource sharing

### Frontend
- **React.js** - Frontend framework
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Chart.js** - Data visualization
- **React Hook Form** - Form handling

## 📁 Project Structure

```
CRM/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── config/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── hooks/
│   │   └── App.js
│   └── public/
└── docs/
    ├── api-documentation.md
    └── database-schema.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CRM
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String,
  role: String (enum: ['user', 'admin']),
  createdAt: Date,
  updatedAt: Date
}
```

### Customers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  company: String,
  ownerId: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### Leads Collection
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: 'Customer'),
  title: String,
  description: String,
  status: String (enum: ['New', 'Contacted', 'Converted', 'Lost']),
  value: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Customers
- `GET /api/customers` - Get all customers (with pagination & search)
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Leads
- `GET /api/customers/:customerId/leads` - Get customer leads
- `POST /api/customers/:customerId/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Heroku/Railway)
1. Build the application
2. Configure environment variables
3. Deploy to your preferred platform

### Frontend (Vercel/Netlify)
1. Build the React app
2. Configure environment variables
3. Deploy to your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
