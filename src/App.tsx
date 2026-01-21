import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReviewModalProvider } from "@/contexts/ReviewModalContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { CookieConsent } from "@/components/layout/CookieConsent";
// Pages
import { AdminSupport } from "./pages/admin/AdminSupport";
import { AdminSupportTicket } from "./pages/admin/AdminSupportTicket";
import { AdminPartners } from "./pages/admin/AdminPartners";
import AdminDisputes from "./pages/admin/AdminDisputes";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { SupportTicket } from "./pages/SupportTicket";
import { Support } from "./pages/Support";
import Index from "./pages/Index";
import ActiveBounties from "./pages/ActiveBounties";
import PostBounty from "./pages/PostBounty";
import BountyDetail from "./pages/BountyDetail";
import Messages from "./pages/Messages";
import MyBounties from "./pages/MyBounties";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import ProfileSetup from "./pages/ProfileSetup";
import Checkout from "./pages/Checkout";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";

import ConnectComplete from "./pages/ConnectComplete";
import Auth from "./pages/Auth";
import EditBounty from "./pages/EditBounty";
// Niche landing pages
import Reconnections from "./pages/niche/Reconnections";
import Collectibles from "./pages/niche/Collectibles";
import VintageCars from "./pages/niche/VintageCars";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <ReviewModalProvider>
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
                      <Route path="/b/:id/edit" element={
                        <ProtectedRoute>
                          <EditBounty />
                        </ProtectedRoute>
                      } />
                      <Route path="/faq" element={<FAQ />} />
                      
                      {/* Niche landing pages */}
                      <Route path="/reconnections" element={<Reconnections />} />
                      <Route path="/collectibles" element={<Collectibles />} />
                      <Route path="/vintage-cars" element={<VintageCars />} />
                      
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
                      <Route path="/u/:userId" element={<PublicProfile />} />
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
                      <Route path="/connect-complete" element={
                        <ProtectedRoute>
                          <ConnectComplete />
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
                      <Route path="/admin/disputes" element={
                        <ProtectedRoute>
                          <AdminDisputes />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/partners" element={
                        <ProtectedRoute>
                          <AdminPartners />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin" element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
            <CookieConsent />
          </div>
          </ReviewModalProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
