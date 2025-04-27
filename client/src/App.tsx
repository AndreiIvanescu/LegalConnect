import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProviderDetailPage from "@/pages/provider-detail-page";
import BookingsPage from "@/pages/bookings-page";
import MessagesPage from "@/pages/messages-page";
import ProfilePage from "@/pages/profile-page";
import ProfileSetupPage from "@/pages/profile-setup-page";
import ProviderDashboard from "@/pages/provider-dashboard";
import JobPostingPage from "@/pages/job-posting-page";
import JobBoardPage from "@/pages/job-board-page";
import PostGigPage from "@/pages/post-gig-page";
import MyGigsPage from "@/pages/my-gigs-page";
import FindContractsPage from "@/pages/find-contracts-page";
import MyApplicationsPage from "@/pages/my-applications-page";
import { ProtectedRoute } from "./lib/protected-route";
import AuthAwareHeader from "@/components/layout/auth-aware-header";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/providers/:id" component={ProviderDetailPage} />
      <ProtectedRoute path="/bookings" component={BookingsPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/setup" component={ProfileSetupPage} />
      <ProtectedRoute path="/provider/dashboard" component={ProviderDashboard} />
      <ProtectedRoute path="/jobs" component={JobPostingPage} />
      <ProtectedRoute path="/job-board" component={JobBoardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <div className="relative min-h-screen flex flex-col">
        <AuthAwareHeader />
        <main className="flex-1">
          <Router />
        </main>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default App;
