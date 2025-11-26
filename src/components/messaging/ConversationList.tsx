import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  participant_1: string;
  participant_2: string;
  bounty_id?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  other_user?: {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  };
  bounty?: {
    title: string;
  };
}

interface ConversationListProps {
  currentUserId: string;
  onConversationSelect: (recipientId: string, bountyId?: string) => void;
  selectedRecipient?: string;
}

export function ConversationList({ 
  currentUserId, 
  onConversationSelect, 
  selectedRecipient 
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refresh conversations when new messages arrive
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchConversations = async () => {
    try {
      // Get conversations using a custom query since we removed the view
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          recipient_id,
          bounty_id,
          content,
          created_at,
          is_read
        `)
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process messages to create conversation list
      const conversationMap = new Map();
      
      messagesData?.forEach(message => {
        const otherUserId = message.sender_id === currentUserId 
          ? message.recipient_id 
          : message.sender_id;
        
        const key = `${otherUserId}-${message.bounty_id || 'direct'}`;
        
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            other_user_id: otherUserId,
            bounty_id: message.bounty_id,
            last_message: message.content,
            last_message_at: message.created_at,
            unread_count: 0
          });
        }
        
        // Count unread messages
        if (message.recipient_id === currentUserId && !message.is_read) {
          conversationMap.get(key).unread_count++;
        }
      });

      // Fetch user profiles and bounty info for conversations
      const conversationList = Array.from(conversationMap.values());
      
      // Get unique user IDs and bounty IDs
      const userIds = [...new Set(conversationList.map(c => c.other_user_id))];
      const bountyIds = [...new Set(conversationList.filter(c => c.bounty_id).map(c => c.bounty_id))];

      const [usersData, bountiesData] = await Promise.all([
        userIds.length > 0 ? supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds) : { data: [] },
        bountyIds.length > 0 ? supabase
          .from('Bounties')
          .select('id, title')
          .in('id', bountyIds) : { data: [] }
      ]);

      // Combine data
      const enrichedConversations = conversationList.map(conv => {
        const userProfile = usersData.data?.find(u => u.id === conv.other_user_id);
        const bountyInfo = bountiesData.data?.find(b => b.id === conv.bounty_id);
        
        return {
          participant_1: currentUserId < conv.other_user_id ? currentUserId : conv.other_user_id,
          participant_2: currentUserId < conv.other_user_id ? conv.other_user_id : currentUserId,
          bounty_id: conv.bounty_id,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: conv.unread_count,
          other_user: userProfile,
          bounty: bountyInfo
        };
      });

      setConversations(enrichedConversations);
    } catch (error: any) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading conversations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => {
              const otherUserId = conversation.other_user?.id || 
                (conversation.participant_1 === currentUserId 
                  ? conversation.participant_2 
                  : conversation.participant_1);
              
              return (
                <div
                  key={`${otherUserId}-${conversation.bounty_id || 'direct'}`}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedRecipient === otherUserId ? 'bg-muted' : ''
                  }`}
                  onClick={() => onConversationSelect(otherUserId, conversation.bounty_id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.other_user?.avatar_url} />
                      <AvatarFallback>
                        {conversation.other_user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">
                          {conversation.other_user?.username || 'Unknown User'}
                        </h4>
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="ml-2">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      
                      {conversation.bounty && (
                        <p className="text-xs text-muted-foreground truncate">
                          Re: {conversation.bounty.title}
                        </p>
                      )}
                      
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversation.last_message}
                      </p>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(conversation.last_message_at), { 
                          addSuffix: true 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}