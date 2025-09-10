const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    next();
  };
};

// User validation schemas
const userValidation = {
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required'
      }),
    role: Joi.string()
      .valid('user', 'admin')
      .default('user')
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .optional(),
    email: Joi.string()
      .email()
      .optional(),
    avatar: Joi.string()
      .uri()
      .optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(6)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'New password is required'
      })
  })
};

// Customer validation schemas
const customerValidation = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email',
        'any.required': 'Email is required'
      }),
    phone: Joi.string()
      .pattern(/^[\+]?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please enter a valid phone number'
      }),
    company: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.max': 'Company name cannot exceed 100 characters',
        'any.required': 'Company name is required'
      }),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      country: Joi.string().default('USA')
    }).optional(),
    industry: Joi.string()
      .valid('Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Consulting', 'Marketing', 'Other')
      .optional(),
    website: Joi.string()
      .uri()
      .optional(),
    tags: Joi.array()
      .items(Joi.string())
      .optional(),
    notes: Joi.string()
      .max(1000)
      .optional(),
    status: Joi.string()
      .valid('active', 'inactive', 'prospect')
      .default('prospect')
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    email: Joi.string()
      .email()
      .optional(),
    phone: Joi.string()
      .pattern(/^[\+]?[\d\s\-\(\)]+$/)
      .optional(),
    company: Joi.string()
      .max(100)
      .optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      country: Joi.string().optional()
    }).optional(),
    industry: Joi.string()
      .valid('Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Consulting', 'Marketing', 'Other')
      .optional(),
    website: Joi.string()
      .uri()
      .optional(),
    tags: Joi.array()
      .items(Joi.string())
      .optional(),
    notes: Joi.string()
      .max(1000)
      .optional(),
    status: Joi.string()
      .valid('active', 'inactive', 'prospect')
      .optional()
  })
};

// Lead validation schemas
const leadValidation = {
  create: Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .required()
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required'
      }),
    description: Joi.string()
      .max(1000)
      .optional(),
    status: Joi.string()
      .valid('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost')
      .default('New'),
    value: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Value cannot be negative',
        'any.required': 'Value is required'
      }),
    currency: Joi.string()
      .valid('USD', 'EUR', 'GBP', 'CAD', 'AUD')
      .default('USD'),
    probability: Joi.number()
      .min(0)
      .max(100)
      .optional(),
    expectedCloseDate: Joi.date()
      .min('now')
      .required()
      .messages({
        'date.min': 'Expected close date must be in the future',
        'any.required': 'Expected close date is required'
      }),
    source: Joi.string()
      .valid('Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Other')
      .default('Other'),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium'),
    tags: Joi.array()
      .items(Joi.string())
      .optional(),
    nextFollowUp: Joi.date()
      .min('now')
      .optional()
  }),

  update: Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .optional(),
    description: Joi.string()
      .max(1000)
      .optional(),
    status: Joi.string()
      .valid('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost')
      .optional(),
    value: Joi.number()
      .min(0)
      .optional(),
    currency: Joi.string()
      .valid('USD', 'EUR', 'GBP', 'CAD', 'AUD')
      .optional(),
    probability: Joi.number()
      .min(0)
      .max(100)
      .optional(),
    expectedCloseDate: Joi.date()
      .min('now')
      .optional(),
    actualCloseDate: Joi.date()
      .optional(),
    source: Joi.string()
      .valid('Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Other')
      .optional(),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .optional(),
    tags: Joi.array()
      .items(Joi.string())
      .optional(),
    nextFollowUp: Joi.date()
      .optional()
  }),

  addActivity: Joi.object({
    type: Joi.string()
      .valid('call', 'email', 'meeting', 'note', 'task')
      .required(),
    description: Joi.string()
      .max(500)
      .required()
      .messages({
        'string.max': 'Description cannot exceed 500 characters',
        'any.required': 'Description is required'
      }),
    date: Joi.date()
      .default(Date.now)
  })
};

// Query validation schemas
const queryValidation = {
  pagination: Joi.object({
    page: Joi.number()
      .min(1)
      .default(1),
    limit: Joi.number()
      .min(1)
      .max(100)
      .default(10),
    sort: Joi.string()
      .default('-createdAt')
  }),

  search: Joi.object({
    q: Joi.string()
      .min(1)
      .optional(),
    status: Joi.string()
      .optional(),
    industry: Joi.string()
      .optional(),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .optional()
  })
};

module.exports = {
  validate,
  userValidation,
  customerValidation,
  leadValidation,
  queryValidation
};
