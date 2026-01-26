import { useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateTicketForm } from '@/components/support/CreateTicketForm';
import { TicketList } from '@/components/support/TicketList';
import { AISupportChat } from '@/components/support/AISupportChat';
import { Plus, MessageSquare, Clock, CheckCircle, Bot } from 'lucide-react';

export function Support() {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">
          Get instant answers from our AI assistant or create a support ticket for complex issues.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="ai" className="flex-1 min-w-[80px] px-2 sm:px-3 flex items-center justify-center gap-1 sm:gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Assistant</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex-1 min-w-[80px] px-2 sm:px-3 flex items-center justify-center gap-1 sm:gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Ticket</span>
            <span className="sm:hidden">New</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex-1 min-w-[80px] px-2 sm:px-3 flex items-center justify-center gap-1 sm:gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">My Tickets</span>
            <span className="sm:hidden">Tickets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AISupportChat />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bot className="h-5 w-5 text-primary" />
                    Instant Answers
                  </CardTitle>
                  <CardDescription>
                    BountyBot can help you understand how the platform works, answer FAQs, and guide you through common tasks.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5" />
                    Need Human Help?
                  </CardTitle>
                  <CardDescription>
                    For account-specific issues, disputes, or complex problems, create a support ticket. We respond within 24-48 hours.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </TabsContent>

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
          <TicketList />
        </TabsContent>
      </Tabs>
    </div>
  );
}