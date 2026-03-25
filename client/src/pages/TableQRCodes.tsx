import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

export default function TableQRCodes() {
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const { data: tableQrs, isLoading } = useQuery({
    queryKey: ["/api/qr/tables"],
    queryFn: async () => {
      const res = await fetch("/api/qr/tables");
      if (!res.ok) throw new Error("Failed to fetch QR tables");
      return res.json();
    },
  });
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();
  useEffect(() => {
    const stored = window.localStorage.getItem("qr_base_url") || "";
    if (stored) {
      setBaseUrlInput(stored);
      return;
    }
    const current = window.location.origin;
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      setBaseUrlInput(current);
      window.localStorage.setItem("qr_base_url", current);
    }
  }, []);

  const resolvedBaseUrl = useMemo(() => {
    const raw = baseUrlInput.trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");
    return `https://${raw}`.replace(/\/+$/, "");
  }, [baseUrlInput]);

  const saveBaseUrl = () => {
    if (resolvedBaseUrl) window.localStorage.setItem("qr_base_url", resolvedBaseUrl);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-amber-400 animate-pulse tracking-widest uppercase text-sm">Loading tables...</div>
      </div>
    );
  }

  const tableList = (tableQrs as any[]) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" data-testid="qr-codes-page">
      <header className="bg-[#111] border-b border-amber-900/30 px-4 py-4 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Kebabil" className="h-8" />
            <div>
              <h1 className="text-lg font-bold text-amber-400 uppercase tracking-widest" data-testid="qr-title">Table QR Codes</h1>
              <p className="text-xs text-neutral-500">{tableList.length} tables — print & place on each table</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="bg-amber-400 text-black px-5 py-2 font-bold uppercase tracking-widest text-xs hover:bg-amber-300 rounded-none transition-colors"
            data-testid="button-print"
          >
            Print All
          </button>
        </div>
        <div className="max-w-6xl mx-auto mt-3 flex gap-2">
          <input
            value={baseUrlInput}
            onChange={(e) => setBaseUrlInput(e.target.value)}
            placeholder="Public base URL (e.g. https://your-domain.com)"
            className="flex-1 bg-black border border-neutral-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            data-testid="input-qr-base-url"
          />
          <button
            type="button"
            onClick={saveBaseUrl}
            className="bg-neutral-800 border border-neutral-700 px-3 py-2 text-xs uppercase tracking-wider hover:bg-neutral-700"
            data-testid="button-save-qr-base-url"
          >
            Save
          </button>
        </div>
      </header>

      <div ref={printRef} className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
          {tableList.map((table: any) => (
            <div
              key={table.tableId}
              className="bg-white text-black p-6 flex flex-col items-center print:break-inside-avoid print:p-4"
              data-testid={`qr-card-${table.tableNumber}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <img src={logoImg} alt="Kebabil" className="h-6 print:h-5" />
                <span className="text-lg font-bold uppercase tracking-[0.2em] text-neutral-800 print:text-base">Kebabil</span>
              </div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-4 print:mb-2">Middle Eastern & Indian Fusion</p>

              <div className="border-2 border-neutral-200 p-3 rounded-none mb-4 print:mb-2 print:p-2">
                <QRCodeSVG
                  value={resolvedBaseUrl ? `${resolvedBaseUrl}${table.scanPath}` : table.scanUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  className="print:w-[140px] print:h-[140px]"
                />
              </div>

              <div className="bg-black text-white px-6 py-2 mb-2 print:px-4 print:py-1">
                <span className="text-2xl font-bold tracking-widest print:text-xl">TABLE {table.tableNumber}</span>
              </div>

              <p className="text-xs text-neutral-500 text-center max-w-[200px] leading-relaxed print:text-[10px]">
                Scan to view our menu & place your order directly from your phone
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
