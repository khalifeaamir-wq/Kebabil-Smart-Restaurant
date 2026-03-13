import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, ArrowLeft, Flame, Leaf, Send, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { wsClient } from "@/lib/websocket";
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

interface MenuCategoryData {
  category: string;
  categoryId: number;
  items: MenuItemData[];
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

type View = "menu" | "cart" | "tracking";

export default function TableOrder() {
  const params = useParams<{ tableNumber: string }>();
  const tableNumber = parseInt(params.tableNumber || "0");
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{ sessionId: number; tableId: number } | null>(null);
  const [orderNotes, setOrderNotes] = useState("");

  const { data: scanResult } = useQuery({
    queryKey: ["table-scan", tableNumber],
    queryFn: async () => {
      const res = await fetch(`/api/table/${tableNumber}/scan`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to scan table");
      return res.json();
    },
    enabled: tableNumber > 0,
  });

  useEffect(() => {
    if (scanResult) {
      setSessionData({ sessionId: scanResult.session.id, tableId: scanResult.table.id });
    }
  }, [scanResult]);

  const { data: menuData = [] } = useQuery<MenuCategoryData[]>({
    queryKey: ["/api/menu"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      return res.json();
    },
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

  useEffect(() => {
    wsClient.connect();
    const unsub = wsClient.on("order_update", () => {
      refetchOrders();
    });
    return () => { unsub(); };
  }, [refetchOrders]);

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
            quantity: item.quantity,
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

  const currentCategory = activeCategory || (menuData.length > 0 ? menuData[0].category : "");
  const activeItems = menuData.find((c) => c.category === currentCategory)?.items || [];

  const addToCart = useCallback((item: MenuItemData, variant: string = "") => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id && c.variant === variant);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id && c.variant === variant ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, priceValue: item.priceValue, quantity: 1, variant, itemNote: "" }];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: number, variant: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId && c.variant === variant);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItemId === menuItemId && c.variant === variant ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => !(c.menuItemId === menuItemId && c.variant === variant));
    });
  }, []);

  const getCartQuantity = (menuItemId: number) => {
    return cart.filter((c) => c.menuItemId === menuItemId).reduce((sum, c) => sum + c.quantity, 0);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.priceValue * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

  const statusSteps = ["new", "accepted", "preparing", "ready", "served"];
  const statusLabels: Record<string, string> = {
    new: "Order Placed",
    accepted: "Accepted",
    preparing: "Preparing",
    ready: "Ready to Serve",
    served: "Served",
  };

  if (tableNumber === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <img src={logoImg} alt="Kebabil" className="h-16 mx-auto mb-6" />
          <h1 className="text-2xl font-serif text-white mb-2">Invalid Table</h1>
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
            <img src={logoImg} alt="Kebabil" className="h-8" />
            <div>
              <p className="text-xs text-primary uppercase tracking-widest font-medium">Table {tableNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {sessionOrders.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(view === "tracking" ? "menu" : "tracking")}
                data-testid="button-toggle-tracking"
                className="text-xs uppercase tracking-wider"
              >
                <Clock className="w-4 h-4 mr-1" />
                Orders
              </Button>
            )}
          </div>
        </div>

        {/* View tabs */}
        {view !== "cart" && (
          <div className="flex border-t border-white/5">
            <button
              onClick={() => setView("menu")}
              className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium transition-colors ${view === "menu" ? "text-primary border-b-2 border-primary" : "text-foreground/40"}`}
              data-testid="tab-menu"
            >
              Menu
            </button>
            <button
              onClick={() => setView("tracking")}
              className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium transition-colors ${view === "tracking" ? "text-primary border-b-2 border-primary" : "text-foreground/40"}`}
              data-testid="tab-tracking"
            >
              My Orders {sessionOrders.length > 0 && `(${sessionOrders.length})`}
            </button>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {/* ===== MENU VIEW ===== */}
        {view === "menu" && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Category tabs */}
            <div className="sticky top-[88px] z-40 bg-background/95 backdrop-blur-md px-4 py-3 overflow-x-auto flex gap-3 scrollbar-hide border-b border-white/5">
              {menuData.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  data-testid={`cat-tab-${cat.categoryId}`}
                  className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-widest rounded-none border transition-all ${
                    currentCategory === cat.category
                      ? "border-primary text-primary bg-primary/10"
                      : "border-white/10 text-foreground/50"
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Menu items */}
            <div className="px-4 py-4 pb-32 space-y-4">
              {activeItems.map((item) => {
                const qty = getCartQuantity(item.id);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    className="bg-white/[0.03] border border-white/5 p-4 hover:border-primary/20 transition-all"
                    data-testid={`order-menu-item-${item.id}`}
                  >
                    <div className="flex justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === "veg" ? (
                            <span className="w-4 h-4 border border-green-500 flex items-center justify-center shrink-0">
                              <span className="w-2 h-2 bg-green-500 rounded-full" />
                            </span>
                          ) : (
                            <span className="w-4 h-4 border border-red-500 flex items-center justify-center shrink-0">
                              <span className="w-2 h-2 bg-red-500 rounded-full" />
                            </span>
                          )}
                          <h3 className="font-serif text-lg text-white truncate">{item.name}</h3>
                        </div>

                        <p className="text-sm text-foreground/50 mb-2 line-clamp-2">{item.description}</p>

                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-primary font-serif text-lg">{item.price}</span>
                          {item.badge && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider rounded-none">
                              {item.badge}
                            </Badge>
                          )}
                          {item.spiceLevel > 0 && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: Math.min(item.spiceLevel, 5) }).map((_, i) => (
                                <Flame key={i} className="w-3 h-3 text-orange-500" />
                              ))}
                            </div>
                          )}
                        </div>

                        {item.prepTimeMinutes > 0 && (
                          <p className="text-xs text-foreground/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ~{item.prepTimeMinutes} min
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        {!item.isAvailable ? (
                          <span className="text-xs text-red-400 uppercase tracking-wider">Unavailable</span>
                        ) : qty === 0 ? (
                          <Button
                            size="sm"
                            onClick={() => addToCart(item, item.variants.length > 0 ? item.variants[0] : "")}
                            data-testid={`button-add-${item.id}`}
                            className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-none uppercase tracking-wider text-xs h-9 px-4"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-1">
                            <button
                              onClick={() => removeFromCart(item.id, item.variants.length > 0 ? item.variants[0] : "")}
                              data-testid={`button-minus-${item.id}`}
                              className="p-1.5 text-primary hover:bg-primary/20"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-primary font-medium w-6 text-center" data-testid={`qty-${item.id}`}>{qty}</span>
                            <button
                              onClick={() => addToCart(item, item.variants.length > 0 ? item.variants[0] : "")}
                              data-testid={`button-plus-${item.id}`}
                              className="p-1.5 text-primary hover:bg-primary/20"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
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
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setView("menu")} className="p-2 hover:bg-white/5" data-testid="button-back-to-menu">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-serif">Your Order</h2>
                <span className="text-foreground/40 text-sm">Table {tableNumber}</span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground/40">Your cart is empty</p>
                  <Button onClick={() => setView("menu")} className="mt-4 bg-primary/10 text-primary rounded-none">
                    Browse Menu
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pb-48">
                  {cart.map((item) => (
                    <div key={`${item.menuItemId}-${item.variant}`} className="bg-white/[0.03] border border-white/5 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-serif text-white">{item.name}</h4>
                          {item.variant && <p className="text-xs text-foreground/40">{item.variant}</p>}
                        </div>
                        <button
                          onClick={() => setCart((prev) => prev.filter((c) => !(c.menuItemId === item.menuItemId && c.variant === item.variant)))}
                          className="text-foreground/30 hover:text-red-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-1">
                          <button onClick={() => removeFromCart(item.menuItemId, item.variant)} className="p-1.5">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => {
                            setCart((prev) => prev.map((c) => c.menuItemId === item.menuItemId && c.variant === item.variant ? { ...c, quantity: c.quantity + 1 } : c));
                          }} className="p-1.5">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-primary font-serif">{formatPrice(item.priceValue * item.quantity)}</span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6">
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Any special instructions? (optional)"
                      className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-foreground/30 rounded-none resize-none h-20 focus:outline-none focus:border-primary/50"
                      data-testid="input-order-notes"
                    />
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-foreground/50">
                      <span>Subtotal</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-foreground/50">
                      <span>Tax (5%)</span>
                      <span>{formatPrice(Math.round(cartTotal * 0.05))}</span>
                    </div>
                    <div className="flex justify-between text-lg font-serif text-primary pt-2 border-t border-white/10">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal + Math.round(cartTotal * 0.05))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="fixed bottom-0 left-0 w-full p-4 bg-background/95 backdrop-blur-md border-t border-white/10 z-50">
                <Button
                  onClick={() => placeOrderMutation.mutate()}
                  disabled={placeOrderMutation.isPending}
                  data-testid="button-place-order"
                  className="w-full h-14 bg-primary text-primary-foreground rounded-none uppercase tracking-widest font-medium shadow-[0_0_20px_rgba(198,156,109,0.3)]"
                >
                  {placeOrderMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" /> Place Order — {formatPrice(cartTotal + Math.round(cartTotal * 0.05))}
                    </span>
                  )}
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
                  <Button onClick={() => setView("menu")} className="mt-4 bg-primary/10 text-primary rounded-none">
                    Browse Menu
                  </Button>
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
                            <p className="text-xs text-foreground/30 mt-1">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <Badge className={`rounded-none text-xs uppercase tracking-wider ${
                            order.status === "ready" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                            order.status === "served" ? "bg-foreground/10 text-foreground/40 border-foreground/20" :
                            order.status === "preparing" ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                            "bg-primary/10 text-primary border-primary/30"
                          }`}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </div>

                        {/* Progress bar */}
                        {order.status !== "served" && (
                          <div className="flex gap-1 mb-4">
                            {statusSteps.slice(0, -1).map((step, i) => (
                              <div
                                key={step}
                                className={`flex-1 h-1 rounded-full transition-all ${
                                  i <= currentStep ? "bg-primary" : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        <div className="space-y-1 mb-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-foreground/60">
                                {item.quantity}× {item.menuItemName}
                                {item.variant && <span className="text-foreground/30 ml-1">({item.variant})</span>}
                              </span>
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

              <Button
                onClick={() => setView("menu")}
                className="w-full mt-6 h-12 bg-white/5 text-white/70 border border-white/10 rounded-none uppercase tracking-wider text-xs hover:bg-white/10"
                data-testid="button-add-more"
              >
                <Plus className="w-4 h-4 mr-2" /> Add More Items
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      {view === "menu" && cartCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 w-full p-4 bg-background/95 backdrop-blur-md border-t border-white/10 z-50"
        >
          <Button
            onClick={() => setView("cart")}
            data-testid="button-view-cart"
            className="w-full h-14 bg-primary text-primary-foreground rounded-none uppercase tracking-widest font-medium shadow-[0_0_20px_rgba(198,156,109,0.3)] flex items-center justify-between px-6"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
            <span>{formatPrice(cartTotal)}</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
