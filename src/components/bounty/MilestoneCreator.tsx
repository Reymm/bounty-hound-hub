import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
}

interface MilestoneCreatorProps {
  totalBountyAmount: number;
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
}

export function MilestoneCreator({ totalBountyAmount, milestones, onChange }: MilestoneCreatorProps) {
  const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const remaining = totalBountyAmount - totalMilestoneAmount;

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      amount: 0
    };
    onChange([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    onChange(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string | number) => {
    onChange(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Payment Milestones</Label>
          <p className="text-sm text-muted-foreground">
            Split the bounty into multiple phases with separate payments
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {remaining !== 0 && milestones.length > 0 && (
        <Alert variant={remaining < 0 ? "destructive" : "default"}>
          <AlertDescription>
            {remaining > 0 
              ? `$${remaining.toFixed(2)} remaining to allocate` 
              : `Over by $${Math.abs(remaining).toFixed(2)} - reduce milestone amounts`
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <Card key={milestone.id}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Phase {index + 1}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(milestone.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`milestone-title-${milestone.id}`}>
                          Milestone Title *
                        </Label>
                        <Input
                          id={`milestone-title-${milestone.id}`}
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                          placeholder="e.g., Initial Research, Find Item, Ship Item"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`milestone-amount-${milestone.id}`}>
                          Amount *
                        </Label>
                        <Input
                          id={`milestone-amount-${milestone.id}`}
                          type="number"
                          min="5"
                          value={milestone.amount || ''}
                          onChange={(e) => updateMilestone(milestone.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`milestone-desc-${milestone.id}`}>
                        Description
                      </Label>
                      <Textarea
                        id={`milestone-desc-${milestone.id}`}
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                        placeholder="What needs to be completed in this phase?"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {milestones.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No milestones added yet</p>
          <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Milestone
          </Button>
        </div>
      )}
    </div>
  );
}
