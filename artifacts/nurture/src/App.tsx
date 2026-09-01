import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useGetProfile } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useEffect } from "react";
import { isAdminAuthed } from "@/hooks/use-admin-auth";

// Pages
import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Track from "@/pages/track";
import Appointments from "@/pages/appointments";
import Benefits from "@/pages/benefits";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, showNav = true }: { component: any, showNav?: boolean }) {
  const { data: profile, isLoading, error } = useGetProfile();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && error) {
      setLocation("/onboarding");
    }
  }, [isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return null; // Will redirect
  }

  return (
    <Layout showNav={showNav}>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/onboarding">
        <Onboarding />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/track">
        <ProtectedRoute component={Track} />
      </Route>
      <Route path="/appointments">
        <ProtectedRoute component={Appointments} />
      </Route>
      <Route path="/benefits">
        <ProtectedRoute component={Benefits} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/admin/login">
        <AdminLogin />
      </Route>
      <Route path="/admin">
        {isAdminAuthed()
          ? <ProtectedRoute component={Admin} showNav={false} />
          : <AdminLogin />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
