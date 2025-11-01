import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

// Pages
import { AdminSupport } from "./pages/admin/AdminSupport";
import { AdminSupportTicket } from "./pages/admin/AdminSupportTicket";
import { SupportTicket } from "./pages/SupportTicket";
import { Support } from "./pages/Support";
import Index from "./pages/Index";
import ActiveBounties from "./pages/ActiveBounties";
import PostBounty from "./pages/PostBounty";
import BountyDetail from "./pages/BountyDetail";
import Messages from "./pages/Messages";
import MyBounties from "./pages/MyBounties";
import Profile from "./pages/Profile";
import ProfileSetup from "./pages/ProfileSetup";
import Checkout from "./pages/Checkout";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import NotFound from "./pages/NotFound";
import KycComplete from "./pages/KycComplete";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/privacy" element={<Privacy />} />
              
              {/* Routes with navigation */}
              <Route path="/*" element={
                <>
                  <TopNav />
                  <main className="flex-1">
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/bounties" element={<ActiveBounties />} />
                      <Route path="/b/:id" element={<BountyDetail />} />
                      
                      {/* Protected routes */}
                      <Route path="/post" element={
                        <ProtectedRoute>
                          <PostBounty />
                        </ProtectedRoute>
                      } />
                      <Route path="/messages" element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      } />
                      <Route path="/me/bounties" element={
                        <ProtectedRoute>
                          <MyBounties />
                        </ProtectedRoute>
                      } />
                      <Route path="/me/profile" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                      <Route path="/setup" element={
                        <ProtectedRoute>
                          <ProfileSetup />
                        </ProtectedRoute>
                      } />
                      <Route path="/checkout" element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      } />
                      <Route path="/kyc-complete" element={
                        <ProtectedRoute>
                          <KycComplete />
                        </ProtectedRoute>
                      } />
                      <Route path="/support" element={
                        <ProtectedRoute>
                          <Support />
                        </ProtectedRoute>
                      } />
                      <Route path="/support/:ticketId" element={
                        <ProtectedRoute>
                          <SupportTicket />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/support" element={
                        <ProtectedRoute>
                          <AdminSupport />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/support/:ticketId" element={
                        <ProtectedRoute>
                          <AdminSupportTicket />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
