const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['call', 'email', 'meeting', 'note', 'task']
  },
  description: {
    type: String,
    required: [true, 'Activity description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  date: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const leadSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Lead must be associated with a customer']
  },
  title: {
    type: String,
    required: [true, 'Lead title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    required: [true, 'Lead status is required'],
    enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost'],
    default: 'New'
  },
  value: {
    type: Number,
    required: [true, 'Lead value is required'],
    min: [0, 'Value cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  probability: {
    type: Number,
    min: [0, 'Probability cannot be less than 0'],
    max: [100, 'Probability cannot be greater than 100'],
    default: function() {
      // Auto-set probability based on status
      const statusProbability = {
        'New': 10,
        'Contacted': 25,
        'Qualified': 50,
        'Proposal': 75,
        'Negotiation': 85,
        'Converted': 100,
        'Lost': 0
      };
      return statusProbability[this.status] || 10;
    }
  },
  expectedCloseDate: {
    type: Date,
    required: [true, 'Expected close date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Expected close date must be in the future'
    }
  },
  actualCloseDate: {
    type: Date,
    default: null
  },
  source: {
    type: String,
    required: [true, 'Lead source is required'],
    enum: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Other'],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lead must be assigned to a user']
  },
  activities: [activitySchema],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  nextFollowUp: {
    type: Date,
    default: function() {
      // Set default follow-up date based on status
      const followUpDays = {
        'New': 1,
        'Contacted': 3,
        'Qualified': 7,
        'Proposal': 5,
        'Negotiation': 2,
        'Converted': 0,
        'Lost': 0
      };
      
      const days = followUpDays[this.status] || 7;
      if (days > 0) {
        const followUp = new Date();
        followUp.setDate(followUp.getDate() + days);
        return followUp;
      }
      return null;
    }
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
leadSchema.index({ customerId: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ expectedCloseDate: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ nextFollowUp: 1 });
leadSchema.index({ createdAt: -1 });

// Virtual for weighted value (value * probability)
leadSchema.virtual('weightedValue').get(function() {
  return (this.value * this.probability) / 100;
});

// Virtual for days until expected close
leadSchema.virtual('daysToClose').get(function() {
  if (!this.expectedCloseDate) return null;
  
  const today = new Date();
  const diffTime = this.expectedCloseDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for overdue status
leadSchema.virtual('isOverdue').get(function() {
  if (!this.expectedCloseDate || this.status === 'Converted' || this.status === 'Lost') {
    return false;
  }
  return new Date() > this.expectedCloseDate;
});

// Pre-save middleware
leadSchema.pre('save', function(next) {
  // Auto-update probability based on status if not manually set
  if (this.isModified('status') && !this.isModified('probability')) {
    const statusProbability = {
      'New': 10,
      'Contacted': 25,
      'Qualified': 50,
      'Proposal': 75,
      'Negotiation': 85,
      'Converted': 100,
      'Lost': 0
    };
    this.probability = statusProbability[this.status] || this.probability;
  }

  // Set actual close date when status changes to Converted or Lost
  if (this.isModified('status') && (this.status === 'Converted' || this.status === 'Lost')) {
    if (!this.actualCloseDate) {
      this.actualCloseDate = new Date();
    }
    this.nextFollowUp = null; // Clear follow-up for closed leads
  }

  next();
});

// Post-save middleware to update customer statistics
leadSchema.post('save', async function() {
  try {
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findById(this.customerId);
    if (customer) {
      await customer.updateLeadStats();
    }
  } catch (error) {
    console.error('Error updating customer stats:', error);
  }
});

// Post-remove middleware to update customer statistics
leadSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Customer = mongoose.model('Customer');
      const customer = await Customer.findById(doc.customerId);
      if (customer) {
        await customer.updateLeadStats();
      }
    } catch (error) {
      console.error('Error updating customer stats after lead deletion:', error);
    }
  }
});

// Method to add activity
leadSchema.methods.addActivity = function(activityData) {
  this.activities.push(activityData);
  return this.save();
};

// Method to update next follow-up
leadSchema.methods.setNextFollowUp = function(date) {
  this.nextFollowUp = date;
  return this.save({ validateBeforeSave: false });
};

// Static method to find leads by status
leadSchema.statics.findByStatus = function(status, assignedTo) {
  const query = { status };
  if (assignedTo) query.assignedTo = assignedTo;
  return this.find(query).populate('customerId', 'name company email');
};

// Static method to find overdue leads
leadSchema.statics.findOverdue = function(assignedTo) {
  const query = {
    expectedCloseDate: { $lt: new Date() },
    status: { $nin: ['Converted', 'Lost'] }
  };
  if (assignedTo) query.assignedTo = assignedTo;
  return this.find(query).populate('customerId', 'name company email');
};

// Static method to get lead statistics
leadSchema.statics.getStats = function(assignedTo) {
  const matchQuery = assignedTo ? { assignedTo } : {};
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        avgProbability: { $avg: '$probability' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } }
      }
    },
    {
      $group: {
        _id: null,
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            totalValue: '$totalValue',
            avgProbability: '$avgProbability',
            weightedValue: '$weightedValue'
          }
        },
        totalLeads: { $sum: '$count' },
        totalValue: { $sum: '$totalValue' },
        totalWeightedValue: { $sum: '$weightedValue' }
      }
    }
  ]);
};

// Static method for lead conversion funnel
leadSchema.statics.getConversionFunnel = function(assignedTo) {
  const matchQuery = assignedTo ? { assignedTo } : {};
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Lead', leadSchema);
