import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

export default function TableEntry() {
  const params = useParams<{ tableNumber: string }>();
  const [, setLocation] = useLocation();
  const tableNumber = parseInt(params.tableNumber || "0");

  const { data, isError } = useQuery({
    queryKey: ["qr-resolve", tableNumber],
    queryFn: async () => {
      const res = await fetch(`/api/qr/resolve/${tableNumber}`);
      if (!res.ok) throw new Error("Failed to resolve QR");
      return res.json();
    },
    enabled: tableNumber > 0,
    retry: false,
  });

  useEffect(() => {
    if (data?.scanPath) {
      setLocation(data.scanPath, { replace: true });
    }
  }, [data, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 text-white">
      <div className="text-center">
        <img src={logoImg} alt="Kebabil" className="h-16 mx-auto mb-6" />
        <h1 className="text-2xl font-serif mb-2">{isError ? "Invalid QR" : "Opening Menu..."}</h1>
        <p className="text-foreground/50">
          {isError ? "Please scan a valid table QR code." : "Securing your table session."}
        </p>
      </div>
    </div>
  );
}
