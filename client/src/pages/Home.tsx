import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { SignatureDishes } from "@/components/SignatureDishes";
import { MenuSection } from "@/components/MenuSection";
import { Experience } from "@/components/Experience";
import { Contact } from "@/components/Contact";
import { Navbar } from "@/components/Navbar";
import { OrderDialog } from "@/components/OrderDialog";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

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
          <button data-testid="button-order-mobile" className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-none shadow-[0_0_20px_rgba(198,156,109,0.3)] uppercase tracking-widest text-sm border border-primary">
            Order Now
          </button>
        </OrderDialog>
      </div>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 pb-28 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start">
              <img src={logoImg} alt="Kebabil" className="h-20 w-auto object-contain mb-4" />
              <p className="text-foreground/50 text-sm font-light text-center md:text-left max-w-xs">
                Where the rich heritage of Middle Eastern cuisine meets the bold flavors of India.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white text-xs uppercase tracking-widest mb-6 font-medium">Quick Links</h4>
              <div className="flex flex-col gap-3">
                <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} className="text-foreground/50 hover:text-primary transition-colors text-sm font-light">About Us</button>
                <button onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })} className="text-foreground/50 hover:text-primary transition-colors text-sm font-light">Our Menu</button>
                <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })} className="text-foreground/50 hover:text-primary transition-colors text-sm font-light">Contact</button>
              </div>
            </div>

            {/* Social & Contact */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white text-xs uppercase tracking-widest mb-6 font-medium">Follow Us</h4>
              <a 
                href="https://www.instagram.com/kebabil.official" 
                target="_blank" 
                rel="noopener noreferrer"
                data-testid="link-instagram"
                className="flex items-center gap-3 text-foreground/50 hover:text-primary transition-colors group mb-6"
              >
                <div className="w-10 h-10 border border-white/10 group-hover:border-primary/50 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <span className="text-sm font-light">@kebabil.official</span>
              </a>

              <div className="text-foreground/40 text-sm font-light space-y-1">
                <p>Rosa Manhattan, Hiranandani Estate</p>
                <p>Thane West, Maharashtra 400607</p>
                <p className="mt-3">
                  <a href="tel:+918669667566" className="hover:text-primary transition-colors">+91 86696 67566</a>
                </p>
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-foreground/30 text-xs tracking-wider">
              © {new Date().getFullYear()} Kebabil. Grilling Happiness. All rights reserved.
            </p>
            <p className="text-foreground/20 text-xs tracking-wider">
              Crafted with fire & passion
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
