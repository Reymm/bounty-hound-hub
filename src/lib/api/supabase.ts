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
  ClaimType,
  IdvStatus,
  SearchFilters,
  PaginatedResponse,
  PostBountyForm,
  ClaimForm,
  Activity
} from '../types';

// Type helpers for database rows
type BountyRow = Database['public']['Tables']['Bounties']['Row'];
type SubmissionRow = Database['public']['Tables']['Submissions']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Helper to parse Supabase timestamps (treat naive ones as UTC)
const parseDbTimestamp = (value: string | null | undefined): Date => {
  if (!value) return new Date();
  
  // Normalize the timestamp: replace space with 'T' for ISO 8601 compliance
  let normalized = value.replace(' ', 'T');
  
  // If it already has timezone info, parse directly
  if (
    normalized.endsWith('Z') ||
    normalized.endsWith('z') ||
    /[+-]\d{2}:\d{2}$/.test(normalized)
  ) {
    return new Date(normalized);
  }
  
  // Add 'Z' suffix to treat as UTC
  return new Date(`${normalized}Z`);
};

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
function transformBountyRow(row: BountyRow, profile?: any, claimsCount?: number, isOfficial?: boolean): Bounty {
  return {
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
    deadline: row.deadline ? parseDbTimestamp(row.deadline as any) : undefined,
    status: row.status as BountyStatus,
    posterId: row.poster_id || '',
    posterName: profile?.full_name || profile?.username || 'Anonymous',
    posterRating: Number(profile?.average_rating || 0),
    posterRatingCount: Number(profile?.total_ratings_received || 0),
    isOfficial: isOfficial || false,
    verificationRequirements: row.verification_requirements || [],
    createdAt: parseDbTimestamp(row.created_at as any),
    updatedAt: parseDbTimestamp((row as any).updated_at || row.created_at as any),
    claimsCount: claimsCount || 0,
    viewsCount: row.view_count || 0,
    requires_shipping: row.requires_shipping || false,
    shippingDetails: row.shipping_details as any || undefined,
    shippingStatus: row.shipping_status || undefined,
    hunterPurchasesItem: row.hunter_purchases_item || false
  };
}

const transformSubmissionRow = (row: any): Claim => ({
  id: row.id,
  bountyId: row.bounty_id,
  hunterId: row.hunter_id,
  hunterName: 'Anonymous', // Will be overridden with actual profile data
  hunterRating: 0, // Will be overridden with actual profile data
  hunterRatingCount: 0, // Will be overridden with actual profile data
  type: 'found' as any, // Default to 'found' - adjust based on your needs
  message: row.message || '',
  proofUrls: row.proof_urls || [],
  proofImages: [], // TODO: Handle image attachments
  status: row.status as ClaimStatus,
  submittedAt: parseDbTimestamp(row.created_at as any),
  updatedAt: parseDbTimestamp((row as any).updated_at || row.created_at as any),
  rejectionReason: row.rejection_reason || undefined
});

// Supabase API functions
export const supabaseApi = {
  // Bounties
  async getBounties(page = 1, limit = 20, filters: SearchFilters = {}): Promise<PaginatedResponse<Bounty>> {
    try {
      // Use full-text search RPC when keyword is provided
      if (filters.keyword && filters.keyword.trim().length > 0) {
        return this._getBountiesFTS(page, limit, filters);
      }

      let query = supabase
        .from('Bounties')
        .select('*')
        .eq('status', 'open');

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      } else if (filters.category) {
        query = query.ilike('category', filters.category);
      }
      
      if (filters.subcategories && filters.subcategories.length > 0) {
        query = query.in('subcategory', filters.subcategories);
      } else if (filters.subcategory) {
        query = query.ilike('subcategory', filters.subcategory);
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

      if (filters.deadlineBefore) {
        query = query.lte('deadline', filters.deadlineBefore.toISOString());
      }

      // Filter by bounty type (Lead Only vs Find & Ship)
      if (filters.bountyType === 'lead_only') {
        query = query.eq('requires_shipping', false);
      } else if (filters.bountyType === 'find_ship') {
        query = query.eq('requires_shipping', true);
      }

      // Apply sorting
      if (filters.sortBy === 'top') {
        query = query.order('amount', { ascending: false }); // Highest payouts first
      } else if (filters.sortBy === 'soonest' || filters.deadline === 'soonest') {
        query = query.order('deadline', { ascending: true }); // Closest deadlines first
      } else {
        query = query.order('display_order', { ascending: true }).order('created_at', { ascending: false }); // Custom order, then newest
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('Bounties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      // Get paginated results
      const start = (page - 1) * limit;
      const { data, error } = await query.range(start, start + limit - 1);

      if (error) throw error;

      // Fetch related metadata for all bounties in parallel
      const [profileMap, claimsCountMap] = await Promise.all([
        this._fetchProfileMap(data),
        this._fetchClaimsCountMap(data),
      ]);

      return {
        data: data?.map(bounty => {
          // Remove shipping_details for unauthorized users
          const sanitizedBounty = { ...bounty };
          delete sanitizedBounty.shipping_details;
          const profile = profileMap.get(bounty.poster_id);
          return transformBountyRow(
            sanitizedBounty,
            profile,
            claimsCountMap.get(bounty.id) || 0,
            profile?.isOfficial
          );
        }) || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      console.error('Error fetching bounties:', error);
      throw error;
    }
  },

  /** Full-text search using Postgres tsvector */
  async _getBountiesFTS(page = 1, limit = 20, filters: SearchFilters = {}): Promise<PaginatedResponse<Bounty>> {
    const offset = (page - 1) * limit;
    
    const { data, error } = await supabase.rpc('search_bounties_fts', {
      search_query: filters.keyword!,
      category_filter: filters.category || (filters.categories?.length === 1 ? filters.categories[0] : null),
      status_filter: 'open',
      result_limit: limit,
      result_offset: offset,
    });

    if (error) {
      console.warn('FTS search failed, falling back to ilike:', error);
      // Fallback: run ilike search if FTS fails (e.g., empty tsvector)
      return this._getBountiesIlikeFallback(page, limit, filters);
    }

    if (!data || data.length === 0) {
      // FTS returned no results — try ilike fallback for partial matches
      return this._getBountiesIlikeFallback(page, limit, filters);
    }

    // Fetch related metadata in parallel
    const [profileMap, claimsCountMap] = await Promise.all([
      this._fetchProfileMap(data),
      this._fetchClaimsCountMap(data),
    ]);

    return {
      data: data.map((row: any) => {
        const profile = profileMap.get(row.poster_id);
        return transformBountyRow(
          row as BountyRow,
          profile,
          claimsCountMap.get(row.id) || 0,
          profile?.isOfficial
        );
      }),
      total: data.length + offset, // Approximate; FTS doesn't give exact count easily
      page,
      limit,
      hasMore: data.length === limit
    };
  },

  /** Fallback ilike search for when FTS returns no results */
  async _getBountiesIlikeFallback(page = 1, limit = 20, filters: SearchFilters = {}): Promise<PaginatedResponse<Bounty>> {
    const searchTerm = filters.keyword || '';
    let query = supabase
      .from('Bounties')
      .select('*')
      .eq('status', 'open')
      .or(
        `title.ilike.%${searchTerm}%,` +
        `description.ilike.%${searchTerm}%,` +
        `location.ilike.%${searchTerm}%,` +
        `category.ilike.%${searchTerm}%,` +
        `subcategory.ilike.%${searchTerm}%`
      );

    if (filters.categories?.length) {
      query = query.in('category', filters.categories);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const start = (page - 1) * limit;
    const { data, error } = await query.range(start, start + limit - 1);
    if (error) throw error;

    const [profileMap, claimsCountMap] = await Promise.all([
      this._fetchProfileMap(data),
      this._fetchClaimsCountMap(data),
    ]);

    return {
      data: data?.map(bounty => {
        const sanitizedBounty = { ...bounty };
        delete sanitizedBounty.shipping_details;
        const profile = profileMap.get(bounty.poster_id);
        return transformBountyRow(
          sanitizedBounty,
          profile,
          claimsCountMap.get(bounty.id) || 0,
          profile?.isOfficial
        );
      }) || [],
      total: data?.length || 0,
      page,
      limit,
      hasMore: (data?.length || 0) === limit
    };
  },

  /** Shared helper to fetch profile data for a list of bounty rows */
  async _fetchProfileMap(data: any[] | null): Promise<Map<string, any>> {
    const posterIds = data?.map(b => b.poster_id).filter(Boolean) || [];
    const uniquePosterIds = [...new Set(posterIds)];
    let profileMap = new Map<string, any>();
    
    try {
      const profileFetchPromise = Promise.all(
        uniquePosterIds.map(async (posterId) => {
          const [profileResult, officialResult] = await Promise.all([
            supabase.rpc('get_public_profile_data', { profile_id: posterId }),
            supabase.rpc('is_official_account', { p_user_id: posterId })
          ]);
          return profileResult.data?.[0] ? { 
            id: posterId, 
            ...profileResult.data[0],
            total_failed_claims: 0,
            isOfficial: officialResult.data || false
          } : null;
        })
      );
      
      const timeoutPromise = new Promise<null[]>((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      const profiles = await Promise.race([profileFetchPromise, timeoutPromise]);
      profileMap = new Map(
        (profiles || [])
          .filter(Boolean)
          .map(p => [p!.id, p])
      );
    } catch (profileError) {
      console.warn('Profile data fetch timed out or failed:', profileError);
    }

    return profileMap;
  },

  /** Shared helper to fetch claim counts for a list of bounty rows */
  async _fetchClaimsCountMap(data: any[] | null | undefined): Promise<Map<string, number>> {
    const bountyIds = data?.map(b => b.id).filter(Boolean) || [];
    const uniqueBountyIds = [...new Set(bountyIds)];

    if (uniqueBountyIds.length === 0) {
      return new Map<string, number>();
    }

    const claimCounts = await Promise.all(
      uniqueBountyIds.map(async (bountyId) => {
        try {
          const { data: count, error } = await supabase.rpc('get_bounty_claims_count', {
            p_bounty_id: bountyId,
          });

          if (error) throw error;

          return [bountyId, count || 0] as const;
        } catch (error) {
          console.warn(`Failed to fetch claim count for bounty ${bountyId}:`, error);
          return [bountyId, 0] as const;
        }
      })
    );

    return new Map(claimCounts);
  },

  async getBounty(id: string): Promise<Bounty | null> {
    try {
      // First increment the view count securely
      await supabase.rpc('increment_bounty_views_secure', { p_bounty_id: id });

      const { data, error } = await supabase
        .from('Bounties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      // Get count of submissions for this bounty using secure function
      // (RLS blocks direct count for non-poster/non-hunter users)
      const { data: submissionsCount } = await supabase
        .rpc('get_bounty_claims_count', { p_bounty_id: id });

      // Check if user can view shipping details
      const { data: user } = await supabase.auth.getUser();
      let canViewShipping = false;
      
      if (user?.user) {
        const { data: canView } = await supabase.rpc('can_view_shipping_details', { 
          p_bounty_id: id 
        });
        canViewShipping = canView || false;
      }

      // Remove shipping_details if user is not authorized
      if (!canViewShipping && data) {
        delete data.shipping_details;
      }

      // Fetch profile data and official status using secure functions
      const [publicProfileResult, officialResult] = await Promise.all([
        supabase.rpc('get_public_profile_data', { profile_id: data.poster_id }),
        supabase.rpc('is_official_account', { p_user_id: data.poster_id })
      ]);
      
      const profile = publicProfileResult.data?.[0] ? {
        ...publicProfileResult.data[0],
        full_name: publicProfileResult.data[0].username,
        total_failed_claims: 0
      } : null;

      return transformBountyRow(data, profile, submissionsCount || 0, officialResult.data || false);
    } catch (error) {
      console.error('Error fetching bounty:', error);
      return null;
    }
  },

  async getBountiesByIds(ids: string[]): Promise<Bounty[]> {
    try {
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from('Bounties')
        .select('*')
        .in('id', ids);

      if (error) throw error;

      // Fetch profile data for all bounties using secure function
      const posterIds = data?.map(bounty => bounty.poster_id).filter(Boolean) || [];
      const uniquePosterIds = [...new Set(posterIds)];
      
      const profilePromises = uniquePosterIds.map(async (posterId) => {
        const { data } = await supabase.rpc('get_public_profile_data', {
          profile_id: posterId
        });
        return data?.[0] ? { 
          id: posterId, 
          ...data[0],
          total_failed_claims: 0
        } : null;
      });
      
      const profiles = await Promise.all(profilePromises);
      const profileMap = new Map(
        profiles
          .filter(Boolean)
          .map(p => [p.id, p])
      );
      const claimsCountMap = await this._fetchClaimsCountMap(data);

      // Maintain order of IDs
      const bountyMap = new Map(data?.map(b => [b.id, b]) || []);
      return ids
        .map(id => bountyMap.get(id))
        .filter(Boolean)
        .map(bounty => {
          const sanitizedBounty = { ...bounty };
          delete sanitizedBounty.shipping_details;
          return transformBountyRow(
            sanitizedBounty,
            profileMap.get(bounty.poster_id),
            claimsCountMap.get(bounty.id) || 0
          );
        });
    } catch (error) {
      console.error('Error fetching bounties by IDs:', error);
      return [];
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
        .select('*')
        .single();

      if (error) throw error;

      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, username, reputation_score, total_successful_claims, total_failed_claims')
        .eq('id', user.id)
        .single();

      return transformBountyRow(data, profile);
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

  async updateBountyShippingDetails(bountyId: string, shippingDetails: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Bounties')
        .update({ 
          shipping_details: shippingDetails,
          shipping_status: 'provided'
        })
        .eq('id', bountyId);

      if (error) throw error;

      // Notify hunter via edge function
      await supabase.functions.invoke('send-shipping-notification', {
        body: { bountyId, shippingDetails }
      });

      return true;
    } catch (error) {
      console.error('Error updating shipping details:', error);
      return false;
    }
  },

  async updateBountyShippingStatus(bountyId: string, status: 'not_requested' | 'requested' | 'provided' | 'not_provided'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Bounties')
        .update({ shipping_status: status })
        .eq('id', bountyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating shipping status:', error);
      return false;
    }
  },

  // Claims/Submissions
  async getClaims(bountyId: string): Promise<Claim[]> {
    try {
      const { data, error } = await supabase
        .from('Submissions')
        .select('*')
        .eq('bounty_id', bountyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for all hunters using secure function
      const hunterIds = data?.map(submission => submission.hunter_id).filter(Boolean) || [];
      const profilePromises = hunterIds.map(async (hunterId) => {
        const { data } = await supabase.rpc('get_public_profile_data', {
          profile_id: hunterId
        });
        return data?.[0] ? { 
          id: hunterId, 
          ...data[0],
          full_name: data[0].username // Use username as display name for public profiles
        } : null;
      });
      
      const profiles = await Promise.all(profilePromises);
      const profileMap = new Map(
        profiles
          .filter(Boolean)
          .map(p => [p.id, p])
      );

      return (data || []).map(submission => ({
        ...transformSubmissionRow(submission),
        hunterName: profileMap.get(submission.hunter_id)?.username || 'Anonymous',
        hunterRating: profileMap.get(submission.hunter_id)?.average_rating || 0,
        hunterRatingCount: profileMap.get(submission.hunter_id)?.total_ratings_received || 0
      }));
    } catch (error) {
      console.error('Error fetching claims:', error);
      throw error;
    }
  },

  async createClaim(bountyId: string, form: ClaimForm): Promise<Claim> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      // Combine proof URLs and uploaded images into one array
      const allProofUrls = [...form.proofUrls, ...form.proofImages];

      const { data, error } = await supabase
        .from('Submissions')
        .insert({
          bounty_id: bountyId,
          hunter_id: user.id,
          message: form.message,
          proof_urls: allProofUrls,
          status: 'submitted'
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch profile data using secure function
      const { data: publicProfile } = await supabase.rpc('get_public_profile_data', {
        profile_id: user.id
      });

      const profile = publicProfile?.[0];

      // Send notification email to bounty poster
      try {
        await supabase.functions.invoke('send-submission-notification', {
          body: {
            bountyId,
            hunterId: user.id,
            submissionId: data.id
          }
        });
      } catch (emailError) {
        console.log('Failed to send submission notification:', emailError);
        // Don't fail the whole request if email fails
      }

      return {
        ...transformSubmissionRow(data),
        hunterName: profile?.username || 'You',
        hunterRating: profile?.reputation_score || 5,
        hunterRatingCount: profile?.total_ratings_received || 0
      };
    } catch (error) {
      console.error('Error creating claim:', error);
      throw error;
    }
  },

  async updateClaimStatus(submissionId: string, status: ClaimStatus, rejectionReason?: string): Promise<boolean> {
    try {
      const updates: Partial<SubmissionRow> = {
        status,
        // Only store a rejection reason when status is rejected
        rejection_reason: status === ClaimStatus.REJECTED ? (rejectionReason || null) : null
      };

      const { data, error } = await supabase
        .from('Submissions')
        .update(updates)
        .eq('id', submissionId)
        .select('id');

      if (error) throw error;
      
      // Send notification to hunter when status changes to accepted or rejected
      if ((status === ClaimStatus.ACCEPTED || status === ClaimStatus.REJECTED) && data && data.length > 0) {
        try {
          await supabase.functions.invoke('send-submission-status-notification', {
            body: {
              submissionId,
              newStatus: status,
              rejectionReason: status === ClaimStatus.REJECTED ? rejectionReason : undefined
            }
          });
        } catch (notifError) {
          console.error('Failed to send notification, but submission status updated:', notifError);
        }
      }
      
      return Array.isArray(data) && data.length > 0;
    } catch (error) {
      console.error('Error updating claim status:', error);
      return false;
    }
  },

  // Messages (using existing message functions from MessageList component)
  async getMessageThreads(userId: string): Promise<MessageThread[]> {
    try {
      // Use the existing Supabase function
      const { data, error } = await supabase.rpc('get_user_conversations');
      
      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Get unique bounty IDs and other participant IDs to fetch their info
      const bountyIds = [...new Set(data.filter((row: any) => row.bounty_id).map((row: any) => row.bounty_id))];
      const otherParticipantIds = [...new Set(data.map((row: any) => 
        row.participant_1 === userId ? row.participant_2 : row.participant_1
      ))];

      // Fetch bounty titles
      const bountiesResult = bountyIds.length > 0 
        ? await supabase.from('Bounties').select('id, title').in('id', bountyIds)
        : { data: [] };

      // Fetch participant profiles using RPC to bypass RLS (same pattern as getMessages)
      const profilePromises = otherParticipantIds.map(id => 
        supabase.rpc('get_public_profile_data', { profile_id: id }).maybeSingle()
      );
      const profileResults = await Promise.all(profilePromises);

      const bountyMap = new Map((bountiesResult.data || []).map(b => [b.id, b.title]));
      
      // Create profile map from RPC results
      const profileMap = new Map<string, string>();
      otherParticipantIds.forEach((id, index) => {
        const profile = profileResults[index]?.data;
        profileMap.set(id, profile?.username || 'Unknown User');
      });

      return (data || []).map((row: any) => {
        const otherParticipantId = row.participant_1 === userId ? row.participant_2 : row.participant_1;
        const otherParticipantName = profileMap.get(otherParticipantId) || 'Unknown User';
        const bountyTitle = bountyMap.get(row.bounty_id) || 'Direct Message';

        // Include bounty_id in thread ID to make each bounty conversation unique
        const participantPart = [row.participant_1, row.participant_2].sort().join('___');
        const threadId = row.bounty_id ? `${participantPart}:::${row.bounty_id}` : participantPart;

        return {
          id: threadId,
          bountyId: row.bounty_id,
          bountyTitle: bountyTitle,
          otherParticipantName: otherParticipantName,
          participants: [row.participant_1, row.participant_2],
          lastMessage: {
            id: 'last',
            threadId: threadId,
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
        };
      });
    } catch (error) {
      console.error('Error fetching message threads:', error);
      return [];
    }
  },

  async getMessages(senderId: string, recipientId: string, bountyId?: string): Promise<Message[]> {
    try {
      // Fetch messages without profile join (RLS blocks profile access)
      let query = supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`);
      
      // Filter by bounty_id if provided
      if (bountyId) {
        query = query.eq('bounty_id', bountyId);
      }
      
      const { data: messagesData, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      // Get unique sender IDs and fetch their profiles using RPC to bypass RLS
      const senderIds = [...new Set((messagesData || []).map(m => m.sender_id))];
      
      // Fetch all sender profiles in parallel
      const profilePromises = senderIds.map(id => 
        supabase.rpc('get_public_profile_data', { profile_id: id }).maybeSingle()
      );
      const profileResults = await Promise.all(profilePromises);
      
      // Create a map of id -> username
      const profileMap = new Map<string, string>();
      senderIds.forEach((id, index) => {
        const profile = profileResults[index]?.data;
        profileMap.set(id, profile?.username || 'Unknown User');
      });

      return (messagesData || []).map((row: any) => ({
        id: row.id,
        threadId: `${senderId}-${recipientId}`,
        bountyId: row.bounty_id,
        senderId: row.sender_id,
        senderName: profileMap.get(row.sender_id) || 'Unknown User',
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
        .select('*')
        .single();

      if (error) throw error;

      const { data: senderProfile } = await supabase
        .rpc('get_public_profile_data', { profile_id: user.id })
        .maybeSingle();

      const senderName = senderProfile?.username || 'Someone';
      supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: recipientId,
          title: `💬 ${senderName}`,
          body: body.length > 100 ? body.slice(0, 100) + '…' : body,
          data: { bountyId, route: `/messages` },
          notification_type: 'messages',
        }
      }).catch(() => {}); // fire-and-forget

      return {
        id: data.id,
        threadId: `${user.id}-${recipientId}`,
        bountyId: data.bounty_id,
        senderId: data.sender_id,
        senderName: senderProfile?.username || 'You',
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
      // Check if this is the current user's profile (full access)
      const { data: { user } } = await supabase.auth.getUser();
      
      let profileData;
      let isOfficial = false;
      
      if (user && user.id === userId) {
        // Full profile access for own profile
        const [profileResult, officialResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.rpc('is_official_account', { p_user_id: userId })
        ]);

        if (profileResult.error) {
          if (profileResult.error.code === 'PGRST116') return null;
          throw profileResult.error;
        }
        profileData = profileResult.data;
        isOfficial = officialResult.data || false;
      } else {
        // Public profile access for other users
        const [profileResult, officialResult] = await Promise.all([
          supabase.rpc('get_public_profile_data', { profile_id: userId }),
          supabase.rpc('is_official_account', { p_user_id: userId })
        ]);

        if (profileResult.error) throw profileResult.error;
        if (!profileResult.data || profileResult.data.length === 0) return null;
        
        isOfficial = officialResult.data || false;
        
        // Convert RPC result to full profile format with limited data
        profileData = {
          id: profileResult.data[0].id,
          username: profileResult.data[0].username,
          avatar_url: profileResult.data[0].avatar_url,
          reputation_score: profileResult.data[0].reputation_score,
          total_successful_claims: profileResult.data[0].total_successful_claims,
          // Default values for sensitive fields
          full_name: null,
          bio: null,
          kyc_verified: false,
          kyc_verified_at: null,
          total_failed_claims: 0,
          is_suspended: false,
          suspended_until: null,
          created_at: null
        };
      }

      // Get user email from auth.users (only for own profile)
      const userEmail = (user && user.id === userId) ? user.email : '';

      // Get user's active bounty count (excluding cancelled/expired)
      const { count: userBounties } = await supabase
        .from('Bounties')
        .select('*', { count: 'exact', head: true })
        .eq('poster_id', userId)
        .in('status', ['open', 'closed', 'completed']);

      return {
        id: profileData.id,
        displayName: profileData.full_name || profileData.username || 'Anonymous',
        username: profileData.username || undefined,
        email: userEmail || '',
        bio: profileData.bio || undefined,
        avatarUrl: profileData.avatar_url || undefined,
        region: profileData.region || 'Unknown',
        rating: profileData.reputation_score || 5.0,
        ratingCount: (profileData.total_successful_claims || 0) + (profileData.total_failed_claims || 0),
        average_rating: profileData.average_rating || 5.0,
        total_ratings_received: profileData.total_ratings_received || 0,
        total_ratings_given: profileData.total_ratings_given || 0,
        joinedAt: profileData.created_at ? new Date(profileData.created_at) : new Date(),
        idvStatus: profileData.stripe_connect_onboarding_complete ? IdvStatus.VERIFIED : IdvStatus.NOT_VERIFIED,
        hasPayoutMethod: profileData.stripe_connect_onboarding_complete || false,
        completedBounties: profileData.total_successful_claims || 0,
        postedBounties: userBounties || 0,
        reputationScore: profileData.reputation_score || 5.0,
        totalSuccessfulClaims: profileData.total_successful_claims || 0,
        totalFailedClaims: profileData.total_failed_claims || 0,
        isSuspended: profileData.is_suspended || false,
        suspendedUntil: profileData.suspended_until ? new Date(profileData.suspended_until) : undefined,
        stripeConnectOnboardingComplete: profileData.stripe_connect_onboarding_complete || false,
        stripeConnectPayoutsEnabled: profileData.stripe_connect_payouts_enabled || false,
        payoutCountry: profileData.payout_country || undefined,
        payoutEmail: profileData.payout_email || undefined,
        isOfficial,
        identityVerified: profileData.identity_verified || false,
        identitySessionId: profileData.identity_session_id || undefined
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async updateProfile(userId: string, updates: { displayName?: string; username?: string; bio?: string; region?: string; avatarUrl?: string; payoutCountry?: string; payoutEmail?: string }): Promise<Profile | null> {
    try {
      const updateData: any = {};
      if (updates.displayName !== undefined) updateData.full_name = updates.displayName;
      if (updates.username !== undefined) updateData.username = updates.username || null;
      if (updates.bio !== undefined) updateData.bio = updates.bio || null;
      if (updates.region !== undefined) updateData.region = updates.region || null;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl || null;
      if (updates.payoutCountry !== undefined) updateData.payout_country = updates.payoutCountry || null;
      if (updates.payoutEmail !== undefined) updateData.payout_email = updates.payoutEmail || null;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        displayName: data.full_name || data.username || '',
        username: data.username || undefined,
        email: '',
        bio: data.bio || undefined,
        avatarUrl: data.avatar_url || undefined,
        region: data.region || 'Unknown',
        rating: data.reputation_score || 0,
        ratingCount: (data.total_successful_claims || 0) + (data.total_failed_claims || 0),
        average_rating: data.average_rating || 5.0,
        total_ratings_received: data.total_ratings_received || 0,
        total_ratings_given: data.total_ratings_given || 0,
        joinedAt: new Date(data.created_at || Date.now()),
        idvStatus: data.stripe_connect_onboarding_complete ? IdvStatus.VERIFIED : IdvStatus.NOT_VERIFIED,
        hasPayoutMethod: data.stripe_connect_onboarding_complete || false,
        completedBounties: data.total_successful_claims || 0,
        postedBounties: 0,
        reputationScore: data.reputation_score || 0,
        totalSuccessfulClaims: data.total_successful_claims || 0,
        totalFailedClaims: data.total_failed_claims || 0,
        isSuspended: data.is_suspended || false,
        suspendedUntil: data.suspended_until ? new Date(data.suspended_until) : undefined,
        stripeConnectOnboardingComplete: data.stripe_connect_onboarding_complete || false,
        stripeConnectPayoutsEnabled: data.stripe_connect_payouts_enabled || false,
        payoutCountry: data.payout_country || undefined,
        payoutEmail: data.payout_email || undefined,
        identityVerified: data.identity_verified || false,
        identitySessionId: data.identity_session_id || undefined
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },


  // Get user activity history
  async getUserActivity(userId: string): Promise<Activity[]> {
    try {
      const activities: Activity[] = [];

      // Get bounties posted
      const { data: bounties } = await supabase
        .from('Bounties')
        .select('id, title, amount, created_at, status')
        .eq('poster_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (bounties) {
        bounties.forEach(bounty => {
          activities.push({
            id: `bounty-${bounty.id}`,
            type: 'bounty_posted',
            title: 'Bounty Posted',
            description: `Posted a bounty`,
            bountyId: bounty.id,
            bountyTitle: bounty.title,
            amount: bounty.amount,
            createdAt: new Date(bounty.created_at)
          });
        });
      }

      // Get submissions (claims)
      const { data: submissions } = await supabase
        .from('Submissions')
        .select(`
          id,
          bounty_id,
          status,
          created_at,
          rejection_reason,
          Bounties!inner(title, amount)
        `)
        .eq('hunter_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (submissions) {
        submissions.forEach((submission: any) => {
          if (submission.status === 'submitted') {
            activities.push({
              id: `submission-${submission.id}`,
              type: 'claim_submitted',
              title: 'Claim Submitted',
              description: 'Submitted a claim for review',
              bountyId: submission.bounty_id,
              bountyTitle: submission.Bounties?.title,
              amount: submission.Bounties?.amount,
              createdAt: new Date(submission.created_at)
            });
          } else if (submission.status === 'accepted') {
            activities.push({
              id: `submission-accepted-${submission.id}`,
              type: 'claim_accepted',
              title: 'Claim Accepted',
              description: 'Your claim was accepted!',
              bountyId: submission.bounty_id,
              bountyTitle: submission.Bounties?.title,
              amount: submission.Bounties?.amount,
              createdAt: new Date(submission.created_at)
            });
          } else if (submission.status === 'rejected') {
            activities.push({
              id: `submission-rejected-${submission.id}`,
              type: 'claim_rejected',
              title: 'Claim Rejected',
              description: submission.rejection_reason || 'Your claim was not accepted',
              bountyId: submission.bounty_id,
              bountyTitle: submission.Bounties?.title,
              createdAt: new Date(submission.created_at)
            });
          }
        });
      }

      // Get ratings received
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          bounty_id,
          Bounties!inner(title)
        `)
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ratings) {
        ratings.forEach((rating: any) => {
          activities.push({
            id: `rating-${rating.id}`,
            type: 'rating_received',
            title: 'Rating Received',
            description: rating.review_text || 'Received a rating',
            bountyId: rating.bounty_id,
            bountyTitle: rating.Bounties?.title,
            rating: rating.rating,
            createdAt: new Date(rating.created_at)
          });
        });
      }

      // Sort all activities by date
      return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  },

  // Stripe Connect methods
  async createConnectAccount(country?: string): Promise<{ onboarding_url?: string; account_id?: string; status?: string; code?: string; message?: string; error?: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: { country }
      });

      // Check for country unsupported error in the response
      if (data?.code === 'country_unsupported') {
        return {
          code: 'country_unsupported',
          message: data.message,
          error: data.error
        };
      }

      if (error) throw error;
      
      return {
        onboarding_url: data.onboarding_url,
        account_id: data.account_id,
        status: data.status
      };
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw error;
    }
  },

  async checkConnectStatus(): Promise<{
    has_account: boolean;
    onboarding_complete: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking Connect status:', error);
      throw error;
    }
  },

  async processPayout(submissionId: string): Promise<{
    success: boolean;
    transfer_id?: string;
    amount?: number;
    platform_fee?: number;
    error?: string;
    requires_verification?: boolean;
    dispute_blocked?: boolean;
    payout_frozen?: boolean;
    freeze_reason?: string;
    already_captured?: boolean;
    capture_in_progress?: boolean;
    lock_failed?: boolean;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('process-payout', {
        body: { submissionId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error processing payout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payout'
      };
    }
  },

  async releaseFunds(submissionId: string): Promise<{
    success: boolean;
    transfer_id?: string;
    amount?: number;
    platform_fee?: number;
    hunter_name?: string;
    error?: string;
    already_released?: boolean;
    hold_not_elapsed?: boolean;
    eligible_at?: string;
    hours_remaining?: number;
    message?: string;
  }> {
    try {
      // Always pass earlyRelease: true since this is the "Release Funds Early" button
      const { data, error } = await supabase.functions.invoke('release-funds', {
        body: { submissionId, earlyRelease: true },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error releasing funds:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release funds'
      };
    }
  },

  // User's bounties
  async getUserBounties(userId: string): Promise<Bounty[]> {
    try {
      const { data, error } = await supabase
        .from('Bounties')
        .select('*')
        .eq('poster_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data using secure function
      const { data: publicProfile } = await supabase.rpc('get_public_profile_data', {
        profile_id: userId
      });
      
      const profile = publicProfile?.[0] ? {
        ...publicProfile[0],
        full_name: publicProfile[0].username, // Use username as display name for public profiles
        total_failed_claims: 0 // Default for public access
      } : null;

      // Fetch claims counts for all bounties
      const claimsCounts = await Promise.all(
        (data || []).map(async (bounty) => {
          const { data: count } = await supabase.rpc('get_bounty_claims_count', { p_bounty_id: bounty.id });
          return { id: bounty.id, count: count || 0 };
        })
      );
      const countsMap = new Map(claimsCounts.map(c => [c.id, c.count]));

      return (data || []).map(bounty => transformBountyRow(bounty, profile, countsMap.get(bounty.id) || 0));
    } catch (error) {
      console.error('Error fetching user bounties:', error);
      return [];
    }
  },

  // User's submissions (applied bounties)
  async getUserSubmissions(userId: string): Promise<(Bounty & { claim: Claim })[]> {
    try {
      // Get all submissions for this user
      const { data: submissions, error: submissionsError } = await supabase
        .from('Submissions')
        .select('*')
        .eq('hunter_id', userId)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      if (!submissions || submissions.length === 0) return [];

      // Fetch all related bounties in a separate query to avoid join issues
      const bountyIds = Array.from(new Set(submissions.map((s: any) => s.bounty_id)));

      const { data: bounties, error: bountiesError } = await supabase
        .from('Bounties')
        .select('*')
        .in('id', bountyIds);

      if (bountiesError) throw bountiesError;

      const bountyById = new Map<string, any>();
      (bounties || []).forEach((b: any) => bountyById.set(b.id, b));
      const claimsCountMap = await this._fetchClaimsCountMap(bounties || []);

      // Transform the data
      const result = await Promise.all(
        submissions.map(async (submission: any) => {
          const bountyData = bountyById.get(submission.bounty_id);
          if (!bountyData) return null;
          
          // Get poster profile
          const { data: posterProfile } = await supabase.rpc('get_public_profile_data', {
            profile_id: bountyData.poster_id
          });

          const profile = posterProfile?.[0] || null;

          // Transform bounty
          const bounty = transformBountyRow(
            bountyData,
            profile,
            claimsCountMap.get(bountyData.id) || 0
          );

          // Transform claim
          const claim: Claim = {
            id: submission.id,
            bountyId: submission.bounty_id,
            hunterId: submission.hunter_id,
            hunterName: 'You',
            hunterRating: 5,
            hunterRatingCount: 0,
            type: 'found' as ClaimType,
            message: submission.message || '',
            proofUrls: submission.proof_urls || [],
            proofImages: [],
            status: submission.status as ClaimStatus,
            submittedAt: new Date(submission.created_at),
            updatedAt: new Date(submission.updated_at || submission.created_at),
            rejectionReason: submission.rejection_reason || undefined
          };

          return {
            ...bounty,
            claim
          };
        })
      );

      // Filter out any nulls (in case a bounty wasn't found due to RLS)
      return result.filter((item): item is Bounty & { claim: Claim } => item !== null);
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      return [];
    }
  }
};