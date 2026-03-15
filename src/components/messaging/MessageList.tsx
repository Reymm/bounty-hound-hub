import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  bounty_id?: string;
  content: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface MessageListProps {
  recipientId: string;
  bountyId?: string;
  currentUserId: string;
}

export function MessageList({ recipientId, bountyId, currentUserId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    
    // Set up realtime subscription - include bounty_id filter if provided
    const filterCondition = bountyId 
      ? `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId},bounty_id.eq.${bountyId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId},bounty_id.eq.${bountyId}))`
      : `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId}))`;
    
    const channel = supabase
      .channel(`messages-${bountyId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: filterCondition
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Double-check bounty_id matches (realtime filters can be unreliable)
          if (bountyId && newMessage.bounty_id !== bountyId) {
            return;
          }
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if we're the recipient
          if (newMessage.recipient_id === currentUserId) {
            markMessageAsRead(newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipientId, currentUserId, bountyId]);

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!sender_id(username, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`);
      
      // Filter by bounty_id to isolate conversations per bounty
      if (bountyId) {
        query = query.eq('bounty_id', bountyId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      const unreadMessages = data?.filter(msg => 
        msg.recipient_id === currentUserId && !msg.is_read
      );
      
      if (unreadMessages && unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(msg => markMessageAsRead(msg.id))
        );
      }
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) console.error('Error marking message as read:', error);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUserId}/${recipientId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image');
    }

    // Since bucket is private, we need to create a signed URL
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    if (signedError) {
      console.error('Signed URL error:', signedError);
      // Fallback to stored path - we'll handle viewing differently
      return fileName;
    }

    return signedUrlData.signedUrl;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    setIsSending(true);
    setIsUploading(!!selectedImage);
    
    try {
      let attachmentUrl: string | null = null;

      if (selectedImage) {
        attachmentUrl = await uploadImage(selectedImage);
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: recipientId,
          bounty_id: bountyId,
          content: newMessage.trim() || (attachmentUrl ? '📷 Image' : ''),
          attachment_url: attachmentUrl
        });

      if (error) throw error;

      const { data: senderProfile } = await supabase
        .rpc('get_public_profile_data', { profile_id: currentUserId })
        .maybeSingle();

      const senderName = senderProfile?.username || 'Someone';
      const previewBody = (newMessage.trim() || (attachmentUrl ? '📷 Sent an image' : 'New message')).slice(0, 100);
      const pushData: Record<string, string> = { route: '/messages' };
      if (bountyId) {
        pushData.bountyId = bountyId;
      }

      const [notificationResult, pushResult] = await Promise.allSettled([
        supabase.from('notifications').insert({
          user_id: recipientId,
          type: 'new_message',
          title: `💬 ${senderName}`,
          message: previewBody,
          bounty_id: bountyId ?? null,
        }),
        supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: recipientId,
            title: `💬 ${senderName}`,
            body: previewBody,
            data: pushData,
            notification_type: 'messages',
          },
        }),
      ]);

      if (notificationResult.status === 'fulfilled' && notificationResult.value.error) {
        console.error('In-app notification insert failed:', notificationResult.value.error);
      } else if (notificationResult.status === 'rejected') {
        console.error('In-app notification insert failed:', notificationResult.reason);
      }

      if (pushResult.status === 'fulfilled' && pushResult.value.error) {
        console.error('Push invoke failed:', pushResult.value.error);
      } else if (pushResult.status === 'rejected') {
        console.error('Push invoke failed:', pushResult.reason);
      }
      
      setNewMessage('');
      clearSelectedImage();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender_id === currentUserId ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender_profile?.avatar_url} />
                    <AvatarFallback>
                      {message.sender_profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content !== '📷 Image' && (
                      <p className="text-sm">{message.content}</p>
                    )}
                    {message.attachment_url && (
                      <div className="mt-2">
                        <img 
                          src={message.attachment_url} 
                          alt="Attachment"
                          className="rounded-md max-w-full max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.attachment_url, '_blank')}
                          onError={(e) => {
                            // Hide image on error, show fallback link
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1 text-xs hidden items-center"
                          onClick={() => window.open(message.attachment_url, '_blank')}
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          View Image
                        </Button>
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Image preview */}
        {imagePreview && (
          <div className="relative inline-block mt-2 mb-2">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-24 rounded-md border"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={clearSelectedImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            title="Attach image"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isSending || (!newMessage.trim() && !selectedImage)}
            size="icon"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}