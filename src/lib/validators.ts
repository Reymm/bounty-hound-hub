// Form validation schemas using Zod
import { z } from 'zod';
import { BountyCategory, ClaimType } from './types';

// Post Bounty form validation
export const postBountySchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must be less than 100 characters'),
  
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  category: z.nativeEnum(BountyCategory, {
    required_error: 'Please select a category'
  }),
  
  tags: z.array(z.string())
    .min(1, 'Add at least one tag')
    .max(10, 'Maximum 10 tags allowed'),
  
  bountyAmount: z.number()
    .min(10, 'Minimum bounty is $10')
    .max(10000, 'Maximum bounty is $10,000'),
  
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
    .refine(date => date <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'Deadline cannot be more than 1 year in the future'),
  
  verificationRequirements: z.array(z.string())
    .min(1, 'Add at least one verification requirement')
    .max(10, 'Maximum 10 verification requirements')
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
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  
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