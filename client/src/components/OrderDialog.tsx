import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";
import React from "react";

export function OrderDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-white text-center mb-2">Place Your Order</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-foreground/70 font-light text-center mb-4">
            We're ready to serve you. Choose how you'd like to reach us.
          </p>
          
          <Button 
            className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-3 text-sm uppercase tracking-widest rounded-none shadow-[0_0_15px_rgba(37,211,102,0.2)] transition-all"
            onClick={() => window.open("https://wa.me/918669667566?text=Hi,%20I'd%20like%20to%20place%20an%20order", "_blank")}
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp Order
          </Button>

          <Button 
            variant="outline"
            className="w-full h-14 border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-3 text-sm uppercase tracking-widest rounded-none transition-all"
            onClick={() => window.open("tel:+918669667566", "_self")}
          >
            <Phone className="w-5 h-5" />
            Call Restaurant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
