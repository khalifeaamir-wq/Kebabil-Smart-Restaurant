import { MapPin, Phone, MessageCircle, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Contact() {
  return (
    <section className="py-32 bg-card relative noise-bg border-t border-white/5" id="contact">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] w-12 bg-primary"></div>
              <span className="text-primary font-medium tracking-widest uppercase text-sm">Visit Us</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-serif text-white mb-6">
              Our <span className="text-gradient-gold">Sanctuary</span>
            </h2>
            <p className="text-foreground/70 mb-14 text-lg font-light leading-relaxed max-w-md">
              Step into our world of glowing embers and aromatic spices. Located in the heart of Thane.
            </p>

            <div className="space-y-10">
              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-none border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors duration-500">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div className="pt-1">
                  <h4 className="text-white font-medium mb-1 tracking-wider uppercase text-sm">Reservations & Delivery</h4>
                  <p className="text-foreground/70 font-light">+91 86696 67566</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-none border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors duration-500">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="pt-1">
                  <h4 className="text-white font-medium mb-1 tracking-wider uppercase text-sm">Service Hours</h4>
                  <p className="text-foreground/70 font-light">Daily: 1:00 PM - 11:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 rounded-none border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors duration-500">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="pt-1">
                  <h4 className="text-white font-medium mb-1 tracking-wider uppercase text-sm">Location</h4>
                  <p className="text-foreground/70 font-light max-w-[300px] leading-relaxed">
                    Rosa Manhattan, Hiranandani Estate, Thane West, Thane, Maharashtra 400607
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row gap-6">
              <Button className="h-14 px-8 rounded-none bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center gap-3 shadow-[0_0_20px_rgba(37,211,102,0.2)] uppercase tracking-widest text-xs transition-all">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Order
              </Button>
              <Button variant="outline" className="h-14 px-8 rounded-none border-primary text-primary hover:bg-primary/10 flex items-center gap-3 uppercase tracking-widest text-xs transition-all">
                <Navigation className="w-4 h-4" />
                Get Directions
              </Button>
            </div>
          </div>

          <div className="h-[600px] w-full rounded-none overflow-hidden border border-white/10 relative shadow-2xl group bg-black">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors duration-1000 pointer-events-none z-10"></div>
            <iframe 
              src="https://maps.google.com/maps?q=Kebabil,%20Rosa%20Manhattan,%20Hiranandani%20Estate,%20Thane&t=m&z=15&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(80%) contrast(90%) grayscale(60%)' }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="opacity-80 group-hover:opacity-100 transition-opacity duration-700"
            ></iframe>
          </div>

        </div>
      </div>
    </section>
  );
}
