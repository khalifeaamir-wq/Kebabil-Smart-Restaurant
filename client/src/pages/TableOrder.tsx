import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, ArrowLeft, Flame, Send, Clock, X, CreditCard, Banknote, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { wsClient } from "@/lib/websocket";
import { fetchMenuFromSupabase, type MenuCategoryData } from "@/lib/menu";
import { QRCodeSVG } from "qrcode.react";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

interface CartItem {
  menuItemId: number;
  name: string;
  price: string;
  priceValue: number;
  quantity: number;
  variant: string;
  itemNote: string;
}

interface MenuItemData {
  id: number;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  variants: string[];
  addons: string[];
  badge: string;
  type: string;
  spiceLevel: number;
  isAvailable: boolean;
  prepTimeMinutes: number;
}

interface OrderData {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  items: { menuItemName: string; quantity: number; unitPrice: number; variant: string }[];
}

interface SessionBillData {
  session: { id: number; status: string };
  orders: Array<{
    id: number;
    orderNumber: string;
    items: Array<{ menuItemName: string; quantity: number; unitPrice: number }>;
  }>;
  bill: { subtotal: number; tax: number; total: number };
  isPaid: boolean;
  payments: Array<{ id: number; paymentStatus: string; paymentMethod: string; amount: number; transactionRef: string }>;
}

interface UpiPaymentData {
  paymentId: number;
  sessionId: number;
  amountPaise: number;
  amount: string;
  merchantUpiId: string;
  merchantName: string;
  note: string;
  upiUri: string;
  deepLink: string;
}

interface ExitPinData {
  id: number;
  pin: string;
  orderId: number;
  tableId: number;
  status: string;
  expiresAt: string;
}

type View = "menu" | "cart" | "tracking" | "bill" | "exitpass";

const formatPrice = (paise: number) => {
  const safePaise = Number(paise);
  const normalized = Number.isFinite(safePaise) && safePaise >= 0 ? safePaise : 0;
  return `₹${(normalized / 100).toFixed(0)}`;
};
const toSafeQuantity = (quantity: unknown) => {
  const parsed = Number(quantity);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};
const toSafeUnitPrice = (priceValue: unknown, priceLabel?: string) => {
  const cleaned = (priceLabel || "").replace(/[^\d.]/g, "");
  const labelRupees = cleaned ? Number.parseFloat(cleaned) : NaN;
  const labelPaise = Number.isFinite(labelRupees) && labelRupees >= 0 ? Math.round(labelRupees * 100) : 0;
  if (labelPaise > 0) return labelPaise;

  const numericPriceValue = Number(priceValue);
  if (Number.isFinite(numericPriceValue) && numericPriceValue >= 0) {
    if (numericPriceValue > 0 && numericPriceValue < 1000) return Math.round(numericPriceValue * 100);
    return Math.round(numericPriceValue);
  }

  return 0;
};

export default function TableOrder() {
  const params = useParams<{ tableId: string; qrToken: string }>();
  const tableId = parseInt(params.tableId || "0");
  const qrToken = params.qrToken || new URLSearchParams(window.location.search).get("token") || "";

  const [view, setView] = useState<View>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{ sessionId: number; tableId: number } | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [exitCountdown, setExitCountdown] = useState(180);

  const { data: scanResult } = useQuery({
    queryKey: ["qr-scan", tableId, qrToken],
    queryFn: async () => {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, token: qrToken }),
      });
      if (!res.ok) throw new Error("Failed to scan table");
      return res.json();
    },
    enabled: tableId > 0 && !!qrToken,
  });
  const tableNumber = scanResult?.table?.tableNumber ?? tableId;

  useEffect(() => {
    if (scanResult) {
      setSessionData({ sessionId: scanResult.session.id, tableId: scanResult.table.id });
    }
  }, [scanResult]);

  const { data: menuData = [] } = useQuery<MenuCategoryData[]>({
    queryKey: ["supabase-menu"],
    queryFn: fetchMenuFromSupabase,
  });

  const { data: sessionOrders = [], refetch: refetchOrders } = useQuery<OrderData[]>({
    queryKey: ["session-orders", sessionData?.sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/session/${sessionData!.sessionId}`);
      return res.json();
    },
    enabled: !!sessionData,
    refetchInterval: 10000,
  });

  const { data: billData, refetch: refetchBill } = useQuery<SessionBillData>({
    queryKey: ["bill", sessionData?.sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/session/${sessionData!.sessionId}/bill`);
      if (!res.ok) throw new Error("Failed to fetch bill");
      return res.json();
    },
    enabled: !!sessionData && (view === "bill" || view === "exitpass"),
  });

  const { data: upiPaymentData, refetch: refetchUpiPaymentData, isFetching: isFetchingUpi } = useQuery<UpiPaymentData>({
    queryKey: ["upi-payment-data", sessionData?.sessionId, billData?.bill?.total],
    queryFn: async () => {
      const res = await fetch(`/api/session/${sessionData!.sessionId}/payment/upi`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to generate UPI QR");
      }
      return res.json();
    },
    enabled: !!sessionData && view === "bill" && selectedPayment === "upi" && !!billData && !billData.isPaid,
    retry: false,
  });

  const { data: exitPinData, refetch: refetchExitPin } = useQuery<ExitPinData>({
    queryKey: ["exit-pin", sessionData?.sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/session/${sessionData!.sessionId}/exit-pin`);
      if (!res.ok) throw new Error("Exit PIN unavailable");
      return res.json();
    },
    enabled: !!sessionData && !!billData?.isPaid,
    retry: false,
  });

  useEffect(() => {
    wsClient.connect();
    const unsub1 = wsClient.on("order_update", () => refetchOrders());
    const unsub2 = wsClient.on("payment_complete", () => {
      refetchBill();
      refetchOrders();
      refetchExitPin();
      setView("exitpass");
    });
    return () => { unsub1(); unsub2(); };
  }, [refetchOrders, refetchBill, refetchExitPin]);

  useEffect(() => {
    if (exitPinData && view === "exitpass") {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(exitPinData.expiresAt).getTime() - Date.now()) / 1000));
        setExitCountdown(remaining);
        if (remaining <= 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [exitPinData, view]);

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData!.sessionId,
          tableId: sessionData!.tableId,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: toSafeQuantity(item.quantity),
            variant: item.variant,
            itemNote: item.itemNote,
          })),
          notes: orderNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      return res.json();
    },
    onSuccess: () => {
      setCart([]);
      setOrderNotes("");
      setView("tracking");
      refetchOrders();
    },
  });

  const requestVerificationMutation = useMutation({
    mutationFn: async () => {
      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData!.sessionId,
          paymentMethod: selectedPayment,
        }),
      });
      if (!payRes.ok) {
        const error = await payRes.json().catch(() => ({}));
        throw new Error(error.message || "Failed to request waiter verification");
      }
      return payRes.json();
    },
    onSuccess: () => {
      refetchBill();
      refetchUpiPaymentData();
    },
  });

  const currentCategory = activeCategory || (menuData.length > 0 ? menuData[0].category : "");
  const activeItems = menuData.find((c) => c.category === currentCategory)?.items || [];

  const addToCart = useCallback((item: MenuItemData, variant: string = "") => {
    const safePriceValue = toSafeUnitPrice(item.priceValue, item.price);
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id && c.variant === variant);
      if (existing) {
        return prev.map((c) => c.menuItemId === item.id && c.variant === variant ? { ...c, quantity: toSafeQuantity(c.quantity) + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, priceValue: safePriceValue, quantity: 1, variant, itemNote: "" }];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: number, variant: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId && c.variant === variant);
      if (existing && toSafeQuantity(existing.quantity) > 1) {
        return prev.map((c) => c.menuItemId === menuItemId && c.variant === variant ? { ...c, quantity: toSafeQuantity(c.quantity) - 1 } : c);
      }
      return prev.filter((c) => !(c.menuItemId === menuItemId && c.variant === variant));
    });
  }, []);

  const normalizedCart = cart.map((item) => {
    const quantity = toSafeQuantity(item.quantity);
    const unitPrice = toSafeUnitPrice(item.priceValue, item.price);
    return { ...item, quantity, unitPrice, lineTotal: unitPrice * quantity };
  });

  const getCartQuantity = (menuItemId: number) =>
    normalizedCart.filter((c) => c.menuItemId === menuItemId).reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = normalizedCart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartCount = normalizedCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTax = Math.round(cartTotal * 0.05);
  const cartGrandTotal = cartTotal + cartTax;

  const statusSteps = ["new", "accepted", "preparing", "ready", "served"];
  const statusLabels: Record<string, string> = { new: "Order Placed", accepted: "Accepted", preparing: "Preparing", ready: "Ready to Serve", served: "Served" };

  const allServed = sessionOrders.length > 0 && sessionOrders.every((o) => o.status === "served");
  const pendingVerificationPayment = billData?.payments?.find((p) => p.paymentStatus !== "completed");
  const completedPayment = billData?.payments?.find((p) => p.paymentStatus === "completed");

  useEffect(() => {
    if (billData?.isPaid) {
      setView("exitpass");
      refetchExitPin();
    }
  }, [billData?.isPaid, refetchExitPin]);

  if (tableId === 0 || !qrToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <img src={logoImg} alt="Kebabil" className="h-16 mx-auto mb-6" />
          <h1 className="text-2xl font-serif text-white mb-2">Invalid QR</h1>
          <p className="text-foreground/50">Please scan a valid table QR code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {(view === "cart" || view === "bill" || view === "exitpass") && (
              <button onClick={() => setView(view === "cart" ? "menu" : "tracking")} className="p-1 hover:bg-white/5">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <img src={logoImg} alt="Kebabil" className="h-8" />
            <p className="text-xs text-primary uppercase tracking-widest font-medium">Table {tableNumber}</p>
          </div>
        </div>
        {view !== "cart" && view !== "bill" && view !== "exitpass" && (
          <div className="flex border-t border-white/5">
            <button onClick={() => setView("menu")} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium transition-colors ${view === "menu" ? "text-primary border-b-2 border-primary" : "text-foreground/40"}`} data-testid="tab-menu">Menu</button>
            <button onClick={() => setView("tracking")} className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium transition-colors ${view === "tracking" ? "text-primary border-b-2 border-primary" : "text-foreground/40"}`} data-testid="tab-tracking">My Orders {sessionOrders.length > 0 && `(${sessionOrders.length})`}</button>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {/* ===== MENU VIEW ===== */}
        {view === "menu" && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sticky top-[88px] z-40 bg-background/95 backdrop-blur-md px-4 py-3 overflow-x-auto flex gap-3 scrollbar-hide border-b border-white/5">
              {menuData.map((cat) => (
                <button key={cat.category} onClick={() => setActiveCategory(cat.category)} data-testid={`cat-tab-${cat.categoryId}`}
                  className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-widest rounded-none border transition-all ${currentCategory === cat.category ? "border-primary text-primary bg-primary/10" : "border-white/10 text-foreground/50"}`}>
                  {cat.category}
                </button>
              ))}
            </div>
            <div className="px-4 py-4 pb-32 space-y-4">
              {activeItems.map((item) => {
                const qty = getCartQuantity(item.id);
                return (
                  <motion.div key={item.id} layout className="bg-white/[0.03] border border-white/5 p-4 hover:border-primary/20 transition-all" data-testid={`order-menu-item-${item.id}`}>
                    <div className="flex justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${item.type === "veg" ? "border-green-500" : "border-red-500"}`}>
                            <span className={`w-2 h-2 rounded-full ${item.type === "veg" ? "bg-green-500" : "bg-red-500"}`} />
                          </span>
                          <h3 className="font-serif text-lg text-white truncate">{item.name}</h3>
                        </div>
                        <p className="text-sm text-foreground/50 mb-2 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-primary font-serif text-lg">{item.price}</span>
                          {item.badge && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider rounded-none">{item.badge}</Badge>}
                          {item.spiceLevel > 0 && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: Math.min(item.spiceLevel, 5) }).map((_, i) => <Flame key={i} className="w-3 h-3 text-orange-500" />)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-foreground/30 flex items-center gap-1"><Clock className="w-3 h-3" /> ~{item.prepTimeMinutes} min</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        {!item.isAvailable ? (
                          <span className="text-xs text-red-400 uppercase tracking-wider">Unavailable</span>
                        ) : qty === 0 ? (
                          <Button size="sm" onClick={() => addToCart(item, item.variants.length > 0 ? item.variants[0] : "")} data-testid={`button-add-${item.id}`}
                            className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-none uppercase tracking-wider text-xs h-9 px-4">
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-1">
                            <button onClick={() => removeFromCart(item.id, item.variants.length > 0 ? item.variants[0] : "")} className="p-1.5 text-primary hover:bg-primary/20"><Minus className="w-4 h-4" /></button>
                            <span className="text-primary font-medium w-6 text-center">{qty}</span>
                            <button onClick={() => addToCart(item, item.variants.length > 0 ? item.variants[0] : "")} className="p-1.5 text-primary hover:bg-primary/20"><Plus className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ===== CART VIEW ===== */}
        {view === "cart" && (
          <motion.div key="cart" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="px-4 py-4">
              <h2 className="text-xl font-serif mb-6">Your Order</h2>
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground/40">Your cart is empty</p>
                  <Button onClick={() => setView("menu")} className="mt-4 bg-primary/10 text-primary rounded-none">Browse Menu</Button>
                </div>
              ) : (
                <div className="space-y-3 pb-48">
                  {normalizedCart.map((item) => (
                    <div key={`${item.menuItemId}-${item.variant}`} className="bg-white/[0.03] border border-white/5 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-serif text-white">{item.name}</h4>
                          {item.variant && <p className="text-xs text-foreground/40">{item.variant}</p>}
                        </div>
                        <button onClick={() => setCart((prev) => prev.filter((c) => !(c.menuItemId === item.menuItemId && c.variant === item.variant)))} className="text-foreground/30 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-1">
                          <button onClick={() => removeFromCart(item.menuItemId, item.variant)} className="p-1.5"><Minus className="w-3 h-3" /></button>
                          <span className="w-6 text-center text-sm">{toSafeQuantity(item.quantity)}</span>
                          <button onClick={() => setCart((prev) => prev.map((c) => c.menuItemId === item.menuItemId && c.variant === item.variant ? { ...c, quantity: toSafeQuantity(c.quantity) + 1 } : c))} className="p-1.5"><Plus className="w-3 h-3" /></button>
                        </div>
                        <span className="text-primary font-serif">{formatPrice(item.lineTotal)}</span>
                      </div>
                    </div>
                  ))}
                  <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Any special instructions? (optional)"
                    className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-foreground/30 rounded-none resize-none h-20 focus:outline-none focus:border-primary/50 mt-4" data-testid="input-order-notes" />
                  <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-foreground/50"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
                      <div className="flex justify-between text-sm text-foreground/50"><span>Tax (5%)</span><span>{formatPrice(cartTax)}</span></div>
                      <div className="flex justify-between text-lg font-serif text-primary pt-2 border-t border-white/10"><span>Total</span><span>{formatPrice(cartGrandTotal)}</span></div>
                  </div>
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="fixed bottom-0 left-0 w-full p-4 bg-background/95 backdrop-blur-md border-t border-white/10 z-50">
                <Button onClick={() => placeOrderMutation.mutate()} disabled={placeOrderMutation.isPending} data-testid="button-place-order"
                  className="w-full h-14 bg-primary text-primary-foreground rounded-none uppercase tracking-widest font-medium shadow-[0_0_20px_rgba(198,156,109,0.3)]">
                  {placeOrderMutation.isPending ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Placing...</span>
                    : <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Place Order — {formatPrice(cartGrandTotal)}</span>}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== TRACKING VIEW ===== */}
        {view === "tracking" && (
          <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="px-4 py-4 pb-32">
              <h2 className="text-xl font-serif mb-6">Your Orders</h2>
              {sessionOrders.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground/40">No orders yet</p>
                  <Button onClick={() => setView("menu")} className="mt-4 bg-primary/10 text-primary rounded-none">Browse Menu</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sessionOrders.map((order) => {
                    const currentStep = statusSteps.indexOf(order.status);
                    return (
                      <div key={order.id} className="bg-white/[0.03] border border-white/5 p-4" data-testid={`order-card-${order.id}`}>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <span className="text-primary font-mono text-sm">{order.orderNumber}</span>
                            <p className="text-xs text-foreground/30 mt-1">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <Badge className={`rounded-none text-xs uppercase tracking-wider ${order.status === "ready" ? "bg-green-500/10 text-green-400 border-green-500/30" : order.status === "served" ? "bg-foreground/10 text-foreground/40 border-foreground/20" : order.status === "preparing" ? "bg-orange-500/10 text-orange-400 border-orange-500/30" : "bg-primary/10 text-primary border-primary/30"}`}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </div>
                        {order.status !== "served" && (
                          <div className="flex gap-1 mb-4">
                            {statusSteps.slice(0, -1).map((step, i) => (
                              <div key={step} className={`flex-1 h-1 rounded-full transition-all ${i <= currentStep ? "bg-primary" : "bg-white/10"}`} />
                            ))}
                          </div>
                        )}
                        <div className="space-y-1 mb-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-foreground/60">{item.quantity}× {item.menuItemName}{item.variant && <span className="text-foreground/30 ml-1">({item.variant})</span>}</span>
                              <span className="text-foreground/40">{formatPrice(item.unitPrice * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-white/5 pt-2 flex justify-between text-sm">
                          <span className="text-foreground/50">Total</span>
                          <span className="text-primary font-serif">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setView("menu")} className="flex-1 h-12 bg-white/5 text-white/70 border border-white/10 rounded-none uppercase tracking-wider text-xs hover:bg-white/10" data-testid="button-add-more">
                  <Plus className="w-4 h-4 mr-2" /> Add More
                </Button>
                {allServed && !billData?.isPaid && (
                  <Button onClick={() => { setView("bill"); refetchBill(); refetchUpiPaymentData(); }} className="flex-1 h-12 bg-primary text-primary-foreground rounded-none uppercase tracking-wider text-xs" data-testid="button-pay-now">
                    <CreditCard className="w-4 h-4 mr-2" /> Pay Now
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== BILL / PAYMENT VIEW ===== */}
        {view === "bill" && billData && (
          <motion.div key="bill" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="px-4 py-6 pb-40">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-serif text-white mb-1">Your Bill</h2>
                <p className="text-xs text-foreground/40 uppercase tracking-widest">Table {tableNumber}</p>
              </div>

              <div className="bg-white/[0.03] border border-white/5 p-5 mb-6">
                {billData.orders.map((order) => (
                  <div key={order.id} className="mb-4 last:mb-0">
                    <p className="text-xs text-foreground/30 font-mono mb-2">{order.orderNumber}</p>
                    {order.items.map((item, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm mb-1">
                        <span className="text-foreground/60">{item.quantity}× {item.menuItemName}</span>
                        <span className="text-foreground/40">{formatPrice(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 mt-4 space-y-2">
                  <div className="flex justify-between text-sm text-foreground/50"><span>Subtotal</span><span>{formatPrice(billData.bill.subtotal)}</span></div>
                  <div className="flex justify-between text-sm text-foreground/50"><span>GST (5%)</span><span>{formatPrice(billData.bill.tax)}</span></div>
                  <div className="flex justify-between text-xl font-serif text-primary pt-3 border-t border-white/10"><span>Total</span><span>{formatPrice(billData.bill.total)}</span></div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-foreground/40 uppercase tracking-widest mb-4">Payment Method</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "upi", label: "UPI", icon: QrCode },
                    { id: "card", label: "Card", icon: CreditCard },
                    { id: "cash", label: "Cash", icon: Banknote },
                  ].map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setSelectedPayment(id)} disabled={!!pendingVerificationPayment || !!completedPayment} data-testid={`payment-${id}`}
                      className={`flex flex-col items-center gap-2 p-4 border transition-all ${selectedPayment === id ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-foreground/40 hover:border-white/20"}`}>
                      <Icon className="w-6 h-6" />
                      <span className="text-xs uppercase tracking-wider">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPayment === "upi" && (
                <div className="bg-white/[0.03] border border-white/5 p-5 text-center mb-6">
                  <p className="text-xs text-foreground/40 mb-3 uppercase tracking-wider">Scan to Pay</p>
                  {upiPaymentData ? (
                    <>
                      <div className="bg-white p-4 inline-block rounded-sm mb-3">
                        <QRCodeSVG value={upiPaymentData.upiUri} size={180} />
                      </div>
                      <p className="text-foreground/40 text-xs mb-3">
                        {upiPaymentData.merchantName} ({upiPaymentData.merchantUpiId})
                      </p>
                      <p className="text-foreground/30 text-xs mb-4">Amount: {formatPrice(upiPaymentData.amountPaise)}</p>
                      <Button
                        type="button"
                        onClick={() => { window.location.href = upiPaymentData.deepLink; }}
                        className="w-full h-11 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-none uppercase tracking-wider text-xs"
                        data-testid="button-pay-via-upi-app"
                      >
                        Pay via UPI App
                      </Button>
                    </>
                  ) : (
                    <p className="text-foreground/40 text-xs">
                      {isFetchingUpi ? "Generating secure UPI QR..." : "Unable to generate UPI QR. Please retry."}
                    </p>
                  )}
                </div>
              )}

              {pendingVerificationPayment && !billData.isPaid && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                  <p className="text-amber-300 text-xs uppercase tracking-wider mb-1">Pending Verification</p>
                  <p className="text-foreground/70 text-sm">Please wait for waiter confirmation.</p>
                </div>
              )}
            </div>

            {!pendingVerificationPayment && !billData.isPaid && (
              <div className="fixed bottom-0 left-0 w-full p-4 bg-background/95 backdrop-blur-md border-t border-white/10 z-50">
                <Button onClick={() => requestVerificationMutation.mutate()} disabled={requestVerificationMutation.isPending || (selectedPayment === "upi" && !upiPaymentData)} data-testid="button-request-verification"
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-none uppercase tracking-widest font-medium shadow-[0_0_20px_rgba(22,163,74,0.3)]">
                  {requestVerificationMutation.isPending ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Requesting...</span>
                    : <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Notify Waiter - {formatPrice(billData.bill.total)}</span>}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== EXIT PIN VIEW ===== */}
        {view === "exitpass" && exitPinData && (
          <motion.div key="exitpass" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="px-4 py-8 pb-16 flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }}>
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
              </motion.div>

              <h2 className="text-2xl font-serif text-white mb-2">Payment Successful!</h2>
              <p className="text-foreground/50 text-sm mb-8">Show this PIN at the exit counter</p>

              <div className="bg-white/[0.03] border border-white/5 p-6 w-full max-w-sm">
                <p className="text-xs text-primary uppercase tracking-widest font-medium mb-3">Your Exit PIN</p>
                <div className="bg-white/[0.04] border border-primary/30 px-6 py-5 mb-4">
                  <p className="text-5xl font-mono tracking-[0.35em] text-primary">{exitPinData.pin}</p>
                </div>

                <div className={`text-center ${exitCountdown <= 30 ? "text-red-400" : "text-foreground/50"}`}>
                  <p className="text-xs uppercase tracking-wider mb-1">PIN valid for</p>
                  <p className="text-3xl font-mono font-bold">
                    {Math.floor(exitCountdown / 60)}:{(exitCountdown % 60).toString().padStart(2, "0")}
                  </p>
                </div>

                {exitCountdown <= 0 && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs">This PIN has expired. Please contact staff.</p>
                  </div>
                )}
              </div>

              <div className="mt-8 bg-white/[0.02] border border-white/5 p-4 w-full max-w-sm">
                <p className="text-xs text-foreground/30 uppercase tracking-wider mb-2">Session Summary</p>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground/50">Table</span>
                  <span className="text-white">{tableNumber}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground/50">Total Paid</span>
                  <span className="text-green-400 font-serif">{formatPrice(billData?.bill?.total || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/50">Payment</span>
                  <span className="text-white capitalize">{(completedPayment?.paymentMethod || pendingVerificationPayment?.paymentMethod || selectedPayment)}</span>
                </div>
              </div>

              <p className="text-foreground/20 text-xs mt-8">Thank you for dining at Kebabil!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      {view === "menu" && cartCount > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 w-full p-4 bg-background/95 backdrop-blur-md border-t border-white/10 z-50">
          <Button onClick={() => setView("cart")} data-testid="button-view-cart"
            className="w-full h-14 bg-primary text-primary-foreground rounded-none uppercase tracking-widest font-medium shadow-[0_0_20px_rgba(198,156,109,0.3)] flex items-center justify-between px-6">
            <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> {cartCount} {cartCount === 1 ? "item" : "items"}</span>
            <span>{formatPrice(cartGrandTotal)}</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}

