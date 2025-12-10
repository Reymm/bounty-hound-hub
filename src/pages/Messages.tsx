import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Send, Paperclip, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageThread, Message } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Messages() {
  const location = useLocation();
  const stateData = location.state as { recipientId?: string; bountyId?: string; bountyTitle?: string } | null;
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [otherParticipantName, setOtherParticipantName] = useState<string>('');
  const [otherParticipantAvatar, setOtherParticipantAvatar] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadThreads();
  }, []);

  // Handle incoming state from bounty detail page
  useEffect(() => {
    if (stateData?.recipientId && stateData?.bountyId && user && threads.length > 0) {
      // Find existing conversation with this user for this bounty
      const existingThread = threads.find(t => 
        t.bountyId === stateData.bountyId &&
        t.participants.includes(stateData.recipientId) &&
        t.participants.includes(user.id)
      );
      
      if (existingThread) {
        // Use existing conversation
        setSelectedThread(existingThread);
      } else {
        // Create new thread object using same format as getMessageThreads
        const threadId = [user.id, stateData.recipientId].sort().join('___');
        const newThread: MessageThread = {
          id: threadId,
          bountyId: stateData.bountyId,
          bountyTitle: stateData.bountyTitle || 'New Conversation',
          participants: [user.id, stateData.recipientId],
          lastMessage: null,
          unreadCount: 0,
          updatedAt: new Date()
        };
        
        setThreads(prev => [newThread, ...prev]);
        setSelectedThread(newThread);
      }
      
      // Clear the state after handling it
      window.history.replaceState({}, document.title);
    }
  }, [stateData, user, threads.length]); // Depend on threads.length instead of threads array

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
    }
  }, [selectedThread?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time message subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Reload threads to update the sidebar
          await loadThreads();
          
          // If this message is for the current thread, add it to messages
          if (selectedThread) {
            const participants = selectedThread.id.split('___');
            const newMessage = payload.new as any;
            
            if (participants.includes(newMessage.sender_id)) {
              // Fetch sender profile
              const { data: profileData } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', newMessage.sender_id)
                .maybeSingle();
              
              setMessages(prev => [...prev, {
                id: newMessage.id,
                threadId: selectedThread.id,
                bountyId: newMessage.bounty_id,
                senderId: newMessage.sender_id,
                senderName: profileData?.username || 'Unknown',
                body: newMessage.content,
                attachments: newMessage.attachment_url ? [newMessage.attachment_url] : [],
                timestamp: new Date(newMessage.created_at),
                isRead: newMessage.is_read
              }]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedThread]);

  const loadThreads = async () => {
    if (!user) return;
    
    try {
      setThreadsLoading(true);
      const threadsData = await supabaseApi.getMessageThreads(user.id);
      setThreads(threadsData);
      
      // Auto-select first thread if none selected
      if (threadsData.length > 0 && !selectedThread) {
        setSelectedThread(threadsData[0]);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      toast({
        title: "Error loading conversations",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setThreadsLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    if (!user) return;
    
    console.log('Loading messages for thread:', threadId);
    
    try {
      setMessagesLoading(true);
      // Extract participant IDs from threadId (format: participant1___participant2)
      const participants = threadId.split('___');
      console.log('Thread participants:', participants);
      
      const otherParticipant = participants.find(p => p !== user.id);
      console.log('Other participant:', otherParticipant);
      
      if (!otherParticipant) {
        console.error('Could not find other participant');
        return;
      }
      
      // Fetch the other participant's profile info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', otherParticipant)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setOtherParticipantName('User');
        setOtherParticipantAvatar('');
      } else if (profileData) {
        const displayName = profileData.username || 'User';
        setOtherParticipantName(displayName);
        setOtherParticipantAvatar(profileData.avatar_url || '');
      } else {
        setOtherParticipantName('User');
        setOtherParticipantAvatar('');
      }
      
      const messagesData = await supabaseApi.getMessages(user.id, otherParticipant);
      console.log('Loaded messages:', messagesData.length);
      setMessages(messagesData);
      
      // Mark all unread messages from this participant as read
      const unreadMessageIds = messagesData
        .filter(msg => msg.senderId === otherParticipant && !msg.isRead)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0 && selectedThread) {
        const { error: markReadError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds);
        
        if (markReadError) {
          console.error('Error marking messages as read:', markReadError);
        } else {
          console.log('Marked', unreadMessageIds.length, 'messages as read');
          
          // Update thread list to clear unread count
          setThreads(prev => prev.map(thread => 
            thread.id === threadId 
              ? { ...thread, unreadCount: 0 }
              : thread
          ));
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedThread || !newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      // Extract participant IDs from threadId
      const participants = selectedThread.id.split('___');
      const recipientId = participants.find(p => p !== user.id);
      if (!recipientId) return;
      
      const message = await supabaseApi.sendMessage(recipientId, selectedThread.bountyId, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Update thread list
      setThreads(prev => prev.map(thread => 
        thread.id === selectedThread.id 
          ? { ...thread, lastMessage: message, updatedAt: new Date() }
          : thread
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm');
    } else if (isYesterday(timestamp)) {
      return 'Yesterday';
    } else {
      return format(timestamp, 'MMM dd');
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.bountyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.otherParticipantName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex h-[calc(100vh-10rem)] border rounded-lg overflow-hidden bg-background shadow-sm">
        {/* Thread List - hidden on mobile when a thread is selected */}
        <div className={`${
          isMobile && selectedThread ? 'hidden' : 'flex'
        } flex-col w-full lg:w-80 xl:w-72 bg-muted/30 border-r border-border flex-shrink-0`}>
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-semibold mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <LoadingSkeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Search}
                  title="No conversations"
                  description="Start a conversation by messaging bounty posters."
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50 ${
                      selectedThread?.id === thread.id ? 'bg-muted/70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate flex-1 pr-2">
                        {thread.otherParticipantName || 'Unknown User'}
                      </h3>
                      {thread.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1.5 flex items-center justify-center flex-shrink-0">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                      Re: {thread.bountyTitle}
                    </p>
                    
                    {thread.lastMessage && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                        {thread.lastMessage.body}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(thread.updatedAt, { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel - hidden on mobile when no thread selected */}
        <div className={`${
          isMobile && !selectedThread ? 'hidden' : 'flex'
        } flex-1 flex-col min-w-0`}>
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Search}
                title="Select a conversation"
                description="Choose a conversation from the sidebar to start messaging."
              />
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-background">
                <div className="flex items-center gap-3">
                  {/* Back button - only visible on mobile */}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedThread(null)}
                      className="flex-shrink-0"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {otherParticipantAvatar ? (
                      <img src={otherParticipantAvatar} alt={otherParticipantName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">
                        {otherParticipantName ? otherParticipantName[0]?.toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-foreground truncate">
                      {otherParticipantName || 'Loading user...'}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                      Re: {selectedThread.bountyTitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <LoadingSkeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="No messages yet"
                    description="Start the conversation by sending a message."
                  />
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.senderId !== user?.id && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {message.senderName}
                            </p>
                          )}
                          <p className="text-sm break-words">{message.body}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === user?.id
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Composer */}
              <div className="p-4 border-t border-border bg-background">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      className="min-h-[2.5rem] max-h-32 resize-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-primary-foreground"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}