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
  isOfficial?: boolean;
  verificationRequirements: string[];
  createdAt: Date;
  updatedAt: Date;
  claimsCount: number;
  viewsCount: number;
  requires_shipping?: boolean;
  shippingDetails?: ShippingDetails;
  shippingStatus?: 'not_requested' | 'requested' | 'provided' | 'not_provided';
  hunterPurchasesItem?: boolean;
}

export interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  notes?: string;
}

export interface Claim {
  id: string;
  bountyId: string;
  hunterId: string;
  hunterName: string;
  hunterRating: number;
  hunterRatingCount?: number;
  type: ClaimType;
  message: string;
  proofUrls: string[];
  proofImages: string[];
  status: ClaimStatus;
  submittedAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
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
  otherParticipantName?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  displayName: string;
  username?: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  region: string;
  rating: number;
  ratingCount: number;
  average_rating: number;
  total_ratings_received: number;
  total_ratings_given: number;
  joinedAt: Date;
  idvStatus: IdvStatus;
  hasPayoutMethod: boolean;
  completedBounties: number;
  postedBounties: number;
  reputationScore: number;
  totalSuccessfulClaims: number;
  totalFailedClaims: number;
  isSuspended: boolean;
  suspendedUntil?: Date;
  stripeConnectOnboardingComplete?: boolean;
  stripeConnectPayoutsEnabled?: boolean;
  payoutCountry?: string;
  payoutEmail?: string;
  isOfficial?: boolean;
  identityVerified?: boolean;
  identitySessionId?: string;
}
export interface Activity {
  id: string;
  type: 'bounty_posted' | 'claim_submitted' | 'claim_accepted' | 'claim_rejected' | 'rating_received';
  title: string;
  description: string;
  bountyId?: string;
  bountyTitle?: string;
  amount?: number;
  rating?: number;
  createdAt: Date;
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
  'toys-comfort': {
    label: 'Toys & Comfort Items',
    subcategories: {
      'plushies': 'Plushies & Stuffed Animals',
      'vintage-toys': 'Vintage Toys',
      'action-figures': 'Action Figures & Dolls',
      'building-sets': 'Building Sets & Blocks',
      'baby-toddler': 'Baby & Toddler'
    }
  },
  'collectibles': {
    label: 'Collectibles',
    subcategories: {
      'trading-cards': 'Trading Cards',
      'rare-coins': 'Rare Coins',
      'sports-memorabilia': 'Sports Memorabilia',
      'vinyl-albums': 'Vinyl & Albums',
      'antiques': 'Antiques & Vintage'
    }
  },
  'fashion': {
    label: 'Fashion & Accessories',
    subcategories: {
      'shoes-sneakers': 'Shoes & Sneakers',
      'handbags': 'Handbags & Purses',
      'jewelry-watches': 'Jewelry & Watches',
      'vintage-fashion': 'Vintage Fashion',
      'designer-items': 'Designer Items'
    }
  },
  'electronics': {
    label: 'Electronics & Gaming',
    subcategories: {
      'gaming': 'Gaming Consoles & Games',
      'cameras': 'Cameras & Photography',
      'phones-tablets': 'Phones & Tablets',
      'audio-equipment': 'Audio Equipment',
      'retro-tech': 'Retro Tech'
    }
  },
  'vehicles': {
    label: 'Vehicles & Parts',
    subcategories: {
      'classic-cars': 'Cars & Classics',
      'motorcycles': 'Motorcycles',
      'parts-accessories': 'Parts & Accessories',
      'boats': 'Boats & Watercraft',
      'tires-wheels': 'Tires & Wheels'
    }
  },
  'lost-media': {
    label: 'Lost Media & Threads',
    subcategories: {
      'reddit-posts': 'Reddit Posts & Comments',
      'deleted-videos': 'Deleted Videos',
      'lost-websites': 'Lost Websites & Pages',
      'old-articles': 'Old Articles & News',
      'internet-mysteries': 'Internet Mysteries'
    }
  },
  'everything-else': {
    label: 'Everything Else',
    subcategories: {
      'home-garden': 'Home & Garden',
      'books-media': 'Books & Media',
      'health-beauty': 'Health & Beauty',
      'sports-outdoors': 'Sports & Outdoors',
      'other': 'Other Items'
    }
  }
};

// Enums for backward compatibility and ease of use
export enum BountyCategory {
  TOYS_COMFORT = 'toys-comfort',
  COLLECTIBLES = 'collectibles',
  FASHION = 'fashion',
  ELECTRONICS = 'electronics',
  VEHICLES = 'vehicles',
  LOST_MEDIA = 'lost-media',
  EVERYTHING_ELSE = 'everything-else'
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
  proofImages: string[]; // Changed from File[] to string[] for URLs
}

export interface SearchFilters {
  keyword?: string;
  category?: BountyCategory;
  categories?: BountyCategory[];
  subcategory?: string;
  subcategories?: string[];
  minBounty?: number;
  maxBounty?: number;
  location?: string;
  deadline?: 'soonest' | 'week' | 'month';
  deadlineBefore?: Date; // Internal use for API
  status?: BountyStatus[];
  sortBy?: 'newest' | 'top' | 'soonest';
  bountyType?: 'lead_only' | 'find_ship';
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