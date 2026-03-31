// Form validation schemas using Zod
import { z } from 'zod';
import { BountyCategory, ClaimType } from './types';


// Post Bounty form validation
export const postBountySchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must be less than 100 characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(4200, 'Description must be less than 4200 characters'),
  
  category: z.nativeEnum(BountyCategory, {
    required_error: 'Please select a category'
  }),
  
  subcategory: z.string().optional(),
  
  tags: z.array(z.string())
    .min(1, 'Add at least one tag')
    .max(10, 'Maximum 10 tags allowed'),
  
  bountyAmount: z.number({
    required_error: 'Bounty amount is required',
    invalid_type_error: 'Please enter a valid amount'
  })
    .min(10, 'Minimum bounty is $10')
    .max(10000, 'Maximum bounty is $10,000')
    .optional()
    .refine(val => val !== undefined, 'Bounty amount is required'),
  
  targetPriceMin: z.number()
    .min(1, 'Minimum price must be at least $1')
    .optional(),
  
  targetPriceMax: z.number()
    .min(1, 'Maximum price must be at least $1')
    .optional(),
  
  location: z.string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must be less than 100 characters'),
  
  deadline: z.date()
    .refine(date => date > new Date(), 'Deadline must be in the future')
    .refine(date => date <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'Deadline cannot be more than 1 year in the future')
    .optional(),
  
  verificationRequirements: z.array(z.string().min(1, 'Requirement cannot be empty'))
    .min(1, 'Add at least one verification requirement')
    .max(10, 'Maximum 10 verification requirements')
    .refine(arr => arr.every(req => req.trim().length > 0), 'All requirements must be non-empty'),
    
  images: z.array(z.string().url())
    .max(5, 'Maximum 5 images allowed')
    .optional()
}).refine(data => {
  if (data.targetPriceMin && data.targetPriceMax) {
    return data.targetPriceMin <= data.targetPriceMax;
  }
  return true;
}, {
  message: 'Minimum price cannot be greater than maximum price',
  path: ['targetPriceMax']
});

// Claim form validation
export const claimSchema = z.object({
  type: z.nativeEnum(ClaimType, {
    required_error: 'Please select claim type'
  }),
  
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  
  proofUrls: z.array(z.string().url('Invalid URL format'))
    .max(5, 'Maximum 5 URLs allowed'),
  
  proofImages: z.array(z.any())
    .max(5, 'Maximum 5 images allowed')
});

// Search filters validation
export const searchFiltersSchema = z.object({
  keyword: z.string().max(100).optional(),
  category: z.nativeEnum(BountyCategory).optional(),
  subcategory: z.string().optional(),
  minBounty: z.number().min(0).optional(),
  maxBounty: z.number().min(0).optional(),
  location: z.string().max(100).optional(),
  deadline: z.enum(['soonest', 'week', 'month']).optional()
}).refine(data => {
  if (data.minBounty && data.maxBounty) {
    return data.minBounty <= data.maxBounty;
  }
  return true;
}, {
  message: 'Minimum bounty cannot be greater than maximum bounty',
  path: ['maxBounty']
});

// Profile update validation
export const profileUpdateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
    .optional()
    .or(z.literal('')),
  
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
    
  region: z.string()
    .min(2, 'Region must be at least 2 characters')
    .max(100, 'Region must be less than 100 characters')
});

// Message validation
export const messageSchema = z.object({
  body: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters')
});

// Export types for form data
export type PostBountyFormData = z.infer<typeof postBountySchema>;
export type ClaimFormData = z.infer<typeof claimSchema>;
export type SearchFiltersData = z.infer<typeof searchFiltersSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;