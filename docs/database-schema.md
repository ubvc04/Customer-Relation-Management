# 📊 Database Schema - Mini CRM Application

## Overview
This document outlines the database schema for the Mini CRM Application using MongoDB. The schema is designed to be flexible, scalable, and efficient for CRM operations.

## Collections

### 1. Users Collection

**Purpose**: Store user authentication and profile information

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "John Doe",
  email: "john.doe@example.com",
  passwordHash: "$2b$10$...", // bcrypt hashed password
  role: "user", // enum: ['user', 'admin']
  avatar: "https://example.com/avatar.jpg", // optional
  isActive: true,
  lastLogin: ISODate("2025-09-09T10:30:00.000Z"),
  createdAt: ISODate("2025-09-01T09:00:00.000Z"),
  updatedAt: ISODate("2025-09-09T10:30:00.000Z")
}
```

**Indexes**:
- `email` (unique)
- `role`
- `isActive`

**Validation Rules**:
- `name`: required, min 2 chars, max 50 chars
- `email`: required, valid email format, unique
- `passwordHash`: required
- `role`: required, enum ['user', 'admin']

### 2. Customers Collection

**Purpose**: Store customer information and contact details

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  name: "Acme Corporation",
  email: "contact@acme.com",
  phone: "+1-555-123-4567",
  company: "Acme Corporation",
  address: {
    street: "123 Business Ave",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  },
  industry: "Technology",
  website: "https://acme.com",
  ownerId: ObjectId("507f1f77bcf86cd799439011"), // reference to Users
  tags: ["enterprise", "high-priority"],
  notes: "Important client with high volume potential",
  status: "active", // enum: ['active', 'inactive', 'prospect']
  totalLeadValue: 150000, // calculated field
  leadsCount: 5, // calculated field
  createdAt: ISODate("2025-09-01T09:00:00.000Z"),
  updatedAt: ISODate("2025-09-09T10:30:00.000Z")
}
```

**Indexes**:
- `ownerId`
- `email` (unique)
- `name` (text index for search)
- `company` (text index for search)
- `status`
- `industry`

**Validation Rules**:
- `name`: required, min 2 chars, max 100 chars
- `email`: required, valid email format, unique
- `phone`: optional, valid phone format
- `ownerId`: required, valid ObjectId

### 3. Leads Collection

**Purpose**: Store lead/opportunity information for customers

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  customerId: ObjectId("507f1f77bcf86cd799439012"), // reference to Customers
  title: "Website Redesign Project",
  description: "Complete website overhaul with modern design and functionality",
  status: "Contacted", // enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost']
  value: 50000,
  currency: "USD",
  probability: 75, // percentage (0-100)
  expectedCloseDate: ISODate("2025-12-31T00:00:00.000Z"),
  actualCloseDate: null, // set when status becomes 'Converted' or 'Lost'
  source: "Website", // enum: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Other']
  priority: "high", // enum: ['low', 'medium', 'high']
  assignedTo: ObjectId("507f1f77bcf86cd799439011"), // reference to Users
  activities: [
    {
      type: "call", // enum: ['call', 'email', 'meeting', 'note']
      description: "Initial discovery call",
      date: ISODate("2025-09-05T14:00:00.000Z"),
      userId: ObjectId("507f1f77bcf86cd799439011")
    }
  ],
  tags: ["web-development", "high-value"],
  nextFollowUp: ISODate("2025-09-15T09:00:00.000Z"),
  createdAt: ISODate("2025-09-01T09:00:00.000Z"),
  updatedAt: ISODate("2025-09-09T10:30:00.000Z")
}
```

**Indexes**:
- `customerId`
- `assignedTo`
- `status`
- `priority`
- `expectedCloseDate`
- `source`

**Validation Rules**:
- `customerId`: required, valid ObjectId
- `title`: required, min 3 chars, max 200 chars
- `status`: required, enum ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost']
- `value`: required, positive number
- `probability`: 0-100

### 4. Activities Collection (Optional Enhancement)

**Purpose**: Track all customer/lead interactions and activities

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  type: "email", // enum: ['call', 'email', 'meeting', 'note', 'task']
  title: "Follow-up email sent",
  description: "Sent proposal details and timeline",
  customerId: ObjectId("507f1f77bcf86cd799439012"),
  leadId: ObjectId("507f1f77bcf86cd799439013"), // optional
  userId: ObjectId("507f1f77bcf86cd799439011"),
  dueDate: ISODate("2025-09-15T09:00:00.000Z"), // for tasks
  completed: false,
  createdAt: ISODate("2025-09-09T10:30:00.000Z"),
  updatedAt: ISODate("2025-09-09T10:30:00.000Z")
}
```

## Relationships

```
Users (1) -----> (N) Customers
  |                   |
  |                   |
  +-----> (N) Leads <-+
  |                   |
  |                   |
  +-----> (N) Activities
```

## Data Flow & Business Rules

### User Management
- Users can have roles: 'user' or 'admin'
- Admins can manage all customers and leads
- Users can only manage their assigned customers and leads

### Customer Management
- Each customer is owned by a user (ownerId)
- Customers can have multiple leads
- Customer totalLeadValue and leadsCount are calculated fields

### Lead Management
- Each lead belongs to one customer
- Lead status follows a sales pipeline
- Lead probability affects forecasting calculations
- Activities are tracked for each lead

### Data Integrity
- Use Mongoose middleware for:
  - Password hashing before save
  - Updating calculated fields (totalLeadValue, leadsCount)
  - Soft deletes with isActive flags
  - Automatic timestamp updates

## Performance Considerations

### Indexing Strategy
- Compound indexes for common query patterns
- Text indexes for search functionality
- Sparse indexes for optional fields

### Aggregation Pipelines
- Dashboard statistics (leads by status, revenue forecasts)
- Customer performance metrics
- User activity reports

### Caching Strategy
- Cache frequently accessed data
- Use Redis for session management
- Cache aggregation results for dashboards

## Sample Queries

### Get Customer with Leads
```javascript
db.customers.aggregate([
  { $match: { _id: ObjectId("...") } },
  {
    $lookup: {
      from: "leads",
      localField: "_id",
      foreignField: "customerId",
      as: "leads"
    }
  }
])
```

### Dashboard Statistics
```javascript
db.leads.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
      totalValue: { $sum: "$value" }
    }
  }
])
```

### Search Customers
```javascript
db.customers.find({
  $or: [
    { name: { $regex: "search_term", $options: "i" } },
    { company: { $regex: "search_term", $options: "i" } },
    { email: { $regex: "search_term", $options: "i" } }
  ]
})
```

## Migration Scripts

When deploying, use migration scripts to:
- Create initial indexes
- Set up default admin user
- Create sample data for development
- Update schema versions
