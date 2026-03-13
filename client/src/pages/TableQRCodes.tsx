import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

export default function TableQRCodes() {
  const { data: tables, isLoading } = useQuery({
    queryKey: ["/api/tables"],
  });
  const printRef = useRef<HTMLDivElement>(null);

  const baseUrl = window.location.origin;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-amber-400 animate-pulse tracking-widest uppercase text-sm">Loading tables...</div>
      </div>
    );
  }

  const tableList = (tables as any[]) || [];

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
          <div className="flex items-center gap-4">
            <a href="/waiter" className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider" data-testid="link-waiter">Waiter</a>
            <button
              onClick={handlePrint}
              className="bg-amber-400 text-black px-5 py-2 font-bold uppercase tracking-widest text-xs hover:bg-amber-300 rounded-none transition-colors"
              data-testid="button-print"
            >
              Print All
            </button>
          </div>
        </div>
      </header>

      <div ref={printRef} className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
          {tableList.map((table: any) => (
            <div
              key={table.id}
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
                  value={`${baseUrl}/table/${table.tableNumber}`}
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

              <div className="mt-3 pt-3 border-t border-neutral-200 w-full text-center print:mt-2 print:pt-2">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Free Wi-Fi Available</p>
                <p className="text-[9px] text-neutral-400 mt-0.5">Rosa Manhattan, Hiranandani Estate, Thane</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          header, .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .print\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
          .print\\:gap-4 { gap: 1rem !important; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </div>
  );
}
