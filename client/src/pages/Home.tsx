import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { SignatureDishes } from "@/components/SignatureDishes";
import { MenuSection } from "@/components/MenuSection";
import { Experience } from "@/components/Experience";
import { Contact } from "@/components/Contact";
import { Navbar } from "@/components/Navbar";
import { OrderDialog } from "@/components/OrderDialog";

export default function Home() {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden selection:bg-primary/30 selection:text-white">
      <Navbar />
      <Hero />
      <About />
      <SignatureDishes />
      <Experience />
      <MenuSection />
      <Contact />
      
      {/* Sticky Mobile Order Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full z-50 p-4 bg-background/90 backdrop-blur-md border-t border-white/10">
        <OrderDialog>
          <button className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-none shadow-[0_0_20px_rgba(198,156,109,0.3)] uppercase tracking-widest text-sm border border-primary">
            Order Now
          </button>
        </OrderDialog>
      </div>

      <footer className="py-8 text-center text-foreground/40 text-sm border-t border-white/5 pb-28 sm:pb-8">
        <p>© {new Date().getFullYear()} Kebabil. Grilling Happiness. All rights reserved.</p>
      </footer>
    </div>
  );
}
