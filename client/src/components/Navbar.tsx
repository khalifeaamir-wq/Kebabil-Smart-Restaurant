import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import logoImg from "@assets/1000037956-removebg-preview_1772137922663.png";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
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
          <Button className="hidden sm:flex rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-10 uppercase tracking-widest text-xs border border-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(198,156,109,0.4)]">
            Order Now
          </Button>
          
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
