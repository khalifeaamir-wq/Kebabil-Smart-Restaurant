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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/table/:tableNumber" component={TableOrder}/>
      <Route path="/kitchen" component={Kitchen}/>
      <Route path="/waiter" component={Waiter}/>
      <Route path="/analytics" component={Analytics}/>
      <Route path="/door" component={DoorScanner}/>
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
