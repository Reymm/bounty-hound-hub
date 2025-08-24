// Mock API services with in-memory data and realistic delays
import { 
  Bounty, 
  Claim, 
  Message, 
  MessageThread, 
  Profile, 
  BountyCategory, 
  BountyStatus, 
  ClaimType, 
  ClaimStatus, 
  IdvStatus,
  PostBountyForm,
  ClaimForm,
  SearchFilters,
  PaginatedResponse,
  EscrowTransaction,
  EscrowStatus
} from '../types';

// Simulated network delay
const delay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data stores
let bounties: Bounty[] = [
  {
    id: '1',
    title: 'Looking for vintage 1970s Rolex Submariner',
    description: 'Seeking a vintage Rolex Submariner from the 1970s in excellent condition. Must have original box and papers. Preferably ref. 5512 or 5513. Will consider watches with patina but no major damage to case or dial.',
    images: ['https://example.com/rolex1.jpg', 'https://example.com/rolex2.jpg'],
    category: BountyCategory.COLLECTIBLES,
    subcategory: 'vintage-items',
    tags: ['rolex', 'vintage', 'watch', 'submariner', '1970s', 'luxury'],
    bountyAmount: 500,
    targetPriceMin: 8000,
    targetPriceMax: 15000,
    location: 'New York, NY',
    deadline: new Date('2024-12-01'),
    status: BountyStatus.OPEN,
    posterId: 'user1',
    posterName: 'WatchCollector92',
    posterRating: 4.8,
    posterRatingCount: 45,
    verificationRequirements: [
      'Provide detailed photos of case, dial, and movement',
      'Include documentation of authenticity',
      'Allow inspection before purchase'
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    claimsCount: 3,
    viewsCount: 127
  },
  {
    id: '2',
    title: 'Need iPhone 15 Pro Max in Natural Titanium',
    description: 'Looking for a brand new, unopened iPhone 15 Pro Max in Natural Titanium color, 512GB storage. Must be unlocked and include all original accessories. Will pay above retail for immediate availability.',
    images: ['https://example.com/iphone1.jpg'],
    category: BountyCategory.ELECTRONICS,
    subcategory: 'cell-phones',
    tags: ['iphone', 'apple', 'smartphone', 'titanium', '15 pro max', 'unlocked'],
    bountyAmount: 200,
    targetPriceMin: 1200,
    targetPriceMax: 1500,
    location: 'Los Angeles, CA',
    deadline: new Date('2024-11-20'),
    status: BountyStatus.OPEN,
    posterId: 'user2',
    posterName: 'TechEnthusiast',
    posterRating: 4.6,
    posterRatingCount: 28,
    verificationRequirements: [
      'Must be sealed in original packaging',
      'Provide receipt or proof of purchase',
      'Meet in person or use secure payment'
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    claimsCount: 7,
    viewsCount: 234
  },
  {
    id: '3',
    title: 'Searching for signed Michael Jordan rookie card',
    description: 'Looking for a PSA-graded Michael Jordan 1986-87 Fleer rookie card (#57) with authentic autograph. Prefer PSA 8 or higher grade. Card must be authenticated by PSA/DNA or JSA for the signature.',
    images: ['https://example.com/jordan-card.jpg'],
    category: BountyCategory.COLLECTIBLES,
    subcategory: 'sports-memorabilia',
    tags: ['michael jordan', 'basketball card', 'rookie card', 'signed', 'PSA', 'authentic'],
    bountyAmount: 750,
    targetPriceMin: 15000,
    targetPriceMax: 30000,
    location: 'Chicago, IL',
    deadline: new Date('2024-12-15'),
    status: BountyStatus.CLAIMED,
    posterId: 'user3',
    posterName: 'CardCollector23',
    posterRating: 4.9,
    posterRatingCount: 67,
    verificationRequirements: [
      'Must have PSA authentication',
      'Signature must be authenticated by PSA/DNA or JSA',
      'Provide high-resolution photos of front and back',
      'Include certificate of authenticity'
    ],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
    claimsCount: 12,
    viewsCount: 456
  },
  {
    id: '4',
    title: '1967 Ford Mustang Fastback - Original 390 V8',
    description: 'Searching for a 1967 Ford Mustang Fastback with the original 390 V8 engine. Prefer S-code car in good condition. Willing to consider project cars if numbers match and body is solid.',
    images: [],
    category: BountyCategory.AUTOMOTIVE,
    subcategory: 'car-parts',
    tags: ['mustang', 'ford', '1967', 'fastback', '390', 'classic car', 'muscle car'],
    bountyAmount: 1000,
    targetPriceMin: 25000,
    targetPriceMax: 60000,
    location: 'Detroit, MI',
    deadline: new Date('2024-12-31'),
    status: BountyStatus.OPEN,
    posterId: 'user4',
    posterName: 'ClassicCarHunter',
    posterRating: 4.7,
    posterRatingCount: 15,
    verificationRequirements: [
      'Numbers matching engine and transmission',
      'Clear title in hand',
      'Detailed photos of body, interior, and engine bay',
      'History documentation if available'
    ],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    claimsCount: 2,
    viewsCount: 89
  },
  {
    id: '5',
    title: 'Original Eames Lounge Chair & Ottoman - Walnut/Black',
    description: 'Looking for an authentic Herman Miller Eames Lounge Chair and Ottoman in walnut with black leather. Must be original production, not a reproduction. Good condition with original tags preferred.',
    images: [],
    category: BountyCategory.HOME_GARDEN,
    subcategory: 'furniture',
    tags: ['eames', 'herman miller', 'lounge chair', 'walnut', 'black leather', 'authentic', 'mid-century'],
    bountyAmount: 300,
    targetPriceMin: 3500,
    targetPriceMax: 6000,
    location: 'San Francisco, CA',
    deadline: new Date('2024-11-30'),
    status: BountyStatus.OPEN,
    posterId: 'user5',
    posterName: 'ModernDesignLover',
    posterRating: 4.9,
    posterRatingCount: 22,
    verificationRequirements: [
      'Herman Miller authentication label',
      'Photos of construction details',
      'Proof of authenticity or provenance'
    ],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    claimsCount: 1,
    viewsCount: 156
  },
  {
    id: '6',
    title: 'Nintendo Game & Watch - Donkey Kong (1982)',
    description: 'Seeking an original Nintendo Game & Watch Donkey Kong from 1982 in working condition. Must have original box, manual, and battery cover. Screen should be clear without any LCD bleeding.',
    images: [],
    category: BountyCategory.CRAFTS_HOBBIES,
    subcategory: 'model-kits',
    tags: ['game watch', 'nintendo', 'donkey kong', '1982', 'handheld', 'retro gaming', 'complete'],
    bountyAmount: 400,
    targetPriceMin: 800,
    targetPriceMax: 1500,
    location: 'Seattle, WA',
    deadline: new Date('2024-11-25'),
    status: BountyStatus.OPEN,
    posterId: 'user6',
    posterName: 'RetroGamer88',
    posterRating: 4.5,
    posterRatingCount: 33,
    verificationRequirements: [
      'Game must be fully functional',
      'Include original box and manual',
      'Battery cover must be intact'
    ],
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
    claimsCount: 4,
    viewsCount: 203
  }
];

let claims: Claim[] = [
  {
    id: 'c1',
    bountyId: 'b1',
    hunterId: 'h1',
    hunterName: 'David Kim',
    hunterRating: 4.7,
    type: ClaimType.FOUND,
    message: 'I found a Leica IIIf from 1963 in excellent condition. The camera has been well-maintained and comes with the original leather case. I can provide detailed photos and documentation.',
    proofUrls: ['https://example.com/camera-photos'],
    proofImages: [],
    status: ClaimStatus.SUBMITTED,
    submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
];

let messages: Message[] = [
  {
    id: 'm1',
    threadId: 't1',
    bountyId: 'b1',
    senderId: 'h1',
    senderName: 'David Kim',
    body: 'Hi Sarah! I believe I found the Leica camera you\'re looking for. Would you like to see more detailed photos?',
    attachments: [],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false
  },
  {
    id: 'm2',
    threadId: 't1',
    bountyId: 'b1',
    senderId: 'u1',
    senderName: 'Sarah Chen',
    body: 'That sounds promising! Yes, please send more photos, especially of the serial number and light meter.',
    attachments: [],
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: true
  }
];

let messageThreads: MessageThread[] = [
  {
    id: 't1',
    bountyId: 'b1',
    bountyTitle: 'Looking for rare vintage Leica camera from 1960s',
    participants: ['u1', 'h1'],
    lastMessage: messages[1],
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  }
];

let profiles: Profile[] = [
  {
    id: 'u1',
    displayName: 'Sarah Chen',
    email: 'sarah@example.com',
    region: 'San Francisco Bay Area',
    rating: 4.8,
    ratingCount: 23,
    joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    idvStatus: IdvStatus.VERIFIED,
    hasPayoutMethod: true,
    completedBounties: 15,
    postedBounties: 8
  }
];

let escrowTransactions: EscrowTransaction[] = [];

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const filterBounties = (bounties: Bounty[], filters: SearchFilters): Bounty[] => {
  return bounties.filter(bounty => {
    if (filters.keyword && !bounty.title.toLowerCase().includes(filters.keyword.toLowerCase()) && 
        !bounty.description.toLowerCase().includes(filters.keyword.toLowerCase())) {
      return false;
    }
    if (filters.subcategory && bounty.subcategory !== filters.subcategory) {
      return false;
    }
    if (filters.minBounty && bounty.bountyAmount < filters.minBounty) {
      return false;
    }
    if (filters.maxBounty && bounty.bountyAmount > filters.maxBounty) {
      return false;
    }
    if (filters.location && !bounty.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.status && filters.status.length > 0 && !filters.status.includes(bounty.status)) {
      return false;
    }
    return true;
  });
};

// Mock API functions
export const mockApi = {
  // Bounties
  async getBounties(page = 1, limit = 20, filters: SearchFilters = {}): Promise<PaginatedResponse<Bounty>> {
    await delay();
    
    const filtered = filterBounties(bounties, filters);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = filtered.slice(start, end);
    
    return {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
      hasMore: end < filtered.length
    };
  },

  async getBounty(id: string): Promise<Bounty | null> {
    await delay(400);
    return bounties.find(b => b.id === id) || null;
  },

  async createBounty(form: PostBountyForm): Promise<Bounty> {
    await delay(1200);
    
    const bounty: Bounty = {
      id: generateId(),
      ...form,
      images: [], // TODO: Handle image uploads to Supabase bucket 'bounty_images'
      status: BountyStatus.OPEN,
      posterId: 'current-user', // TODO: Get from Supabase auth
      posterName: 'Current User', // TODO: Get from Supabase profile
      posterRating: 0,
      posterRatingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      claimsCount: 0,
      viewsCount: 0
    };
    
    bounties.unshift(bounty);
    return bounty;
  },

  async updateBountyStatus(id: string, status: BountyStatus): Promise<boolean> {
    await delay(600);
    const bounty = bounties.find(b => b.id === id);
    if (bounty) {
      bounty.status = status;
      bounty.updatedAt = new Date();
      return true;
    }
    return false;
  },

  // Claims
  async getClaims(bountyId: string): Promise<Claim[]> {
    await delay(500);
    return claims.filter(c => c.bountyId === bountyId);
  },

  async createClaim(bountyId: string, form: ClaimForm): Promise<Claim> {
    await delay(1000);
    
    const claim: Claim = {
      id: generateId(),
      bountyId,
      hunterId: 'current-user', // TODO: Get from Supabase auth
      hunterName: 'Current User', // TODO: Get from Supabase profile
      hunterRating: 0,
      type: form.type,
      message: form.message,
      proofUrls: form.proofUrls,
      proofImages: [], // TODO: Handle file uploads to Supabase bucket 'message_attachments'
      status: ClaimStatus.SUBMITTED,
      submittedAt: new Date(),
      updatedAt: new Date()
    };
    
    claims.push(claim);
    
    // Update bounty claims count
    const bounty = bounties.find(b => b.id === bountyId);
    if (bounty) {
      bounty.claimsCount++;
    }
    
    return claim;
  },

  // Messages
  async getMessageThreads(userId: string): Promise<MessageThread[]> {
    await delay(600);
    return messageThreads.filter(thread => thread.participants.includes(userId));
  },

  async getMessages(threadId: string): Promise<Message[]> {
    await delay(400);
    return messages.filter(m => m.threadId === threadId);
  },

  async sendMessage(threadId: string, body: string, attachments: string[] = []): Promise<Message> {
    await delay(800);
    
    const message: Message = {
      id: generateId(),
      threadId,
      bountyId: messageThreads.find(t => t.id === threadId)?.bountyId || '',
      senderId: 'current-user', // TODO: Get from Supabase auth
      senderName: 'Current User', // TODO: Get from Supabase profile
      body,
      attachments,
      timestamp: new Date(),
      isRead: false
    };
    
    messages.push(message);
    
    // Update thread
    const thread = messageThreads.find(t => t.id === threadId);
    if (thread) {
      thread.lastMessage = message;
      thread.updatedAt = new Date();
    }
    
    return message;
  },

  // Profile
  async getProfile(userId: string): Promise<Profile | null> {
    await delay(400);
    return profiles.find(p => p.id === userId) || null;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    await delay(800);
    const profile = profiles.find(p => p.id === userId);
    if (profile) {
      Object.assign(profile, updates);
      return profile;
    }
    return null;
  },

  // Escrow (Mock implementation)
  async createEscrowDeposit(bountyId: string, amount: number): Promise<EscrowTransaction> {
    await delay(1500);
    
    const transaction: EscrowTransaction = {
      id: generateId(),
      bountyId,
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      status: EscrowStatus.DEPOSITED,
      depositedAt: new Date(),
      stripePaymentIntentId: 'pi_mock_' + generateId()
    };
    
    escrowTransactions.push(transaction);
    return transaction;
  },

  async releaseEscrow(transactionId: string): Promise<boolean> {
    await delay(1000);
    const transaction = escrowTransactions.find(t => t.id === transactionId);
    if (transaction && transaction.status === EscrowStatus.DEPOSITED) {
      transaction.status = EscrowStatus.RELEASED;
      transaction.releasedAt = new Date();
      return true;
    }
    return false;
  },

  async refundEscrow(transactionId: string): Promise<boolean> {
    await delay(1000);
    const transaction = escrowTransactions.find(t => t.id === transactionId);
    if (transaction && transaction.status === EscrowStatus.DEPOSITED) {
      transaction.status = EscrowStatus.REFUNDED;
      transaction.refundedAt = new Date();
      return true;
    }
    return false;
  }
};

// TODO: Replace all mock functions with actual Supabase calls
// TODO: Add proper error handling and retry logic
// TODO: Implement real-time subscriptions for messages using Supabase Realtime
// TODO: Add file upload handling for images and attachments
// TODO: Integrate with Stripe for actual payment processing