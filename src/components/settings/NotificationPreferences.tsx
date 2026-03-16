import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getPushPermissionState,
  initPushNotifications,
  type NativePushPermission,
} from '@/lib/push-notifications';

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

const nativePermissionCopy: Record<NativePushPermission, string> = {
  granted: 'iPhone notifications are enabled for this device.',
  denied: 'Notifications are off on this iPhone. Open Settings > Notifications > BountyBay to turn them back on.',
  prompt: 'This iPhone has not granted notification access yet.',
  'prompt-with-rationale': 'This iPhone still needs notification permission.',
  unavailable: 'Native push is only available inside the installed iPhone or Android app.',
};

export function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isNativePlatform = Capacitor.isNativePlatform();
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [nativePermission, setNativePermission] = useState<NativePushPermission>('unavailable');
  const [syncingNativePush, setSyncingNativePush] = useState(false);

  useEffect(() => {
    if (!user) return;

    void loadPreferences();
    if (isNativePlatform) {
      void loadNativePermission();
    }
  }, [user, isNativePlatform]);

  const loadPreferences = async () => {
    const { data } = await supabase
      .from('notification_preferences')
      .select('claims, messages, comments, status_updates')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (data) {
      setPrefs(data);
    }
    setLoading(false);
  };

  const loadNativePermission = async () => {
    const permission = await getPushPermissionState();
    setNativePermission(permission);
  };

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: user!.id, ...newPrefs, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) {
      setPrefs(prefs);
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const syncNativePush = async () => {
    if (!user || !isNativePlatform) return;

    setSyncingNativePush(true);
    const result = await initPushNotifications(user.id);
    setNativePermission(result.permission);
    setSyncingNativePush(false);

    if (result.status === 'registered') {
      toast({ title: 'Native notifications enabled' });
      return;
    }

    if (result.status === 'denied') {
      toast({
        title: 'Notifications are off',
        description: 'Enable them in iPhone Settings > Notifications > BountyBay.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Native push setup failed',
      description: result.error ?? 'Please reopen the app and try again.',
      variant: 'destructive',
    });
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

        {isNativePlatform && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Native phone notifications</p>
              <p className="text-xs text-muted-foreground">
                {nativePermissionCopy[nativePermission]}
              </p>
            </div>
            <Button
              type="button"
              variant={nativePermission === 'granted' ? 'outline' : 'default'}
              onClick={syncNativePush}
              disabled={syncingNativePush}
            >
              {syncingNativePush
                ? 'Checking iPhone notifications...'
                : nativePermission === 'granted'
                  ? 'Refresh native registration'
                  : 'Enable iPhone notifications'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
