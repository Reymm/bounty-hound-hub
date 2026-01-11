import { useState, useEffect } from 'react';
import { 
  Crown, 
  Plus, 
  Edit2, 
  Users, 
  DollarSign,
  Calendar,
  Infinity,
  Search,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths } from 'date-fns';

interface Partner {
  id: string;
  username: string | null;
  full_name: string | null;
  referral_code: string | null;
  is_partner: boolean | null;
  partner_name: string | null;
  partner_commission_percent: number | null;
  partner_flat_fee_cents: number | null;
  partner_attribution_expires_at: string | null;
  referral_count?: number;
  total_earnings?: number;
}

interface PartnerFormData {
  partner_name: string;
  partner_commission_percent: string;
  partner_flat_fee_cents: string;
  attribution_type: 'lifetime' | '12months' | '6months' | 'custom';
  custom_expiry_date: string;
}

export function AdminPartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allUsers, setAllUsers] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [formData, setFormData] = useState<PartnerFormData>({
    partner_name: '',
    partner_commission_percent: '20',
    partner_flat_fee_cents: '50',
    attribution_type: 'lifetime',
    custom_expiry_date: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      
      // Get all partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, referral_code, is_partner, partner_name, partner_commission_percent, partner_flat_fee_cents, partner_attribution_expires_at')
        .eq('is_partner', true)
        .order('partner_name', { ascending: true });

      if (partnersError) throw partnersError;

      // Get referral counts for each partner
      const partnersWithStats = await Promise.all(
        (partnersData || []).map(async (partner) => {
          const { count } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', partner.id);

          return {
            ...partner,
            referral_count: count || 0,
          };
        })
      );

      setPartners(partnersWithStats);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast({
        title: "Error",
        description: "Failed to load partners.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setAllUsers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, referral_code, is_partner, partner_name, partner_commission_percent, partner_flat_fee_cents, partner_attribution_expires_at')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,referral_code.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const openAddDialog = () => {
    setEditingPartner(null);
    setSelectedUserId('');
    setFormData({
      partner_name: '',
      partner_commission_percent: '20',
      partner_flat_fee_cents: '50',
      attribution_type: 'lifetime',
      custom_expiry_date: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner);
    setSelectedUserId(partner.id);
    setFormData({
      partner_name: partner.partner_name || '',
      partner_commission_percent: partner.partner_commission_percent 
        ? String(partner.partner_commission_percent * 100) 
        : '20',
      partner_flat_fee_cents: partner.partner_flat_fee_cents 
        ? String(partner.partner_flat_fee_cents) 
        : '50',
      attribution_type: partner.partner_attribution_expires_at ? 'custom' : 'lifetime',
      custom_expiry_date: partner.partner_attribution_expires_at 
        ? partner.partner_attribution_expires_at.split('T')[0] 
        : '',
    });
    setDialogOpen(true);
  };

  const calculateExpiryDate = (): string | null => {
    switch (formData.attribution_type) {
      case 'lifetime':
        return null;
      case '12months':
        return addMonths(new Date(), 12).toISOString();
      case '6months':
        return addMonths(new Date(), 6).toISOString();
      case 'custom':
        return formData.custom_expiry_date ? new Date(formData.custom_expiry_date).toISOString() : null;
      default:
        return null;
    }
  };

  const handleSavePartner = async () => {
    const userId = editingPartner?.id || selectedUserId;
    
    if (!userId) {
      toast({
        title: "Error",
        description: "Please select a user to make a partner.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData = {
        is_partner: true,
        partner_name: formData.partner_name || null,
        partner_commission_percent: parseFloat(formData.partner_commission_percent) / 100,
        partner_flat_fee_cents: parseInt(formData.partner_flat_fee_cents) || 0,
        partner_attribution_expires_at: calculateExpiryDate(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: editingPartner ? "Partner updated" : "Partner added",
        description: `Successfully ${editingPartner ? 'updated' : 'added'} partner.`,
      });

      setDialogOpen(false);
      loadPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast({
        title: "Error",
        description: "Failed to save partner.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_partner: false,
          partner_name: null,
          partner_commission_percent: null,
          partner_flat_fee_cents: null,
          partner_attribution_expires_at: null,
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast({
        title: "Partner removed",
        description: "Partner status has been removed.",
      });

      loadPartners();
    } catch (error) {
      console.error('Error removing partner:', error);
      toast({
        title: "Error",
        description: "Failed to remove partner.",
        variant: "destructive",
      });
    }
  };

  const calculateEarningsExample = (percent: number, flatCents: number) => {
    const exampleBounty = 100;
    const platformPercent = 0.05;
    const percentEarning = exampleBounty * platformPercent * (percent / 100);
    const flatEarning = flatCents / 100;
    return (percentEarning + flatEarning).toFixed(2);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Partner Management
              </CardTitle>
              <CardDescription>
                Manage affiliate partners and their commission rates
              </CardDescription>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No partners yet</p>
              <p className="text-sm">Add your first partner to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {partners.map((partner) => (
                <div 
                  key={partner.id} 
                  className="p-4 border rounded-lg flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {partner.partner_name || partner.username || partner.full_name || 'Unnamed Partner'}
                      </span>
                      {partner.partner_attribution_expires_at ? (
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Expires {format(new Date(partner.partner_attribution_expires_at), 'MMM dd, yyyy')}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs bg-primary/20 text-primary">
                          <Infinity className="h-3 w-3 mr-1" />
                          Lifetime
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono bg-muted px-2 py-0.5 rounded">
                        {partner.referral_code}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {partner.referral_count} referrals
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        <strong>{((partner.partner_commission_percent || 0) * 100).toFixed(0)}%</strong> of platform fee
                      </span>
                      <span>+</span>
                      <span>
                        <strong>${((partner.partner_flat_fee_cents || 0) / 100).toFixed(2)}</strong> flat
                      </span>
                      <span className="text-muted-foreground">
                        (≈ ${calculateEarningsExample(
                          (partner.partner_commission_percent || 0) * 100,
                          partner.partner_flat_fee_cents || 0
                        )} per $100 bounty)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(partner)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemovePartner(partner.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Edit Partner' : 'Add New Partner'}
            </DialogTitle>
            <DialogDescription>
              {editingPartner 
                ? 'Update partner commission rates and settings'
                : 'Search for a user to make them a partner'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Search (only for new partners) */}
            {!editingPartner && (
              <div className="space-y-2">
                <Label>Find User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username or referral code..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                </div>
                {allUsers.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors ${
                          selectedUserId === user.id ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setFormData(prev => ({
                            ...prev,
                            partner_name: user.username || user.full_name || '',
                          }));
                        }}
                      >
                        <p className="font-medium">{user.username || user.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.referral_code}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUserId && (
                  <p className="text-sm text-green-600">✓ User selected</p>
                )}
              </div>
            )}

            {/* Partner Name */}
            <div className="space-y-2">
              <Label htmlFor="partner_name">Partner Display Name</Label>
              <Input
                id="partner_name"
                placeholder="e.g., SneakerHeads Community"
                value={formData.partner_name}
                onChange={(e) => setFormData(prev => ({ ...prev, partner_name: e.target.value }))}
              />
            </div>

            {/* Commission Percent */}
            <div className="space-y-2">
              <Label htmlFor="commission_percent">
                Commission (% of your 5% fee)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="commission_percent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.partner_commission_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, partner_commission_percent: e.target.value }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                20% means they get 1% of the bounty (20% of your 5%)
              </p>
            </div>

            {/* Flat Fee */}
            <div className="space-y-2">
              <Label htmlFor="flat_fee">
                Flat Fee (cents from your $2)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="flat_fee"
                  type="number"
                  min="0"
                  max="200"
                  value={formData.partner_flat_fee_cents}
                  onChange={(e) => setFormData(prev => ({ ...prev, partner_flat_fee_cents: e.target.value }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">¢</span>
              </div>
              <p className="text-xs text-muted-foreground">
                50 cents = $0.50 per completed bounty
              </p>
            </div>

            {/* Attribution Duration */}
            <div className="space-y-2">
              <Label>Attribution Duration</Label>
              <Select
                value={formData.attribution_type}
                onValueChange={(value: 'lifetime' | '12months' | '6months' | 'custom') => 
                  setFormData(prev => ({ ...prev, attribution_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifetime">♾️ Lifetime (Founding Partner)</SelectItem>
                  <SelectItem value="12months">📅 12 Months</SelectItem>
                  <SelectItem value="6months">📅 6 Months</SelectItem>
                  <SelectItem value="custom">📅 Custom Date</SelectItem>
                </SelectContent>
              </Select>
              
              {formData.attribution_type === 'custom' && (
                <Input
                  type="date"
                  value={formData.custom_expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_expiry_date: e.target.value }))}
                />
              )}
            </div>

            {/* Earnings Preview */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Earnings Preview (per $100 bounty)</p>
              <p className="text-xl font-bold text-primary">
                ${calculateEarningsExample(
                  parseFloat(formData.partner_commission_percent) || 0,
                  parseInt(formData.partner_flat_fee_cents) || 0
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePartner}>
              {editingPartner ? 'Update Partner' : 'Add Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}