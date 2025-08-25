import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

// Pages
import Index from "./pages/Index";
import ActiveBounties from "./pages/ActiveBounties";
import PostBounty from "./pages/PostBounty";
import BountyDetail from "./pages/BountyDetail";
import Messages from "./pages/Messages";
import MyBounties from "./pages/MyBounties";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background">
          <TopNav />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/bounties" element={<ActiveBounties />} />
              <Route path="/post" element={<PostBounty />} />
              <Route path="/b/:id" element={<BountyDetail />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/me/bounties" element={<MyBounties />} />
              <Route path="/me/profile" element={<Profile />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/privacy" element={<Privacy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
