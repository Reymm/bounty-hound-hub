import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateTicketForm } from '@/components/support/CreateTicketForm';
import { Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react';

export function Support() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">
          Get help with bounties, submissions, payments, or any platform issues.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Ticket
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            My Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Platform Issues
                </CardTitle>
                <CardDescription>
                  Problems with the website, features not working, or general platform questions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Disputes
                </CardTitle>
                <CardDescription>
                  Bounty or submission disputes, disagreements between posters and hunters.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Quick Response
                </CardTitle>
                <CardDescription>
                  We respond to all tickets within 24-48 hours during business days.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <CreateTicketForm onSuccess={() => setActiveTab('tickets')} />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
              <CardDescription>
                View and manage your support tickets. Click on any ticket to continue the conversation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No support tickets yet.</p>
                <p className="text-sm">Create your first ticket to get started.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab('create')}
                >
                  Create Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}