import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-white/5 shadow-lg py-3" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        
        {/* Replace text with Logo if small logo available, using text for clean nav */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
           <span className="text-2xl font-serif font-bold tracking-wider text-white">Kebabil</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo("about")} className="text-sm text-foreground/80 hover:text-primary transition-colors">About</button>
          <button onClick={() => scrollTo("signature")} className="text-sm text-foreground/80 hover:text-primary transition-colors">Signatures</button>
          <button onClick={() => scrollTo("menu")} className="text-sm text-foreground/80 hover:text-primary transition-colors">Menu</button>
          <button onClick={() => scrollTo("contact")} className="text-sm text-foreground/80 hover:text-primary transition-colors">Contact</button>
        </div>

        <div className="flex items-center gap-4">
          <Button className="hidden sm:flex rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6">
            Order Now
          </Button>
          
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
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
