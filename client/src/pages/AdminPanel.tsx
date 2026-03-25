import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { wsClient } from "@/lib/websocket";
import { AdminPortalTabs } from "@/components/AdminPortalTabs";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

interface OrderItem {
  id: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemNote: string;
  variant: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  createdAt: string;
  items: OrderItem[];
}

interface TableData {
  id: number;
  tableNumber: number;
  capacity: number;
  status: string;
  activeSessionId: number | null;
  session: {
    id: number;
    sessionCode: string;
    status: string;
    openedAt: string;
  } | null;
  orders: Order[];
}

const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

const statusConfig: Record<string, { bg: string; dot: string; text: string }> = {
  available: { bg: "border-green-500/30 bg-green-500/5", dot: "bg-green-500", text: "text-green-400" },
  unoccupied: { bg: "border-green-500/30 bg-green-500/5", dot: "bg-green-500", text: "text-green-400" },
  occupied: { bg: "border-amber-500/30 bg-amber-500/5", dot: "bg-amber-500", text: "text-amber-400" },
  reserved: { bg: "border-purple-500/30 bg-purple-500/5", dot: "bg-purple-500", text: "text-purple-400" },
  cleaning: { bg: "border-orange-500/30 bg-orange-500/5", dot: "bg-orange-500", text: "text-orange-400" },
};

const displayTableStatus = (status: string) => (status === "available" ? "unoccupied" : status);

const orderStatusBadge: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  accepted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  preparing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ready: "bg-green-500/20 text-green-400 border-green-500/30",
  served: "bg-neutral-700/50 text-neutral-400 border-neutral-600",
};

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [editingCapacity, setEditingCapacity] = useState<{ tableId: number; value: number } | null>(null);

  const { data: tables = [], refetch } = useQuery<TableData[]>({
    queryKey: ["admin-tables"],
    queryFn: async () => {
      const res = await fetch("/api/waiter/tables");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    wsClient.connect();
    const events = ["new_order", "order_update", "payment_complete", "table_cleared", "exit_verified"];
    const unsubs = events.map(e => wsClient.on(e, () => refetch()));
    return () => unsubs.forEach(u => u());
  }, [refetch]);

  const updateCapacityMutation = useMutation({
    mutationFn: async ({ tableId, capacity }: { tableId: number; capacity: number }) => {
      const res = await fetch(`/api/admin/table/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ capacity }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setEditingCapacity(null);
    },
  });

  const updateTableStatusMutation = useMutation({
    mutationFn: async ({ tableId, status }: { tableId: number; status: "occupied" | "reserved" | "unoccupied" }) => {
      const res = await fetch(`/api/admin/table/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onMutate: async ({ tableId, status }) => {
      const normalizedStatus = status === "unoccupied" ? "available" : status;
      queryClient.setQueryData<TableData[]>(["admin-tables"], (old) =>
        (old || []).map((t) => (t.id === tableId ? { ...t, status: normalizedStatus } : t))
      );
    },
    onSuccess: () => refetch(),
  });

  const clearTableMutation = useMutation({
    mutationFn: async (tableId: number) => {
      const res = await fetch(`/api/waiter/table/${tableId}/clear`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setSelectedTable(null);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const occupiedCount = tables.filter(t => t.status === "occupied").length;
  const totalCapacity = tables.reduce((s, t) => s + (t.capacity || 4), 0);
  const occupiedCapacity = tables.filter(t => t.status === "occupied").reduce((s, t) => s + (t.capacity || 4), 0);
  const activeOrders = tables.flatMap(t => t.orders).filter(o => o.status !== "served");
  const selectedTableData = tables.find(t => t.id === selectedTable);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white" data-testid="admin-panel-page">
      <header className="bg-[#111] border-b border-amber-900/30 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Kebabil" className="h-8" />
            <div>
              <h1 className="text-lg font-bold text-amber-400 uppercase tracking-widest" data-testid="admin-title">Admin Panel</h1>
              <p className="text-[11px] text-neutral-500">Live restaurant overview</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AdminPortalTabs current="admin" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-green-400">Live</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Tables" value={`${occupiedCount}/${tables.length}`} sub="occupied" color="text-amber-400" />
          <StatCard label="Guests Capacity" value={`${occupiedCapacity}/${totalCapacity}`} sub="seated / total" color="text-blue-400" />
          <StatCard label="Active Orders" value={activeOrders.length} sub="in progress" color="text-orange-400" />
          <StatCard label="Ready to Serve" value={activeOrders.filter(o => o.status === "ready").length} sub="pick up now" color="text-green-400" />
          <StatCard label="Session Revenue" value={formatPrice(tables.flatMap(t => t.orders).reduce((s, o) => s + o.total, 0))} sub="all tables" color="text-emerald-400" />
        </div>

        <div className="flex gap-6">
          <div className={`${selectedTable ? "w-1/2 lg:w-3/5" : "w-full"} transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase tracking-widest text-neutral-500">Floor Map</h2>
              {selectedTable && (
                <button onClick={() => setSelectedTable(null)} className="text-xs text-neutral-500 hover:text-white uppercase tracking-wider" data-testid="close-detail">
                  Close Detail ×
                </button>
              )}
            </div>
            <div className={`grid ${selectedTable ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-5"} gap-3`}>
              {tables.map(table => {
                const cfg = statusConfig[table.status] || statusConfig.available;
                const hasReady = table.orders.some(o => o.status === "ready");
                const tableTotal = table.orders.reduce((s, o) => s + o.total, 0);
                const isSelected = selectedTable === table.id;

                return (
                  <motion.div
                    key={table.id}
                    layout
                    onClick={() => setSelectedTable(isSelected ? null : table.id)}
                    className={`border p-3 cursor-pointer transition-all hover:border-amber-500/50 ${cfg.bg} ${
                      isSelected ? "ring-2 ring-amber-400 border-amber-400" : ""
                    } ${hasReady ? "animate-pulse border-green-500/60" : ""}`}
                    data-testid={`admin-table-${table.tableNumber}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xl font-bold text-white">T{table.tableNumber}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>{table.capacity || 4} seats</span>
                    </div>
                    {table.status === "occupied" && (
                      <>
                        <div className="text-[10px] text-neutral-500">{table.orders.length} order{table.orders.length !== 1 ? "s" : ""}</div>
                        {tableTotal > 0 && <div className="text-sm font-bold text-amber-400 mt-1">{formatPrice(tableTotal)}</div>}
                      </>
                    )}
                    {table.status === "available" && (
                      <div className="text-[10px] text-green-500/60 mt-1">Ready</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {selectedTable && selectedTableData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-1/2 lg:w-2/5 bg-neutral-900 border border-neutral-800 p-4 overflow-y-auto max-h-[calc(100vh-200px)] sticky top-24"
              >
                <TableDetail
                  table={selectedTableData}
                  editingCapacity={editingCapacity}
                  setEditingCapacity={setEditingCapacity}
                  onSaveCapacity={(tableId, cap) => updateCapacityMutation.mutate({ tableId, capacity: cap })}
                  onSetTableStatus={(tableId, status) => updateTableStatusMutation.mutate({ tableId, status })}
                  onClearTable={(tableId) => clearTableMutation.mutate(tableId)}
                  onUpdateOrder={(orderId, status) => updateOrderMutation.mutate({ orderId, status })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-3">
      <div className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-neutral-600 mt-0.5">{sub}</div>
    </div>
  );
}

function TableDetail({
  table,
  editingCapacity,
  setEditingCapacity,
  onSaveCapacity,
  onSetTableStatus,
  onClearTable,
  onUpdateOrder,
}: {
  table: TableData;
  editingCapacity: { tableId: number; value: number } | null;
  setEditingCapacity: (v: { tableId: number; value: number } | null) => void;
  onSaveCapacity: (tableId: number, capacity: number) => void;
  onSetTableStatus: (tableId: number, status: "occupied" | "reserved" | "unoccupied") => void;
  onClearTable: (tableId: number) => void;
  onUpdateOrder: (orderId: number, status: string) => void;
}) {
  const cfg = statusConfig[table.status] || statusConfig.available;
  const sessionTotal = table.orders.reduce((s, o) => s + o.total, 0);
  const isEditing = editingCapacity?.tableId === table.id;

  const nextStatus: Record<string, string> = {
    new: "accepted",
    accepted: "preparing",
    preparing: "ready",
    ready: "served",
  };

  return (
    <div data-testid={`table-detail-${table.tableNumber}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">Table {table.tableNumber}</h3>
          <div className={`text-xs uppercase tracking-widest ${cfg.text}`}>{displayTableStatus(table.status)}</div>
        </div>
        <div className={`px-3 py-1.5 border ${cfg.bg}`}>
          <div className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>{displayTableStatus(table.status)}</div>
        </div>
      </div>

      <div className="bg-neutral-800 p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-sm text-neutral-300">Seating Capacity</span>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={editingCapacity.value}
                onChange={e => setEditingCapacity({ tableId: table.id, value: parseInt(e.target.value) || 1 })}
                className="w-14 bg-neutral-700 border border-neutral-600 text-white text-center py-1 text-sm rounded-none focus:border-amber-400 focus:outline-none"
                data-testid="input-capacity"
              />
              <button
                onClick={() => onSaveCapacity(table.id, editingCapacity.value)}
                className="text-xs bg-amber-400 text-black px-2 py-1 font-bold uppercase tracking-wider rounded-none"
                data-testid="button-save-capacity"
              >
                Save
              </button>
              <button
                onClick={() => setEditingCapacity(null)}
                className="text-xs text-neutral-500 hover:text-white"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingCapacity({ tableId: table.id, value: table.capacity || 4 })}
              className="flex items-center gap-2 group"
              data-testid="button-edit-capacity"
            >
              <span className="text-lg font-bold text-white">{table.capacity || 4}</span>
              <span className="text-[10px] text-neutral-500 group-hover:text-amber-400 uppercase tracking-wider">Edit</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-neutral-800 p-3 mb-4">
        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Table Status</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSetTableStatus(table.id, "occupied")}
            className={`py-2 text-[10px] uppercase tracking-wider font-semibold border transition-colors ${
              table.status === "occupied"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-amber-400/50"
            }`}
            data-testid={`set-status-occupied-${table.tableNumber}`}
          >
            Occupied
          </button>
          <button
            onClick={() => onSetTableStatus(table.id, "reserved")}
            className={`py-2 text-[10px] uppercase tracking-wider font-semibold border transition-colors ${
              table.status === "reserved"
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-purple-400/50"
            }`}
            data-testid={`set-status-reserved-${table.tableNumber}`}
          >
            Reserved
          </button>
          <button
            onClick={() => onSetTableStatus(table.id, "unoccupied")}
            className={`py-2 text-[10px] uppercase tracking-wider font-semibold border transition-colors ${
              table.status === "available"
                ? "bg-green-500/20 border-green-500/40 text-green-300"
                : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-green-400/50"
            }`}
            data-testid={`set-status-unoccupied-${table.tableNumber}`}
          >
            Unoccupied
          </button>
        </div>
      </div>

      {table.session && (
        <div className="bg-neutral-800 p-3 mb-4">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Session Info</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral-500">Code: </span>
              <span className="text-neutral-300 font-mono">{table.session.sessionCode}</span>
            </div>
            <div>
              <span className="text-neutral-500">Status: </span>
              <span className="text-neutral-300">{table.session.status}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-500">Opened: </span>
              <span className="text-neutral-300">{new Date(table.session.openedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {table.orders.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500">Orders ({table.orders.length})</span>
            <span className="text-sm font-bold text-amber-400">{formatPrice(sessionTotal)}</span>
          </div>

          <div className="space-y-3">
            {table.orders.map(order => (
              <div key={order.id} className="border border-neutral-700 bg-neutral-800/50" data-testid={`order-detail-${order.id}`}>
                <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">{order.orderNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold border ${orderStatusBadge[order.status] || "bg-neutral-700 text-neutral-400"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{formatPrice(order.total)}</span>
                    {nextStatus[order.status] && (
                      <button
                        onClick={() => onUpdateOrder(order.id, nextStatus[order.status])}
                        className="text-[10px] bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 uppercase tracking-wider font-semibold hover:bg-amber-400 hover:text-black transition-colors"
                        data-testid={`advance-order-${order.id}`}
                      >
                        → {nextStatus[order.status]}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm" data-testid={`order-item-${item.id}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold text-xs w-6">{item.quantity}×</span>
                        <div>
                          <span className="text-neutral-200">{item.menuItemName}</span>
                          {item.variant && <span className="text-neutral-500 text-xs ml-1">({item.variant})</span>}
                          {item.itemNote && <div className="text-neutral-600 text-[10px] italic">Note: {item.itemNote}</div>}
                        </div>
                      </div>
                      <span className="text-neutral-400 text-xs">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2 border-t border-neutral-700 flex justify-between text-xs text-neutral-500">
                  <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  <div>
                    <span>Sub: {formatPrice(order.subtotal)}</span>
                    <span className="ml-2">Tax: {formatPrice(order.tax)}</span>
                  </div>
                </div>

                {order.notes && (
                  <div className="px-3 py-2 border-t border-neutral-700 text-xs text-orange-400">
                    Note: {order.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {table.status === "occupied" && table.session?.status === "paid" && (
        <button
          onClick={() => onClearTable(table.id)}
          className="w-full bg-red-500/20 text-red-400 border border-red-500/30 py-2 text-xs uppercase tracking-widest font-bold hover:bg-red-500 hover:text-white transition-colors"
          data-testid={`clear-table-btn-${table.tableNumber}`}
        >
          Clear Table
        </button>
      )}

      {table.status === "available" && table.orders.length === 0 && (
        <div className="text-center py-6 text-neutral-600">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          <p className="text-xs uppercase tracking-wider">No active session</p>
        </div>
      )}
    </div>
  );
}
