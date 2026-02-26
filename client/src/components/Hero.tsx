import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/1000037956-removebg-preview_1772137922663.png";
import { OrderDialog } from "./OrderDialog";
import { TransparentLogo } from "./TransparentLogo";

export function Hero() {
  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image with Parallax & Overlay */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 scale-105"
        style={{ backgroundImage: "url('/images/hero-smoke.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-black/50 z-10" />

      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto noise-bg h-full w-full mt-10">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="mb-8"
        >
          <TransparentLogo 
            src={logoImg} 
            alt="Kebabil Logo" 
            className="w-56 md:w-80 h-auto object-contain drop-shadow-[0_0_40px_rgba(198,156,109,0.5)]"
          />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-serif text-white mb-6 tracking-wide uppercase font-light hidden"
        >
          Grilling <span className="text-gradient-gold">Happiness</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-sm md:text-lg text-foreground/80 font-light mb-12 max-w-2xl tracking-[0.2em] uppercase text-primary"
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
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-widest uppercase h-14 px-12 rounded-none shadow-[0_0_20px_rgba(198,156,109,0.3)] transition-all duration-500 hover:shadow-[0_0_40px_rgba(198,156,109,0.6)] border border-primary"
          >
            Explore Menu
          </Button>
          
          <OrderDialog>
            <Button size="lg" variant="outline" className="h-14 px-12 rounded-none border-white/30 text-white hover:bg-white/10 glass-panel uppercase tracking-widest transition-all duration-500">
              Order Now
            </Button>
          </OrderDialog>
        </motion.div>

      </div>

      {/* Subtle Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
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
