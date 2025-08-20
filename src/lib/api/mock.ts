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
    id: 'b1',
    title: 'Looking for rare vintage Leica camera from 1960s',
    description: 'I\'m a collector searching for a vintage Leica IIIf camera in excellent condition. Must have original leather case and working light meter. Willing to pay premium for authenticated piece.',
    images: [],
    category: BountyCategory.COLLECTIBLES,
    tags: ['vintage', 'camera', 'leica', 'collector', 'authentic'],
    bountyAmount: 500,
    targetPriceMin: 1500,
    targetPriceMax: 3000,
    location: 'San Francisco, CA',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    status: BountyStatus.OPEN,
    posterId: 'u1',
    posterName: 'Sarah Chen',
    posterRating: 4.8,
    posterRatingCount: 23,
    verificationRequirements: ['Photo authentication', 'Serial number verification', 'Functionality test'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    claimsCount: 3,
    viewsCount: 47
  },
  {
    id: 'b2',
    title: 'Need iPhone 15 Pro Max in specific midnight blue color',
    description: 'Looking for brand new iPhone 15 Pro Max 256GB in midnight blue. Must be unlocked and come with original packaging. Need it for a gift by next week.',
    images: [],
    category: BountyCategory.ELECTRONICS,
    tags: ['iphone', 'apple', 'midnight-blue', 'unlocked', 'gift'],
    bountyAmount: 200,
    targetPriceMin: 1100,
    targetPriceMax: 1300,
    location: 'New York, NY',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    status: BountyStatus.OPEN,
    posterId: 'u2',
    posterName: 'Mike Rodriguez',
    posterRating: 4.9,
    posterRatingCount: 12,
    verificationRequirements: ['Original packaging', 'Proof of purchase', 'IMEI verification'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    claimsCount: 1,
    viewsCount: 89
  },
  {
    id: 'b3',
    title: 'Rare first edition Harry Potter book set',
    description: 'Searching for complete first edition set of Harry Potter books, preferably UK editions. Must be in mint condition with dust jackets intact.',
    images: [],
    category: BountyCategory.COLLECTIBLES,
    tags: ['books', 'harry-potter', 'first-edition', 'mint-condition', 'complete-set'],
    bountyAmount: 800,
    targetPriceMin: 3000,
    targetPriceMax: 8000,
    location: 'Los Angeles, CA',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: BountyStatus.CLAIMED,
    posterId: 'u3',
    posterName: 'Emma Watson',
    posterRating: 5.0,
    posterRatingCount: 8,
    verificationRequirements: ['Professional authentication', 'Condition assessment', 'Provenance documentation'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    claimsCount: 2,
    viewsCount: 156
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
    if (filters.category && bounty.category !== filters.category) {
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