import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, CheckCircle2, AlertCircle, Utensils, Trash2, Bell, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { wsClient } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

interface TableData {
  id: number;
  tableNumber: number;
  status: string;
  activeSessionId: number | null;
  session: {
    id: number;
    sessionCode: string;
    status: string;
  } | null;
  orders: {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: { menuItemName: string; quantity: number; variant: string }[];
  }[];
}

interface PendingPaymentData {
  paymentId: number;
  sessionId: number;
  tableId: number;
  tableNumber: number;
  orderId: number | null;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionRef: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  available: "bg-green-500/10 border-green-500/30 text-green-400",
  occupied: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  reserved: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  cleaning: "bg-orange-500/10 border-orange-500/30 text-orange-400",
};

const orderStatusColors: Record<string, string> = {
  new: "text-blue-400",
  accepted: "text-yellow-400",
  preparing: "text-orange-400",
  ready: "text-green-400",
  served: "text-foreground/40",
};

const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

export default function Waiter() {
  const { toast } = useToast();
  const { data: tables = [], refetch } = useQuery<TableData[]>({
    queryKey: ["waiter-tables"],
    queryFn: async () => {
      const res = await fetch("/api/waiter/tables", { credentials: "include" });
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: pendingPayments = [], refetch: refetchPendingPayments } = useQuery<PendingPaymentData[]>({
    queryKey: ["waiter-pending-payments"],
    queryFn: async () => {
      const res = await fetch("/api/waiter/payments/pending", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending payments");
      return res.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    wsClient.connect();
    const unsub1 = wsClient.on("new_order", () => refetch());
    const unsub2 = wsClient.on("order_update", () => refetch());
    const unsub3 = wsClient.on("payment_complete", () => refetch());
    const unsub4 = wsClient.on("table_cleared", () => refetch());
    const unsub5 = wsClient.on("exit_verified", () => refetch());
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, [refetch]);

  useEffect(() => {
    wsClient.connect();
    const unsub1 = wsClient.on("payment_complete", () => refetchPendingPayments());
    const unsub2 = wsClient.on("new_order", () => refetchPendingPayments());
    return () => { unsub1(); unsub2(); };
  }, [refetchPendingPayments]);

  const clearTableMutation = useMutation({
    mutationFn: async (tableId: number) => {
      const res = await fetch(`/api/waiter/table/${tableId}/clear`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to clear table");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const res = await fetch(`/api/waiter/payments/${paymentId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (res.ok) return res.json();

      const fallback = await fetch(`/api/payments/${paymentId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!fallback.ok) {
        const error = await fallback.json().catch(() => ({}));
        throw new Error(error.message || "Failed to confirm payment");
      }
      return fallback.json();
    },
    onSuccess: () => {
      refetch();
      refetchPendingPayments();
      toast({ title: "Payment confirmed", description: "Exit PIN is now available to customer." });
    },
    onError: (error: Error) => {
      toast({ title: "Confirmation failed", description: error.message, variant: "destructive" });
    },
  });

  const occupiedTables = tables.filter((t) => t.status === "occupied");
  const availableTables = tables.filter((t) => t.status === "available");
  const readyOrders = tables.flatMap((t) => t.orders.filter((o) => o.status === "ready").map((o) => ({ ...o, tableNumber: t.tableNumber })));

  return (
    <div className="min-h-screen bg-background text-white">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Kebabil" className="h-8" />
            <div>
              <h1 className="text-lg font-serif">Waiter Dashboard</h1>
              <p className="text-xs text-foreground/40">
                {occupiedTables.length} occupied · {availableTables.length} available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/qr-codes" className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider" data-testid="link-qr-codes">QR Codes</a>
            <a href="/analytics" className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider" data-testid="link-analytics">Analytics</a>
            <a href="/door" className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider" data-testid="link-door">Door</a>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Ready to Serve Alert */}
      {readyOrders.length > 0 && (
        <div className="mx-4 mt-4 bg-green-500/10 border border-green-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium uppercase tracking-wider">Ready to Serve ({readyOrders.length})</span>
          </div>
          <div className="space-y-2">
            {readyOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between bg-green-500/5 p-3 border border-green-500/20">
                <div>
                  <span className="text-white font-mono text-sm">{order.orderNumber}</span>
                  <span className="text-green-400 text-xs ml-2">→ Table {order.tableNumber}</span>
                  <div className="text-xs text-foreground/40 mt-1">
                    {order.items.map((i) => `${i.quantity}× ${i.menuItemName}`).join(", ")}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: "served" })}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-none text-xs uppercase tracking-wider h-9"
                  data-testid={`serve-order-${order.id}`}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Served
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingPayments.length > 0 && (
        <div className="mx-4 mt-4 bg-amber-500/10 border border-amber-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium uppercase tracking-wider">Pending Payment Verification ({pendingPayments.length})</span>
          </div>
          <div className="space-y-2">
            {pendingPayments.map((payment) => (
              <div key={payment.paymentId} className="flex items-center justify-between bg-amber-500/5 p-3 border border-amber-500/20">
                <div>
                  <div className="text-sm text-white font-medium">
                    Table {payment.tableNumber} · {payment.orderNumber || "Order Pending"}
                  </div>
                  <div className="text-xs text-foreground/50 mt-1">
                    Method: {payment.paymentMethod.toUpperCase()} · Amount: {formatPrice(payment.amount)}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => confirmPaymentMutation.mutate(payment.paymentId)}
                  disabled={confirmPaymentMutation.isPending}
                  className="bg-amber-500 text-black hover:bg-amber-400 rounded-none text-[10px] uppercase tracking-wider h-9"
                  data-testid={`confirm-payment-${payment.paymentId}`}
                >
                  {confirmPaymentMutation.isPending ? "Confirming..." : "Confirm Payment"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {tables.map((table) => {
            const hasReadyOrders = table.orders.some((o) => o.status === "ready");
            const sessionTotal = table.orders.reduce((sum, o) => sum + o.total, 0);

            return (
              <motion.div
                key={table.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border p-4 transition-all ${
                  hasReadyOrders
                    ? "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)] bg-green-500/5"
                    : table.status === "occupied"
                    ? "border-blue-500/20 bg-blue-500/5"
                    : "border-white/5 bg-white/[0.02]"
                }`}
                data-testid={`waiter-table-${table.tableNumber}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-2xl font-serif text-white">T-{table.tableNumber}</p>
                  </div>
                  <Badge className={`${statusColors[table.status] || "bg-white/10 text-foreground/50"} rounded-none text-[10px] uppercase tracking-wider border`}>
                    {table.status}
                  </Badge>
                </div>

                {table.status === "occupied" && table.session && (
                  <>
                    <div className="space-y-1 mb-3">
                      {table.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-foreground/50">{order.orderNumber}</span>
                          <span className={`uppercase tracking-wider ${orderStatusColors[order.status] || "text-foreground/40"}`}>
                            {order.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {sessionTotal > 0 && (
                      <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2 mb-3">
                        <span className="text-foreground/40">Total</span>
                        <span className="text-primary font-serif">{formatPrice(sessionTotal)}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {table.session.status === "paid" && (
                        <Button
                          size="sm"
                          onClick={() => clearTableMutation.mutate(table.id)}
                          className="flex-1 bg-foreground/10 text-foreground/60 rounded-none text-[10px] uppercase tracking-wider h-8 hover:bg-foreground/20"
                          data-testid={`clear-table-${table.tableNumber}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Clear
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {table.status === "available" && (
                  <div className="flex items-center gap-2 text-foreground/20 mt-2">
                    <Utensils className="w-4 h-4" />
                    <span className="text-xs">Ready for guests</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
