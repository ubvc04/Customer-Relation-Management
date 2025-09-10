const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[\d\s\-\(\)]+$/,
      'Please enter a valid phone number'
    ]
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'USA'
    }
  },
  industry: {
    type: String,
    trim: true,
    enum: [
      'Technology',
      'Healthcare',
      'Finance',
      'Education',
      'Retail',
      'Manufacturing',
      'Real Estate',
      'Consulting',
      'Marketing',
      'Other'
    ]
  },
  website: {
    type: String,
    trim: true,
    match: [
      /^https?:\/\/.+/,
      'Please enter a valid website URL'
    ]
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer must be assigned to a user']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect'],
    default: 'prospect'
  },
  totalLeadValue: {
    type: Number,
    default: 0,
    min: 0
  },
  leadsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastContactDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
customerSchema.index({ ownerId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ industry: 1 });
customerSchema.index({ name: 'text', company: 'text', email: 'text' });
customerSchema.index({ createdAt: -1 });

// Virtual for customer's leads
customerSchema.virtual('leads', {
  ref: 'Lead',
  localField: '_id',
  foreignField: 'customerId'
});

// Pre-save middleware to calculate lead statistics
customerSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('leads')) {
    // This will be updated by lead operations
    next();
  } else {
    next();
  }
});

// Method to update lead statistics
customerSchema.methods.updateLeadStats = async function() {
  const Lead = mongoose.model('Lead');
  
  const stats = await Lead.aggregate([
    { $match: { customerId: this._id } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: '$value' },
        count: { $sum: 1 },
        lastContact: { $max: '$updatedAt' }
      }
    }
  ]);

  if (stats.length > 0) {
    this.totalLeadValue = stats[0].totalValue || 0;
    this.leadsCount = stats[0].count || 0;
    this.lastContactDate = stats[0].lastContact || this.lastContactDate;
  } else {
    this.totalLeadValue = 0;
    this.leadsCount = 0;
  }

  return this.save({ validateBeforeSave: false });
};

// Static method to search customers
customerSchema.statics.search = function(query, ownerId) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    ownerId,
    $or: [
      { name: searchRegex },
      { company: searchRegex },
      { email: searchRegex }
    ]
  });
};

// Static method to get customers by status
customerSchema.statics.findByStatus = function(status, ownerId) {
  return this.find({ status, ownerId });
};

// Static method to get customers with pagination
customerSchema.statics.paginate = function(filter, options) {
  const { page = 1, limit = 10, sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate('ownerId', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Method to get full address string
customerSchema.methods.getFullAddress = function() {
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country]
    .filter(Boolean)
    .join(', ');
};

module.exports = mongoose.model('Customer', customerSchema);
