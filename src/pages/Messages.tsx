import { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageThread, Message } from '@/lib/types';
import { supabaseApi } from '@/lib/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export default function Messages() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock real-time updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedThread) {
        // TODO: Replace with Supabase Realtime subscription
        console.log('TODO: Mock real-time message updates');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedThread]);

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
    
    try {
      setMessagesLoading(true);
      // Extract participant IDs from threadId (format: participant1-participant2)
      const participants = threadId.split('-');
      const otherParticipant = participants.find(p => p !== user.id);
      if (!otherParticipant) return;
      
      const messagesData = await supabaseApi.getMessages(user.id, otherParticipant);
      setMessages(messagesData);
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
      const participants = selectedThread.id.split('-');
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
    thread.bountyTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
        {/* Thread List */}
        <div className="lg:col-span-4 xl:col-span-3 bg-muted/30 border-r border-border">
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

          <div className="overflow-y-auto h-[calc(100%-8rem)]">
            {threadsLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <LoadingSkeleton key={i} className="h-16" />
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
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 pr-2">
                        <h3 className="font-medium text-foreground truncate">
                          {thread.bountyTitle}
                        </h3>
                        {thread.lastMessage?.attachments && thread.lastMessage.attachments.length > 0 && (
                          <span className="text-primary" title="Has attachments">📸</span>
                        )}
                      </div>
                      {thread.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    {thread.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        <span className="font-medium">{thread.lastMessage.senderName}:</span>{' '}
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

        {/* Chat Panel */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground truncate">
                      {selectedThread.bountyTitle}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedThread.participants.length} participants
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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