// BountyBay Types - Complete type definitions for the marketplace

export interface Bounty {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: BountyCategory;
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

// Enums
export enum BountyCategory {
  ELECTRONICS = 'electronics',
  FASHION = 'fashion',
  HOME = 'home',
  AUTOMOTIVE = 'automotive',
  COLLECTIBLES = 'collectibles',
  SERVICES = 'services',
  OTHER = 'other'
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