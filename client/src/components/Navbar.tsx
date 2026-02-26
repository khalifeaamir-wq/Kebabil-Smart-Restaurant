import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import logoImg from "@assets/1000037956-removebg-preview_1772137922663.png";
import { OrderDialog } from "./OrderDialog";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setIsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled ? "bg-background/95 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl" : "bg-gradient-to-b from-black/80 to-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
           <img src={logoImg} alt="Kebabil Logo" className="h-12 md:h-16 w-auto object-contain drop-shadow-lg" />
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <button onClick={() => scrollTo("about")} className="text-xs uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors">About</button>
          <button onClick={() => scrollTo("signature")} className="text-xs uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors">Signatures</button>
          <button onClick={() => scrollTo("menu")} className="text-xs uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors">Menu</button>
          <button onClick={() => scrollTo("contact")} className="text-xs uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors">Contact</button>
        </div>

        <div className="flex items-center gap-4">
          <OrderDialog>
            <Button className="hidden sm:flex rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-10 uppercase tracking-widest text-xs border border-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(198,156,109,0.4)]">
              Order Now
            </Button>
          </OrderDialog>
          
          {/* Mobile Menu Toggle */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden text-white p-2">
                <Menu className="w-7 h-7" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-l border-white/10 w-[300px] flex flex-col pt-16 px-8">
              <SheetHeader className="hidden">
                 <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-8 mt-10">
                <button onClick={() => scrollTo("about")} className="text-left text-sm uppercase tracking-widest text-white hover:text-primary transition-colors">About</button>
                <button onClick={() => scrollTo("signature")} className="text-left text-sm uppercase tracking-widest text-white hover:text-primary transition-colors">Signatures</button>
                <button onClick={() => scrollTo("menu")} className="text-left text-sm uppercase tracking-widest text-white hover:text-primary transition-colors">Menu</button>
                <button onClick={() => scrollTo("contact")} className="text-left text-sm uppercase tracking-widest text-white hover:text-primary transition-colors">Contact</button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
