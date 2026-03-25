import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { AdminPortalTabs } from "@/components/AdminPortalTabs";

type VerifyResult = {
  success: boolean;
  message: string;
  timestamp: Date;
};

const errorMap: Record<string, string> = {
  invalid_pin: "Invalid PIN",
  expired: "PIN expired",
  already_used: "PIN already used",
  payment_incomplete: "Payment not completed",
  invalid_table: "Invalid table",
  server_error: "Server error",
};

export default function DoorScanner() {
  const [tableNumber, setTableNumber] = useState("");
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState<VerifyResult[]>([]);

  const addDigit = (digit: string) => {
    if (pin.length >= 4) return;
    setPin((prev) => `${prev}${digit}`);
  };

  const clearDigit = () => setPin((prev) => prev.slice(0, -1));
  const clearAll = () => setPin("");

  const verifyPin = async () => {
    if (verifying || pin.length !== 4 || !tableNumber.trim()) return;
    setVerifying(true);
    try {
      const res = await apiRequest("POST", "/api/exit-pin/verify", {
        tableNumber: Number(tableNumber),
        pin,
      });
      const data = await res.json();
      const success = !!data.valid;
      const message = success
        ? `Access granted - Table ${data.tableNumber}`
        : errorMap[data.reason] || "Access denied";
      setResults((prev) => [{ success, message, timestamp: new Date() }, ...prev].slice(0, 50));
      if (success) {
        setPin("");
        setTableNumber("");
      }
    } catch {
      setResults((prev) => [{ success: false, message: "Network error", timestamp: new Date() }, ...prev].slice(0, 50));
    }
    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col" data-testid="door-scanner-page">
      <header className="bg-[#111] border-b border-amber-900/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400 uppercase tracking-widest" data-testid="door-title">Exit PIN Verify</h1>
            <p className="text-sm text-neutral-400 mt-1">Enter table number and 4-digit PIN</p>
          </div>
          <AdminPortalTabs current="door" />
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="bg-neutral-900 border border-neutral-800 p-4 mb-6">
          <label className="text-xs uppercase tracking-widest text-neutral-500 mb-2 block">Table Number</label>
          <input
            type="number"
            min={1}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full bg-black border border-neutral-700 px-4 py-3 mb-4 text-xl focus:border-amber-400 focus:outline-none"
            data-testid="input-table-number"
          />

          <label className="text-xs uppercase tracking-widest text-neutral-500 mb-2 block">PIN</label>
          <div className="w-full bg-black border border-neutral-700 px-4 py-3 mb-4 text-3xl font-mono tracking-[0.5em] text-center" data-testid="input-pin-display">
            {(pin || "").padEnd(4, "•")}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "<"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === "C") clearAll();
                  else if (key === "<") clearDigit();
                  else addDigit(key);
                }}
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-4 text-xl font-semibold"
                data-testid={`key-${key}`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={verifyPin}
            disabled={verifying || pin.length !== 4 || !tableNumber.trim()}
            className="w-full bg-amber-400 text-black py-3 font-bold uppercase tracking-widest text-sm hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-verify-pin"
          >
            {verifying ? "Verifying..." : "Verify PIN"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((r, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 px-4 py-3 flex items-center justify-between" data-testid={`scan-log-${i}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${r.success ? "bg-green-400" : "bg-red-400"}`} />
                  <span className="text-sm text-neutral-300">{r.message}</span>
                </div>
                <span className="text-xs text-neutral-600">{r.timestamp.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

