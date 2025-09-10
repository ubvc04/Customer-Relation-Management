# CRM Application - Frontend

A modern, responsive Customer Relationship Management (CRM) application built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion animations
- **TypeScript**: Full type safety and enhanced development experience
- **State Management**: Redux Toolkit for global state management
- **Authentication**: JWT-based authentication with role-based access control
- **Responsive Design**: Mobile-first responsive design
- **Dark Mode**: Full dark mode support
- **Performance**: Optimized with React.lazy and code splitting
- **Real-time Updates**: Ready for WebSocket integration
- **Form Validation**: Comprehensive form validation
- **Error Handling**: Global error boundary and user-friendly error messages

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Forms**: React Hook Form with validation
- **HTTP Client**: Axios
- **Charts**: Chart.js with React-Chartjs-2
- **Date Handling**: date-fns
- **Notifications**: React Toastify
- **Icons**: Heroicons (SVG)

## 📁 Project Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ErrorBoundary/
│   │   ├── Layout/
│   │   └── UI/
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   │   ├── Auth/
│   │   ├── Customers/
│   │   ├── Dashboard/
│   │   ├── Leads/
│   │   ├── Profile/
│   │   └── Settings/
│   ├── services/           # API services
│   ├── store/              # Redux store and slices
│   │   └── slices/
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env                    # Environment variables
├── .env.production         # Production environment variables
├── package.json
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=CRM Application
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🔐 Authentication

The application uses JWT-based authentication with the following features:

- **Login/Register**: Email and password authentication
- **Role-based Access**: Admin, Manager, and Sales Rep roles
- **Protected Routes**: Route guards based on authentication state
- **Token Management**: Automatic token refresh and storage
- **Password Reset**: Forgot password functionality

### Default Test Accounts

```javascript
// Admin Account
Email: admin@crm.com
Password: admin123
Role: admin

// Manager Account
Email: manager@crm.com
Password: manager123
Role: manager

// Sales Rep Account
Email: sales@crm.com
Password: sales123
Role: sales_rep
```

## 🎨 UI Components

### Core Components

- **Layout**: Main application layout with sidebar and header
- **LoadingSpinner**: Various loading indicators
- **ErrorBoundary**: Error handling and display
- **Forms**: Reusable form components with validation

### Design System

- **Colors**: Primary (blue), secondary (purple), success (green), warning (yellow), danger (red)
- **Typography**: Inter font family with responsive sizes
- **Spacing**: Consistent spacing scale (4, 8, 12, 16, 24, 32px)
- **Shadows**: Soft shadows for depth
- **Animations**: Smooth transitions and micro-interactions

## 📊 State Management

### Redux Store Structure

```typescript
interface RootState {
  auth: AuthState;           // User authentication state
  ui: UIState;              // UI state (modals, loading, etc.)
  customers: CustomerState; // Customer data and filters
  leads: LeadState;         // Lead data and pipeline
}
```

### Key Features

- **Persistent State**: Auth state persisted to localStorage
- **Optimistic Updates**: Immediate UI updates with rollback on failure
- **Normalized Data**: Efficient data structure for performance
- **Real-time Sync**: Ready for WebSocket integration

## 🌐 API Integration

### Service Layer

```typescript
// Example API service
const customerService = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};
```

### Error Handling

- **Global Error Interceptor**: Automatic error handling for API calls
- **User-friendly Messages**: Translated error messages
- **Retry Logic**: Automatic retry for failed requests
- **Offline Support**: Graceful handling of network issues

## 🎯 Features Overview

### Dashboard
- **Analytics Overview**: Key metrics and KPIs
- **Recent Activities**: Timeline of recent actions
- **Quick Actions**: Fast access to common tasks
- **Charts & Graphs**: Visual data representation

### Customer Management
- **Customer List**: Searchable and filterable customer list
- **Customer Details**: Comprehensive customer profiles
- **Activity History**: Track all customer interactions
- **Custom Fields**: Extensible customer data

### Lead Management
- **Lead Pipeline**: Kanban-style lead management
- **Lead Scoring**: Automatic lead qualification
- **Activity Tracking**: Complete lead history
- **Conversion Tracking**: Lead to customer conversion

### User Management
- **Profile Settings**: User profile management
- **Role-based Permissions**: Granular access control
- **Activity Logs**: User action tracking
- **Preferences**: Customizable user settings

## 🔧 Configuration

### Environment Variables

```env
# App Configuration
VITE_APP_NAME=CRM Application
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=false

# Development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Tailwind CSS Configuration

The application uses a custom Tailwind configuration with:

- **Custom Colors**: Brand-specific color palette
- **Typography**: Custom font sizes and line heights
- **Animations**: Custom animation classes
- **Components**: Utility-first component classes

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

```env
VITE_API_URL=https://your-api-domain.com/api
VITE_APP_NAME=CRM Application
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

## 🧪 Testing

### Running Tests

```bash
npm run test
```

### Test Structure

```
src/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── utils/
```

## 📱 Progressive Web App (PWA)

The application is configured as a PWA with:

- **Service Worker**: Offline functionality
- **App Manifest**: Install on mobile devices
- **Caching Strategy**: Efficient resource caching
- **Push Notifications**: Real-time notifications

## 🔒 Security

### Security Features

- **XSS Protection**: Input sanitization and validation
- **CSRF Protection**: Token-based request verification
- **Content Security Policy**: Strict CSP headers
- **Secure Headers**: Security-focused HTTP headers

### Best Practices

- **Input Validation**: Client and server-side validation
- **Secure Storage**: Secure token storage
- **HTTPS Only**: Force HTTPS in production
- **Regular Updates**: Keep dependencies updated

## 🌍 Internationalization (i18n)

Ready for internationalization with:

- **React i18next**: Translation framework
- **Language Detection**: Browser language detection
- **RTL Support**: Right-to-left language support
- **Date/Number Formatting**: Locale-specific formatting

## 📈 Performance

### Optimization Features

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: Responsive images
- **Bundle Analysis**: webpack-bundle-analyzer
- **Memoization**: React.memo and useMemo optimization

### Performance Monitoring

- **Web Vitals**: Core Web Vitals tracking
- **Error Tracking**: Error monitoring
- **Analytics**: User behavior tracking
- **Performance Metrics**: Real user monitoring

## 🛠️ Development

### Code Style

- **ESLint**: Code linting with React rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality
- **TypeScript**: Strict type checking

### Development Tools

- **React DevTools**: Component debugging
- **Redux DevTools**: State debugging
- **Vite DevTools**: Build debugging
- **TypeScript Language Server**: IDE support

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- **Follow TypeScript best practices**
- **Write meaningful commit messages**
- **Add tests for new features**
- **Update documentation**
- **Follow the existing code style**

## 📞 Support

For support and questions:

- **Documentation**: Check the docs first
- **Issues**: Create a GitHub issue
- **Discussions**: GitHub Discussions
- **Email**: support@crm-app.com

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 Quick Start Checklist

- [ ] Clone the repository
- [ ] Install Node.js (v16+)
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables (`.env`)
- [ ] Start the backend API
- [ ] Start the development server (`npm run dev`)
- [ ] Open http://localhost:5173
- [ ] Login with test credentials
- [ ] Explore the application!

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
