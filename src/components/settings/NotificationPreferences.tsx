import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Preferences {
  claims: boolean;
  messages: boolean;
  comments: boolean;
  status_updates: boolean;
}

const defaultPrefs: Preferences = {
  claims: true,
  messages: true,
  comments: true,
  status_updates: true,
};

export function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    const { data } = await supabase
      .from('notification_preferences' as any)
      .select('claims, messages, comments, status_updates')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (data) {
      setPrefs(data as any);
    }
    setLoading(false);
  };

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    const { error } = await supabase
      .from('notification_preferences' as any)
      .upsert(
        { user_id: user!.id, ...newPrefs, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) {
      setPrefs(prefs); // revert
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const items: { key: keyof Preferences; label: string; description: string }[] = [
    { key: 'claims', label: 'Claims', description: 'When someone submits a claim on your bounty' },
    { key: 'messages', label: 'Messages', description: 'When you receive a new direct message' },
    { key: 'comments', label: 'Comments', description: 'When someone comments on your bounty' },
    { key: 'status_updates', label: 'Status Updates', description: 'When your claim is accepted or rejected' },
  ];

  if (loading) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor={`notif-${key}`} className="text-sm font-medium">{label}</Label>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
              id={`notif-${key}`}
              checked={prefs[key]}
              onCheckedChange={(checked) => updatePref(key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
