import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPortalTabs } from "@/components/AdminPortalTabs";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function Analytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/analytics/overview"],
    refetchInterval: 15000,
  });

  const [activeTab, setActiveTab] = useState<"overview" | "items" | "orders" | "access">("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-amber-400 text-lg tracking-widest uppercase animate-pulse">Loading Analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-red-400 text-lg">Failed to load analytics</div>
      </div>
    );
  }

  const { summary, topItems, ordersByStatus, paymentMethods, hourlyData, doorAccessStats, recentOrders } = data as any;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "items", label: "Top Items" },
    { key: "orders", label: "Orders" },
    { key: "access", label: "Door Access" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white" data-testid="analytics-page">
      <header className="bg-[#111] border-b border-amber-900/30 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400 uppercase tracking-widest" data-testid="analytics-title">Kebabil Analytics</h1>
            <p className="text-sm text-neutral-400 mt-1">Real-time restaurant insights</p>
          </div>
          <AdminPortalTabs current="analytics" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-3">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold rounded-none transition-colors ${
                activeTab === t.key ? "bg-amber-400 text-black" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
              data-testid={`tab-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Today's Revenue" value={formatPrice(summary.todayRevenue)} color="text-green-400" testId="stat-today-revenue" />
              <StatCard label="Today's Orders" value={summary.todayOrders} color="text-amber-400" testId="stat-today-orders" />
              <StatCard label="Active Tables" value={`${summary.occupiedTables}/${summary.totalTables}`} color="text-blue-400" testId="stat-tables" />
              <StatCard label="Avg Order Value" value={formatPrice(summary.avgOrderValue)} color="text-purple-400" testId="stat-avg-order" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Revenue" value={formatPrice(summary.totalRevenue)} color="text-green-300" testId="stat-total-revenue" />
              <StatCard label="Total Orders" value={summary.totalOrders} color="text-amber-300" testId="stat-total-orders" />
              <StatCard label="Total Sessions" value={summary.totalSessions} color="text-blue-300" testId="stat-total-sessions" />
              <StatCard label="Today's Sessions" value={summary.todaySessions} color="text-purple-300" testId="stat-today-sessions" />
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none">
              <h3 className="text-sm uppercase tracking-widest text-amber-400 mb-4">Order Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(ordersByStatus).map(([status, count]) => (
                  <div key={status} className="bg-neutral-800 p-3 text-center">
                    <div className="text-lg font-bold text-white">{count as number}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wider mt-1">{status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none">
              <h3 className="text-sm uppercase tracking-widest text-amber-400 mb-4">Payment Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(paymentMethods).map(([method, info]) => {
                  const { count, total } = info as { count: number; total: number };
                  return (
                    <div key={method} className="bg-neutral-800 p-4 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-wider text-white">{method}</div>
                        <div className="text-xs text-neutral-400 mt-1">{count} transaction{count !== 1 ? "s" : ""}</div>
                      </div>
                      <div className="text-lg font-bold text-green-400">{formatPrice(total)}</div>
                    </div>
                  );
                })}
                {Object.keys(paymentMethods).length === 0 && (
                  <div className="text-neutral-500 text-sm col-span-3 text-center py-4">No completed payments yet</div>
                )}
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none">
              <h3 className="text-sm uppercase tracking-widest text-amber-400 mb-4">Hourly Orders (Today)</h3>
              <div className="flex items-end gap-1 h-40">
                {hourlyData.map((h: any) => {
                  const maxOrders = Math.max(...hourlyData.map((d: any) => d.orders), 1);
                  const height = (h.orders / maxOrders) * 100;
                  return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center justify-end group">
                      <div className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{h.orders}</div>
                      <div
                        className="w-full bg-amber-400/80 hover:bg-amber-400 transition-all rounded-none"
                        style={{ height: `${Math.max(height, 2)}%`, minHeight: h.orders > 0 ? "4px" : "1px" }}
                      />
                      <div className="text-[9px] text-neutral-500 mt-1 hidden md:block">{h.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none">
            <h3 className="text-sm uppercase tracking-widest text-amber-400 mb-4">Top Selling Items</h3>
            {topItems.length === 0 ? (
              <div className="text-neutral-500 text-center py-8">No orders yet</div>
            ) : (
              <div className="space-y-2">
                {topItems.map((item: any, i: number) => {
                  const maxCount = topItems[0]?.count || 1;
                  return (
                    <div key={item.name} className="flex items-center gap-4" data-testid={`top-item-${i}`}>
                      <div className="text-amber-400 font-bold text-lg w-8 text-right">#{i + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white font-medium">{item.name}</span>
                          <span className="text-neutral-400 text-sm">{item.count} sold — {formatPrice(item.revenue)}</span>
                        </div>
                        <div className="w-full bg-neutral-800 h-2 rounded-none">
                          <div className="bg-amber-400 h-2 rounded-none transition-all" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none">
            <h3 className="text-sm uppercase tracking-widest text-amber-400 mb-4">Recent Orders</h3>
            {recentOrders.length === 0 ? (
              <div className="text-neutral-500 text-center py-8">No orders yet</div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="bg-neutral-800 p-3 flex items-center justify-between" data-testid={`recent-order-${order.id}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-amber-400 font-mono font-bold">{order.orderNumber}</span>
                      <span className="text-neutral-400 text-sm">Table {order.tableId}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2 py-1 uppercase tracking-wider font-semibold ${
                        order.status === "served" ? "bg-green-900/50 text-green-400" :
                        order.status === "ready" ? "bg-blue-900/50 text-blue-400" :
                        order.status === "preparing" ? "bg-amber-900/50 text-amber-400" :
                        order.status === "cancelled" ? "bg-red-900/50 text-red-400" :
                        "bg-neutral-700 text-neutral-300"
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-white font-semibold">{formatPrice(order.total)}</span>
                      <span className="text-neutral-500 text-xs">{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "access" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Scans" value={doorAccessStats.total} color="text-blue-400" testId="stat-total-scans" />
              <StatCard label="Successful" value={doorAccessStats.successful} color="text-green-400" testId="stat-success-scans" />
              <StatCard label="Failed" value={doorAccessStats.failed} color="text-red-400" testId="stat-failed-scans" />
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none">
              <h3 className="text-sm uppercase tracking-widest text-amber-400 mb-4">Door Access Logs</h3>
              <DoorAccessLogsList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, testId }: { label: string; value: string | number; color: string; testId: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none" data-testid={testId}>
      <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function DoorAccessLogsList() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/door/logs"],
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="text-neutral-500 text-center py-4">Loading...</div>;
  if (!logs || (logs as any[]).length === 0) return <div className="text-neutral-500 text-center py-8">No door access logs yet</div>;

  return (
    <div className="space-y-2">
      {(logs as any[]).slice(0, 30).map((log: any) => (
        <div key={log.id} className="bg-neutral-800 p-3 flex items-center justify-between" data-testid={`door-log-${log.id}`}>
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${log.result === "success" ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-neutral-400 text-sm">Token #{log.exitTokenId}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs px-2 py-1 uppercase tracking-wider font-semibold ${
              log.result === "success" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
            }`}>
              {log.result}
            </span>
            {log.reason && <span className="text-neutral-500 text-xs">{log.reason}</span>}
            <span className="text-neutral-500 text-xs">{new Date(log.scanTime).toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
