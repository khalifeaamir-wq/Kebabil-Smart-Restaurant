type PortalTab = {
  key: "admin" | "kitchen" | "waiter" | "analytics" | "door" | "qr-codes";
  label: string;
  href: string;
  testId: string;
};

const tabs: PortalTab[] = [
  { key: "admin", label: "Admin", href: "/admin", testId: "portal-tab-admin" },
  { key: "kitchen", label: "Kitchen", href: "/kitchen", testId: "portal-tab-kitchen" },
  { key: "waiter", label: "Waiter", href: "/waiter", testId: "portal-tab-waiter" },
  { key: "analytics", label: "Analytics", href: "/analytics", testId: "portal-tab-analytics" },
  { key: "door", label: "Door", href: "/door", testId: "portal-tab-door" },
  { key: "qr-codes", label: "QR", href: "/qr-codes", testId: "portal-tab-qr" },
];

export function AdminPortalTabs({ current }: { current: PortalTab["key"] }) {
  return (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      {tabs.map((tab) => (
        <a
          key={tab.key}
          href={tab.href}
          data-testid={tab.testId}
          className={`text-xs uppercase tracking-wider transition-colors ${
            tab.key === current
              ? "text-white font-semibold"
              : "text-amber-400 hover:text-amber-300"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
  );
}
