// BountyBay Types - Complete type definitions for the marketplace

export interface Bounty {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: BountyCategory;
  subcategory?: string;
  tags: string[];
  bountyAmount: number;
  targetPriceMin?: number;
  targetPriceMax?: number;
  location: string;
  deadline: Date;
  status: BountyStatus;
  posterId: string;
  posterName: string;
  posterRating: number;
  posterRatingCount: number;
  verificationRequirements: string[];
  createdAt: Date;
  updatedAt: Date;
  claimsCount: number;
  viewsCount: number;
}

export interface Claim {
  id: string;
  bountyId: string;
  hunterId: string;
  hunterName: string;
  hunterRating: number;
  type: ClaimType;
  message: string;
  proofUrls: string[];
  proofImages: string[];
  status: ClaimStatus;
  submittedAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  threadId: string;
  bountyId: string;
  senderId: string;
  senderName: string;
  body: string;
  attachments: string[];
  timestamp: Date;
  isRead: boolean;
}

export interface MessageThread {
  id: string;
  bountyId: string;
  bountyTitle: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  displayName: string;
  email: string;
  region: string;
  rating: number;
  ratingCount: number;
  joinedAt: Date;
  idvStatus: IdvStatus;
  hasPayoutMethod: boolean;
  completedBounties: number;
  postedBounties: number;
}

export interface IdvCheck {
  id: string;
  userId: string;
  status: IdvStatus;
  stripeVerificationId?: string;
  submittedAt?: Date;
  completedAt?: Date;
}

export interface Rating {
  id: string;
  bountyId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Category system - Main categories with subcategories
export interface CategoryStructure {
  [key: string]: {
    label: string;
    subcategories: {
      [key: string]: string;
    };
  };
}

export const CATEGORY_STRUCTURE: CategoryStructure = {
  'vehicles-parts': {
    label: 'Vehicles & Parts',
    subcategories: {
      'cars-trucks': 'Cars & Trucks',
      'motorcycles': 'Motorcycles',
      'boats': 'Boats',
      'auto-parts': 'Auto Parts & Accessories',
      'tires-wheels': 'Tires & Wheels',
      'car-electronics': 'Car Electronics',
      'other-vehicles': 'Other Vehicles'
    }
  },
  'home-garden': {
    label: 'Home & Garden',
    subcategories: {
      'furniture': 'Furniture',
      'kitchen-dining': 'Kitchen & Dining',
      'home-decor': 'Home Decor',
      'garden-patio': 'Garden & Patio',
      'home-improvement': 'Home Improvement',
      'appliances': 'Appliances',
      'lighting': 'Lighting'
    }
  },
  'clothing-accessories': {
    label: 'Clothing & Accessories',
    subcategories: {
      'mens-clothing': "Men's Clothing",
      'womens-clothing': "Women's Clothing",
      'kids-clothing': "Kids' Clothing",
      'shoes': 'Shoes',
      'jewelry-watches': 'Jewelry & Watches',
      'handbags': 'Handbags & Accessories',
      'vintage-clothing': 'Vintage Clothing'
    }
  },
  'electronics': {
    label: 'Electronics',
    subcategories: {
      'computers': 'Computers & Tablets',
      'cell-phones': 'Cell Phones & Smart Watches',
      'audio-video': 'Audio & Video',
      'gaming': 'Gaming',
      'cameras': 'Cameras & Photo',
      'tv-home-theater': 'TV & Home Theater',
      'electronics-accessories': 'Electronics Accessories'
    }
  },
  'collectibles': {
    label: 'Collectibles',
    subcategories: {
      'coins-currency': 'Coins & Currency',
      'comics': 'Comics & Graphic Novels',
      'sports-cards': 'Sports Trading Cards',
      'antiques': 'Antiques',
      'vintage-items': 'Vintage Items',
      'memorabilia': 'Memorabilia',
      'stamps': 'Stamps'
    }
  },
  'toys-hobbies': {
    label: 'Toys & Hobbies',
    subcategories: {
      'action-figures': 'Action Figures',
      'model-trains': 'Model Trains & Railroad',
      'crafts': 'Crafts & Sewing',
      'board-games': 'Board Games & Puzzles',
      'radio-control': 'Radio Control & Control Line',
      'slot-cars': 'Slot Cars',
      'outdoor-toys': 'Outdoor Toys & Structures'
    }
  },
  'books-media': {
    label: 'Books & Media',
    subcategories: {
      'books': 'Books',
      'movies-tv': 'Movies & TV',
      'music': 'Music',
      'magazines': 'Magazines',
      'video-games': 'Video Games',
      'educational': 'Educational Materials'
    }
  },
  'health-beauty': {
    label: 'Health & Beauty',
    subcategories: {
      'skincare': 'Skincare',
      'makeup': 'Makeup',
      'hair-care': 'Hair Care',
      'fitness': 'Fitness & Wellness',
      'vitamins': 'Vitamins & Supplements',
      'nail-care': 'Nail Care',
      'fragrance': 'Fragrance'
    }
  },
  'sports-outdoors': {
    label: 'Sports & Outdoors',
    subcategories: {
      'athletic-apparel': 'Athletic Apparel',
      'exercise-equipment': 'Exercise & Fitness Equipment',
      'outdoor-sports': 'Outdoor Sports',
      'team-sports': 'Team Sports',
      'water-sports': 'Water Sports',
      'winter-sports': 'Winter Sports',
      'fishing': 'Fishing'
    }
  },
  'business-industrial': {
    label: 'Business & Industrial',
    subcategories: {
      'manufacturing': 'Manufacturing & Metalworking',
      'office-supplies': 'Office Supplies',
      'restaurant-catering': 'Restaurant & Catering',
      'construction': 'Construction',
      'medical-dental': 'Medical & Dental',
      'printing': 'Printing & Graphic Arts'
    }
  }
};

// Enums for backward compatibility and ease of use
export enum BountyCategory {
  VEHICLES_PARTS = 'vehicles-parts',
  HOME_GARDEN = 'home-garden',
  CLOTHING_ACCESSORIES = 'clothing-accessories',
  ELECTRONICS = 'electronics',
  COLLECTIBLES = 'collectibles',
  TOYS_HOBBIES = 'toys-hobbies',
  BOOKS_MEDIA = 'books-media',
  HEALTH_BEAUTY = 'health-beauty',
  SPORTS_OUTDOORS = 'sports-outdoors',
  BUSINESS_INDUSTRIAL = 'business-industrial'
}

export enum BountyStatus {
  OPEN = 'open',
  CLAIMED = 'claimed',
  FULFILLED = 'fulfilled',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum ClaimType {
  LEAD = 'lead',
  FOUND = 'found'
}

export enum ClaimStatus {
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  FULFILLED = 'fulfilled',
  DISPUTED = 'disputed'
}

export enum IdvStatus {
  NOT_VERIFIED = 'not_verified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed'
}

// Form types
export interface PostBountyForm {
  title: string;
  description: string;
  images: File[];
  category: BountyCategory;
  subcategory?: string;
  tags: string[];
  targetPriceMin?: number;
  targetPriceMax?: number;
  bountyAmount: number;
  location: string;
  deadline: Date;
  verificationRequirements: string[];
}

export interface ClaimForm {
  type: ClaimType;
  message: string;
  proofUrls: string[];
  proofImages: File[];
}

export interface SearchFilters {
  keyword?: string;
  category?: BountyCategory;
  subcategory?: string;
  minBounty?: number;
  maxBounty?: number;
  location?: string;
  deadline?: 'soonest' | 'week' | 'month';
  status?: BountyStatus[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Escrow/Payment types
export interface EscrowTransaction {
  id: string;
  bountyId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  depositedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  stripePaymentIntentId?: string;
}

export enum EscrowStatus {
  PENDING = 'pending',
  DEPOSITED = 'deposited',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed'
}