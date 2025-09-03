import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { 
  Bounty, 
  Claim, 
  Message, 
  MessageThread, 
  Profile, 
  BountyStatus, 
  ClaimStatus, 
  SearchFilters,
  PaginatedResponse,
  PostBountyForm,
  ClaimForm
} from '../types';

// Type helpers for database rows
type BountyRow = Database['public']['Tables']['Bounties']['Row'];
type SubmissionRow = Database['public']['Tables']['Submissions']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// API-specific types (after form processing)
interface CreateBountyData {
  title: string;
  description: string;
  images: string[]; // URLs after upload, not Files
  category: string;
  subcategory?: string;
  tags: string[];
  targetPriceMin?: number;
  targetPriceMax?: number;
  bountyAmount: number;
  location: string;
  deadline: Date;
  verificationRequirements: string[];
}

// Helper functions to transform database rows to app types
const transformBountyRow = (row: any): Bounty => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  images: row.images || [],
  category: row.category as any,
  subcategory: row.subcategory || undefined,
  tags: row.tags || [],
  bountyAmount: row.amount || 0,
  targetPriceMin: row.target_price_min || undefined,
  targetPriceMax: row.target_price_max || undefined,
  location: row.location || '',
  deadline: row.deadline ? new Date(row.deadline) : new Date(),
  status: row.status as BountyStatus,
  posterId: row.poster_id || '',
  posterName: row.profiles?.full_name || row.profiles?.username || 'Unknown User',
  posterRating: row.profiles?.reputation_score || 0,
  posterRatingCount: (row.profiles?.total_successful_claims || 0) + (row.profiles?.total_failed_claims || 0),
  verificationRequirements: row.verification_requirements || [],
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.created_at),
  claimsCount: 0, // Will be populated separately if needed
  viewsCount: 0 // TODO: Add views tracking
});

const transformSubmissionRow = (row: any): Claim => ({
  id: row.id,
  bountyId: row.bounty_id,
  hunterId: row.hunter_id,
  hunterName: row.profiles?.full_name || row.profiles?.username || 'Unknown Hunter',
  hunterRating: row.profiles?.reputation_score || 0,
  type: 'found' as any, // Default to 'found' - adjust based on your needs
  message: row.message || '',
  proofUrls: row.proof_urls || [],
  proofImages: [], // TODO: Handle image attachments
  status: row.status as ClaimStatus,
  submittedAt: new Date(row.created_at || Date.now()),
  updatedAt: new Date(row.created_at || Date.now())
});

// Supabase API functions
export const supabaseApi = {
  // Bounties
  async getBounties(page = 1, limit = 20, filters: SearchFilters = {}): Promise<PaginatedResponse<Bounty>> {
    try {
      let query = supabase
        .from('Bounties')
        .select(`
          *,
          profiles:poster_id (
            full_name,
            username,
            reputation_score,
            total_successful_claims,
            total_failed_claims
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.keyword) {
        query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }
      
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters.minBounty) {
        query = query.gte('amount', filters.minBounty);
      }
      
      if (filters.maxBounty) {
        query = query.lte('amount', filters.maxBounty);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('Bounties')
        .select('*', { count: 'exact', head: true });
      
      // Get paginated results
      const start = (page - 1) * limit;
      const { data, error } = await query.range(start, start + limit - 1);

      if (error) throw error;

      const bounties = (data || []).map(transformBountyRow);
      
      return {
        data: bounties,
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > start + limit
      };
    } catch (error) {
      console.error('Error fetching bounties:', error);
      throw error;
    }
  },

  async getBounty(id: string): Promise<Bounty | null> {
    try {
      const { data, error } = await supabase
        .from('Bounties')
        .select(`
          *,
          profiles:poster_id (
            full_name,
            username,
            reputation_score,
            total_successful_claims,
            total_failed_claims
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return transformBountyRow(data);
    } catch (error) {
      console.error('Error fetching bounty:', error);
      return null;
    }
  },

  async createBounty(formData: CreateBountyData): Promise<Bounty> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('Bounties')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          location: formData.location,
          amount: formData.bountyAmount,
          target_price_min: formData.targetPriceMin,
          target_price_max: formData.targetPriceMax,
          deadline: formData.deadline?.toISOString(),
          tags: formData.tags,
          verification_requirements: formData.verificationRequirements,
          images: formData.images,
          poster_id: user.id,
          status: 'open'
        })
        .select(`
          *,
          profiles:poster_id (
            full_name,
            username,
            reputation_score,
            total_successful_claims,
            total_failed_claims
          )
        `)
        .single();

      if (error) throw error;

      return transformBountyRow(data);
    } catch (error) {
      console.error('Error creating bounty:', error);
      throw error;
    }
  },

  async updateBountyStatus(id: string, status: BountyStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Bounties')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating bounty status:', error);
      return false;
    }
  },

  // Claims/Submissions
  async getClaims(bountyId: string): Promise<Claim[]> {
    try {
      const { data, error } = await supabase
        .from('Submissions')
        .select(`
          *,
          profiles:hunter_id (
            full_name,
            username,
            reputation_score
          )
        `)
        .eq('bounty_id', bountyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(transformSubmissionRow);
    } catch (error) {
      console.error('Error fetching claims:', error);
      throw error;
    }
  },

  async createClaim(bountyId: string, form: ClaimForm): Promise<Claim> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('Submissions')
        .insert({
          bounty_id: bountyId,
          hunter_id: user.id,
          message: form.message,
          proof_urls: form.proofUrls,
          status: 'submitted'
        })
        .select(`
          *,
          profiles:hunter_id (
            full_name,
            username,
            reputation_score
          )
        `)
        .single();

      if (error) throw error;

      return transformSubmissionRow(data);
    } catch (error) {
      console.error('Error creating claim:', error);
      throw error;
    }
  },

  // Messages (using existing message functions from MessageList component)
  async getMessageThreads(userId: string): Promise<MessageThread[]> {
    try {
      // Use the existing Supabase function
      const { data, error } = await supabase.rpc('get_user_conversations');
      
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: `${row.participant_1}-${row.participant_2}-${row.bounty_id}`,
        bountyId: row.bounty_id,
        bountyTitle: 'Bounty Discussion', // TODO: Get actual bounty title
        participants: [row.participant_1, row.participant_2],
        lastMessage: {
          id: 'last',
          threadId: '',
          bountyId: row.bounty_id,
          senderId: '',
          senderName: '',
          body: row.last_message,
          attachments: [],
          timestamp: new Date(row.last_message_at),
          isRead: row.unread_count === 0
        },
        unreadCount: row.unread_count,
        updatedAt: new Date(row.last_message_at)
      }));
    } catch (error) {
      console.error('Error fetching message threads:', error);
      return [];
    }
  },

  async getMessages(senderId: string, recipientId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!sender_id (full_name, username)
        `)
        .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        threadId: `${senderId}-${recipientId}`,
        bountyId: row.bounty_id,
        senderId: row.sender_id,
        senderName: row.sender_profile?.full_name || row.sender_profile?.username || 'Unknown',
        body: row.content,
        attachments: row.attachment_url ? [row.attachment_url] : [],
        timestamp: new Date(row.created_at),
        isRead: row.is_read
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  async sendMessage(recipientId: string, bountyId: string, body: string): Promise<Message> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          bounty_id: bountyId,
          content: body
        })
        .select(`
          *,
          sender_profile:profiles!sender_id (full_name, username)
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        threadId: `${user.id}-${recipientId}`,
        bountyId: data.bounty_id,
        senderId: data.sender_id,
        senderName: data.sender_profile?.full_name || data.sender_profile?.username || 'You',
        body: data.content,
        attachments: data.attachment_url ? [data.attachment_url] : [],
        timestamp: new Date(data.created_at),
        isRead: false
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Profile
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: data.id,
        displayName: data.full_name || data.username || '',
        email: '', // Email not stored in profiles table
        region: '', // TODO: Add region to profiles table
        rating: data.reputation_score || 0,
        ratingCount: (data.total_successful_claims || 0) + (data.total_failed_claims || 0),
        joinedAt: new Date(data.created_at || Date.now()),
        idvStatus: data.kyc_verified ? 'verified' : 'not_started' as any,
        hasPayoutMethod: false, // TODO: Add payout method tracking
        completedBounties: data.total_successful_claims || 0,
        postedBounties: 0 // TODO: Calculate from bounties table
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async updateProfile(userId: string, updates: { displayName?: string; region?: string }): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.displayName,
          // TODO: Add region field to profiles table
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        displayName: data.full_name || data.username || '',
        email: '',
        region: '',
        rating: data.reputation_score || 0,
        ratingCount: (data.total_successful_claims || 0) + (data.total_failed_claims || 0),
        joinedAt: new Date(data.created_at || Date.now()),
        idvStatus: data.kyc_verified ? 'verified' : 'not_started' as any,
        hasPayoutMethod: false,
        completedBounties: data.total_successful_claims || 0,
        postedBounties: 0
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },

  // User's bounties
  async getUserBounties(userId: string): Promise<Bounty[]> {
    try {
      const { data, error } = await supabase
        .from('Bounties')
        .select(`
          *,
          profiles:poster_id (
            full_name,
            username,
            reputation_score,
            total_successful_claims,
            total_failed_claims
          )
        `)
        .eq('poster_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(transformBountyRow);
    } catch (error) {
      console.error('Error fetching user bounties:', error);
      return [];
    }
  }
};