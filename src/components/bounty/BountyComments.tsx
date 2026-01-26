import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface BountyCommentsProps {
  bountyId: string;
  bountyStatus: string;
}

export function BountyComments({ bountyId, bountyStatus }: BountyCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
  }, [bountyId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bounty_comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('bounty_id', bountyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const commentsWithUsers = (data || []).map(comment => ({
        ...comment,
        user: profileMap.get(comment.user_id) || null,
      }));

      setComments(commentsWithUsers);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: 'Error loading comments',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to leave a comment.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    if (trimmedComment.length > 1000) {
      toast({
        title: 'Comment too long',
        description: 'Comments must be under 1000 characters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('bounty_comments')
        .insert({
          bounty_id: bountyId,
          user_id: user.id,
          content: trimmedComment,
        })
        .select()
        .single();

      if (error) throw error;

      // Get user profile for the new comment
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', user.id)
        .single();

      setComments(prev => [...prev, {
        ...data,
        user: profile,
      }]);
      setNewComment('');
      
      toast({
        title: 'Comment posted!',
        description: 'Your comment has been added.',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error posting comment',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (username: string | null) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form - only show for open bounties */}
        {bountyStatus === 'open' ? (
          user ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                placeholder="Leave a helpful tip or ask a question..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {newComment.length}/1000 characters
                </span>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post Comment
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Sign in to leave a comment
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          )
        ) : (
          <div className="text-center py-3 bg-muted rounded-lg text-sm text-muted-foreground">
            Comments are closed on this bounty
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to leave a helpful tip!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Link to={`/u/${comment.user_id}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.user?.username)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link 
                      to={`/u/${comment.user_id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {comment.user?.username || 'Anonymous'}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
