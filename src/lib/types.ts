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
  'collectibles': {
    label: 'Collectibles',
    subcategories: {
      'vintage-toys': 'Vintage Toys',
      'rare-coins': 'Rare Coins',
      'comic-books': 'Comic Books',
      'sports-memorabilia': 'Sports Memorabilia',
      'antiques': 'Antiques',
      'trading-cards': 'Trading Cards',
      'stamps': 'Stamps',
      'vintage-items': 'Vintage Items'
    }
  },
  'electronics': {
    label: 'Electronics',
    subcategories: {
      'computers': 'Computers & Laptops',
      'cell-phones': 'Cell Phones & Tablets',
      'audio-video': 'Audio & Video Equipment',
      'gaming': 'Gaming Consoles & Games',
      'cameras': 'Cameras & Photography',
      'tv-home-theater': 'TV & Home Theater',
      'wearable-tech': 'Wearable Technology',
      'electronics-parts': 'Electronics Parts & Components'
    }
  },
  'fashion-apparel': {
    label: 'Fashion & Apparel',
    subcategories: {
      'mens-clothing': "Men's Clothing",
      'womens-clothing': "Women's Clothing",
      'shoes': 'Shoes & Footwear',
      'jewelry-watches': 'Jewelry & Watches',
      'handbags-accessories': 'Handbags & Accessories',
      'vintage-fashion': 'Vintage Fashion',
      'designer-items': 'Designer Items',
      'activewear': 'Activewear & Sportswear'
    }
  },
  'books-media': {
    label: 'Books & Media',
    subcategories: {
      'rare-books': 'Rare & Collectible Books',
      'textbooks': 'Textbooks & Educational',
      'magazines': 'Magazines & Periodicals',
      'movies-dvd': 'Movies & DVDs',
      'music-vinyl': 'Music & Vinyl Records',
      'video-games': 'Video Games',
      'digital-media': 'Digital Media',
      'manuscripts': 'Manuscripts & Documents'
    }
  },
  'miscellaneous': {
    label: 'Miscellaneous',
    subcategories: {
      'home-garden': 'Home & Garden',
      'automotive': 'Automotive Parts & Accessories',
      'tools-hardware': 'Tools & Hardware',
      'health-beauty': 'Health & Beauty',
      'sports-outdoors': 'Sports & Outdoors',
      'crafts-hobbies': 'Crafts & Hobbies',
      'business-industrial': 'Business & Industrial',
      'other': 'Other Items'
    }
  }
};

// Enums for backward compatibility and ease of use
export enum BountyCategory {
  COLLECTIBLES = 'collectibles',
  ELECTRONICS = 'electronics',
  FASHION_APPAREL = 'fashion-apparel',
  BOOKS_MEDIA = 'books-media',
  MISCELLANEOUS = 'miscellaneous'
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