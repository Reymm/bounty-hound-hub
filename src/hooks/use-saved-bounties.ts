import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useSavedBounties() {
  const [savedBountyIds, setSavedBountyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadSavedBounties = useCallback(async () => {
    if (!user) {
      setSavedBountyIds(new Set());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_bounties')
        .select('bounty_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedBountyIds(new Set(data.map(item => item.bounty_id)));
    } catch (error) {
      console.error('Error loading saved bounties:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedBounties();
  }, [loadSavedBounties]);

  const toggleSave = useCallback(async (bountyId: string) => {
    // Wrap entire function in try-catch for native app safety
    try {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save bounties.",
          variant: "destructive",
        });
        return;
      }

      const isSaved = savedBountyIds.has(bountyId);

      // Optimistic update
      setSavedBountyIds(prev => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.delete(bountyId);
        } else {
          newSet.add(bountyId);
        }
        return newSet;
      });

      try {
        if (isSaved) {
          const { error } = await supabase
            .from('saved_bounties')
            .delete()
            .eq('user_id', user.id)
            .eq('bounty_id', bountyId);

          if (error) throw error;

          toast({
            title: "Bounty removed",
            description: "Removed from your saved bounties.",
          });
        } else {
          const { error } = await supabase
            .from('saved_bounties')
            .insert({ user_id: user.id, bounty_id: bountyId });

          if (error) throw error;

          toast({
            title: "Bounty saved",
            description: "Added to your saved bounties.",
          });
        }
      } catch (error) {
        // Revert optimistic update
        setSavedBountyIds(prev => {
          const newSet = new Set(prev);
          if (isSaved) {
            newSet.add(bountyId);
          } else {
            newSet.delete(bountyId);
          }
          return newSet;
        });

        try {
          console.error('Error toggling save:', error);
        } catch {
          // Ignore logging errors
        }
        
        toast({
          title: "Error",
          description: "Failed to update saved bounties.",
          variant: "destructive",
        });
      }
    } catch (outerError) {
      // Catch any unexpected errors to prevent app crash
      try {
        console.error('Unexpected error in toggleSave:', outerError);
      } catch {
        // Ignore
      }
    }
  }, [user, savedBountyIds, toast]);

  const isSaved = useCallback((bountyId: string) => {
    return savedBountyIds.has(bountyId);
  }, [savedBountyIds]);

  return {
    savedBountyIds,
    loading,
    toggleSave,
    isSaved,
    refresh: loadSavedBounties,
  };
}
