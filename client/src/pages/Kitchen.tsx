import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, Check, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { wsClient } from "@/lib/websocket";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

interface OrderItemData {
  id: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  variant: string;
  itemNote: string;
}

interface OrderData {
  id: number;
  orderNumber: string;
  tableId: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  createdAt: string;
  items: OrderItemData[];
}

const statusConfig: Record<string, { label: string; color: string; next: string; nextLabel: string; icon: any }> = {
  new: { label: "New Order", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", next: "accepted", nextLabel: "Accept", icon: Bell },
  accepted: { label: "Accepted", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", next: "preparing", nextLabel: "Start Cooking", icon: ChefHat },
  preparing: { label: "Preparing", color: "bg-orange-500/10 text-orange-400 border-orange-500/30", next: "ready", nextLabel: "Mark Ready", icon: Clock },
  ready: { label: "Ready", color: "bg-green-500/10 text-green-400 border-green-500/30", next: "served", nextLabel: "Mark Served", icon: Check },
};

export default function Kitchen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [newOrderFlash, setNewOrderFlash] = useState(false);

  const { data: orders = [], refetch } = useQuery<OrderData[]>({
    queryKey: ["active-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders/active");
      return res.json();
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    wsClient.connect();
    const unsubNew = wsClient.on("new_order", () => {
      refetch();
      setNewOrderFlash(true);
      setTimeout(() => setNewOrderFlash(false), 2000);
      if ("vibrate" in navigator) navigator.vibrate(200);
    });
    const unsubUpdate = wsClient.on("order_update", () => {
      refetch();
    });
    return () => { unsubNew(); unsubUpdate(); };
  }, [refetch]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const countByStatus = (status: string) => orders.filter((o) => o.status === status).length;

  return (
    <div className={`min-h-screen bg-background text-white transition-colors ${newOrderFlash ? "bg-primary/5" : ""}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Kebabil" className="h-8" />
            <div>
              <h1 className="text-lg font-serif">Kitchen Dashboard</h1>
              <p className="text-xs text-foreground/40">{orders.length} active orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400">Live</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-t border-white/5">
          {[
            { key: "all", label: "All", count: orders.length },
            { key: "new", label: "New", count: countByStatus("new") },
            { key: "accepted", label: "Accepted", count: countByStatus("accepted") },
            { key: "preparing", label: "Preparing", count: countByStatus("preparing") },
            { key: "ready", label: "Ready", count: countByStatus("ready") },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              data-testid={`kitchen-filter-${tab.key}`}
              className={`whitespace-nowrap px-3 py-1.5 text-xs uppercase tracking-widest border transition-all ${
                filter === tab.key
                  ? "border-primary text-primary bg-primary/10"
                  : "border-white/10 text-foreground/40"
              }`}
            >
              {tab.label} {tab.count > 0 && <span className="ml-1 font-bold">({tab.count})</span>}
            </button>
          ))}
        </div>
      </header>

      {/* Orders Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status];
            if (!config) return null;
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white/[0.03] border p-5 ${
                  order.status === "new" ? "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-white/5"
                }`}
                data-testid={`kitchen-order-${order.id}`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-mono font-bold text-lg">{order.orderNumber}</span>
                    </div>
                    <p className="text-xs text-foreground/30 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getTimeSince(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${config.color} rounded-none text-xs uppercase tracking-wider`}>
                      <StatusIcon className="w-3 h-3 mr-1" /> {config.label}
                    </Badge>
                    <p className="text-2xl font-serif text-white mt-2">T-{order.tableId}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4 border-t border-white/5 pt-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                        <span className="text-white">
                          {item.menuItemName}
                          {item.variant && <span className="text-foreground/30 ml-1">({item.variant})</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                  {order.items.some((i) => i.itemNote) && (
                    <div className="mt-2">
                      {order.items.filter((i) => i.itemNote).map((i) => (
                        <p key={i.id} className="text-xs text-orange-400 italic">
                          {i.menuItemName}: {i.itemNote}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {order.notes && (
                  <div className="bg-orange-500/5 border border-orange-500/20 p-2 mb-4">
                    <p className="text-xs text-orange-400">Note: {order.notes}</p>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => updateStatusMutation.mutate({ id: order.id, status: config.next })}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-status-${order.id}`}
                  className={`w-full h-12 rounded-none uppercase tracking-widest text-sm font-medium ${
                    order.status === "new"
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : order.status === "preparing"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {config.nextLabel} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="col-span-full text-center py-20">
            <ChefHat className="w-16 h-16 text-foreground/10 mx-auto mb-4" />
            <p className="text-foreground/30 text-lg">No {filter === "all" ? "" : filter} orders</p>
            <p className="text-foreground/20 text-sm mt-1">New orders will appear here in real-time</p>
          </div>
        )}
      </div>
    </div>
  );
}
