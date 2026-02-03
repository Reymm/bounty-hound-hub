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
  'home-garden': {
    label: 'Home & Garden',
    subcategories: {
      'furniture': 'Furniture',
      'decor': 'Home Decor',
      'blankets-throws': 'Blankets & Throws',
      'garden-tools': 'Garden Tools & Equipment',
      'plants-seeds': 'Plants & Seeds',
      'outdoor-living': 'Outdoor Living',
      'home-improvement': 'Home Improvement',
      'kitchen-dining': 'Kitchen & Dining',
      'bedding-bath': 'Bedding & Bath'
    }
  },
  'vehicles': {
    label: 'Vehicles',
    subcategories: {
      'cars': 'Cars & Automobiles',
      'motorcycles': 'Motorcycles',
      'trucks': 'Trucks',
      'classic-cars': 'Classic & Vintage Cars',
      'boats': 'Boats & Watercraft',
      'rvs': 'RVs & Campers',
      'atvs-utvs': 'ATVs & UTVs',
      'vehicle-parts': 'Vehicle Parts'
    }
  },
  'reconnections': {
    label: 'Reconnections',
    subcategories: {
      'biological-parents': 'Biological Parents',
      'family-members': 'Family Members',
      'old-friends': 'Old Friends',
      'adoption-search': 'Adoption Search',
      'lost-pets': 'Lost Pets',
      'lost-contact': 'Lost Contact',
      'genealogy': 'Genealogy Research',
      'family-history': 'Family History'
    }
  },
  'music-vinyl': {
    label: 'Music & Vinyl',
    subcategories: {
      'vinyl-records': 'Vinyl Records',
      'rare-albums': 'Rare Albums',
      'concert-memorabilia': 'Concert Memorabilia',
      'band-merch': 'Band Merchandise',
      'musical-instruments': 'Musical Instruments',
      'audio-equipment': 'Audio Equipment',
      'signed-memorabilia': 'Signed Memorabilia'
    }
  },
  'automotive': {
    label: 'Automotive Parts & Accessories',
    subcategories: {
      'car-parts': 'Car Parts',
      'motorcycle-parts': 'Motorcycle Parts',
      'truck-parts': 'Truck Parts',
      'automotive-tools': 'Automotive Tools',
      'car-electronics': 'Car Electronics',
      'tires-wheels': 'Tires & Wheels',
      'car-care': 'Car Care Products',
      'performance-parts': 'Performance Parts'
    }
  },
  'tools-hardware': {
    label: 'Tools & Hardware',
    subcategories: {
      'hand-tools': 'Hand Tools',
      'power-tools': 'Power Tools',
      'hardware': 'Hardware & Fasteners',
      'safety-equipment': 'Safety Equipment',
      'measuring-tools': 'Measuring Tools',
      'electrical-supplies': 'Electrical Supplies',
      'plumbing-supplies': 'Plumbing Supplies',
      'workshop-equipment': 'Workshop Equipment'
    }
  },
  'health-beauty': {
    label: 'Health & Beauty',
    subcategories: {
      'skincare': 'Skincare',
      'makeup': 'Makeup & Cosmetics',
      'hair-care': 'Hair Care',
      'fragrances': 'Fragrances',
      'health-supplements': 'Health Supplements',
      'medical-devices': 'Medical Devices',
      'fitness-equipment': 'Fitness Equipment',
      'personal-care': 'Personal Care'
    }
  },
  'sports-outdoors': {
    label: 'Sports & Outdoors',
    subcategories: {
      'fitness-exercise': 'Fitness & Exercise',
      'outdoor-recreation': 'Outdoor Recreation',
      'team-sports': 'Team Sports',
      'water-sports': 'Water Sports',
      'winter-sports': 'Winter Sports',
      'hunting-fishing': 'Hunting & Fishing',
      'camping-hiking': 'Camping & Hiking',
      'cycling': 'Cycling'
    }
  },
  'crafts-hobbies': {
    label: 'Crafts & Hobbies',
    subcategories: {
      'art-supplies': 'Art Supplies',
      'sewing-crafts': 'Sewing & Crafts',
      'model-kits': 'Model Kits',
      'woodworking': 'Woodworking',
      'jewelry-making': 'Jewelry Making',
      'scrapbooking': 'Scrapbooking',
      'painting-drawing': 'Painting & Drawing',
      'musical-instruments': 'Musical Instruments'
    }
  },
  'business-industrial': {
    label: 'Business & Industrial',
    subcategories: {
      'office-supplies': 'Office Supplies',
      'industrial-equipment': 'Industrial Equipment',
      'safety-supplies': 'Safety Supplies',
      'packaging-supplies': 'Packaging Supplies',
      'restaurant-equipment': 'Restaurant Equipment',
      'medical-equipment': 'Medical Equipment',
      'manufacturing': 'Manufacturing Equipment',
      'warehouse-supplies': 'Warehouse Supplies'
    }
  },
  'miscellaneous': {
    label: 'Miscellaneous',
    subcategories: {
      'other': 'Other Items'
    }
  },
  'recovery-rewards': {
    label: 'Recovery Rewards',
    subcategories: {
      'stolen-vehicles': 'Stolen Vehicles',
      'stolen-electronics': 'Stolen Electronics',
      'stolen-bikes': 'Stolen Bikes',
      'stolen-tools': 'Stolen Tools & Equipment',
      'lost-pets': 'Lost Pets',
      'lost-items': 'Lost Items',
      'other-recovery': 'Other Recovery'
    }
  },
  'toys-kids': {
    label: 'Toys & Kids',
    subcategories: {
      'stuffed-animals': 'Stuffed Animals & Plush',
      'action-figures': 'Action Figures & Dolls',
      'discontinued-toys': 'Discontinued Toys',
      'baby-toddler': 'Baby & Toddler Toys',
      'educational-stem': 'Educational & STEM',
      'outdoor-play': 'Outdoor & Ride-On',
      'building-sets': 'Building Sets & Blocks',
      'board-games-puzzles': 'Board Games & Puzzles'
    }
  },
  'lost-media-threads': {
    label: 'Lost Media & Threads',
    subcategories: {
      'reddit-posts': 'Reddit Posts & Comments',
      'forum-threads': 'Forum Threads & Discussions',
      'deleted-videos': 'Deleted Videos',
      'lost-websites': 'Lost Websites & Pages',
      'obscure-media': 'Obscure Media',
      'old-articles': 'Old Articles & News',
      'internet-mysteries': 'Internet Mysteries',
      'archived-content': 'Archived Content'
    }
  }
};

// Enums for backward compatibility and ease of use
export enum BountyCategory {
  COLLECTIBLES = 'collectibles',
  VEHICLES = 'vehicles',
  FASHION_APPAREL = 'fashion-apparel',
  ELECTRONICS = 'electronics',
  MUSIC_VINYL = 'music-vinyl',
  SPORTS_OUTDOORS = 'sports-outdoors',
  RECONNECTIONS = 'reconnections',
  BOOKS_MEDIA = 'books-media',
  HOME_GARDEN = 'home-garden',
  AUTOMOTIVE = 'automotive',
  TOOLS_HARDWARE = 'tools-hardware',
  HEALTH_BEAUTY = 'health-beauty',
  CRAFTS_HOBBIES = 'crafts-hobbies',
  BUSINESS_INDUSTRIAL = 'business-industrial',
  MISCELLANEOUS = 'miscellaneous',
  RECOVERY_REWARDS = 'recovery-rewards',
  TOYS_KIDS = 'toys-kids',
  LOST_MEDIA_THREADS = 'lost-media-threads'
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
  subcategory?: string;
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