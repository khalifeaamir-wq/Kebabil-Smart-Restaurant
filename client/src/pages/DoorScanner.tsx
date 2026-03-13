import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

type ScanResult = {
  success: boolean;
  message: string;
  timestamp: Date;
};

export default function DoorScanner() {
  const [tokenInput, setTokenInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const verifyToken = async (token: string) => {
    if (!token.trim() || scanning) return;
    setScanning(true);
    try {
      const res = await apiRequest("POST", "/api/exit-token/verify", { token: token.trim() });
      const data = await res.json();
      setResults(prev => [{
        success: data.valid,
        message: data.valid ? `Access granted — Table ${data.tableNumber || "?"}, Session #${data.sessionId || "?"}` : data.reason || "Access denied",
        timestamp: new Date(),
      }, ...prev].slice(0, 50));
    } catch {
      setResults(prev => [{
        success: false,
        message: "Network error — could not verify",
        timestamp: new Date(),
      }, ...prev].slice(0, 50));
    }
    setTokenInput("");
    setScanning(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(tokenInput);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col" data-testid="door-scanner-page">
      <header className="bg-[#111] border-b border-amber-900/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400 uppercase tracking-widest" data-testid="door-title">Door Scanner</h1>
            <p className="text-sm text-neutral-400 mt-1">Verify exit passes</p>
          </div>
          <a href="/analytics" className="text-sm text-amber-400 hover:text-amber-300 uppercase tracking-wider" data-testid="link-analytics">
            Analytics →
          </a>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        <form onSubmit={handleSubmit} className="mb-6">
          <label className="text-xs uppercase tracking-widest text-neutral-500 mb-2 block">Scan or Enter Exit Token</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Paste or scan token here..."
              className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-4 py-3 text-lg font-mono focus:border-amber-400 focus:outline-none rounded-none"
              autoFocus
              data-testid="input-token"
            />
            <button
              type="submit"
              disabled={scanning || !tokenInput.trim()}
              className="bg-amber-400 text-black px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-none transition-colors"
              data-testid="button-verify"
            >
              {scanning ? "..." : "Verify"}
            </button>
          </div>
        </form>

        {results.length > 0 && (
          <div className="mb-6">
            <div className={`p-6 text-center border-2 transition-all ${
              results[0].success
                ? "border-green-500 bg-green-900/20"
                : "border-red-500 bg-red-900/20"
            }`}>
              <div className={`text-5xl mb-3 ${results[0].success ? "text-green-400" : "text-red-400"}`}>
                {results[0].success ? "✓" : "✗"}
              </div>
              <div className={`text-2xl font-bold uppercase tracking-widest mb-2 ${
                results[0].success ? "text-green-400" : "text-red-400"
              }`} data-testid="scan-result-status">
                {results[0].success ? "ACCESS GRANTED" : "ACCESS DENIED"}
              </div>
              <div className="text-neutral-400 text-sm" data-testid="scan-result-message">{results[0].message}</div>
            </div>
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Recent Scans ({results.length})</h3>
          {results.length === 0 ? (
            <div className="text-neutral-600 text-center py-12 text-sm">No scans yet. Enter a token above or scan a QR code.</div>
          ) : (
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
    </div>
  );
}
