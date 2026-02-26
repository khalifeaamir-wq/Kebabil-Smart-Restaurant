import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { OrderDialog } from "./OrderDialog";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  const parallax = Math.min(scrollY * 0.3, 80);
  const bgScale = 1.05 + Math.min(scrollY * 0.0001, 0.07);
  const textOpacity = Math.max(1 - scrollY * 0.002, 0);
  const textLift = Math.min(scrollY * 0.15, 40);

  return (
    <section ref={sectionRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      
      {/* Hero Image — Ultra HD Enhanced */}
      <div 
        className="absolute inset-0 w-full h-full z-0"
        style={{
          transform: `translateY(${parallax}px) scale(${bgScale})`,
          willChange: "transform",
        }}
      >
        <img 
          src="/images/hero-night.jpg" 
          alt="Kebabil Restaurant" 
          className="w-full h-full object-cover object-[center_30%] md:object-center"
          style={{
            imageRendering: "auto",
            filter: "contrast(1.08) saturate(1.15) brightness(1.05)",
          }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      {/* Cinematic Gradient */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 35%, rgba(28,28,28,0.5) 70%, rgba(28,28,28,0.95) 100%)",
        }}
      />
      
      {/* Vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Film Grain */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] noise-bg" />

      {/* Content */}
      <div 
        className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto h-full w-full"
        style={{
          transform: `translateY(-${textLift}px)`,
          opacity: textOpacity,
          willChange: "transform, opacity",
        }}
      >
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-sm md:text-lg text-white/80 font-light mb-12 max-w-2xl tracking-[0.2em] uppercase"
        >
          Authentic Middle Eastern & Indian Kebabs
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
        >
          <Button 
            size="lg" 
            onClick={scrollToMenu}
            data-testid="button-explore-menu"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-widest uppercase h-14 px-12 rounded-none shadow-[0_0_20px_rgba(198,156,109,0.3)] transition-all duration-500 hover:shadow-[0_0_40px_rgba(198,156,109,0.6)] border border-primary"
          >
            Explore Menu
          </Button>
          
          <OrderDialog>
            <Button size="lg" variant="outline" data-testid="button-order-now-hero" className="h-14 px-12 rounded-none border-white/30 text-white hover:bg-white/10 backdrop-blur-sm uppercase tracking-widest transition-all duration-500">
              Order Now
            </Button>
          </OrderDialog>
        </motion.div>

      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
        style={{ opacity: textOpacity }}
      >
        <div className="w-[1px] h-24 bg-white/10 overflow-hidden relative">
          <motion.div 
            animate={{ y: [0, 96] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-primary"
          />
        </div>
      </motion.div>
    </section>
  );
}
