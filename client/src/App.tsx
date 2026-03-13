import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import TableOrder from "@/pages/TableOrder";
import Kitchen from "@/pages/Kitchen";
import Waiter from "@/pages/Waiter";
import Analytics from "@/pages/Analytics";
import DoorScanner from "@/pages/DoorScanner";
import TableQRCodes from "@/pages/TableQRCodes";
import AdminLogin from "@/pages/AdminLogin";
import { useAuth } from "@/lib/useAuth";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { loading, authenticated, user, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-amber-400 animate-pulse tracking-widest uppercase text-sm">Authenticating...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <div>
      <div className="bg-[#0a0a0a] border-b border-neutral-800 px-4 py-1.5 flex items-center justify-between">
        <span className="text-neutral-500 text-xs">
          Signed in as <span className="text-amber-400">{user?.displayName}</span>
          <span className="text-neutral-700 ml-2">({user?.role})</span>
        </span>
        <button
          onClick={logout}
          className="text-xs text-neutral-500 hover:text-red-400 uppercase tracking-wider transition-colors"
          data-testid="button-logout"
        >
          Sign Out
        </button>
      </div>
      <Component />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/table/:tableNumber" component={TableOrder}/>
      <Route path="/admin">{() => <AdminRoute component={() => {
        if (typeof window !== "undefined") window.location.href = "/kitchen";
        return null;
      }} />}</Route>
      <Route path="/kitchen">{() => <AdminRoute component={Kitchen} />}</Route>
      <Route path="/waiter">{() => <AdminRoute component={Waiter} />}</Route>
      <Route path="/analytics">{() => <AdminRoute component={Analytics} />}</Route>
      <Route path="/door">{() => <AdminRoute component={DoorScanner} />}</Route>
      <Route path="/qr-codes">{() => <AdminRoute component={TableQRCodes} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
